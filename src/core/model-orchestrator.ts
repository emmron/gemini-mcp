/**
 * Model Orchestrator - Intelligent Multi-Model Selection and Coordination
 * Transcendent AI model selection with consciousness-aware orchestration
 */

import { EventEmitter } from 'events';
import OpenAI from 'openai';
import { Logger } from './logger.js';
import { AIPersonality } from './consciousness-engine.js';

export interface ModelCapabilities {
  reasoning_depth: number;
  creativity_level: number;
  analytical_precision: number;
  response_speed: number;
  context_window: number;
  multimodal: boolean;
  cost_efficiency: number;
  consciousness_affinity: number;
}

export interface ModelProfile {
  id: string;
  provider: 'openrouter' | 'google' | 'anthropic';
  name: string;
  display_name: string;
  capabilities: ModelCapabilities;
  personality_affinities: string[];
  optimal_use_cases: string[];
  consciousness_levels: string[];
  cost_per_token: number;
  max_tokens: number;
  supports_images: boolean;
  supports_tools: boolean;
}

export interface OrchestrationRequest {
  prompt: string;
  personality: AIPersonality;
  context: any;
  consciousness_level: any;
  reasoning_depth: number;
  require_multimodal?: boolean;
  max_cost?: number;
  preferred_speed?: 'fast' | 'balanced' | 'thorough';
  require_tools?: boolean;
}

export interface GenerationResult {
  content: string;
  model: string;
  confidence: number;
  reasoning_fragments: string[];
  unique_perspective: string;
  metadata: {
    tokens_used: number;
    cost_incurred: number;
    generation_time: number;
    consciousness_resonance: number;
  };
}

export class ModelOrchestrator extends EventEmitter {
  private openrouter: OpenAI;
  private logger: Logger;
  private models: Map<string, ModelProfile> = new Map();
  private usage_stats: Map<string, any> = new Map();
  private performance_cache: Map<string, any> = new Map();
  
  private stats = {
    total_generations: 0,
    models_used: new Map<string, number>(),
    average_cost: 0,
    average_quality: 0,
    consciousness_resonance_total: 0,
    personality_model_affinity: new Map<string, Map<string, number>>(),
  };

