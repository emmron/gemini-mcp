// Configuration management
export const AI_MODELS = {
  main: 'google/gemini-flash-1.5',
  research: 'google/gemini-pro-1.5',
  fallback: 'google/gemini-flash-1.5',
  coding: 'anthropic/claude-3.5-sonnet',
  analysis: 'openai/gpt-4o',
  creative: 'google/gemini-pro-1.5',
  debug: 'anthropic/claude-3-haiku',
  review: 'openai/gpt-4o-mini',
  consensus: ['google/gemini-pro-1.5', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
  collaborative: ['google/gemini-flash-1.5', 'anthropic/claude-3-haiku']
};

export const CONFIG = {
  MAX_THREAD_HISTORY: 50, // Reduced from 100
  THREAD_TIMEOUT: 1800000, // 30 minutes instead of 1 hour
  MAX_CONTEXT_TOKENS: 100000, // Much more reasonable
  CLEANUP_INTERVAL: 300000, // 5 minutes
  CACHE_TTL: 3600000 // 1 hour
};

export function validateConfig() {
  const requiredEnvVars = ['OPENROUTER_API_KEY'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}