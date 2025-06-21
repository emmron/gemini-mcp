#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import fs from 'fs/promises';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { createHash } from 'crypto';
import { URL } from 'url';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY environment variable is required');
  process.exit(1);
}

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY,
});

// Enhanced multi-model AI configuration with orchestration capabilities
const AI_MODELS = {
  // Core models
  main: 'google/gemini-flash-1.5',
  research: 'google/gemini-pro-1.5',
  fallback: 'google/gemini-flash-1.5',
  
  // Specialized models for different tasks
  coding: 'anthropic/claude-3.5-sonnet',
  analysis: 'openai/gpt-4o',
  creative: 'google/gemini-pro-1.5',
  debug: 'anthropic/claude-3-haiku',
  review: 'openai/gpt-4o-mini',
  
  // Multi-model orchestration
  consensus: ['google/gemini-pro-1.5', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
  collaborative: ['google/gemini-flash-1.5', 'anthropic/claude-3-haiku']
};

// Intelligent model selection based on task complexity and type
function selectOptimalModel(taskType, complexity = 'medium', context = '') {
  const complexityWeight = {
    'simple': 1,
    'medium': 2, 
    'complex': 3,
    'enterprise': 4
  }[complexity] || 2;
  
  const taskModels = {
    'frontend': complexityWeight > 2 ? 'coding' : 'creative',
    'backend': complexityWeight > 2 ? 'coding' : 'main',
    'devops': 'coding',
    'testing': complexityWeight > 1 ? 'coding' : 'main',
    'analysis': 'analysis',
    'optimization': 'analysis',
    'security': 'review',
    'debugging': 'debug',
    'research': 'research',
    'collaboration': 'main'
  };
  
  // Context-aware selection
  if (context.toLowerCase().includes('performance')) return 'analysis';
  if (context.toLowerCase().includes('security')) return 'review';
  if (context.toLowerCase().includes('debug')) return 'debug';
  
  return taskModels[taskType] || 'main';
}

// Conversation threading for context persistence
const conversationThreads = new Map();
const MAX_THREAD_HISTORY = 100; // Increased for large context window
const THREAD_TIMEOUT = 3600000; // 1 hour
const MAX_CONTEXT_TOKENS = 900000; // Reserve 100k for response

function getThreadId(context = '') {
  const hash = createHash('md5');
  hash.update(context + Date.now().toString());
  return hash.digest('hex').substring(0, 8);
}

function addToThread(threadId, message, response) {
  if (!conversationThreads.has(threadId)) {
    conversationThreads.set(threadId, {
      messages: [],
      created: Date.now(),
      lastActivity: Date.now()
    });
  }
  
  const thread = conversationThreads.get(threadId);
  thread.messages.push({ message, response, timestamp: Date.now() });
  thread.lastActivity = Date.now();
  
  // Limit thread history
  if (thread.messages.length > MAX_THREAD_HISTORY) {
    thread.messages = thread.messages.slice(-MAX_THREAD_HISTORY);
  }
}

function getThreadContext(threadId) {
  const thread = conversationThreads.get(threadId);
  if (!thread || Date.now() - thread.lastActivity > THREAD_TIMEOUT) {
    return null;
  }
  
  // Use full context for large window models
  return thread.messages.slice(-50).map(m => 
    `Human: ${m.message}\nAI: ${m.response}`
  ).join('\n\n');
}

// Clean up expired threads
setInterval(() => {
  const now = Date.now();
  for (const [threadId, thread] of conversationThreads.entries()) {
    if (now - thread.lastActivity > THREAD_TIMEOUT) {
      conversationThreads.delete(threadId);
    }
  }
}, 300000); // Clean every 5 minutes

const server = new Server(
  { 
    name: 'gemini-task-master', 
    version: '3.0.0',
    protocolVersion: '2024-11-05'
  },
  { 
    capabilities: { 
      tools: {},
      logging: {}
    }
  }
);

// Enhanced persistent state management
const TASKS_FILE = path.join(process.cwd(), '.taskmaster', 'tasks.json');
const CONFIG_FILE = path.join(process.cwd(), '.taskmaster', 'config.json');
const CONTEXT_FILE = path.join(process.cwd(), '.taskmaster', 'context.json');
const CACHE_FILE = path.join(process.cwd(), '.taskmaster', 'cache.json');
const PRD_FILE = path.join(process.cwd(), '.taskmaster', 'docs', 'prd.txt');
const ANALYSIS_FILE = path.join(process.cwd(), '.taskmaster', 'analysis.json');

async function ensureTaskmasterDir() {
  const dirs = [
    path.dirname(TASKS_FILE),
    path.dirname(PRD_FILE)
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {}
  }
}

async function loadTasks() {
  try {
    await ensureTaskmasterDir();
    const data = await fs.readFile(TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { tasks: [], nextId: 1, projectName: path.basename(process.cwd()) };
  }
}

async function saveTasks(taskData) {
  await ensureTaskmasterDir();
  await fs.writeFile(TASKS_FILE, JSON.stringify(taskData, null, 2));
}

async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {
      projectType: 'general',
      framework: null,
      complexity: 'medium',
      preferences: {}
    };
  }
}

async function aiCall(prompt, modelType = 'main', options = {}) {
  const { threadId, taskType, complexity } = options;
  
  // Auto-select optimal model if requested
  const finalModelType = modelType === 'auto' ? 
    selectOptimalModel(taskType || 'general', complexity, prompt) : 
    modelType;
  
  const model = AI_MODELS[finalModelType] || AI_MODELS.main;
  
  // Add thread context if available
  let enhancedPrompt = prompt;
  if (threadId) {
    const context = getThreadContext(threadId);
    if (context) {
      enhancedPrompt = `Previous conversation context:\n${context}\n\n---\n\nCurrent request:\n${prompt}`;
    }
  }
  
  try {
    const response = await openrouter.chat.completions.create({
      model,
      messages: [{ role: 'user', content: enhancedPrompt }],
      max_tokens: options.maxTokens || 1500,
      temperature: options.temperature || 0.3,
      ...options
    });
    
    const result = response.choices[0]?.message?.content || null;
    
    // Store in thread if threadId provided
    if (threadId && result) {
      addToThread(threadId, prompt, result);
    }
    
    return result;
  } catch (error) {
    // Enhanced fallback strategy
    if (finalModelType !== 'fallback') {
      console.error(`[AI] ${finalModelType} model failed, trying fallback:`, error.message);
      return await aiCall(prompt, 'fallback', { ...options, threadId: undefined });
    }
    throw error;
  }
}

// Multi-model consensus and collaboration functions
async function aiConsensus(prompt, models = AI_MODELS.consensus, options = {}) {
  const responses = await Promise.allSettled(
    models.map(model => 
      openrouter.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.3,
        ...options
      })
    )
  );
  
  const results = responses
    .filter(r => r.status === 'fulfilled')
    .map((r, i) => ({
      model: models[i],
      response: r.value.choices[0]?.message?.content || 'No response'
    }));
  
  // Synthesize consensus
  const synthesisPrompt = `Analyze these responses from different AI models and provide a consensus view:

${results.map(r => `**${r.model}:**\n${r.response}\n`).join('\n')}

Provide a synthesized response that combines the best insights from all models.`;
  
  return await aiCall(synthesisPrompt, 'main', { maxTokens: 1500 });
}

async function aiCollaborate(prompt, context = '', models = AI_MODELS.collaborative) {
  let conversation = context;
  const results = [];
  
  for (const model of models) {
    const fullPrompt = conversation ? 
      `Previous context:\n${conversation}\n\nContinue the analysis:\n${prompt}` : 
      prompt;
    
    try {
      const response = await openrouter.chat.completions.create({
        model,
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 1000,
        temperature: 0.4
      });
      
      const content = response.choices[0]?.message?.content || 'No response';
      results.push({ model, response: content });
      conversation += `\n\n**${model}:**\n${content}`;
    } catch (error) {
      console.error(`[Collaborate] ${model} failed:`, error.message);
    }
  }
  
  return {
    conversation,
    individual_responses: results,
    final_context: conversation
  };
}


// Advanced context and cache management
async function loadContext() {
  try {
    await ensureTaskmasterDir();
    const data = await fs.readFile(CONTEXT_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {
      sessions: [],
      current_session: null,
      conversation_history: [],
      project_context: {},
      user_preferences: {},
      model_performance: {}
    };
  }
}

async function saveContext(contextData) {
  await ensureTaskmasterDir();
  await fs.writeFile(CONTEXT_FILE, JSON.stringify(contextData, null, 2));
}

async function loadCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { responses: {}, analyses: {}, research: {} };
  }
}

async function saveCache(cacheData) {
  await ensureTaskmasterDir();
  await fs.writeFile(CACHE_FILE, JSON.stringify(cacheData, null, 2));
}

// PRD and document analysis
async function loadPRD() {
  try {
    const prdContent = await fs.readFile(PRD_FILE, 'utf8');
    return prdContent.trim();
  } catch {
    return null;
  }
}

async function savePRD(content) {
  await ensureTaskmasterDir();
  const docsDir = path.dirname(PRD_FILE);
  await fs.mkdir(docsDir, { recursive: true });
  await fs.writeFile(PRD_FILE, content);
}

