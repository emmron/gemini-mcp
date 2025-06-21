import { aiClient } from '../ai/client.js';
import { validateString } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

export const codeTools = {
  'mcp__gemini__generate_component': {
    description: 'Generate UI components for React, Vue, Angular, Svelte',
    parameters: {
      name: { type: 'string', description: 'Component name', required: true },
      framework: { type: 'string', description: 'Framework', default: 'react' },
      styling: { type: 'string', description: 'Styling approach', default: 'css' },
      features: { type: 'string', description: 'Component features' }
    },
    handler: async (args) => {
      const { name, framework = 'react', styling = 'css', features = '' } = args;
      validateString(name, 'component name');
      
      const prompt = `Generate a ${framework} component named "${name}" with ${styling} styling.
      
Features: ${features}

Provide:
1. Complete component code
2. Proper imports and exports  
3. TypeScript if applicable
4. Basic styling
5. Usage example`;

      const result = await aiClient.call(prompt, 'coding');
      return `🎨 **${framework.toUpperCase()} Component Generated**\n\n${result}`;
    }
  },

  'mcp__gemini__generate_api': {
    description: 'Generate REST API endpoints with validation',
    parameters: {
      resource: { type: 'string', description: 'Resource name', required: true },
      methods: { type: 'string', description: 'HTTP methods', default: 'GET,POST,PUT,DELETE' },
      framework: { type: 'string', description: 'Backend framework', default: 'express' },
      database: { type: 'string', description: 'Database type', default: 'mongodb' }
    },
    handler: async (args) => {
      const { resource, methods = 'GET,POST,PUT,DELETE', framework = 'express', database = 'mongodb' } = args;
      validateString(resource, 'resource name');
      
      const prompt = `Generate ${framework} API endpoints for "${resource}" resource.

Methods: ${methods}
Database: ${database}

Include:
1. Route definitions
2. Request validation
3. Error handling
4. Database operations
5. Response formatting
6. Authentication middleware`;

      const result = await aiClient.call(prompt, 'coding');
      return `🔌 **${framework.toUpperCase()} API Generated**\n\n${result}`;
    }
  },

  'mcp__gemini__refactor_suggestions': {
    description: 'Get AI-powered refactoring suggestions',
    parameters: {
      code: { type: 'string', description: 'Code to refactor', required: true },
      language: { type: 'string', description: 'Programming language', default: 'javascript' },
      goals: { type: 'string', description: 'Refactoring goals', default: 'readability,performance' }
    },
    handler: async (args) => {
      const { code, language = 'javascript', goals = 'readability,performance' } = args;
      validateString(code, 'code', 20000);
      
      const prompt = `Refactor this ${language} code focusing on: ${goals}

\`\`\`${language}
${code}
\`\`\`

Provide:
1. Refactored code with improvements
2. Explanation of changes made
3. Performance impact analysis
4. Maintainability improvements
5. Best practices applied`;

      const result = await aiClient.call(prompt, 'coding');
      return `♻️ **Code Refactoring Suggestions**\n\n${result}`;
    }
  }
};