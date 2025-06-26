import crypto from 'crypto';
import { logger } from './logger.js';
import { storage } from '../storage/storage.js';

class IntelligentCache {
  constructor() {
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0
    };
    this.maxMemoryItems = 1000;
    this.defaultTTL = 3600000; // 1 hour
    this.cleanupInterval = 300000; // 5 minutes
    
    // Start cleanup process
    this.startCleanupProcess();
    
    logger.info('Intelligent cache initialized', { 
      maxItems: this.maxMemoryItems,
      defaultTTL: this.defaultTTL 
    });
  }

  // Generate cache key from prompt and options
  generateKey(prompt, modelType, options = {}) {
    const keyData = {
      prompt: prompt.trim(),
      modelType,
      maxTokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      complexity: options.complexity || 'medium'
    };
    
    const keyString = JSON.stringify(keyData);
    return crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 16);
  }

  // Check if response should be cached (avoid caching dynamic/time-sensitive content)
  shouldCache(prompt, modelType, options = {}) {
    const noCachePatterns = [
      /current time/i,
      /today/i,
      /now/i,
      /latest/i,
      /recent/i,
      /this (week|month|year)/i,
      /random/i,
      /generate.*unique/i
    ];
    
    // Don't cache time-sensitive or random content
    for (const pattern of noCachePatterns) {
      if (pattern.test(prompt)) {
        return false;
      }
    }
    
    // Don't cache very short prompts (likely to be dynamic)
    if (prompt.length < 20) {
      return false;
    }
    
    // Don't cache high temperature (creative) requests
    if ((options.temperature || 0.7) > 0.8) {
      return false;
    }
    
    return true;
  }

  // Get TTL based on content type and complexity
  getTTL(prompt, modelType) {
    // Longer TTL for stable content types
    const longTTL = 24 * 60 * 60 * 1000; // 24 hours
    const mediumTTL = 6 * 60 * 60 * 1000; // 6 hours
    const shortTTL = 1 * 60 * 60 * 1000; // 1 hour
    
    // Code analysis and reviews can be cached longer
    if (modelType === 'analysis' || modelType === 'review') {
      return longTTL;
    }
    
    // Documentation and explanations
    if (prompt.includes('explain') || prompt.includes('documentation')) {
      return mediumTTL;
    }
    
    // Security and debugging content
    if (modelType === 'debug' || modelType === 'security') {
      return mediumTTL;
    }
    
    // Default TTL
    return shortTTL;
  }

  // Get from cache
  async get(prompt, modelType, options = {}) {
    this.cacheStats.totalRequests++;
    
    if (!this.shouldCache(prompt, modelType, options)) {
      this.cacheStats.misses++;
      return null;
    }
    
    const key = this.generateKey(prompt, modelType, options);
    
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && memoryItem.expires > Date.now()) {
      this.cacheStats.hits++;
      memoryItem.lastAccessed = Date.now();
      logger.debug('Cache hit (memory)', { key, modelType });
      return memoryItem.data;
    }
    
    // Check persistent cache
    try {
      const persistentCache = await storage.read('cache');
      const persistentItem = persistentCache[key];
      
      if (persistentItem && persistentItem.expires > Date.now()) {
        this.cacheStats.hits++;
        
        // Promote to memory cache
        this.memoryCache.set(key, {
          data: persistentItem.data,
          expires: persistentItem.expires,
          lastAccessed: Date.now(),
          modelType
        });
        
        logger.debug('Cache hit (persistent)', { key, modelType });
        return persistentItem.data;
      }
    } catch (error) {
      logger.error('Persistent cache read failed', { error: error.message });
    }
    
    this.cacheStats.misses++;
    return null;
  }

  // Set cache entry
  async set(prompt, modelType, options, data) {
    if (!this.shouldCache(prompt, modelType, options)) {
      return;
    }
    
    const key = this.generateKey(prompt, modelType, options);
    const ttl = this.getTTL(prompt, modelType);
    const expires = Date.now() + ttl;
    
    const cacheItem = {
      data,
      expires,
      lastAccessed: Date.now(),
      modelType,
      size: JSON.stringify(data).length
    };
    
    // Add to memory cache
    this.memoryCache.set(key, cacheItem);
    
    // Evict if memory cache is too large
    if (this.memoryCache.size > this.maxMemoryItems) {
      this.evictLRU();
    }
    
    // Add to persistent cache for larger/important items
    if (cacheItem.size > 1000 || modelType === 'analysis' || modelType === 'review') {
      try {
        const persistentCache = await storage.read('cache');
        persistentCache[key] = {
          data,
          expires,
          modelType,
          cached: Date.now()
        };
        await storage.write('cache', persistentCache);
        logger.debug('Cache set (persistent)', { key, modelType, ttl });
      } catch (error) {
        logger.error('Persistent cache write failed', { error: error.message });
      }
    }
    
    logger.debug('Cache set (memory)', { key, modelType, ttl });
  }

  // Evict least recently used items from memory
  evictLRU() {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const evictCount = Math.ceil(this.maxMemoryItems * 0.1); // Evict 10%
    for (let i = 0; i < evictCount && entries.length > 0; i++) {
      const [key] = entries.shift();
      this.memoryCache.delete(key);
      this.cacheStats.evictions++;
    }
    
    logger.debug('Cache LRU eviction completed', { evicted: evictCount });
  }

  // Start background cleanup process
  startCleanupProcess() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  // Clean up expired entries
  async cleanup() {
    const now = Date.now();
    let expiredCount = 0;
    
    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expires <= now) {
        this.memoryCache.delete(key);
        expiredCount++;
      }
    }
    
    // Clean persistent cache
    try {
      const persistentCache = await storage.read('cache');
      const keys = Object.keys(persistentCache);
      
      for (const key of keys) {
        if (persistentCache[key].expires <= now) {
          delete persistentCache[key];
          expiredCount++;
        }
      }
      
      if (expiredCount > 0) {
        await storage.write('cache', persistentCache);
      }
    } catch (error) {
      logger.error('Cache cleanup failed', { error: error.message });
    }
    
    if (expiredCount > 0) {
      logger.debug('Cache cleanup completed', { expired: expiredCount });
    }
  }

  // Get cache statistics
  getStats() {
    const hitRate = this.cacheStats.totalRequests > 0 
      ? (this.cacheStats.hits / this.cacheStats.totalRequests * 100).toFixed(2)
      : 0;
    
    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      memoryItems: this.memoryCache.size,
      memoryUsage: this.calculateMemoryUsage()
    };
  }

  calculateMemoryUsage() {
    let totalSize = 0;
    for (const item of this.memoryCache.values()) {
      totalSize += item.size || 0;
    }
    return `${(totalSize / 1024).toFixed(2)} KB`;
  }

  // Clear all cache
  async clear() {
    this.memoryCache.clear();
    try {
      await storage.write('cache', {});
      logger.info('All cache cleared');
    } catch (error) {
      logger.error('Failed to clear persistent cache', { error: error.message });
    }
  }

  // Warm up cache with common patterns
  async warmup(commonPrompts = []) {
    logger.info('Starting cache warmup', { prompts: commonPrompts.length });
    
    const defaultPrompts = [
      'Explain the concept of dependency injection in JavaScript',
      'What are the best practices for React component architecture?',
      'How to implement proper error handling in Node.js?',
      'Explain the differences between SQL and NoSQL databases',
      'What is the purpose of Docker containerization?'
    ];
    
    const allPrompts = [...commonPrompts, ...defaultPrompts];
    
    // Pre-generate cache keys for common patterns
    for (const prompt of allPrompts) {
      const key = this.generateKey(prompt, 'main', {});
      logger.debug('Warmup cache key generated', { key, prompt: prompt.substring(0, 50) });
    }
    
    logger.info('Cache warmup completed');
  }
}

export const intelligentCache = new IntelligentCache();