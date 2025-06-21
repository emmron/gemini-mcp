// Additional high-quality tools for the registry
import { aiClient } from '../ai/client.js';
import { storage } from '../storage/storage.js';
import { logger } from '../utils/logger.js';
import { validateString } from '../utils/validation.js';

export function registerAdditionalTools(registry) {
  // Code review tool
  registry.registerTool(
    'mcp__gemini__code_review',
    'AI-powered code review with multiple perspectives',
    {
      code: { type: 'string', description: 'Code to review', required: true },
      language: { type: 'string', description: 'Programming language', default: 'javascript' },
      focus: { type: 'array', description: 'Review focus areas', default: ['security', 'performance', 'maintainability'] }
    },
    async (args) => {
      const { code, language = 'javascript', focus = ['security', 'performance', 'maintainability'] } = args;
      validateString(code, 'code', 20000);
      
      const focusAreas = Array.isArray(focus) ? focus.join(', ') : focus;
      
      const prompt = `Perform a comprehensive code review focusing on: ${focusAreas}

\`\`\`${language}
${code}
\`\`\`

Provide detailed analysis including:
1. Security vulnerabilities and risks
2. Performance bottlenecks and optimizations
3. Code maintainability and readability
4. Best practice violations
5. Specific improvement suggestions with examples
6. Overall quality score (1-10)

Format as a structured review with actionable recommendations.`;

      const review = await aiClient.call(prompt, 'review');
      return `🔍 **Code Review** (${language})\\n\\n📋 **Focus Areas**: ${focusAreas}\\n\\n${review}`;
    }
  );

  // Debug analysis tool
  registry.registerTool(
    'mcp__gemini__debug_analysis',
    'Collaborative debugging with AI assistance',
    {
      error: { type: 'string', description: 'Error message or description', required: true },
      code: { type: 'string', description: 'Code where error occurs' },
      context: { type: 'string', description: 'Additional context about the error' },
      language: { type: 'string', description: 'Programming language', default: 'javascript' }
    },
    async (args) => {
      const { error, code, context = '', language = 'javascript' } = args;
      validateString(error, 'error');
      
      let prompt = `Debug this ${language} error:\\n\\n**Error**: ${error}\\n\\n`;
      
      if (code) {
        prompt += `**Code Context**:\\n\`\`\`${language}\\n${code}\\n\`\`\`\\n\\n`;
      }
      
      if (context) {
        prompt += `**Additional Context**: ${context}\\n\\n`;
      }
      
      prompt += `Provide:\\n1. Root cause analysis\\n2. Step-by-step debugging approach\\n3. Potential fixes with code examples\\n4. Prevention strategies\\n5. Related issues to check`;
      
      const analysis = await aiClient.call(prompt, 'debug');
      return `🐛 **Debug Analysis** (${language})\\n\\n${analysis}`;
    }
  );

  // Refactoring suggestions tool
  registry.registerTool(
    'mcp__gemini__refactor_suggestions',
    'AI-powered refactoring suggestions and improvements',
    {
      code: { type: 'string', description: 'Code to refactor', required: true },
      language: { type: 'string', description: 'Programming language', default: 'javascript' },
      goals: { type: 'array', description: 'Refactoring goals', default: ['readability', 'maintainability'] }
    },
    async (args) => {
      const { code, language = 'javascript', goals = ['readability', 'maintainability'] } = args;
      validateString(code, 'code', 15000);
      
      const refactoringGoals = Array.isArray(goals) ? goals.join(', ') : goals;
      
      const prompt = `Analyze this ${language} code and suggest refactoring improvements focused on: ${refactoringGoals}

\`\`\`${language}
${code}
\`\`\`

Provide:
1. Current code analysis and issues
2. Refactoring opportunities with before/after examples
3. Architecture improvements
4. Performance optimizations
5. Code quality enhancements
6. Step-by-step refactoring plan

Include working code examples for each suggestion.`;

      const suggestions = await aiClient.call(prompt, 'coding');
      return `♻️ **Refactoring Suggestions** (${language})\\n\\n🎯 **Goals**: ${refactoringGoals}\\n\\n${suggestions}`;
    }
  );

  // Generate component tool
  registry.registerTool(
    'mcp__gemini__generate_component',
    'Generate UI components for various frameworks',
    {
      name: { type: 'string', description: 'Component name', required: true },
      framework: { type: 'string', description: 'Framework', default: 'react' },
      type: { type: 'string', description: 'Component type', default: 'functional' },
      features: { type: 'string', description: 'Component features' }
    },
    async (args) => {
      const { name, framework = 'react', type = 'functional', features = '' } = args;
      validateString(name, 'name');
      
      const prompt = `Generate a ${framework} ${type} component named "${name}".

Features: ${features || 'Basic component with props and state management'}

Include:
1. Complete component code with TypeScript
2. Props interface/types
3. Styling (CSS modules or styled-components)
4. Usage examples
5. Unit tests
6. Documentation comments

Follow ${framework} best practices and modern patterns.`;

      const component = await aiClient.call(prompt, 'coding');
      return `⚛️ **Component Generated** (${framework})\\n\\n📦 **Name**: ${name}\\n🔧 **Type**: ${type}\\n✨ **Features**: ${features || 'Basic functionality'}\\n\\n${component}`;
    }
  );

  logger.info('Additional tools registered', { count: 4 });
}