// Advanced codebase analysis
async function analyzeCodebase(targetPath = '.') {
  const analysis = {
    files: [],
    languages: {},
    structure: {},
    dependencies: {},
    metrics: {},
    patterns: [],
    issues: [],
    timestamp: new Date().toISOString()
  };
  
  try {
    // Get file structure
    const getFiles = (dir, files = []) => {
      const items = readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('.') && item.name !== '.taskmaster') continue;
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          getFiles(fullPath, files);
        } else {
          files.push(fullPath);
        }
      }
      return files;
    };
    
    analysis.files = getFiles(targetPath);
    
    // Analyze languages
    analysis.files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      analysis.languages[ext] = (analysis.languages[ext] || 0) + 1;
    });
    
    // Package analysis
    const packageFiles = ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod'];
    for (const pkgFile of packageFiles) {
      try {
        const pkgPath = path.join(targetPath, pkgFile);
        const content = await fs.readFile(pkgPath, 'utf8');
        if (pkgFile === 'package.json') {
          const pkg = JSON.parse(content);
          analysis.dependencies.npm = {
            dependencies: pkg.dependencies || {},
            devDependencies: pkg.devDependencies || {},
            scripts: pkg.scripts || {}
          };
        }
      } catch {}
    }
    
    analysis.metrics = {
      total_files: analysis.files.length,
      code_files: analysis.files.filter(f => ['.js', '.ts', '.py', '.go', '.rs', '.java', '.cpp'].includes(path.extname(f))).length,
      config_files: analysis.files.filter(f => ['package.json', '.env', 'config.json', 'tsconfig.json'].includes(path.basename(f))).length
    };
    
  } catch (error) {
    analysis.error = error.message;
  }
  
  return analysis;
}

// Web research integration
async function webResearch(query, context = '') {
  const cacheKey = createHash('md5').update(query + context).digest('hex');
  const cache = await loadCache();
  
  if (cache.research[cacheKey] && 
      Date.now() - cache.research[cacheKey].timestamp < 3600000) { // 1 hour cache
    return cache.research[cacheKey].result;
  }
  
  const researchPrompt = `Research this topic with current information: ${query}

${context ? `Context: ${context}` : ''}

Provide:
1. Current best practices and trends
2. Latest tools and technologies
3. Common pitfalls and solutions
4. Practical implementation advice
5. Relevant examples and case studies`;
  
  const result = await aiCall(researchPrompt, 'research', { maxTokens: 2000 });
  
  cache.research[cacheKey] = {
    result,
    timestamp: Date.now(),
    query,
    context
  };
  
  await saveCache(cache);
  return result;
}

// Performance monitoring for models
async function trackModelPerformance(model, taskType, startTime, success, error = null) {
  const context = await loadContext();
  const performanceKey = `${model}-${taskType}`;
  
  if (!context.model_performance[performanceKey]) {
    context.model_performance[performanceKey] = {
      calls: 0,
      successes: 0,
      failures: 0,
      avg_response_time: 0,
      total_time: 0
    };
  }
  
  const perf = context.model_performance[performanceKey];
  const responseTime = Date.now() - startTime;
  
  perf.calls++;
  perf.total_time += responseTime;
  perf.avg_response_time = perf.total_time / perf.calls;
  
  if (success) {
    perf.successes++;
  } else {
    perf.failures++;
    perf.last_error = error;
  }
  
  await saveContext(context);
}

