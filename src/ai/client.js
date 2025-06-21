import OpenAI from 'openai';
import { AI_MODELS, CONFIG } from '../config.js';
import { logger } from '../utils/logger.js';
import { validateString } from '../utils/validation.js';

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
  }

  selectModel(taskType = 'main', complexity = 'medium') {
    const complexityWeight = { simple: 1, medium: 2, complex: 3, enterprise: 4 }[complexity] || 2;
    
    const taskModels = {
      frontend: complexityWeight > 2 ? 'coding' : 'creative',
      backend: complexityWeight > 2 ? 'coding' : 'main',
      devops: 'coding',
      testing: complexityWeight > 1 ? 'coding' : 'main',
      analysis: 'analysis',
      security: 'review',
      debugging: 'debug',
      research: 'research'
    };
    
    return AI_MODELS[taskModels[taskType] || taskType] || AI_MODELS.main;
  }

  async call(prompt, modelType = 'main', options = {}) {
    try {
      validateString(prompt, 'prompt', 50000);
      
      if (!this.client) {
        logger.warn('AI client not initialized (test mode)');
        return `[TEST MODE] AI response for: ${prompt.substring(0, 100)}...`;
      }
      
      const model = this.selectModel(modelType, options.complexity);
      const startTime = Date.now();
      
      logger.debug('AI call initiated', { model, taskType: modelType });
      
      const response = await this.client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
      });
      
      const result = response.choices[0]?.message?.content;
      const duration = Date.now() - startTime;
      
      logger.info('AI call completed', { model, duration, success: true });
      
      return result;
    } catch (error) {
      logger.error('AI call failed', { error: error.message, model: modelType });
      throw new Error(`AI request failed: ${error.message}`);
    }
  }
}

export const aiClient = new AIClient();