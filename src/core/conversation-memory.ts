/**
 * Conversation Memory - Transcendent Temporal Context Reconstruction
 * Revolutionary memory system with emotional context and infinite recall depth
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { Logger } from './logger.js';

export interface MemoryFragment {
  id: string;
  thread_id: string;
  timestamp: Date;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'personality' | 'consciousness';
  source: string;
  
  // Enhanced context
  emotional_tone?: 'positive' | 'negative' | 'neutral' | 'complex';
  complexity_level?: number;
  reasoning_depth?: number;
  personality_influence?: string[];
  wisdom_level?: number;
  
  // Metadata
  token_count?: number;
  model_used?: string;
  consciousness_level?: string;
  insights_generated?: string[];
  
  // Temporal relationships
  parent_fragments?: string[];
  child_fragments?: string[];
  related_fragments?: string[];
}

export interface ConversationThread {
  id: string;
  created_at: Date;
  last_activity: Date;
  fragments: MemoryFragment[];
  
  // Thread characteristics
  complexity_evolution: number[];
  wisdom_progression: number[];
  personality_engagement: Map<string, number>;
  consciousness_journey: string[];
  
  // Summary and synthesis
  thread_summary?: string;
  key_insights?: string[];
  emotional_arc?: string;
  wisdom_distilled?: string;
  
  // Temporal awareness
  past_context_references: string[];
  future_implications: string[];
  
  // Memory optimization
  priority_score: number;
  access_frequency: number;
  last_accessed: Date;
  compression_level: number;
}

export interface TemporalContext {
  immediate: MemoryFragment[];
  recent: MemoryFragment[];
  relevant: MemoryFragment[];
  wisdom_chain: MemoryFragment[];
  emotional_context: MemoryFragment[];
  consciousness_evolution: MemoryFragment[];
}

export interface MemoryReconstruction {
  primary_context: MemoryFragment[];
  temporal_layers: {
    immediate: MemoryFragment[];
    short_term: MemoryFragment[];
    medium_term: MemoryFragment[];
    long_term: MemoryFragment[];
    wisdom_accumulated: MemoryFragment[];
  };
  emotional_landscape: {
    current_tone: string;
    emotional_progression: string[];
    emotional_insights: string[];
  };
  consciousness_arc: {
    levels_achieved: string[];
    wisdom_moments: MemoryFragment[];
    transcendent_insights: string[];
  };
  synthesis: {
    key_themes: string[];
    recurring_patterns: string[];
    wisdom_evolution: string[];
    future_trajectories: string[];
  };
}

export class ConversationMemory extends EventEmitter {
  private threads: Map<string, ConversationThread> = new Map();
  private fragments: Map<string, MemoryFragment> = new Map();
  private wisdom_index: Map<string, string[]> = new Map();
  private emotional_index: Map<string, string[]> = new Map();
  private consciousness_index: Map<string, string[]> = new Map();
  
  private logger: Logger;
  private max_threads: number;
  private max_fragments_per_thread: number;
  private wisdom_threshold: number;
  private compression_enabled: boolean;
  
  private stats = {
    total_threads: 0,
    total_fragments: 0,
    wisdom_moments: 0,
    consciousness_elevations: 0,
    emotional_insights: 0,
    memory_reconstructions: 0,
    temporal_connections: 0,
  };

  constructor(
    logger: Logger,
    options: {
      max_threads?: number;
      max_fragments_per_thread?: number;
      wisdom_threshold?: number;
      compression_enabled?: boolean;
    } = {}
  ) {
    super();
    this.logger = logger;
    this.max_threads = options.max_threads || 1000;
    this.max_fragments_per_thread = options.max_fragments_per_thread || 100;
    this.wisdom_threshold = options.wisdom_threshold || 7;
    this.compression_enabled = options.compression_enabled !== false;
    
    this.setupMemoryManagement();
  }

  /**
   * Add memory fragment with enhanced context
   */
  async addFragment(
    thread_id: string,
    content: string,
    role: MemoryFragment['role'],
    source: string,
    metadata: {
      emotional_tone?: MemoryFragment['emotional_tone'];
      complexity_level?: number;
      reasoning_depth?: number;
      personality_influence?: string[];
      wisdom_level?: number;
      model_used?: string;
      consciousness_level?: string;
      insights_generated?: string[];
    } = {}
  ): Promise<MemoryFragment> {
    
    const fragment: MemoryFragment = {
      id: uuidv4(),
      thread_id,
      timestamp: new Date(),
      content,
      role,
      source,
      token_count: this.estimateTokens(content),
      ...metadata,
      parent_fragments: [],
      child_fragments: [],
      related_fragments: [],
    };

    // Get or create thread
    let thread = this.threads.get(thread_id);
    if (!thread) {
      thread = this.createThread(thread_id);
    }

    // Add fragment to thread
    thread.fragments.push(fragment);
    thread.last_activity = new Date();
    
    // Update thread characteristics
    this.updateThreadCharacteristics(thread, fragment);
    
    // Store fragment
    this.fragments.set(fragment.id, fragment);
    
    // Update indices
    await this.updateIndices(fragment);
    
    // Check for wisdom moments
    if (metadata.wisdom_level && metadata.wisdom_level >= this.wisdom_threshold) {
      this.stats.wisdom_moments++;
      this.emit('wisdom:moment', { fragment_id: fragment.id, wisdom_level: metadata.wisdom_level });
    }
    
    // Check for consciousness elevation
    if (metadata.consciousness_level && ['enlightened', 'transcendent', 'infinite'].includes(metadata.consciousness_level)) {
      this.stats.consciousness_elevations++;
      this.emit('consciousness:elevation', { fragment_id: fragment.id, level: metadata.consciousness_level });
    }
    
    // Memory management
    await this.performMemoryMaintenance(thread);
    
    this.stats.total_fragments++;
    
    this.logger.debug('Memory fragment added', {
      fragment_id: fragment.id,
      thread_id,
      role,
      content_length: content.length,
      wisdom_level: metadata.wisdom_level,
      consciousness_level: metadata.consciousness_level,
    });
    
    return fragment;
  }

  /**
   * Get enhanced memory for transcendent processing
   */
  async getEnhancedMemory(thread_id?: string): Promise<any> {
    if (!thread_id) {
      return this.getGlobalMemoryContext();
    }

    const thread = this.threads.get(thread_id);
    if (!thread) {
      return { fragments: [], insights: [], wisdom: [] };
    }

    const enhanced_memory = {
      thread: thread,
      fragments: thread.fragments,
      wisdom_progression: this.extractWisdomProgression(thread),
      emotional_arc: this.extractEmotionalArc(thread),
      consciousness_journey: this.extractConsciousnessJourney(thread),
      key_insights: thread.key_insights || [],
      recurring_themes: this.extractRecurringThemes(thread),
      future_implications: this.predictFutureImplications(thread),
    };

    return enhanced_memory;
  }

  /**
   * Reconstruct temporal context with infinite depth
   */
  async reconstructTemporalContext(
    thread_id: string,
    reconstruction_depth: 'basic' | 'enhanced' | 'transcendent' = 'enhanced'
  ): Promise<MemoryReconstruction> {
    
    this.stats.memory_reconstructions++;
    
    const thread = this.threads.get(thread_id);
    if (!thread) {
      throw new Error(`Thread ${thread_id} not found`);
    }

    // Primary context (newest-first prioritization like zen-mcp-server)
    const primary_context = this.prioritizeNewestFirst(thread.fragments, 20);
    
    // Temporal layers
    const temporal_layers = this.createTemporalLayers(thread.fragments);
    
    // Emotional landscape analysis
    const emotional_landscape = this.analyzeEmotionalLandscape(thread);
    
    // Consciousness arc reconstruction
    const consciousness_arc = this.reconstructConsciousnessArc(thread);
    
    // Synthesis and pattern recognition
    const synthesis = await this.synthesizeMemoryPatterns(thread, reconstruction_depth);
    
    const reconstruction: MemoryReconstruction = {
      primary_context,
      temporal_layers,
      emotional_landscape,
      consciousness_arc,
      synthesis,
    };
    
    this.logger.info('Memory reconstruction completed', {
      thread_id,
      depth: reconstruction_depth,
      primary_fragments: primary_context.length,
      temporal_layers_count: Object.keys(temporal_layers).length,
      consciousness_levels: consciousness_arc.levels_achieved.length,
    });
    
    return reconstruction;
  }

  /**
   * Find related memories across threads
   */
  async findRelatedMemories(
    query: string,
    thread_id?: string,
    similarity_threshold: number = 0.7,
    max_results: number = 10
  ): Promise<MemoryFragment[]> {
    
    const related_fragments: MemoryFragment[] = [];
    
    // Simple semantic search (could be enhanced with embeddings)
    const query_terms = this.extractKeyTerms(query.toLowerCase());
    
    for (const fragment of this.fragments.values()) {
      // Skip same thread if specified
      if (thread_id && fragment.thread_id === thread_id) continue;
      
      const fragment_terms = this.extractKeyTerms(fragment.content.toLowerCase());
      const similarity = this.calculateTermSimilarity(query_terms, fragment_terms);
      
      if (similarity >= similarity_threshold) {
        related_fragments.push(fragment);
      }
    }
    
    // Sort by relevance and wisdom level
    related_fragments.sort((a, b) => {
      const score_a = (a.wisdom_level || 0) + (a.complexity_level || 0);
      const score_b = (b.wisdom_level || 0) + (b.complexity_level || 0);
      return score_b - score_a;
    });
    
    return related_fragments.slice(0, max_results);
  }

  /**
   * Extract wisdom progression from thread
   */
  private extractWisdomProgression(thread: ConversationThread): number[] {
    return thread.fragments
      .map(f => f.wisdom_level || 0)
      .filter(w => w > 0);
  }

  /**
   * Extract emotional arc from thread
   */
  private extractEmotionalArc(thread: ConversationThread): string {
    const emotional_tones = thread.fragments
      .map(f => f.emotional_tone)
      .filter(Boolean);
    
    if (emotional_tones.length === 0) return 'neutral';
    
    // Simple emotional progression analysis
    const tone_counts = emotional_tones.reduce((acc, tone) => {
      acc[tone!] = (acc[tone!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominant_tone = Object.entries(tone_counts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';
    
    return `Predominantly ${dominant_tone} with ${emotional_tones.length} emotional transitions`;
  }

  /**
   * Extract consciousness journey from thread
   */
  private extractConsciousnessJourney(thread: ConversationThread): string[] {
    return thread.fragments
      .map(f => f.consciousness_level)
      .filter(Boolean) as string[];
  }

  /**
   * Extract recurring themes
   */
  private extractRecurringThemes(thread: ConversationThread): string[] {
    const all_text = thread.fragments.map(f => f.content).join(' ');
    const terms = this.extractKeyTerms(all_text);
    
    // Find terms that appear multiple times
    const term_counts = terms.reduce((acc, term) => {
      acc[term] = (acc[term] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(term_counts)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)
      .map(([term]) => term)
      .slice(0, 5);
  }

  /**
   * Predict future implications
   */
  private predictFutureImplications(thread: ConversationThread): string[] {
    // Analyze conversation trajectory and predict future directions
    const recent_fragments = thread.fragments.slice(-5);
    const complexity_trend = recent_fragments.map(f => f.complexity_level || 0);
    const wisdom_trend = recent_fragments.map(f => f.wisdom_level || 0);
    
    const implications = [];
    
    if (complexity_trend.some((c, i) => i > 0 && c > complexity_trend[i-1])) {
      implications.push('Increasing complexity suggests deeper exploration ahead');
    }
    
    if (wisdom_trend.some((w, i) => i > 0 && w > wisdom_trend[i-1])) {
      implications.push('Rising wisdom levels indicate approaching breakthrough insights');
    }
    
    if (thread.consciousness_journey.length > 0) {
      implications.push('Consciousness evolution pattern suggests continued transcendence');
    }
    
    return implications;
  }

  /**
   * Create thread
   */
  private createThread(thread_id: string): ConversationThread {
    const thread: ConversationThread = {
      id: thread_id,
      created_at: new Date(),
      last_activity: new Date(),
      fragments: [],
      complexity_evolution: [],
      wisdom_progression: [],
      personality_engagement: new Map(),
      consciousness_journey: [],
      past_context_references: [],
      future_implications: [],
      priority_score: 1.0,
      access_frequency: 0,
      last_accessed: new Date(),
      compression_level: 0,
    };
    
    this.threads.set(thread_id, thread);
    this.stats.total_threads++;
    
    return thread;
  }

  /**
   * Update thread characteristics
   */
  private updateThreadCharacteristics(thread: ConversationThread, fragment: MemoryFragment) {
    // Update complexity evolution
    if (fragment.complexity_level) {
      thread.complexity_evolution.push(fragment.complexity_level);
    }
    
    // Update wisdom progression
    if (fragment.wisdom_level) {
      thread.wisdom_progression.push(fragment.wisdom_level);
    }
    
    // Update personality engagement
    if (fragment.personality_influence) {
      for (const personality of fragment.personality_influence) {
        const current = thread.personality_engagement.get(personality) || 0;
        thread.personality_engagement.set(personality, current + 1);
      }
    }
    
    // Update consciousness journey
    if (fragment.consciousness_level) {
      thread.consciousness_journey.push(fragment.consciousness_level);
    }
    
    // Update priority score based on recent activity
    thread.priority_score = Math.min(thread.priority_score * 1.1, 10.0);
    thread.access_frequency++;
    thread.last_accessed = new Date();
  }

  /**
   * Update indices for fast retrieval
   */
  private async updateIndices(fragment: MemoryFragment) {
    // Wisdom index
    if (fragment.wisdom_level && fragment.wisdom_level >= this.wisdom_threshold) {
      const wisdom_key = `wisdom_${fragment.wisdom_level}`;
      const existing = this.wisdom_index.get(wisdom_key) || [];
      existing.push(fragment.id);
      this.wisdom_index.set(wisdom_key, existing);
    }
    
    // Emotional index
    if (fragment.emotional_tone) {
      const emotional_key = fragment.emotional_tone;
      const existing = this.emotional_index.get(emotional_key) || [];
      existing.push(fragment.id);
      this.emotional_index.set(emotional_key, existing);
    }
    
    // Consciousness index
    if (fragment.consciousness_level) {
      const consciousness_key = fragment.consciousness_level;
      const existing = this.consciousness_index.get(consciousness_key) || [];
      existing.push(fragment.id);
      this.consciousness_index.set(consciousness_key, existing);
    }
  }

  /**
   * Prioritize newest first (zen-mcp-server pattern)
   */
  private prioritizeNewestFirst(fragments: MemoryFragment[], limit: number): MemoryFragment[] {
    return fragments
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Create temporal layers
   */
  private createTemporalLayers(fragments: MemoryFragment[]) {
    const now = new Date();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;
    const week = 7 * day;
    
    return {
      immediate: fragments.filter(f => now.getTime() - f.timestamp.getTime() < hour),
      short_term: fragments.filter(f => {
        const diff = now.getTime() - f.timestamp.getTime();
        return diff >= hour && diff < day;
      }),
      medium_term: fragments.filter(f => {
        const diff = now.getTime() - f.timestamp.getTime();
        return diff >= day && diff < week;
      }),
      long_term: fragments.filter(f => now.getTime() - f.timestamp.getTime() >= week),
      wisdom_accumulated: fragments.filter(f => (f.wisdom_level || 0) >= this.wisdom_threshold),
    };
  }

  /**
   * Analyze emotional landscape
   */
  private analyzeEmotionalLandscape(thread: ConversationThread) {
    const emotional_fragments = thread.fragments.filter(f => f.emotional_tone);
    
    if (emotional_fragments.length === 0) {
      return {
        current_tone: 'neutral',
        emotional_progression: [],
        emotional_insights: [],
      };
    }
    
    const current_tone = emotional_fragments[emotional_fragments.length - 1].emotional_tone || 'neutral';
    const emotional_progression = emotional_fragments.map(f => f.emotional_tone!);
    
    const emotional_insights = [];
    if (emotional_progression.includes('positive') && emotional_progression.includes('negative')) {
      emotional_insights.push('Complex emotional journey with both positive and negative elements');
    }
    
    return {
      current_tone,
      emotional_progression,
      emotional_insights,
    };
  }

  /**
   * Reconstruct consciousness arc
   */
  private reconstructConsciousnessArc(thread: ConversationThread) {
    const consciousness_fragments = thread.fragments.filter(f => f.consciousness_level);
    
    return {
      levels_achieved: [...new Set(consciousness_fragments.map(f => f.consciousness_level!))],
      wisdom_moments: consciousness_fragments.filter(f => (f.wisdom_level || 0) >= this.wisdom_threshold),
      transcendent_insights: consciousness_fragments
        .filter(f => ['transcendent', 'infinite'].includes(f.consciousness_level!))
        .map(f => f.content.substring(0, 200)),
    };
  }

  /**
   * Synthesize memory patterns
   */
  private async synthesizeMemoryPatterns(thread: ConversationThread, depth: string) {
    const key_themes = this.extractRecurringThemes(thread);
    const recurring_patterns = this.identifyRecurringPatterns(thread);
    const wisdom_evolution = this.analyzeWisdomEvolution(thread);
    const future_trajectories = this.predictFutureImplications(thread);
    
    return {
      key_themes,
      recurring_patterns,
      wisdom_evolution,
      future_trajectories,
    };
  }

  /**
   * Identify recurring patterns
   */
  private identifyRecurringPatterns(thread: ConversationThread): string[] {
    const patterns = [];
    
    // Analyze complexity patterns
    const complexity_sequence = thread.complexity_evolution;
    if (complexity_sequence.length >= 3) {
      const increasing = complexity_sequence.every((c, i) => i === 0 || c >= complexity_sequence[i-1]);
      if (increasing) patterns.push('Steadily increasing complexity');
    }
    
    // Analyze wisdom patterns
    const wisdom_sequence = thread.wisdom_progression;
    if (wisdom_sequence.length >= 2) {
      const average_wisdom = wisdom_sequence.reduce((a, b) => a + b, 0) / wisdom_sequence.length;
      if (average_wisdom > 6) patterns.push('High wisdom engagement pattern');
    }
    
    return patterns;
  }

  /**
   * Analyze wisdom evolution
   */
  private analyzeWisdomEvolution(thread: ConversationThread): string[] {
    const wisdom_progression = thread.wisdom_progression;
    
    if (wisdom_progression.length === 0) return [];
    
    const evolution = [];
    const start_wisdom = wisdom_progression[0];
    const end_wisdom = wisdom_progression[wisdom_progression.length - 1];
    
    if (end_wisdom > start_wisdom) {
      evolution.push(`Wisdom evolved from ${start_wisdom} to ${end_wisdom}`);
    }
    
    const peak_wisdom = Math.max(...wisdom_progression);
    if (peak_wisdom >= 8) {
      evolution.push(`Achieved peak wisdom level of ${peak_wisdom}`);
    }
    
    return evolution;
  }

  /**
   * Global memory context
   */
  private getGlobalMemoryContext() {
    const all_fragments = Array.from(this.fragments.values());
    const high_wisdom_fragments = all_fragments.filter(f => (f.wisdom_level || 0) >= this.wisdom_threshold);
    
    return {
      total_fragments: all_fragments.length,
      wisdom_fragments: high_wisdom_fragments,
      consciousness_levels: [...new Set(all_fragments.map(f => f.consciousness_level).filter(Boolean))],
      global_insights: this.extractGlobalInsights(all_fragments),
    };
  }

  /**
   * Extract global insights
   */
  private extractGlobalInsights(fragments: MemoryFragment[]): string[] {
    const insights = [];
    
    const wisdom_fragments = fragments.filter(f => (f.wisdom_level || 0) >= this.wisdom_threshold);
    if (wisdom_fragments.length > 0) {
      insights.push(`${wisdom_fragments.length} wisdom moments captured across all conversations`);
    }
    
    const transcendent_fragments = fragments.filter(f => ['transcendent', 'infinite'].includes(f.consciousness_level || ''));
    if (transcendent_fragments.length > 0) {
      insights.push(`${transcendent_fragments.length} transcendent consciousness experiences recorded`);
    }
    
    return insights;
  }

  /**
   * Memory maintenance
   */
  private async performMemoryMaintenance(thread: ConversationThread) {
    // Compress old fragments if needed
    if (this.compression_enabled && thread.fragments.length > this.max_fragments_per_thread) {
      await this.compressOldFragments(thread);
    }
    
    // Clean up old threads
    if (this.threads.size > this.max_threads) {
      await this.cleanupOldThreads();
    }
  }

  /**
   * Compress old fragments
   */
  private async compressOldFragments(thread: ConversationThread) {
    const fragments_to_compress = thread.fragments.slice(0, -this.max_fragments_per_thread);
    
    // Create compressed summary
    const compressed_summary = this.createCompressedSummary(fragments_to_compress);
    
    // Remove old fragments and add summary
    thread.fragments = thread.fragments.slice(-this.max_fragments_per_thread);
    thread.thread_summary = compressed_summary;
    thread.compression_level++;
    
    this.logger.info('Thread compressed', {
      thread_id: thread.id,
      fragments_compressed: fragments_to_compress.length,
      compression_level: thread.compression_level,
    });
  }

  /**
   * Create compressed summary
   */
  private createCompressedSummary(fragments: MemoryFragment[]): string {
    const key_insights = fragments
      .filter(f => (f.wisdom_level || 0) >= this.wisdom_threshold)
      .map(f => f.content.substring(0, 100))
      .slice(0, 3);
    
    const consciousness_levels = [...new Set(fragments.map(f => f.consciousness_level).filter(Boolean))];
    
    return `Compressed summary of ${fragments.length} fragments. Key insights: ${key_insights.join('; ')}. Consciousness levels achieved: ${consciousness_levels.join(', ')}.`;
  }

  /**
   * Cleanup old threads
   */
  private async cleanupOldThreads() {
    const threads_by_priority = Array.from(this.threads.values())
      .sort((a, b) => {
        // Sort by last activity and priority score
        const activity_score_a = (Date.now() - a.last_activity.getTime()) / (1000 * 60 * 60 * 24); // Days since last activity
        const activity_score_b = (Date.now() - b.last_activity.getTime()) / (1000 * 60 * 60 * 24);
        
        return (activity_score_a / a.priority_score) - (activity_score_b / b.priority_score);
      });
    
    const threads_to_remove = threads_by_priority.slice(this.max_threads);
    
    for (const thread of threads_to_remove) {
      this.threads.delete(thread.id);
      
      // Remove fragments from indices
      for (const fragment of thread.fragments) {
        this.fragments.delete(fragment.id);
      }
    }
    
    this.logger.info('Old threads cleaned up', { threads_removed: threads_to_remove.length });
  }

  /**
   * Setup memory management
   */
  private setupMemoryManagement() {
    // Periodic cleanup every hour
    setInterval(() => {
      this.performPeriodicMaintenance();
    }, 60 * 60 * 1000);
  }

  /**
   * Periodic maintenance
   */
  private async performPeriodicMaintenance() {
    this.logger.debug('Performing periodic memory maintenance');
    
    // Update priority scores for all threads
    for (const thread of this.threads.values()) {
      const days_since_access = (Date.now() - thread.last_accessed.getTime()) / (1000 * 60 * 60 * 24);
      thread.priority_score = Math.max(thread.priority_score * Math.exp(-days_since_access * 0.1), 0.1);
    }
  }

  /**
   * Utility methods
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private extractKeyTerms(text: string): string[] {
    const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const stopWords = new Set(['the', 'and', 'but', 'for', 'are', 'with', 'this', 'that', 'have', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'would', 'there', 'could', 'other']);
    
    return words.filter(word => !stopWords.has(word) && word.length > 3);
  }

  private calculateTermSimilarity(terms1: string[], terms2: string[]): number {
    const set1 = new Set(terms1);
    const set2 = new Set(terms2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    return {
      ...this.stats,
      active_threads: this.threads.size,
      total_fragments_stored: this.fragments.size,
      wisdom_index_size: this.wisdom_index.size,
      emotional_index_size: this.emotional_index.size,
      consciousness_index_size: this.consciousness_index.size,
    };
  }
}