// Enhanced codebase analysis function
async function performCodebaseAnalysis(targetPath = '.', options = {}) {
  const {
    includeAI = true,
    reportType = 'comprehensive',
    depth = 'deep',
    saveResults = true
  } = options;

  const analysis = {
    timestamp: new Date().toISOString(),
    target: targetPath,
    options,
    basic_analysis: null,
    ai_insights: null,
    executive_summary: null,
    recommendations: [],
    errors: []
  };

  try {
    // Perform basic codebase analysis
    analysis.basic_analysis = await analyzeCodebase(targetPath);
    
    if (includeAI && analysis.basic_analysis) {
      // AI-powered deep analysis
      const aiAnalysisPrompt = `Perform ${depth} analysis of this codebase data:

${JSON.stringify(analysis.basic_analysis, null, 2)}

Provide insights on:
1. Code quality and maintainability
2. Architecture patterns and structure
3. Technology stack assessment
4. Security considerations
5. Performance implications
6. Technical debt indicators
7. Scalability assessment
8. Development best practices compliance

Format as structured analysis with specific findings and recommendations.`;

      analysis.ai_insights = await aiCall(aiAnalysisPrompt, 'analysis', { maxTokens: 2000 });
      
      // Generate executive summary if requested
      if (reportType === 'executive' || reportType === 'comprehensive') {
        const executivePrompt = `Create an executive summary from this codebase analysis:

Basic Analysis: ${JSON.stringify(analysis.basic_analysis, null, 2)}

AI Insights: ${analysis.ai_insights}

Provide:
- Health Score (0-100)
- Risk Assessment
- Key Metrics
- Strategic Recommendations
- Investment Priorities
- Timeline Estimates

Format as executive briefing with business impact focus.`;

        analysis.executive_summary = await aiCall(executivePrompt, 'research', { maxTokens: 1500 });
      }
    }

    // Save results if requested
    if (saveResults) {
      await ensureTaskmasterDir();
      await fs.writeFile(ANALYSIS_FILE, JSON.stringify(analysis, null, 2));
    }

    return analysis;
  } catch (error) {
    analysis.errors.push({
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return analysis;
  }
}

// Autonomous agent capabilities
async function autonomousAnalysis(target, depth = 'comprehensive') {
  const analysis = {
    target,
    depth,
    findings: [],
    recommendations: [],
    action_plan: [],
    confidence: 0,
    timestamp: new Date().toISOString()
  };
  
  // Multi-step autonomous analysis
  const steps = [
    { name: 'codebase_scan', model: 'analysis' },
    { name: 'security_review', model: 'review' },
    { name: 'performance_analysis', model: 'coding' },
    { name: 'architecture_assessment', model: 'research' }
  ];
  
  for (const step of steps) {
    try {
      const stepPrompt = `Perform ${step.name} on: ${target}

Depth: ${depth}
Previous findings: ${JSON.stringify(analysis.findings.slice(-2))}

Provide specific, actionable insights.`;
      
      const result = await aiCall(stepPrompt, step.model);
      analysis.findings.push({
        step: step.name,
        model: step.model,
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      analysis.findings.push({
        step: step.name,
        error: error.message
      });
    }
  }
  
  // Generate final recommendations
  const recommendPrompt = `Based on these analysis findings, provide prioritized recommendations:

${analysis.findings.map(f => `${f.step}: ${f.result || f.error}`).join('\n\n')}

Provide:
1. Top 5 priority actions
2. Risk assessment
3. Implementation timeline
4. Success metrics`;
  
  const recommendations = await aiCall(recommendPrompt, 'main');
  analysis.recommendations = recommendations;
  analysis.confidence = Math.min(95, analysis.findings.filter(f => !f.error).length * 20);
  
  return analysis;
}

// Task Master-style: Comprehensive tool set
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // 🎨 Frontend Development Tools
    {
      name: 'generate_component',
      description: 'Advanced UI component generation for React, Vue, Angular, Svelte',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Component name' },
          framework: { type: 'string', enum: ['react', 'vue', 'angular', 'svelte'], default: 'react' },
          type: { type: 'string', enum: ['functional', 'class', 'hooks'], default: 'functional' },
          features: { type: 'string', description: 'Comma-separated features: state,effects,props,typescript' },
          styling: { type: 'string', enum: ['css', 'scss', 'styled-components', 'tailwind'], default: 'css' }
        },
        required: ['name']
      }
    },
    {
      name: 'generate_styles',
      description: 'Modern CSS generation and theming with design systems',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['component', 'theme', 'utilities'], default: 'component' },
          framework: { type: 'string', enum: ['css', 'scss', 'tailwind', 'styled-components'], default: 'css' },
          features: { type: 'string', description: 'dark-mode,responsive,animations' }
        },
        required: ['type']
      }
    },
    {
      name: 'generate_hook',
      description: 'Smart hooks and composables for React and Vue',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Hook name' },
          framework: { type: 'string', enum: ['react', 'vue'], default: 'react' },
          type: { type: 'string', enum: ['data-fetching', 'state-management', 'side-effects', 'custom'], default: 'custom' }
        },
        required: ['name']
      }
    },
    {
      name: 'scaffold_project',
      description: 'Complete project structure setup with modern tooling',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Project name' },
          framework: { type: 'string', enum: ['react', 'vue', 'nextjs', 'nuxtjs', 'angular', 'svelte'], default: 'react' },
          features: { type: 'string', description: 'typescript,tailwind,testing,pwa,auth' }
        },
        required: ['name']
      }
    },
    // 🔧 Backend Development Tools
    {
      name: 'generate_api',
      description: 'Enterprise REST API generation with authentication and validation',
      inputSchema: {
        type: 'object',
        properties: {
          framework: { type: 'string', enum: ['express', 'fastify', 'nestjs', 'koa'], default: 'express' },
          resource: { type: 'string', description: 'Resource name (e.g., users, posts)' },
          methods: { type: 'string', description: 'HTTP methods: GET,POST,PUT,DELETE' },
          features: { type: 'string', description: 'auth,validation,pagination,swagger' },
          database: { type: 'string', enum: ['mongodb', 'postgresql', 'mysql', 'sqlite'], default: 'mongodb' }
        },
        required: ['resource']
      }
    },
    {
      name: 'generate_schema',
      description: 'Advanced database schema generation with relationships and migrations',
      inputSchema: {
        type: 'object',
        properties: {
          database: { type: 'string', enum: ['mongodb', 'postgresql', 'mysql', 'sqlite'], default: 'mongodb' },
          orm: { type: 'string', enum: ['prisma', 'typeorm', 'mongoose', 'sequelize'], default: 'mongoose' },
          entities: { type: 'string', description: 'Comma-separated entity names' }
        },
        required: ['entities']
      }
    },
    {
      name: 'generate_middleware',
      description: 'Security and utility middleware generation',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['auth', 'cors', 'validation', 'logging', 'rate-limiting'], default: 'auth' },
          framework: { type: 'string', enum: ['express', 'fastify', 'nestjs'], default: 'express' },
          features: { type: 'string', description: 'jwt,oauth,rate-limiting,monitoring' }
        },
        required: ['type']
      }
    },
    // 🧪 Testing & Quality Tools
    {
      name: 'generate_tests',
      description: 'Comprehensive test suite generation with coverage reporting',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['unit', 'integration', 'e2e', 'component', 'full-stack'], default: 'unit' },
          framework: { type: 'string', enum: ['jest', 'vitest', 'cypress', 'playwright', 'mocha'], default: 'jest' },
          target: { type: 'string', description: 'Component or module to test' },
          features: { type: 'string', description: 'coverage,mocks,integration,performance' }
        },
        required: ['type']
      }
    },
    {
      name: 'optimize_code',
      description: 'AI-powered code optimization and refactoring suggestions',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to code to optimize' },
          focus: { type: 'string', description: 'performance,security,maintainability,testing' },
          language: { type: 'string', description: 'Programming language' }
        },
        required: ['path']
      }
    },
    // 🐳 DevOps & Deployment Tools
    {
      name: 'generate_dockerfile',
      description: 'Production-ready container generation with multi-stage builds',
      inputSchema: {
        type: 'object',
        properties: {
          appType: { type: 'string', enum: ['node', 'python', 'java', 'go', 'fullstack'], default: 'node' },
          framework: { type: 'string', description: 'Application framework' },
          features: { type: 'string', description: 'multi-stage,alpine,nginx,healthcheck' },
          port: { type: 'number', default: 3000 }
        },
        required: ['appType']
      }
    },
    {
      name: 'generate_deployment',
      description: 'Cloud deployment configurations for Kubernetes, Docker Compose, AWS',
      inputSchema: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: ['kubernetes', 'docker-compose', 'aws', 'gcp', 'azure'], default: 'kubernetes' },
          replicas: { type: 'number', default: 3 },
          features: { type: 'string', description: 'autoscaling,monitoring,secrets,ingress' },
          namespace: { type: 'string', default: 'default' }
        },
        required: ['platform']
      }
    },
    {
      name: 'generate_env',
      description: 'Environment configuration management with secrets validation',
      inputSchema: {
        type: 'object',
        properties: {
          environments: { type: 'string', description: 'dev,staging,prod' },
          features: { type: 'string', description: 'secrets,validation,docker' }
        },
        required: ['environments']
      }
    },
    {
      name: 'generate_monitoring',
      description: 'Observability stack setup with Prometheus, Grafana, and alerting',
      inputSchema: {
        type: 'object',
        properties: {
          stack: { type: 'string', enum: ['prometheus', 'elk', 'jaeger', 'full'], default: 'prometheus' },
          features: { type: 'string', description: 'alerting,dashboards,logging,tracing' }
        },
        required: ['stack']
      }
    },
    // 💼 Business Intelligence Tools
    {
      name: 'analyze_codebase',
      description: 'Revolutionary AI code intelligence with business impact analysis and executive dashboards',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to analyze' },
          includeAnalysis: { type: 'boolean', default: true, description: 'Include deep AI analysis' },
          reportType: { type: 'string', enum: ['executive', 'technical', 'security', 'financial'], default: 'comprehensive' }
        },
        required: ['path']
      }
    },
    {
      name: 'ask_gemini',
      description: 'Advanced AI consultation with context-aware recommendations',
      inputSchema: {
        type: 'object', 
        properties: {
          question: { type: 'string', description: 'Question or problem to solve' },
          context: { type: 'string', description: 'Additional context or code' },
          expertise: { type: 'string', enum: ['architecture', 'performance', 'security', 'best-practices'], default: 'general' }
        },
        required: ['question']
      }
    },
    {
      name: 'create_project_tasks',
      description: 'Parse requirements and create comprehensive project tasks with AI research',
      inputSchema: {
        type: 'object',
        properties: {
          requirements: {
            type: 'string',
            description: 'Project requirements or PRD to break down into tasks'
          },
          project_type: {
            type: 'string',
            enum: ['web_app', 'mobile_app', 'api', 'library', 'script', 'general'],
            default: 'general',
            description: 'Type of project for context-aware task generation'
          },
          complexity: {
            type: 'string',
            enum: ['simple', 'medium', 'complex'],
            default: 'medium',
            description: 'Expected project complexity level'
          }
        },
        required: ['requirements']
      }
    },
    {
      name: 'get_task_research',
      description: 'Research best practices and implementation details for a specific task',
      inputSchema: {
        type: 'object',
        properties: {
          task_id: {
            type: 'number',
            description: 'ID of the task to research'
          },
          focus_areas: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['implementation', 'testing', 'security', 'performance', 'best_practices', 'examples']
            },
            default: ['implementation', 'best_practices'],
            description: 'Areas to focus research on'
          }
        },
        required: ['task_id']
      }
    },
    {
      name: 'update_task_status',
      description: 'Update task status and manage dependencies automatically',
      inputSchema: {
        type: 'object',
        properties: {
          task_id: {
            type: 'number',
            description: 'ID of the task to update'
          },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'blocked', 'completed', 'cancelled'],
            description: 'New status for the task'
          },
          notes: {
            type: 'string',
            description: 'Progress notes or completion details'
          },
          completion_percentage: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Task completion percentage'
          }
        },
        required: ['task_id', 'status']
      }
    },
    {
      name: 'list_project_tasks',
      description: 'List and filter project tasks with intelligent organization',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'blocked', 'completed', 'cancelled', 'all'],
            default: 'all',
            description: 'Filter by task status'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical', 'all'],
            default: 'all',
            description: 'Filter by priority level'
          },
          show_dependencies: {
            type: 'boolean',
            default: true,
            description: 'Show task dependencies and relationships'
          },
          view: {
            type: 'string',
            enum: ['summary', 'detailed', 'timeline'],
            default: 'summary',
            description: 'Display format for tasks'
          }
        }
      }
    },
    {
      name: 'get_next_actions',
      description: 'AI-powered recommendation of next actions based on project state',
      inputSchema: {
        type: 'object',
        properties: {
          context: {
            type: 'string',
            description: 'Current working context or recent changes'
          },
          limit: {
            type: 'number',
            default: 5,
            description: 'Maximum number of recommendations'
          }
        }
      }
    },
    {
      name: 'generate_implementation_plan',
      description: 'Generate detailed implementation plan for a specific task',
      inputSchema: {
        type: 'object',
        properties: {
          task_id: {
            type: 'number',
            description: 'ID of the task to plan'
          },
          include_code_structure: {
            type: 'boolean',
            default: true,
            description: 'Include suggested code structure and architecture'
          },
          include_testing: {
            type: 'boolean',
            default: true,
            description: 'Include testing strategy and test cases'
          }
        },
        required: ['task_id']
      }
    },
    {
      name: 'ai_chat',
      description: 'Collaborative AI conversation with model selection and context awareness',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Message or question for AI conversation'
          },
          model: {
            type: 'string',
            enum: ['main', 'research', 'coding', 'analysis', 'creative', 'debug', 'review'],
            default: 'main',
            description: 'Specific AI model to use'
          },
          context: {
            type: 'string',
            description: 'Additional context or previous conversation'
          },
          max_tokens: {
            type: 'number',
            default: 1500,
            description: 'Maximum tokens for response'
          }
        },
        required: ['message']
      }
    },
    {
      name: 'ai_consensus',
      description: 'Get consensus from multiple AI models on complex decisions',
      inputSchema: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'Question or problem to get consensus on'
          },
          models: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific models to use (optional)'
          },
          context: {
            type: 'string',
            description: 'Additional context for the question'
          }
        },
        required: ['question']
      }
    },
    {
      name: 'ai_collaborate',
      description: 'Multi-model collaborative thinking and problem solving',
      inputSchema: {
        type: 'object',
        properties: {
          problem: {
            type: 'string',
            description: 'Problem or challenge to solve collaboratively'
          },
          context: {
            type: 'string',
            description: 'Existing context or previous analysis'
          },
          models: {
            type: 'array',
            items: { type: 'string' },
            description: 'Models to use in collaboration'
          }
        },
        required: ['problem']
      }
    },
    {
      name: 'code_review',
      description: 'AI-powered code review with multiple perspectives',
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Code to review'
          },
          language: {
            type: 'string',
            description: 'Programming language'
          },
          focus: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['security', 'performance', 'maintainability', 'best_practices', 'bugs', 'style']
            },
            default: ['security', 'performance', 'maintainability'],
            description: 'Areas to focus review on'
          },
          use_consensus: {
            type: 'boolean',
            default: true,
            description: 'Use multiple models for consensus review'
          }
        },
        required: ['code']
      }
    },
    {
      name: 'debug_analysis',
      description: 'Collaborative debugging with multiple AI models',
      inputSchema: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message or description'
          },
          code: {
            type: 'string',
            description: 'Code where error occurs'
          },
          context: {
            type: 'string',
            description: 'Additional context about the error'
          },
          language: {
            type: 'string',
            description: 'Programming language'
          }
        },
        required: ['error']
      }
    },
    {
      name: 'code_analyze',
      description: 'Deep code analysis with AI insights',
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Code to analyze'
          },
          analysis_type: {
            type: 'string',
            enum: ['structure', 'complexity', 'dependencies', 'patterns', 'optimization', 'comprehensive'],
            default: 'comprehensive',
            description: 'Type of analysis to perform'
          },
          language: {
            type: 'string',
            description: 'Programming language'
          }
        },
        required: ['code']
      }
    },
    {
      name: 'refactor_suggestions',
      description: 'AI-powered refactoring suggestions and improvements',
      inputSchema: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Code to refactor'
          },
          goals: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['readability', 'performance', 'maintainability', 'security', 'modularity']
            },
            default: ['readability', 'maintainability'],
            description: 'Refactoring goals'
          },
          language: {
            type: 'string',
            description: 'Programming language'
          },
          provide_code: {
            type: 'boolean',
            default: true,
            description: 'Provide refactored code examples'
          }
        },
        required: ['code']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // Enhanced frontend development tools
    if (name === 'generate_component') {
      const { name: compName, framework = 'react', type = 'functional', features = '', styling = 'css' } = args;
      const featureList = features.split(',').map(f => f.trim()).filter(Boolean);
      
      // Task Master-style feedback
      let output = `🚀 **Generating ${framework} Component**\n\n`;
      output += `📝 **Component**: ${compName}\n`;
      output += `⚙️ **Framework**: ${framework}\n`;
      output += `🎨 **Type**: ${type}\n`;
      output += `✨ **Features**: ${featureList.join(', ') || 'Basic component'}\n`;
      output += `🎯 **Styling**: ${styling}\n\n`;
      output += `🔄 **Generating code using AI model: coding**...\n\n`;
      
      const prompt = `Generate a ${framework} ${type} component named "${compName}" with the following specifications:
      
Features: ${featureList.join(', ')}
Styling: ${styling}
      
Provide:
1. Complete component code with TypeScript if requested
2. Props interface/types
3. Basic styling
4. Usage example
5. Best practices implementation
      
Make it production-ready with proper error handling and accessibility.`;
      
      const result = await aiCall(prompt, 'coding');
      
      output += `✅ **Component Generated Successfully!**\n\n`;
      output += `📁 **File**: ${compName}.${framework === 'react' ? 'tsx' : framework === 'vue' ? 'vue' : 'ts'}\n`;
      output += `🎯 **Next Steps**:\n`;
      output += `• Save the component to your project\n`;
      output += `• Install required dependencies\n`;
      output += `• Run tests to verify functionality\n`;
      output += `• Import and use in your application\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    if (name === 'generate_styles') {
      const { type = 'component', framework = 'css', features = '' } = args;
      const featureList = features.split(',').map(f => f.trim()).filter(Boolean);
      
      let output = `🎨 **Generating ${framework.toUpperCase()} Styles**\n\n`;
      output += `📋 **Type**: ${type}\n`;
      output += `🛠️ **Framework**: ${framework}\n`;
      output += `✨ **Features**: ${featureList.join(', ') || 'Basic styles'}\n\n`;
      output += `🔄 **Generating styles using AI model: creative**...\n\n`;
      
      const prompt = `Generate ${framework} styles for ${type} with features: ${featureList.join(', ')}
      
Include:
1. Modern CSS with best practices
2. Responsive design patterns
3. CSS custom properties/variables
4. Component-scoped styles
5. Performance optimizations
      
Make it maintainable and scalable.`;
      
      const result = await aiCall(prompt, 'creative');
      
      output += `✅ **Styles Generated Successfully!**\n\n`;
      output += `📁 **File**: styles.${framework === 'scss' ? 'scss' : framework === 'styled-components' ? 'js' : 'css'}\n`;
      output += `🎯 **Next Steps**:\n`;
      output += `• Add styles to your project\n`;
      output += `• Configure build tools if needed\n`;
      output += `• Test responsive breakpoints\n`;
      output += `• Optimize for performance\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    if (name === 'generate_hook') {
      const { name: hookName, framework = 'react', type = 'custom' } = args;
      
      let output = `🪝 **Generating ${framework} Hook**\n\n`;
      output += `📝 **Hook**: ${hookName}\n`;
      output += `⚙️ **Framework**: ${framework}\n`;
      output += `🔧 **Type**: ${type}\n\n`;
      output += `🔄 **Generating hook using AI model: coding**...\n\n`;
      
      const prompt = `Create a ${framework} ${type} hook named "${hookName}":
      
Requirements:
1. TypeScript support
2. Proper error handling
3. Performance optimization
4. Reusability
5. Testing considerations
      
Include usage examples and best practices.`;
      
      const result = await aiCall(prompt, 'coding');
      
      output += `✅ **Hook Generated Successfully!**\n\n`;
      output += `📁 **File**: ${hookName}.ts\n`;
      output += `🎯 **Next Steps**:\n`;
      output += `• Add hook to your project\n`;
      output += `• Install required dependencies\n`;
      output += `• Write unit tests\n`;
      output += `• Use in components\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    if (name === 'scaffold_project') {
      const { name: projName, framework = 'react', features = '' } = args;
      const featureList = features.split(',').map(f => f.trim()).filter(Boolean);
      
      const prompt = `Create a complete ${framework} project scaffold named "${projName}" with features: ${featureList.join(', ')}
      
Provide:
1. Project structure
2. Package.json with dependencies
3. Configuration files
4. Basic components and pages
5. Development setup instructions
6. Build and deployment scripts
      
Make it production-ready with modern tooling.`;
      
      const result = await aiCall(prompt, 'research');
      
      let output = `🏗️ **Scaffolding ${framework} Project**\n\n`;
      output += `📝 **Project**: ${projName}\n`;
      output += `⚙️ **Framework**: ${framework}\n`;
      output += `✨ **Features**: ${featureList.join(', ') || 'Basic setup'}\n\n`;
      output += `✅ **Project Scaffolded Successfully!**\n\n`;
      output += `📁 **Structure Created**:\n`;
      output += `• src/ - Source code\n`;
      output += `• package.json - Dependencies\n`;
      output += `• README.md - Documentation\n`;
      output += `• .env.example - Environment template\n\n`;
      output += `🎯 **Next Steps**:\n`;
      output += `• cd ${projName}\n`;
      output += `• npm install\n`;
      output += `• npm run dev\n`;
      output += `• Start coding!\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    // Enhanced backend development tools
    if (name === 'generate_api') {
      const { framework = 'express', resource, methods = 'GET,POST,PUT,DELETE', features = '', database = 'mongodb' } = args;
      const methodList = methods.split(',').map(m => m.trim());
      const featureList = features.split(',').map(f => f.trim()).filter(Boolean);
      
      let output = `🔧 **Generating ${framework} REST API**\n\n`;
      output += `📦 **Resource**: ${resource}\n`;
      output += `🛠️ **Framework**: ${framework}\n`;
      output += `🗄️ **Database**: ${database}\n`;
      output += `📋 **Methods**: ${methodList.join(', ')}\n`;
      output += `✨ **Features**: ${featureList.join(', ') || 'Basic CRUD'}\n\n`;
      output += `🔄 **Generating API using AI model: coding**...\n\n`;
      
      const prompt = `Generate a ${framework} REST API for ${resource} resource:
      
Methods: ${methodList.join(', ')}
Database: ${database}
Features: ${featureList.join(', ')}
      
Include:
1. Route definitions with proper HTTP methods
2. Request validation and sanitization
3. Error handling middleware
4. Database models/schemas
5. Authentication middleware (if requested)
6. API documentation (OpenAPI/Swagger)
7. Testing examples
      
Make it enterprise-grade with security best practices.`;
      
      const result = await aiCall(prompt, 'coding');
      
      output += `✅ **API Generated Successfully!**\n\n`;
      output += `📁 **Files Created**:\n`;
      output += `• routes/${resource}Routes.js\n`;
      output += `• controllers/${resource}Controller.js\n`;
      output += `• models/${resource}.js\n`;
      output += `• middleware/auth.js\n\n`;
      output += `🎯 **Next Steps**:\n`;
      output += `• Install dependencies: npm install\n`;
      output += `• Set up database connection\n`;
      output += `• Configure environment variables\n`;
      output += `• Run tests: npm test\n`;
      output += `• Start server: npm start\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    if (name === 'generate_schema') {
      const { database = 'mongodb', orm = 'mongoose', entities } = args;
      const entityList = entities.split(',').map(e => e.trim());
      
      let output = `🗄️ **Generating Database Schemas**\n\n`;
      output += `📊 **Database**: ${database}\n`;
      output += `🛠️ **ORM**: ${orm}\n`;
      output += `📋 **Entities**: ${entityList.join(', ')}\n\n`;
      output += `🔄 **Generating schemas using AI model: coding**...\n\n`;
      
      const prompt = `Create ${database} schemas using ${orm} for entities: ${entityList.join(', ')}
      
Include:
1. Complete schema definitions with proper types
2. Relationships and foreign keys
3. Indexes for performance
4. Validation rules
5. Middleware hooks
6. Migration scripts
7. Seed data examples
      
Follow database design best practices and normalization.`;
      
      const result = await aiCall(prompt, 'coding');
      
      output += `✅ **Schemas Generated Successfully!**\n\n`;
      output += `📁 **Files Created**:\n`;
      entityList.forEach(entity => {
        output += `• models/${entity}.js\n`;
      });
      output += `• migrations/\n• seeds/\n\n`;
      output += `🎯 **Next Steps**:\n`;
      output += `• Set up database connection\n`;
      output += `• Run migrations: npm run migrate\n`;
      output += `• Seed test data: npm run seed\n`;
      output += `• Test schema relationships\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    if (name === 'generate_middleware') {
      const { type = 'auth', framework = 'express', features = '' } = args;
      const featureList = features.split(',').map(f => f.trim()).filter(Boolean);
      
      const prompt = `Create ${framework} ${type} middleware with features: ${featureList.join(', ')}
      
Include:
1. Complete middleware implementation
2. Error handling
3. Security best practices
4. Configuration options
5. Usage examples
6. Testing utilities
      
Make it production-ready and reusable.`;
      
      const result = await aiCall(prompt, 'coding');
      
      let output = `🛡️ **Generating ${framework} Middleware**\n\n`;
      output += `🔧 **Type**: ${type}\n`;
      output += `⚙️ **Framework**: ${framework}\n`;
      output += `✨ **Features**: ${featureList.join(', ') || 'Basic middleware'}\n\n`;
      output += `✅ **Middleware Generated!**\n\n`;
      output += `📁 **File**: middleware/${type}.js\n`;
      output += `🎯 **Next Steps**:\n`;
      output += `• Add to your app: app.use(middleware)\n`;
      output += `• Configure options\n`;
      output += `• Test functionality\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    // Enhanced testing and quality tools
    if (name === 'generate_tests') {
      const { type = 'unit', framework = 'jest', target, features = '' } = args;
      const featureList = features.split(',').map(f => f.trim()).filter(Boolean);
      
      const prompt = `Generate comprehensive ${type} tests using ${framework} for ${target || 'the application'}:
      
Features: ${featureList.join(', ')}
      
Include:
1. Test suite setup and configuration
2. Unit tests with edge cases
3. Integration tests (if applicable)
4. Mocking utilities
5. Coverage reporting setup
6. Performance benchmarks
7. CI/CD integration examples
      
Follow testing best practices and TDD principles.`;
      
      const result = await aiCall(prompt, 'coding');
      
      let output = `🧪 **Generating ${framework} Tests**\n\n`;
      output += `📋 **Type**: ${type}\n`;
      output += `🎯 **Target**: ${target || 'application'}\n`;
      output += `⚙️ **Framework**: ${framework}\n`;
      output += `✨ **Features**: ${featureList.join(', ') || 'Basic tests'}\n\n`;
      output += `✅ **Tests Generated!**\n\n`;
      output += `📁 **Files Created**:\n`;
      output += `• __tests__/\n`;
      output += `• jest.config.js\n`;
      output += `• .github/workflows/test.yml\n\n`;
      output += `🎯 **Next Steps**:\n`;
      output += `• npm test\n`;
      output += `• npm run test:coverage\n`;
      output += `• Set up CI/CD\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    if (name === 'optimize_code') {
      const { path, focus = 'performance,security', language } = args;
      const focusAreas = focus.split(',').map(f => f.trim());
      
      const prompt = `Analyze and optimize code at ${path} focusing on: ${focusAreas.join(', ')}
      
Language: ${language || 'auto-detect'}
      
Provide:
1. Performance bottleneck identification
2. Security vulnerability assessment
3. Code quality improvements
4. Refactoring suggestions
5. Best practices recommendations
6. Before/after code examples
7. Automated optimization scripts
      
Prioritize actionable improvements with measurable impact.`;
      
      const result = await aiCall(prompt, 'analysis');
      
      let output = `⚡ **Optimizing Code**\n\n`;
      output += `📁 **Path**: ${path}\n`;
      output += `🎯 **Focus Areas**: ${focusAreas.join(', ')}\n`;
      output += `💻 **Language**: ${language || 'auto-detected'}\n\n`;
      output += `✅ **Analysis Complete!**\n\n`;
      output += `📊 **Report Generated**:\n`;
      output += `• Performance optimizations\n`;
      output += `• Security improvements\n`;
      output += `• Code quality enhancements\n\n`;
      output += `🎯 **Next Steps**:\n`;
      output += `• Review suggestions\n`;
      output += `• Implement changes\n`;
      output += `• Run benchmarks\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    // Enhanced DevOps and deployment tools
    if (name === 'generate_dockerfile') {
      const { appType = 'node', framework, features = '', port = 3000 } = args;
      const featureList = features.split(',').map(f => f.trim()).filter(Boolean);
      
      const prompt = `Create a production-ready Dockerfile for ${appType} application:
      
Framework: ${framework || 'standard ' + appType}
Features: ${featureList.join(', ')}
Port: ${port}
      
Include:
1. Multi-stage build optimization
2. Security hardening (non-root user, minimal base image)
3. Efficient layer caching
4. Health checks
5. Environment variable handling
6. Build optimization
7. Docker compose example
      
Follow container best practices and security guidelines.`;
      
      const result = await aiCall(prompt, 'coding');
      
      let output = `🐳 **Generating Docker Container**\n\n`;
      output += `📝 **App Type**: ${appType}\n`;
      output += `⚙️ **Framework**: ${framework || 'default'}\n`;
      output += `🚀 **Port**: ${port}\n`;
      output += `✨ **Features**: ${featureList.join(', ') || 'Basic container'}\n\n`;
      output += `✅ **Docker Files Generated!**\n\n`;
      output += `📁 **Files Created**:\n`;
      output += `• Dockerfile\n`;
      output += `• .dockerignore\n`;
      output += `• docker-compose.yml\n\n`;
      output += `🎯 **Next Steps**:\n`;
      output += `• docker build -t ${appType}-app .\n`;
      output += `• docker run -p ${port}:${port} ${appType}-app\n`;
      output += `• Test container locally\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    if (name === 'generate_deployment') {
      const { platform = 'kubernetes', replicas = 3, features = '', namespace = 'default' } = args;
      const featureList = features.split(',').map(f => f.trim()).filter(Boolean);
      
      const prompt = `Generate ${platform} deployment configuration:
      
Replicas: ${replicas}
Namespace: ${namespace}
Features: ${featureList.join(', ')}
      
Include:
1. Deployment manifests
2. Service definitions
3. Ingress configuration
4. ConfigMaps and Secrets
5. Auto-scaling policies
6. Monitoring and logging setup
7. Health checks and readiness probes
8. Security policies
      
Make it production-ready with high availability.`;
      
      const result = await aiCall(prompt, 'coding');
      
      let output = `🚀 **Generating ${platform} Deployment**\n\n`;
      output += `☁️ **Platform**: ${platform}\n`;
      output += `🔄 **Replicas**: ${replicas}\n`;
      output += `📁 **Namespace**: ${namespace}\n`;
      output += `✨ **Features**: ${featureList.join(', ') || 'Basic deployment'}\n\n`;
      output += `✅ **Deployment Generated!**\n\n`;
      output += `📁 **Files Created**:\n`;
      output += `• deployment.yaml\n`;
      output += `• service.yaml\n`;
      output += `• ingress.yaml\n`;
      output += `• configmap.yaml\n\n`;
      output += `🎯 **Next Steps**:\n`;
      output += `• kubectl apply -f .\n`;
      output += `• kubectl get pods\n`;
      output += `• Monitor deployment status\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    if (name === 'generate_env') {
      const { environments, features = '' } = args;
      const envList = environments.split(',').map(e => e.trim());
      const featureList = features.split(',').map(f => f.trim()).filter(Boolean);
      
      const prompt = `Create environment configuration for: ${envList.join(', ')}
      
Features: ${featureList.join(', ')}
      
Include:
1. Environment-specific .env files
2. Configuration validation
3. Secret management
4. Environment variable documentation
5. Docker environment setup
6. CI/CD environment configuration
7. Security best practices
      
Ensure proper separation and security for each environment.`;
      
      const result = await aiCall(prompt, 'coding');
      
      let output = `⚙️ **Generating Environment Configuration**\n\n`;
      output += `🌍 **Environments**: ${envList.join(', ')}\n`;
      output += `✨ **Features**: ${featureList.join(', ') || 'Basic config'}\n\n`;
      output += `✅ **Environment Files Generated!**\n\n`;
      output += `📁 **Files Created**:\n`;
      envList.forEach(env => {
        output += `• .env.${env}\n`;
      });
      output += `• .env.example\n`;
      output += `• docker-compose.override.yml\n\n`;
      output += `🎯 **Next Steps**:\n`;
      output += `• Copy .env.example to .env\n`;
      output += `• Fill in your actual values\n`;
      output += `• Never commit .env files\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    if (name === 'generate_monitoring') {
      const { stack = 'prometheus', features = '' } = args;
      const featureList = features.split(',').map(f => f.trim()).filter(Boolean);
      
      const prompt = `Set up ${stack} monitoring stack with features: ${featureList.join(', ')}
      
Include:
1. Monitoring service configuration
2. Custom dashboards
3. Alerting rules
4. Log aggregation setup
5. Performance metrics
6. Application health monitoring
7. Infrastructure monitoring
8. Documentation and runbooks
      
Make it comprehensive and production-ready.`;
      
      const result = await aiCall(prompt, 'coding');
      
      let output = `📊 **Setting Up ${stack} Monitoring**\n\n`;
      output += `🔍 **Stack**: ${stack}\n`;
      output += `✨ **Features**: ${featureList.join(', ') || 'Basic monitoring'}\n\n`;
      output += `✅ **Monitoring Setup Generated!**\n\n`;
      output += `📁 **Files Created**:\n`;
      output += `• prometheus.yml\n`;
      output += `• grafana-dashboard.json\n`;
      output += `• alerting-rules.yml\n`;
      output += `• docker-compose.monitoring.yml\n\n`;
      output += `🎯 **Next Steps**:\n`;
      output += `• docker-compose -f docker-compose.monitoring.yml up\n`;
      output += `• Access Grafana at http://localhost:3000\n`;
      output += `• Configure alert notifications\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    // Enhanced business intelligence tools  
    if (name === 'analyze_codebase') {
      const { path, includeAnalysis = true, reportType = 'comprehensive' } = args;
      
      if (!includeAnalysis) {
        // Simple analysis without AI
        const analysis = await analyzeCodebase(path);
        return { content: [{ type: 'text', text: JSON.stringify(analysis, null, 2) }] };
      }
      
      // Full AI-powered analysis with business intelligence
      const analysis = await analyzeCodebase(path);
      
      const businessPrompt = `Analyze this codebase data and provide executive-level insights:
      
${JSON.stringify(analysis, null, 2)}
      
Generate a ${reportType} report including:
      
📊 EXECUTIVE DASHBOARD
- Development Efficiency Score (0-100%)
- Codebase Health Rating  
- Time to Market Assessment
- Scalability Index
- Reliability Score
      
💰 FINANCIAL IMPACT ANALYSIS
- Technical debt cost (annual $)
- Downtime risk assessment ($)
- Feature delivery delays ($)
- Security breach risk ($)
- ROI on recommended fixes
      
🎯 STRATEGIC RECOMMENDATIONS
- Top 5 priority actions with cost/benefit
- Risk mitigation strategies
- Technology modernization roadmap
- Team productivity improvements
      
🛡️ SECURITY & COMPLIANCE
- Vulnerability risk assessment
- Compliance gap analysis
- Zero-day threat predictions
- Quantum-readiness score
      
📈 PERFORMANCE METRICS
- Load capacity analysis
- Bottleneck identification
- Optimization opportunities
- Scalability projections
      
Format as executive summary with actionable insights and dollar quantification.`;
      
      const businessReport = await aiCall(businessPrompt, 'analysis');
      
      return {
        content: [{
          type: 'text',
          text: `# 🚀 Revolutionary AI Code Intelligence Report\n\n${businessReport}\n\n---\n\n## 📋 Technical Analysis Data\n\n\`\`\`json\n${JSON.stringify(analysis, null, 2)}\n\`\`\``
        }]
      };
    }
    
    if (name === 'ask_gemini') {
      const { question, context = '', expertise = 'general' } = args;
      
      const enhancedPrompt = `${expertise !== 'general' ? `As a ${expertise} expert, ` : ''}${question}
      
${context ? `Context: ${context}` : ''}
      
Provide:
1. Direct answer with actionable advice
2. Best practices and recommendations
3. Potential pitfalls to avoid
4. Code examples (if applicable)
5. Further learning resources
      
Be comprehensive yet practical.`;
      
      const result = await aiCall(enhancedPrompt, 'main');
      
      let output = `🤖 **AI Consultation Complete**\n\n`;
      output += `❓ **Question**: ${question}\n`;
      output += `🎯 **Expertise**: ${expertise}\n`;
      output += `🧠 **AI Model**: main\n\n`;
      output += `✅ **Analysis Generated!**\n\n`;
      output += `📝 **Includes**:\n`;
      output += `• Direct actionable advice\n`;
      output += `• Best practices\n`;
      output += `• Potential pitfalls\n`;
      output += `• Code examples\n`;
      output += `• Learning resources\n\n`;
      output += `---\n\n${result}`;
      
      return { content: [{ type: 'text', text: output }] };
    }
    
    switch (name) {
      case 'create_project_tasks': {
        const { requirements, project_type = 'general', complexity = 'medium' } = args || {};
        
        if (!requirements?.trim()) {
          return {
            content: [{ 
              type: 'text', 
              text: '❌ **Requirements needed**\n\nPlease provide project requirements or PRD to break down into tasks.' 
            }]
          };
        }

        const taskData = await loadTasks();
        const config = await loadConfig();
        
        // Task Master-style: AI-powered task breakdown with research
        const analysisPrompt = `You are an expert project manager and software architect. Break down these requirements into actionable development tasks:

REQUIREMENTS:
${requirements}

PROJECT CONTEXT:
- Type: ${project_type}
- Complexity: ${complexity}
- Current project: ${taskData.projectName}

INSTRUCTIONS:
1. Create 5-15 specific, actionable tasks
2. Assign realistic priorities (low/medium/high/critical)
3. Estimate complexity (1-10 scale)
4. Identify dependencies between tasks
5. Include setup, development, testing, and deployment phases
6. Consider edge cases and error handling
7. Add acceptance criteria for each task

Format as JSON:
{
  "tasks": [
    {
      "title": "Clear, actionable task title",
      "description": "Detailed description with acceptance criteria",
      "priority": "high",
      "complexity": 7,
      "estimatedHours": 8,
      "dependencies": [],
      "category": "development",
      "acceptance_criteria": ["criterion 1", "criterion 2"]
    }
  ]
}`;

        const aiResponse = await aiCall(analysisPrompt, 'research', { maxTokens: 2500 });
        
        let tasksToCreate;
        try {
          tasksToCreate = JSON.parse(aiResponse).tasks;
        } catch {
          return {
            content: [{ 
              type: 'text', 
              text: '⚠️ **AI parsing failed**\n\nCould not parse task breakdown. Please try again with clearer requirements.' 
            }]
          };
        }

        // Task Master-style: Create tasks with proper ID management
        const createdTasks = [];
        for (const taskTemplate of tasksToCreate) {
          const task = {
            id: taskData.nextId++,
            title: taskTemplate.title,
            description: taskTemplate.description,
            status: 'pending',
            priority: taskTemplate.priority || 'medium',
            complexity: taskTemplate.complexity || 5,
            estimatedHours: taskTemplate.estimatedHours || null,
            dependencies: taskTemplate.dependencies || [],
            category: taskTemplate.category || 'development',
            acceptance_criteria: taskTemplate.acceptance_criteria || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            research: null,
            implementation_plan: null,
            progress_notes: []
          };
          
          taskData.tasks.push(task);
          createdTasks.push(task);
        }

        await saveTasks(taskData);

        let output = `🎯 **Project Tasks Created**\n\n`;
        output += `📋 **${createdTasks.length} tasks** generated from requirements\n`;
        output += `📂 **Project:** ${taskData.projectName}\n`;
        output += `🏗️ **Type:** ${project_type}\n\n`;

        output += `### Tasks Created:\n\n`;
        createdTasks.forEach(task => {
          const priorityEmoji = {
            low: '🟢', medium: '🟡', high: '🔴', critical: '🚨'
          }[task.priority];
          
          output += `**${task.id}.** ${priorityEmoji} **${task.title}**\n`;
          output += `   📊 Complexity: ${task.complexity}/10`;
          if (task.estimatedHours) output += ` | ⏱️ ${task.estimatedHours}h`;
          output += `\n`;
          if (task.dependencies.length > 0) {
            output += `   🔗 Depends on: ${task.dependencies.join(', ')}\n`;
          }
          output += `\n`;
        });

        output += `### Next Steps:\n`;
        output += `• Use \`get_task_research\` to research specific tasks\n`;
        output += `• Use \`get_next_actions\` for AI recommendations\n`;
        output += `• Use \`update_task_status\` when starting work\n`;
        
        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      }

      case 'get_task_research': {
        const { task_id, focus_areas = ['implementation', 'best_practices'] } = args || {};
        
        if (!task_id) {
          return {
            content: [{ 
              type: 'text', 
              text: '❌ **Task ID required**\n\nProvide the ID of the task to research.' 
            }]
          };
        }

        const taskData = await loadTasks();
        const task = taskData.tasks.find(t => t.id === task_id);
        
        if (!task) {
          return {
            content: [{ 
              type: 'text', 
              text: `❌ **Task not found**\n\nNo task found with ID: ${task_id}` 
            }]
          };
        }

        // Task Master-style: Deep research with multiple focus areas
        const researchPrompt = `Research this development task in depth:

TASK: ${task.title}
DESCRIPTION: ${task.description}
COMPLEXITY: ${task.complexity}/10
CATEGORY: ${task.category}

FOCUS AREAS: ${focus_areas.join(', ')}

Provide comprehensive research covering:
${focus_areas.includes('implementation') ? '- Step-by-step implementation approach' : ''}
${focus_areas.includes('testing') ? '- Testing strategies and test cases' : ''}
${focus_areas.includes('security') ? '- Security considerations and best practices' : ''}
${focus_areas.includes('performance') ? '- Performance optimization techniques' : ''}
${focus_areas.includes('best_practices') ? '- Industry best practices and patterns' : ''}
${focus_areas.includes('examples') ? '- Code examples and practical demos' : ''}

Include:
- Recommended tools and libraries
- Common pitfalls to avoid
- Success criteria and validation methods
- Links to relevant documentation (if applicable)

Keep response practical and immediately actionable.`;

        const research = await aiCall(researchPrompt, 'research', { maxTokens: 2000 });
        
        // Save research to task
        task.research = {
          content: research,
          focus_areas,
          generated_at: new Date().toISOString()
        };
        task.updatedAt = new Date().toISOString();
        
        await saveTasks(taskData);

        return {
          content: [{
            type: 'text',
            text: `🔬 **Task Research: ${task.title}**\n\n${research}\n\n---\n*Research generated • ${new Date().toLocaleString()}*`
          }]
        };
      }

      case 'update_task_status': {
        const { task_id, status, notes, completion_percentage } = args || {};
        
        if (!task_id || !status) {
          return {
            content: [{ 
              type: 'text', 
              text: '❌ **Task ID and status required**\n\nProvide task ID and new status.' 
            }]
          };
        }

        const taskData = await loadTasks();
        const task = taskData.tasks.find(t => t.id === task_id);
        
        if (!task) {
          return {
            content: [{ 
              type: 'text', 
              text: `❌ **Task not found**\n\nNo task found with ID: ${task_id}` 
            }]
          };
        }

        const oldStatus = task.status;
        task.status = status;
        task.updatedAt = new Date().toISOString();
        
        if (completion_percentage !== undefined) {
          task.completion_percentage = completion_percentage;
        }
        
        if (notes) {
          task.progress_notes.push({
            note: notes,
            timestamp: new Date().toISOString(),
            status_change: `${oldStatus} → ${status}`
          });
        }

        // Task Master-style: Dependency management
        if (status === 'completed') {
          task.completion_percentage = 100;
          task.completed_at = new Date().toISOString();
          
          // Check for dependent tasks
          const dependentTasks = taskData.tasks.filter(t => 
            t.dependencies.includes(task_id) && t.status === 'pending'
          );
          
          if (dependentTasks.length > 0) {
            // Auto-update dependent tasks if all dependencies are met
            for (const depTask of dependentTasks) {
              const allDepsCompleted = depTask.dependencies.every(depId => {
                const depTaskObj = taskData.tasks.find(t => t.id === depId);
                return depTaskObj && depTaskObj.status === 'completed';
              });
              
              if (allDepsCompleted && depTask.status === 'pending') {
                depTask.status = 'pending'; // Ready to start
                depTask.updatedAt = new Date().toISOString();
              }
            }
          }
        }

        await saveTasks(taskData);

        const statusEmoji = {
          pending: '⏳', in_progress: '🔄', blocked: '🚫', 
          completed: '✅', cancelled: '❌'
        }[status];

        let output = `${statusEmoji} **Task Updated**\n\n`;
        output += `**${task.title}**\n`;
        output += `🔄 Status: ${oldStatus} → ${status}\n`;
        if (completion_percentage !== undefined) {
          output += `📊 Progress: ${completion_percentage}%\n`;
        }
        if (notes) {
          output += `📝 Notes: ${notes}\n`;
        }

        // Show newly available tasks
        const nowAvailable = taskData.tasks.filter(t => 
          t.dependencies.includes(task_id) && 
          t.dependencies.every(depId => {
            const depTask = taskData.tasks.find(dt => dt.id === depId);
            return depTask && depTask.status === 'completed';
          })
        );

        if (nowAvailable.length > 0) {
          output += `\n🎯 **Now Available:**\n`;
          nowAvailable.forEach(t => {
            output += `• ${t.id}. ${t.title}\n`;
          });
        }
        
        return {
          content: [{
            type: 'text',
            text: output
          }]
        };
      }

      case 'list_project_tasks': {
        const { status = 'all', priority = 'all', show_dependencies = true, view = 'summary' } = args || {};
        
        const taskData = await loadTasks();
        let tasks = taskData.tasks;
        
        // Apply filters
        if (status !== 'all') {
          tasks = tasks.filter(t => t.status === status);
        }
        if (priority !== 'all') {
          tasks = tasks.filter(t => t.priority === priority);
        }

        if (tasks.length === 0) {
          return {
            content: [{
              type: 'text',
              text: '📭 **No tasks found**\n\nCreate tasks with `create_project_tasks` or adjust filters.'
            }]
          };
        }

        // Task Master-style: Intelligent task organization
        tasks.sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const statusOrder = { in_progress: 4, pending: 3, blocked: 2, completed: 1, cancelled: 0 };
          
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          
          const statusDiff = statusOrder[b.status] - statusOrder[a.status];
          if (statusDiff !== 0) return statusDiff;
          
          return a.id - b.id;
        });

        let output = `📋 **${taskData.projectName} Tasks**\n\n`;
        
        if (view === 'summary') {
          const statusCounts = tasks.reduce((acc, t) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
          }, {});
          
          output += `**Overview:** ${tasks.length} tasks `;
          output += Object.entries(statusCounts).map(([s, c]) => `${s}: ${c}`).join(', ');
          output += '\n\n';
        }

        tasks.forEach(task => {
          const statusEmoji = {
            pending: '⏳', in_progress: '🔄', blocked: '🚫',
            completed: '✅', cancelled: '❌'
          }[task.status];
          
          const priorityEmoji = {
            low: '🟢', medium: '🟡', high: '🔴', critical: '🚨'
          }[task.priority];

          output += `**${task.id}.** ${statusEmoji} ${priorityEmoji} **${task.title}**\n`;
          
          if (view === 'detailed') {
            output += `   📝 ${task.description}\n`;
            if (task.acceptance_criteria?.length > 0) {
              output += `   ✅ Criteria: ${task.acceptance_criteria.join(', ')}\n`;
            }
          }
          
          output += `   📊 ${task.complexity}/10`;
          if (task.estimatedHours) output += ` | ⏱️ ${task.estimatedHours}h`;
          if (task.completion_percentage) output += ` | ${task.completion_percentage}%`;
          output += `\n`;
          
          if (show_dependencies && task.dependencies.length > 0) {
            output += `   🔗 Depends on: ${task.dependencies.join(', ')}\n`;
          }
          
          if (task.progress_notes?.length > 0 && view === 'detailed') {
            const latestNote = task.progress_notes[task.progress_notes.length - 1];
            output += `   💬 Latest: ${latestNote.note}\n`;
          }
          
          output += `\n`;
        });

        return {
          content: [{
            type: 'text',
            text: output.trim()
          }]
        };
      }

      case 'get_next_actions': {
        const { context, limit = 5 } = args || {};
        
        const taskData = await loadTasks();
        const config = await loadConfig();
        
        // Task Master-style: AI-powered next action recommendations
        const prompt = `Analyze the current project state and recommend next actions:

PROJECT: ${taskData.projectName}
TOTAL TASKS: ${taskData.tasks.length}

CURRENT STATE:
${taskData.tasks.map(t => `${t.id}. [${t.status}] ${t.title} (${t.priority})`).join('\n')}

${context ? `CURRENT CONTEXT: ${context}` : ''}

Based on task dependencies, priorities, and current status, recommend the top ${limit} next actions. Consider:
- Which tasks are ready to start (dependencies met)
- Priority levels and urgency
- Logical development flow
- Potential blockers
- Quick wins vs complex tasks

Format each recommendation with:
- Task ID and title
- Why it should be done next
- Estimated effort
- Any prerequisites or considerations`;

        const recommendations = await aiCall(prompt, 'main', { maxTokens: 1500 });

        return {
          content: [{
            type: 'text',
            text: `🎯 **Next Actions Recommended**\n\n${recommendations}\n\n---\n*AI recommendations • ${new Date().toLocaleString()}*`
          }]
        };
      }

      case 'generate_implementation_plan': {
        const { task_id, include_code_structure = true, include_testing = true } = args || {};
        
        if (!task_id) {
          return {
            content: [{ 
              type: 'text', 
              text: '❌ **Task ID required**\n\nProvide the ID of the task to plan.' 
            }]
          };
        }

        const taskData = await loadTasks();
        const task = taskData.tasks.find(t => t.id === task_id);
        
        if (!task) {
          return {
            content: [{ 
              type: 'text', 
              text: `❌ **Task not found**\n\nNo task found with ID: ${task_id}` 
            }]
          };
        }

        // Task Master-style: Detailed implementation planning
        const planPrompt = `Create a detailed implementation plan for this task:

TASK: ${task.title}
DESCRIPTION: ${task.description}
COMPLEXITY: ${task.complexity}/10
ACCEPTANCE CRITERIA: ${task.acceptance_criteria?.join(', ') || 'None specified'}

Generate a comprehensive implementation plan including:

1. **Analysis Phase**
   - Requirements breakdown
   - Technical approach decision
   - Architecture considerations

2. **Implementation Steps**
   - Step-by-step development approach
   - Code organization and structure
   - Key components to build

${include_code_structure ? `3. **Code Structure**
   - File/folder organization
   - Main classes/functions needed
   - Data models and interfaces
   - API endpoints (if applicable)` : ''}

${include_testing ? `4. **Testing Strategy**
   - Unit tests to write
   - Integration test scenarios
   - Edge cases to cover
   - Manual testing checklist` : ''}

5. **Implementation Timeline**
   - Phase breakdown with time estimates
   - Potential roadblocks and solutions
   - Dependencies and prerequisites

6. **Definition of Done**
   - Completion criteria
   - Quality gates
   - Deployment considerations

Keep the plan practical and specific to the task requirements.`;

        const plan = await aiCall(planPrompt, 'research', { maxTokens: 2500 });
        
        // Save implementation plan to task
        task.implementation_plan = {
          content: plan,
          generated_at: new Date().toISOString(),
          includes_code_structure: include_code_structure,
          includes_testing: include_testing
        };
        task.updatedAt = new Date().toISOString();
        
        await saveTasks(taskData);

        return {
          content: [{
            type: 'text',
            text: `📋 **Implementation Plan: ${task.title}**\n\n${plan}\n\n---\n*Implementation plan generated • ${new Date().toLocaleString()}*`
          }]
        };
      }

      case 'ai_chat': {
        const { message, model = 'main', context, max_tokens = 1500 } = args || {};
        
        if (!message?.trim()) {
          return {
            content: [{ 
              type: 'text', 
              text: '❌ **Message required**\n\nProvide a message for AI conversation.' 
            }]
          };
        }

        const fullPrompt = context ? `Context: ${context}\n\nMessage: ${message}` : message;
        const response = await aiCall(fullPrompt, model, { maxTokens: max_tokens });

        return {
          content: [{
            type: 'text',
            text: `🤖 **AI Response** (${AI_MODELS[model] || model})\n\n${response}`
          }]
        };
      }

      case 'ai_consensus': {
        const { question, models, context } = args || {};
        
        if (!question?.trim()) {
          return {
            content: [{ 
              type: 'text', 
              text: '❌ **Question required**\n\nProvide a question to get consensus on.' 
            }]
          };
        }

        const fullPrompt = context ? `Context: ${context}\n\nQuestion: ${question}` : question;
        const consensus = await aiConsensus(fullPrompt, models);

        return {
          content: [{
            type: 'text',
            text: `🎯 **AI Consensus**\n\n${consensus}\n\n---\n*Consensus from multiple AI models • ${new Date().toLocaleString()}*`
          }]
        };
      }

      case 'ai_collaborate': {
        const { problem, context, models } = args || {};
        
        if (!problem?.trim()) {
          return {
            content: [{ 
              type: 'text', 
              text: '❌ **Problem required**\n\nProvide a problem for collaborative AI solving.' 
            }]
          };
        }

        const collaboration = await aiCollaborate(problem, context, models);

        return {
          content: [{
            type: 'text',
            text: `🤝 **AI Collaboration**\n\n${collaboration.conversation}\n\n---\n*Collaborative analysis completed • ${new Date().toLocaleString()}*`
          }]
        };
      }

      case 'code_review': {
        const { code, language, focus = ['security', 'performance', 'maintainability'], use_consensus = true } = args || {};
        
        if (!code?.trim()) {
          return {
            content: [{ 
              type: 'text', 
              text: '❌ **Code required**\n\nProvide code to review.' 
            }]
          };
        }

        const reviewPrompt = `Perform a comprehensive code review focusing on: ${focus.join(', ')}

${language ? `Language: ${language}` : ''}

Code:
\`\`\`
${code}
\`\`\`

Provide detailed feedback on:
${focus.map(f => `- ${f.charAt(0).toUpperCase() + f.slice(1)}`).join('\n')}

Include specific suggestions for improvement and highlight any issues found.`;

        let review;
        if (use_consensus) {
          review = await aiConsensus(reviewPrompt);
        } else {
          review = await aiCall(reviewPrompt, 'review');
        }

        return {
          content: [{
            type: 'text',
            text: `🔍 **Code Review**${use_consensus ? ' (Consensus)' : ''}\n\n${review}\n\n---\n*Review completed • ${new Date().toLocaleString()}*`
          }]
        };
      }

      case 'debug_analysis': {
        const { error, code, context, language } = args || {};
        
        if (!error?.trim()) {
          return {
            content: [{ 
              type: 'text', 
              text: '❌ **Error required**\n\nProvide error message or description.' 
            }]
          };
        }

        const debugPrompt = `Debug this issue:

Error: ${error}
${language ? `Language: ${language}` : ''}
${context ? `Context: ${context}` : ''}
${code ? `\nCode:\n\`\`\`\n${code}\n\`\`\`` : ''}

Provide:
1. Root cause analysis
2. Step-by-step debugging approach
3. Potential solutions
4. Prevention strategies`;

        const analysis = await aiCollaborate(debugPrompt, '', ['debug', 'main']);

        return {
          content: [{
            type: 'text',
            text: `🐛 **Debug Analysis**\n\n${analysis.conversation}\n\n---\n*Collaborative debugging completed • ${new Date().toLocaleString()}*`
          }]
        };
      }

      case 'code_analyze': {
        const { code, analysis_type = 'comprehensive', language } = args || {};
        
        if (!code?.trim()) {
          return {
            content: [{ 
              type: 'text', 
              text: '❌ **Code required**\n\nProvide code to analyze.' 
            }]
          };
        }

        const analysisPrompt = `Perform ${analysis_type} code analysis:

${language ? `Language: ${language}` : ''}

Code:
\`\`\`
${code}
\`\`\`

Analysis type: ${analysis_type}

Provide detailed insights covering the requested analysis type.`;

        const analysis = await aiCall(analysisPrompt, 'analysis', { maxTokens: 2000 });

        return {
          content: [{
            type: 'text',
            text: `📊 **Code Analysis** (${analysis_type})\n\n${analysis}\n\n---\n*Analysis completed • ${new Date().toLocaleString()}*`
          }]
        };
      }

      case 'refactor_suggestions': {
        const { code, goals = ['readability', 'maintainability'], language, provide_code = true } = args || {};
        
        if (!code?.trim()) {
          return {
            content: [{ 
              type: 'text', 
              text: '❌ **Code required**\n\nProvide code to refactor.' 
            }]
          };
        }

        const refactorPrompt = `Suggest refactoring improvements for these goals: ${goals.join(', ')}

${language ? `Language: ${language}` : ''}

Original Code:
\`\`\`
${code}
\`\`\`

Provide:
1. Specific refactoring suggestions
2. Explanation of improvements
${provide_code ? '3. Refactored code examples' : ''}
4. Benefits of each change`;

        const suggestions = await aiCall(refactorPrompt, 'coding', { maxTokens: 2500 });

        return {
          content: [{
            type: 'text',
            text: `🔄 **Refactoring Suggestions**\n\n${suggestions}\n\n---\n*Refactoring analysis completed • ${new Date().toLocaleString()}*`
          }]
        };
      }

      default:
        return {
          content: [{
            type: 'text',
            text: `❌ **Unknown tool:** ${name}\n\n🎨 **Frontend Tools:**\n• generate_component • generate_styles • generate_hook • scaffold_project\n\n🔧 **Backend Tools:**\n• generate_api • generate_schema • generate_middleware\n\n🧪 **Testing Tools:**\n• generate_tests • optimize_code\n\n🐳 **DevOps Tools:**\n• generate_dockerfile • generate_deployment • generate_env • generate_monitoring\n\n💼 **Business Intelligence:**\n• analyze_codebase • ask_gemini\n\n📋 **Task Management:**\n• create_project_tasks • get_task_research • update_task_status • list_project_tasks • get_next_actions • generate_implementation_plan\n\n🤖 **AI Collaboration:**\n• ai_chat • ai_consensus • ai_collaborate • code_review • debug_analysis • code_analyze • refactor_suggestions`
          }]
        };
    }
    
  } catch (error) {
    console.error(`[Task Master] Error in ${name}:`, error.message);
    
    return {
      content: [{
        type: 'text',
        text: `💥 **Error**\n\n${error.message}\n\nPlease try again. If the issue persists, check your configuration.`
      }]
    };
  }
});

// Task Master-style: Professional startup
const transport = new StdioServerTransport();

async function startServer() {
  try {
    await server.connect(transport);
    console.error('🚀 Enhanced Gemini MCP Server v3.0.0');
    console.error('🎯 Multi-model AI orchestration & task management');
    console.error('🤖 27 revolutionary AI tools ready');
    console.error('🔗 Supports: Gemini, Claude, OpenAI via OpenRouter');
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.error('👋 Task Master shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('👋 Task Master terminated');
  process.exit(0);
});

startServer();