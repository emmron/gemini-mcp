import OpenAI from 'openai';
import { AI_MODELS, CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';
import { validateString } from '../utils/validation.js';
import { performanceMonitor } from '../utils/performance.js';
import { intelligentCache } from '../utils/cache.js';

class AIClient {
  constructor() {
    if (!process.env.OPENROUTER_API_KEY && process.env.NODE_ENV !== 'test') {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    
    if (process.env.OPENROUTER_API_KEY) {
      this.client = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
      });
    } else {
      this.client = null; // Test mode
    }

    // Advanced orchestration features
    this.modelPerformance = new Map(); // Track model performance metrics
    this.modelHealth = new Map(); // Track model availability and response times
    this.taskComplexityAnalyzer = new TaskComplexityAnalyzer();
    this.contextManager = new ContextManager();
    this.failureCount = new Map(); // Track failures per model
    this.lastUsed = new Map(); // Track last usage time per model
    
    // Initialize model health tracking
    this.initializeModelHealth();
  }

  initializeModelHealth() {
    Object.values(AI_MODELS).flat().forEach(model => {
      this.modelHealth.set(model, {
        available: true,
        avgResponseTime: 1000,
        successRate: 1.0,
        lastHealthCheck: Date.now()
      });
      this.modelPerformance.set(model, {
        totalCalls: 0,
        successfulCalls: 0,
        avgResponseTime: 1000,
        avgAccuracy: 0.85,
        taskTypePerformance: new Map()
      });
      this.failureCount.set(model, 0);
    });
  }

  selectModel(taskType = 'main', complexity = 'medium', prompt = '') {
    const complexityWeight = { simple: 1, medium: 2, complex: 3, enterprise: 4 }[complexity] || 2;
    
    // Analyze task complexity from prompt if provided
    const analyzedComplexity = this.taskComplexityAnalyzer.analyzePrompt(prompt, taskType);
    const finalComplexity = Math.max(complexityWeight, analyzedComplexity);
    
    const taskModels = {
      frontend: finalComplexity > 2 ? 'coding' : 'creative',
      backend: finalComplexity > 2 ? 'coding' : 'main',
      devops: 'coding',
      testing: finalComplexity > 1 ? 'coding' : 'main',
      analysis: 'analysis',
      security: 'review',
      debugging: 'debug',
      research: 'research',
      consensus: 'consensus',
      chat: 'main',
      planning: 'main'
    };
    
    const preferredModelType = taskModels[taskType] || taskType;
    const candidateModels = Array.isArray(AI_MODELS[preferredModelType]) 
      ? AI_MODELS[preferredModelType] 
      : [AI_MODELS[preferredModelType] || AI_MODELS.main];

    // Smart model selection based on performance and health
    return this.selectBestModel(candidateModels, taskType, finalComplexity);
  }

  selectBestModel(candidateModels, taskType, complexity) {
    let bestModel = candidateModels[0];
    let bestScore = -1;

    for (const model of candidateModels) {
      const health = this.modelHealth.get(model);
      const performance = this.modelPerformance.get(model);
      const failures = this.failureCount.get(model) || 0;
      
      // Skip unavailable models or models with too many recent failures
      if (!health?.available || failures > 3) continue;
      
      // Calculate selection score based on multiple factors
      const score = this.calculateModelScore(model, taskType, complexity, health, performance);
      
      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }

    // Reset failure count if model was selected (give it another chance)
    this.failureCount.set(bestModel, Math.max(0, this.failureCount.get(bestModel) - 1));
    
    logger.debug('Model selected', { 
      model: bestModel, 
      score: bestScore, 
      taskType, 
      complexity,
      candidates: candidateModels.length 
    });
    
    return bestModel;
  }

  calculateModelScore(model, taskType, complexity, health, performance) {
    // Base score from success rate and response time
    let score = health.successRate * 0.4 + (1000 / health.avgResponseTime) * 0.3;
    
    // Add performance bonus for task type
    const taskPerf = performance.taskTypePerformance.get(taskType);
    if (taskPerf) {
      score += taskPerf.avgAccuracy * 0.2;
    }
    
    // Complexity matching bonus
    const complexityMatch = this.getComplexityMatch(model, complexity);
    score += complexityMatch * 0.1;
    
    // Penalize recent failures
    const failures = this.failureCount.get(model) || 0;
    score -= failures * 0.1;
    
    // Load balancing - slight preference for less recently used models
    const lastUsed = this.lastUsed.get(model) || 0;
    const timeSinceLastUse = Date.now() - lastUsed;
    score += Math.min(timeSinceLastUse / 60000, 0.05); // Max 0.05 bonus for 1+ minute
    
    return score;
  }

  getComplexityMatch(model, complexity) {
    // Model complexity preferences
    const modelComplexity = {
      'google/gemini-flash-1.5': 2,
      'google/gemini-pro-1.5': 4,
      'anthropic/claude-3.5-sonnet': 4,
      'anthropic/claude-3-haiku': 2,
      'openai/gpt-4o': 4,
      'openai/gpt-4o-mini': 2
    };
    
    const modelComplexityLevel = modelComplexity[model] || 2;
    const diff = Math.abs(modelComplexityLevel - complexity);
    return 1 - (diff / 4); // Normalize to 0-1 range
  }

  async call(prompt, modelType = 'main', options = {}) {
    const timer = performanceMonitor.startTimer(`ai_call_${modelType}`);
    let model;
    
    try {
      validateString(prompt, 'prompt', 50000);
      
      if (!this.client) {
        logger.warn('AI client not initialized (test mode)');
        return `[TEST MODE] AI response for: ${prompt.substring(0, 100)}...`;
      }

      // Check cache first (unless disabled)
      if (options.useCache !== false) {
        const cachedResult = await intelligentCache.get(prompt, modelType, options);
        if (cachedResult) {
          logger.debug('Cache hit for AI call', { modelType });
          timer.end();
          return cachedResult;
        }
      }
      
      model = this.selectModel(modelType, options.complexity, prompt);
      const startTime = Date.now();
      
      // Check circuit breaker
      if (!this.isModelHealthy(model)) {
        logger.warn('Model circuit breaker triggered, using fallback', { model });
        return await this.callWithFallback(prompt, modelType, options, [model]);
      }
      
      logger.debug('AI call initiated', { model, taskType: modelType });
      
      // Update last used time
      this.lastUsed.set(model, startTime);
      
      const response = await this.client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
      });
      
      const result = response.choices[0]?.message?.content;
      const duration = Date.now() - startTime;
      
      // Cache the result (unless disabled)
      if (options.useCache !== false && result) {
        await intelligentCache.set(prompt, modelType, options, result);
      }
      
      // Update performance metrics
      this.updateModelPerformance(model, modelType, duration, true);
      
      logger.info('AI call completed', { model, duration, success: true });
      timer.end();
      
      return result;
    } catch (error) {
      if (model) {
        const duration = Date.now() - (this.lastUsed.get(model) || Date.now());
        this.updateModelPerformance(model, modelType, duration, false);
        this.incrementFailureCount(model);
      }
      
      logger.error('AI call failed', { error: error.message, model: model || modelType });
      
      // Try fallback if available
      if (options.allowFallback !== false && model) {
        try {
          return await this.callWithFallback(prompt, modelType, options, [model]);
        } catch (fallbackError) {
          logger.error('All fallbacks failed', { error: fallbackError.message });
        }
      }
      
      timer.end();
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  async callWithFallback(prompt, modelType, options, excludeModels = []) {
    const fallbackOrder = this.getFallbackModels(modelType, excludeModels);
    
    for (const fallbackModel of fallbackOrder) {
      try {
        logger.info('Attempting fallback model', { model: fallbackModel, originalType: modelType });
        
        const response = await this.client.chat.completions.create({
          model: fallbackModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7,
        });
        
        const result = response.choices[0]?.message?.content;
        logger.info('Fallback successful', { model: fallbackModel });
        
        return result;
      } catch (error) {
        logger.warn('Fallback failed', { model: fallbackModel, error: error.message });
        this.incrementFailureCount(fallbackModel);
      }
    }
    
    throw new Error(`All models failed for task type: ${modelType}`);
  }

  getFallbackModels(taskType, excludeModels) {
    const allModels = Object.values(AI_MODELS).flat().filter(model => !excludeModels.includes(model));
    
    // Sort by health and performance
    return allModels.sort((a, b) => {
      const healthA = this.modelHealth.get(a);
      const healthB = this.modelHealth.get(b);
      const perfA = this.modelPerformance.get(a);
      const perfB = this.modelPerformance.get(b);
      
      const scoreA = (healthA?.successRate || 0) + (perfA?.avgAccuracy || 0);
      const scoreB = (healthB?.successRate || 0) + (perfB?.avgAccuracy || 0);
      
      return scoreB - scoreA;
    }).slice(0, 3); // Max 3 fallback attempts
  }

  isModelHealthy(model) {
    const failures = this.failureCount.get(model) || 0;
    const health = this.modelHealth.get(model);
    
    // Circuit breaker: too many failures or low success rate
    return failures < 5 && (health?.successRate || 0) > 0.3;
  }

  updateModelPerformance(model, taskType, duration, success) {
    const performance = this.modelPerformance.get(model);
    if (!performance) return;
    
    performance.totalCalls++;
    if (success) performance.successfulCalls++;
    
    // Update average response time
    performance.avgResponseTime = (performance.avgResponseTime + duration) / 2;
    
    // Update task-specific performance
    if (!performance.taskTypePerformance.has(taskType)) {
      performance.taskTypePerformance.set(taskType, {
        calls: 0,
        successes: 0,
        avgResponseTime: duration,
        avgAccuracy: 0.85
      });
    }
    
    const taskPerf = performance.taskTypePerformance.get(taskType);
    taskPerf.calls++;
    if (success) taskPerf.successes++;
    taskPerf.avgResponseTime = (taskPerf.avgResponseTime + duration) / 2;
    
    // Update health metrics
    const health = this.modelHealth.get(model);
    if (health) {
      health.successRate = performance.successfulCalls / performance.totalCalls;
      health.avgResponseTime = performance.avgResponseTime;
      health.lastHealthCheck = Date.now();
    }
  }

  incrementFailureCount(model) {
    const current = this.failureCount.get(model) || 0;
    this.failureCount.set(model, current + 1);
    
    // Update model availability if too many failures
    if (current >= 5) {
      const health = this.modelHealth.get(model);
      if (health) {
        health.available = false;
        // Schedule re-enable after 5 minutes
        setTimeout(() => {
          health.available = true;
          this.failureCount.set(model, 0);
          logger.info('Model re-enabled after cooldown', { model });
        }, 5 * 60 * 1000);
      }
    }
  }
  // Advanced orchestration methods
  async callMultiModel(prompt, modelTypes, options = {}) {
    const promises = modelTypes.map(type => 
      this.call(prompt, type, { ...options, allowFallback: false }).catch(e => ({ error: e.message, type }))
    );
    
    const results = await Promise.allSettled(promises);
    return results.map((result, index) => ({
      modelType: modelTypes[index],
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : result.reason.message
    }));
  }

  async callConsensus(prompt, modelTypes = ['main', 'analysis', 'review'], options = {}) {
    const results = await this.callMultiModel(prompt, modelTypes, options);
    
    // Simple consensus: return results with confidence scoring
    const validResults = results.filter(r => r.success);
    
    if (validResults.length === 0) {
      throw new Error('No models succeeded in consensus call');
    }
    
    return {
      consensus: validResults.length > 1 ? this.findConsensus(validResults) : validResults[0].result,
      individual: validResults,
      confidence: validResults.length / modelTypes.length
    };
  }

  findConsensus(results) {
    // Simple consensus algorithm - in a real implementation, this would be more sophisticated
    const responses = results.map(r => r.result);
    
    // For now, return the longest response as it's likely most comprehensive
    return responses.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }

  getHealthStatus() {
    const status = {};
    for (const [model, health] of this.modelHealth.entries()) {
      const performance = this.modelPerformance.get(model);
      const failures = this.failureCount.get(model) || 0;
      
      status[model] = {
        available: health.available,
        successRate: health.successRate,
        avgResponseTime: health.avgResponseTime,
        totalCalls: performance?.totalCalls || 0,
        recentFailures: failures,
        lastHealthCheck: new Date(health.lastHealthCheck).toISOString()
      };
    }
    return status;
  }

  // Get comprehensive system status including cache
  getSystemStatus() {
    return {
      modelHealth: this.getHealthStatus(),
      cacheStats: intelligentCache.getStats(),
      performanceMetrics: performanceMonitor.getSystemHealth()
    };
  }

  // Warm up cache with common queries
  async warmupCache() {
    const commonQueries = [
      'Explain JavaScript async/await patterns',
      'Best practices for React component architecture',
      'How to implement proper error handling in Node.js',
      'Explain RESTful API design principles',
      'What is the difference between SQL and NoSQL databases'
    ];
    
    await intelligentCache.warmup(commonQueries);
    logger.info('AI client cache warmup completed');
  }
}

