import { aiClient } from '../ai/client.js';
import { storage } from '../storage/storage.js';
import { logger } from '../utils/logger.js';
import { validateString, validateObject } from '../utils/validation.js';
import { codeTools } from './code-tools.js';
import { analysisTools } from './analysis-tools.js';

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerTools();
  }

  registerTool(name, description, parameters, handler) {
    this.tools.set(name, {
      name,
      description,
      inputSchema: {
        type: 'object',
        properties: parameters,
        required: Object.keys(parameters).filter(key => parameters[key].required)
      },
      handler
    });
  }

  registerTools() {
    // AI Chat tool
    this.registerTool(
      'mcp__gemini__ai_chat',
      'AI conversation with model selection',
      {
        message: { type: 'string', description: 'Message for AI', required: true },
        model: { type: 'string', description: 'Model type', default: 'main' },
        context: { type: 'string', description: 'Additional context' }
      },
      async (args) => {
        const { message, model = 'main', context = '' } = args;
        validateString(message, 'message');
        
        const response = await aiClient.call(message, model, { context });
        return `🤖 **AI Response** (${model})\\n\\n${response}`;
      }
    );

    // Code analysis tool
    this.registerTool(
      'mcp__gemini__code_analyze',
      'Analyze code for quality and issues',
      {
        code: { type: 'string', description: 'Code to analyze', required: true },
        language: { type: 'string', description: 'Programming language' },
        analysis_type: { type: 'string', description: 'Type of analysis', default: 'comprehensive' }
      },
      async (args) => {
        const { code, language = 'javascript', analysis_type = 'comprehensive' } = args;
        validateString(code, 'code', 10000);
        
        const prompt = \`Analyze this \${language} code for \${analysis_type} review:

\\\`\\\`\\\`\${language}
\${code}
\\\`\\\`\\\`

Provide:
1. Code quality assessment
2. Security vulnerabilities
3. Performance issues
4. Best practice violations
5. Specific improvement suggestions\`;

        const analysis = await aiClient.call(prompt, 'analysis');
        return \`📊 **Code Analysis** (\${analysis_type})\\n\\n\${analysis}\`;
      }
    );

    // Task management
    this.registerTool(
      'mcp__gemini__create_project_tasks',
      'Create project tasks from requirements',
      {
        requirements: { type: 'string', description: 'Project requirements', required: true },
        project_type: { type: 'string', description: 'Project type', default: 'general' },
        complexity: { type: 'string', description: 'Complexity level', default: 'medium' }
      },
      async (args) => {
        const { requirements, project_type = 'general', complexity = 'medium' } = args;
        validateString(requirements, 'requirements');
        
        const prompt = \`Break down these project requirements into specific, actionable tasks:

\${requirements}

Project Type: \${project_type}
Complexity: \${complexity}

Create a structured task list with:
1. Clear task descriptions
2. Priority levels (high/medium/low)
3. Estimated effort
4. Dependencies between tasks
5. Implementation order\`;

        const taskBreakdown = await aiClient.call(prompt, 'main', { complexity });
        
        // Save to storage
        const taskData = await storage.read('tasks');
        const timestamp = new Date().toISOString();
        taskData.last_requirements = requirements;
        taskData.last_breakdown = taskBreakdown;
        taskData.updated = timestamp;
        await storage.write('tasks', taskData);
        
        return \`📋 **Project Tasks Created**\\n\\n\${taskBreakdown}\`;
      }
    );

    // Register additional tools from modules
    this.registerToolsFromModule(codeTools);
    this.registerToolsFromModule(analysisTools);
    
    logger.info('Tool registry initialized', { toolCount: this.tools.size });
  }

  registerToolsFromModule(toolsModule) {
    Object.entries(toolsModule).forEach(([name, tool]) => {
      this.registerTool(name, tool.description, tool.parameters, tool.handler);
    });
  }

  getToolList() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  async executeTool(name, args) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(\`Tool '\${name}' not found\`);
    }

    try {
      return await tool.handler(args || {});
    } catch (error) {
      logger.error('Tool execution failed', { name, error: error.message });
      throw error;
    }
  }
}

export const toolRegistry = new ToolRegistry();