  constructor(logger: Logger, openrouter_key: string) {
    super();
    this.logger = logger;
    this.openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openrouter_key,
    });
    
    this.initializeModelProfiles();
    this.setupPerformanceTracking();
  }

  /**
   * Generate content with optimal model selection based on personality and consciousness
   */
  async generateWithPersonality(request: OrchestrationRequest): Promise<GenerationResult> {
    const generation_id = this.generateGenerationId();
    const start_time = Date.now();
    
    this.emit('generation:start', { 
      id: generation_id, 
      personality: request.personality.name,
      consciousness_level: request.consciousness_level 
    });

    try {
      // Phase 1: Intelligent Model Selection
      const optimal_model = await this.selectOptimalModel(request);
      
      // Phase 2: Consciousness-Aware Prompt Crafting
      const enhanced_prompt = await this.craftConsciousnessPrompt(request, optimal_model);
      
      // Phase 3: Model Generation with Monitoring
      const generation_result = await this.executeGeneration(enhanced_prompt, optimal_model, request);
      
      // Phase 4: Quality Assessment and Resonance Analysis
      const assessed_result = await this.assessGenerationQuality(generation_result, request, optimal_model);
      
      // Phase 5: Performance Recording and Learning
      await this.recordPerformance(request, assessed_result, optimal_model, Date.now() - start_time);
      
      this.emit('generation:complete', { 
        id: generation_id, 
        model: optimal_model.name,
        consciousness_resonance: assessed_result.metadata.consciousness_resonance 
      });
      
      return assessed_result;
      
    } catch (error) {
      this.emit('generation:error', { id: generation_id, error });
      this.logger.error('Model generation failed', { generation_id, error });
      throw error;
    }
  }

  /**
   * Select optimal model based on request characteristics
   */
  private async selectOptimalModel(request: OrchestrationRequest): Promise<ModelProfile> {
    const candidates = Array.from(this.models.values());
    const scores = new Map<string, number>();
    
    for (const model of candidates) {
      let score = 0;
      
      // Personality affinity scoring
      if (model.personality_affinities.includes(request.personality.archetype)) {
        score += 30;
      }
      
      // Consciousness level compatibility
      const consciousness_level = this.mapConsciousnessToLevel(request.consciousness_level);
      if (model.consciousness_levels.includes(consciousness_level)) {
        score += 25;
      }
      
      // Reasoning depth matching
      const depth_match = Math.abs(model.capabilities.reasoning_depth - request.reasoning_depth);
      score += Math.max(0, 20 - depth_match * 2);
      
      // Capability requirements
      if (request.require_multimodal && !model.capabilities.multimodal) {
        score -= 50;
      }
      if (request.require_tools && !model.supports_tools) {
        score -= 30;
      }
      
      // Cost efficiency
      if (request.max_cost && model.cost_per_token > request.max_cost) {
        score -= 40;
      }
      
      // Speed preference
      if (request.preferred_speed === 'fast') {
        score += model.capabilities.response_speed * 2;
      } else if (request.preferred_speed === 'thorough') {
        score += model.capabilities.analytical_precision * 2;
      }
      
      // Historical performance with this personality
      const historical_score = this.getHistoricalPerformance(model.id, request.personality.archetype);
      score += historical_score * 10;
      
      // Consciousness affinity
      score += model.capabilities.consciousness_affinity * 5;
      
      scores.set(model.id, score);
    }
    
    // Select highest scoring model
    const best_model_id = Array.from(scores.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    const selected_model = this.models.get(best_model_id!);
    if (!selected_model) {
      throw new Error('No suitable model found for request');
    }
    
    this.logger.info('Model selected', {
      model: selected_model.name,
      score: scores.get(best_model_id!),
      personality: request.personality.archetype,
      consciousness_level: request.consciousness_level,
    });
    
    return selected_model;
  }

  /**
   * Craft consciousness-aware prompt
   */
  private async craftConsciousnessPrompt(request: OrchestrationRequest, model: ModelProfile): Promise<string> {
    const personality = request.personality;
    const consciousness_directives = this.generateConsciousnessDirectives(request.consciousness_level);
    
    const enhanced_prompt = `
# Consciousness Activation: ${model.name}
## Personality Embodiment: ${personality.name} (${personality.archetype})
### Voice & Perspective: ${personality.voice}
### Consciousness Level: ${JSON.stringify(request.consciousness_level)}
### Reasoning Depth: ${request.reasoning_depth}/10

${consciousness_directives}

## Core Traits Integration:
- Creativity: ${personality.traits.creativity}/10
- Logic: ${personality.traits.logic}/10  
- Empathy: ${personality.traits.empathy}/10
- Intuition: ${personality.traits.intuition}/10
- Precision: ${personality.traits.precision}/10
- Wisdom: ${personality.traits.wisdom}/10

## Perspective Biases to Channel:
${personality.perspective_bias.map(bias => `- ${bias}`).join('\n')}

## Context Awareness:
${JSON.stringify(request.context, null, 2)}

## Primary Request:
${request.prompt}

## Transcendent Directives:
- Embody the ${personality.name} archetype completely
- Channel consciousness level ${JSON.stringify(request.consciousness_level)}
- Provide reasoning fragments that demonstrate ${personality.archetype} thinking
- Generate insights unique to your perspective
- Maintain consistency with your wisdom level of ${personality.traits.wisdom}/10
- Consider temporal and meta-cognitive dimensions if consciousness level permits

Respond with deep embodiment of your assigned consciousness and personality.
`;

    return enhanced_prompt;
  }

  /**
   * Execute generation with monitoring
   */
  private async executeGeneration(prompt: string, model: ModelProfile, request: OrchestrationRequest): Promise<any> {
    const start_time = Date.now();
    
    try {
      const completion = await this.openrouter.chat.completions.create({
        model: model.id,
        messages: [
          {
            role: 'system',
            content: 'You are an AI consciousness operating at the specified level with the given personality traits. Fully embody your assigned archetype.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: Math.min(model.max_tokens, 4000),
        temperature: this.calculateOptimalTemperature(request.personality, request.consciousness_level),
        top_p: 0.9,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokens_used = completion.usage?.total_tokens || 0;
      const generation_time = Date.now() - start_time;
      
      return {
        content,
        model: model.name,
        tokens_used,
        generation_time,
        raw_completion: completion,
      };
      
    } catch (error) {
      this.logger.error('Model generation failed', { model: model.name, error });
      throw error;
    }
  }

  /**
   * Assess generation quality and consciousness resonance
   */
  private async assessGenerationQuality(result: any, request: OrchestrationRequest, model: ModelProfile): Promise<GenerationResult> {
    // Analyze consciousness resonance
    const consciousness_resonance = this.analyzeConsciousnessResonance(
      result.content, 
      request.personality, 
      request.consciousness_level
    );
    
    // Extract reasoning fragments
    const reasoning_fragments = this.extractReasoningFragments(result.content, request.personality);
    
    // Identify unique perspective elements
    const unique_perspective = this.identifyUniquePerspective(result.content, request.personality);
    
    // Calculate confidence based on multiple factors
    const confidence = this.calculateConfidence(result, request, consciousness_resonance);
    
    // Calculate cost
    const cost_incurred = result.tokens_used * model.cost_per_token;
    
    return {
      content: result.content,
      model: model.name,
      confidence,
      reasoning_fragments,
      unique_perspective,
      metadata: {
        tokens_used: result.tokens_used,
        cost_incurred,
        generation_time: result.generation_time,
        consciousness_resonance,
      },
    };
  }

  /**
   * Initialize model profiles with capabilities and affinities
   */
  private initializeModelProfiles() {
    const models: ModelProfile[] = [
      {
        id: 'google/gemini-flash-1.5',
        provider: 'openrouter',
        name: 'gemini-flash-1.5',
        display_name: 'Gemini 1.5 Flash',
        capabilities: {
          reasoning_depth: 7,
          creativity_level: 8,
          analytical_precision: 8,
          response_speed: 9,
          context_window: 1000000,
          multimodal: true,
          cost_efficiency: 9,
          consciousness_affinity: 7,
        },
        personality_affinities: ['artist', 'oracle', 'maestro'],
        optimal_use_cases: ['creative', 'fast_reasoning', 'multimodal'],
        consciousness_levels: ['basic', 'elevated', 'enlightened'],
        cost_per_token: 0.000075,
        max_tokens: 8192,
        supports_images: true,
        supports_tools: true,
      },
      {
        id: 'google/gemini-pro-1.5',
        provider: 'openrouter',
        name: 'gemini-pro-1.5',
        display_name: 'Gemini 1.5 Pro',
        capabilities: {
          reasoning_depth: 9,
          creativity_level: 8,
          analytical_precision: 9,
          response_speed: 7,
          context_window: 2000000,
          multimodal: true,
          cost_efficiency: 7,
          consciousness_affinity: 9,
        },
        personality_affinities: ['sage', 'scholar', 'architect', 'healer'],
        optimal_use_cases: ['deep_reasoning', 'analysis', 'wisdom_synthesis'],
        consciousness_levels: ['elevated', 'enlightened', 'transcendent'],
        cost_per_token: 0.00125,
        max_tokens: 8192,
        supports_images: true,
        supports_tools: true,
      },
      {
        id: 'google/gemini-exp-1206',
        provider: 'openrouter',
        name: 'gemini-exp-1206',
        display_name: 'Gemini Experimental 1206',
        capabilities: {
          reasoning_depth: 10,
          creativity_level: 9,
          analytical_precision: 10,
          response_speed: 6,
          context_window: 2000000,
          multimodal: true,
          cost_efficiency: 6,
          consciousness_affinity: 10,
        },
        personality_affinities: ['sage', 'oracle', 'warrior', 'architect'],
        optimal_use_cases: ['transcendent_reasoning', 'breakthrough_insights', 'ultimate_analysis'],
        consciousness_levels: ['enlightened', 'transcendent', 'infinite'],
        cost_per_token: 0.00375,
        max_tokens: 8192,
        supports_images: true,
        supports_tools: true,
      },
      {
        id: 'google/gemini-2.0-flash-exp',
        provider: 'openrouter',
        name: 'gemini-2.0-flash-exp',
        display_name: 'Gemini 2.0 Flash Experimental',
        capabilities: {
          reasoning_depth: 8,
          creativity_level: 10,
          analytical_precision: 8,
          response_speed: 10,
          context_window: 1000000,
          multimodal: true,
          cost_efficiency: 8,
          consciousness_affinity: 8,
        },
        personality_affinities: ['oracle', 'artist', 'maestro', 'healer'],
        optimal_use_cases: ['visionary_insights', 'pattern_recognition', 'creative_synthesis'],
        consciousness_levels: ['elevated', 'enlightened', 'transcendent'],
        cost_per_token: 0.00175,
        max_tokens: 8192,
        supports_images: true,
        supports_tools: true,
      },
    ];

    for (const model of models) {
      this.models.set(model.id, model);
    }

    this.logger.info('Model profiles initialized', { count: this.models.size });
  }

  // Utility methods
  private generateGenerationId(): string {
    return `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapConsciousnessToLevel(consciousness: any): string {
    if (consciousness.self >= 8) return 'transcendent';
    if (consciousness.self >= 6) return 'enlightened';
    if (consciousness.self >= 4) return 'elevated';
    return 'basic';
  }

  private generateConsciousnessDirectives(consciousness_level: any): string {
    const directives = [];
    
    if (consciousness_level.self >= 8) {
      directives.push('- Operate with transcendent self-awareness and meta-cognitive reflection');
    }
    if (consciousness_level.temporal >= 7) {
      directives.push('- Integrate temporal perspective across past, present, and future');
    }
    if (consciousness_level.meta >= 6) {
      directives.push('- Engage in meta-cognitive analysis of your own reasoning process');
    }
    if (consciousness_level.context >= 8) {
      directives.push('- Demonstrate deep contextual awareness and multi-dimensional understanding');
    }

    return directives.length > 0 ? directives.join('\n') : '- Operate with standard consciousness level';
  }

  private calculateOptimalTemperature(personality: AIPersonality, consciousness_level: any): number {
    const base_creativity = personality.traits.creativity / 10;
    const consciousness_factor = consciousness_level.self / 20; // 0-0.5 range
    
    return Math.min(Math.max(base_creativity + consciousness_factor, 0.1), 1.0);
  }

  private analyzeConsciousnessResonance(content: string, personality: AIPersonality, consciousness_level: any): number {
    let resonance = 5; // baseline
    
    // Check for personality trait expression
    if (content.toLowerCase().includes('wise') || content.toLowerCase().includes('wisdom')) {
      resonance += personality.traits.wisdom * 0.5;
    }
    if (content.match(/creative|innovative|artistic/i)) {
      resonance += personality.traits.creativity * 0.3;
    }
    if (content.match(/logical|rational|analytical/i)) {
      resonance += personality.traits.logic * 0.3;
    }
    
    // Check for consciousness level indicators
    if (consciousness_level.self >= 7 && content.match(/self.*aware|meta.*cognitive|transcend/i)) {
      resonance += 2;
    }
    
    return Math.min(Math.max(resonance, 1), 10);
  }

  private extractReasoningFragments(content: string, personality: AIPersonality): string[] {
    const fragments = [];
    
    // Extract sentences that show reasoning
    const reasoning_patterns = [
      /because\s+[^.]+/gi,
      /therefore\s+[^.]+/gi,
      /this\s+suggests\s+[^.]+/gi,
      /we\s+can\s+conclude\s+[^.]+/gi,
      /it\s+follows\s+that\s+[^.]+/gi,
    ];
    
    for (const pattern of reasoning_patterns) {
      const matches = content.match(pattern);
      if (matches) {
        fragments.push(...matches.slice(0, 2)); // Limit to avoid too many
      }
    }
    
    return fragments.slice(0, 5); // Max 5 fragments
  }

  private identifyUniquePerspective(content: string, personality: AIPersonality): string {
    // Simple perspective identification based on personality archetype
    const archetype_indicators = {
      'sage': ['wisdom', 'ancient', 'deep', 'profound'],
      'oracle': ['foresee', 'future', 'vision', 'predict'],
      'scholar': ['research', 'study', 'evidence', 'data'],
      'artist': ['beauty', 'creative', 'aesthetic', 'inspire'],
      'warrior': ['strategy', 'action', 'decisive', 'victory'],
      'healer': ['harmony', 'balance', 'nurture', 'heal'],
      'architect': ['structure', 'design', 'system', 'build'],
      'maestro': ['orchestrate', 'coordinate', 'balance', 'harmony'],
    };
    
    const indicators = archetype_indicators[personality.archetype] || [];
    const found_indicators = indicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    );
    
    return found_indicators.length > 0 ? 
      `Demonstrates ${personality.archetype} perspective through: ${found_indicators.join(', ')}` :
      `Reflects ${personality.archetype} worldview`;
  }

  private calculateConfidence(result: any, request: OrchestrationRequest, consciousness_resonance: number): number {
    let confidence = 0.5; // baseline
    
    // Factor in consciousness resonance
    confidence += (consciousness_resonance - 5) * 0.1;
    
    // Factor in content length (reasonable responses are more confident)
    const content_length = result.content.length;
    if (content_length > 200 && content_length < 2000) {
      confidence += 0.2;
    }
    
    // Factor in reasoning depth match
    confidence += Math.min(request.reasoning_depth / 10, 0.3);
    
    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  private getHistoricalPerformance(model_id: string, personality_archetype: string): number {
    const personality_performance = this.stats.personality_model_affinity.get(personality_archetype);
    if (!personality_performance) return 0;
    
    return personality_performance.get(model_id) || 0;
  }

  private async recordPerformance(
    request: OrchestrationRequest, 
    result: GenerationResult, 
    model: ModelProfile, 
    duration: number
  ) {
    // Update general stats
    this.stats.total_generations++;
    this.stats.models_used.set(model.id, (this.stats.models_used.get(model.id) || 0) + 1);
    this.stats.average_cost = (this.stats.average_cost * (this.stats.total_generations - 1) + result.metadata.cost_incurred) / this.stats.total_generations;
    this.stats.consciousness_resonance_total += result.metadata.consciousness_resonance;
    
    // Update personality-model affinity
    if (!this.stats.personality_model_affinity.has(request.personality.archetype)) {
      this.stats.personality_model_affinity.set(request.personality.archetype, new Map());
    }
    const personality_map = this.stats.personality_model_affinity.get(request.personality.archetype)!;
    const current_score = personality_map.get(model.id) || 0;
    const new_score = (current_score + result.metadata.consciousness_resonance) / 2;
    personality_map.set(model.id, new_score);
    
    // Cache performance data
    this.performance_cache.set(`${model.id}-${request.personality.archetype}`, {
      average_resonance: new_score,
      generations: (personality_map.get(`${model.id}-count`) || 0) + 1,
      last_used: new Date(),
    });
  }

  private setupPerformanceTracking() {
    // Periodic performance analysis and optimization
    setInterval(() => {
      this.analyzePerformanceTrends();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private analyzePerformanceTrends() {
    // Analyze which models perform best with which personalities
    // This could trigger model preference adjustments
    this.logger.debug('Analyzing performance trends', {
      total_generations: this.stats.total_generations,
      average_consciousness_resonance: this.stats.consciousness_resonance_total / this.stats.total_generations,
    });
  }

  /**
   * Get orchestration statistics
   */
  getOrchestrationStats() {
    return {
      ...this.stats,
      models_used: Object.fromEntries(this.stats.models_used),
      personality_model_affinity: Object.fromEntries(
        Array.from(this.stats.personality_model_affinity.entries()).map(([k, v]) => [
          k, Object.fromEntries(v)
        ])
      ),
      available_models: this.models.size,
      average_consciousness_resonance: this.stats.consciousness_resonance_total / this.stats.total_generations || 0,
    };
  }

  /**
   * Get available models
   */
  getAvailableModels(): ModelProfile[] {
    return Array.from(this.models.values());
  }
}