// Task Complexity Analyzer
class TaskComplexityAnalyzer {
  analyzePrompt(prompt, taskType) {
    if (!prompt) return 2; // Default medium complexity
    
    let complexity = 1; // Start with simple
    
    // Complexity indicators
    const complexityMarkers = {
      'architecture': 3,
      'enterprise': 4,
      'production': 3,
      'scalability': 3,
      'performance': 2,
      'security': 3,
      'algorithm': 3,
      'optimization': 3,
      'refactor': 2,
      'legacy': 3,
      'migration': 4,
      'integration': 3,
      'microservice': 4,
      'kubernetes': 4,
      'docker': 2,
      'testing': 2,
      'debugging': 2
    };
    
    // Check for complexity markers
    for (const [marker, weight] of Object.entries(complexityMarkers)) {
      if (prompt.toLowerCase().includes(marker)) {
        complexity = Math.max(complexity, weight);
      }
    }
    
    // Length-based complexity
    if (prompt.length > 1000) complexity = Math.max(complexity, 3);
    if (prompt.length > 2000) complexity = Math.max(complexity, 4);
    
    // Code block complexity
    const codeBlocks = (prompt.match(/```/g) || []).length / 2;
    if (codeBlocks > 2) complexity = Math.max(complexity, 3);
    
    return Math.min(complexity, 4); // Cap at enterprise level
  }
}

// Context Manager
class ContextManager {
  constructor() {
    this.contexts = new Map();
    this.maxContexts = 100;
  }
  
  saveContext(id, context) {
    this.contexts.set(id, {
      ...context,
      timestamp: Date.now()
    });
    
    // Cleanup old contexts
    if (this.contexts.size > this.maxContexts) {
      this.cleanupOldContexts();
    }
  }
  
  getContext(id) {
    return this.contexts.get(id);
  }
  
  cleanupOldContexts() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    for (const [id, context] of this.contexts.entries()) {
      if (context.timestamp < cutoff) {
        this.contexts.delete(id);
      }
    }
  }
}

export const aiClient = new AIClient();