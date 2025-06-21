import { aiClient } from '../ai/client.js';
import { validateString } from '../utils/validation.js';
import { storage } from '../storage/storage.js';
import fs from 'fs/promises';
import path from 'path';

export const analysisTools = {
  'mcp__gemini__analyze_codebase': {
    description: 'Comprehensive codebase analysis with AI insights',
    parameters: {
      path: { type: 'string', description: 'Path to analyze', default: '.' },
      includeAnalysis: { type: 'boolean', description: 'Include AI analysis', default: true },
      reportType: { type: 'string', description: 'Report type', default: 'comprehensive' }
    },
    handler: async (args) => {
      const { path: targetPath = '.', includeAnalysis = true, reportType = 'comprehensive' } = args;
      
      // Quick file analysis
      const analysis = {
        timestamp: new Date().toISOString(),
        path: targetPath,
        files: [],
        structure: {},
        metrics: {},
        insights: null
      };

      try {
        // Get file list
        const files = await fs.readdir(targetPath, { recursive: true });
        analysis.files = files.filter(f => !f.includes('node_modules'));
        
        // Calculate metrics
        analysis.metrics = {
          totalFiles: analysis.files.length,
          jsFiles: analysis.files.filter(f => f.endsWith('.js')).length,
          configFiles: analysis.files.filter(f => f.includes('package.json') || f.includes('.env')).length,
          testFiles: analysis.files.filter(f => f.includes('test') || f.includes('spec')).length
        };

        if (includeAnalysis) {
          const prompt = `Analyze this codebase structure and provide insights:

Files: ${analysis.files.slice(0, 50).join(', ')}
Metrics: ${JSON.stringify(analysis.metrics, null, 2)}

Provide:
1. Architecture assessment
2. Code quality observations  
3. Security considerations
4. Performance insights
5. Improvement recommendations`;

          analysis.insights = await aiClient.call(prompt, 'analysis');
        }

      } catch (error) {
        analysis.error = error.message;
      }

      const report = `📊 **Codebase Analysis** (${reportType})

**Path:** ${targetPath}  
**Files:** ${analysis.metrics.totalFiles}  
**JavaScript:** ${analysis.metrics.jsFiles}  
**Config:** ${analysis.metrics.configFiles}  
**Tests:** ${analysis.metrics.testFiles}

${analysis.insights || 'Basic analysis completed'}

${analysis.error ? `⚠️ **Error:** ${analysis.error}` : ''}`;

      return report;
    }
  },

  'mcp__gemini__debug_analysis': {
    description: 'AI-powered debugging assistance',
    parameters: {
      error: { type: 'string', description: 'Error message', required: true },
      code: { type: 'string', description: 'Code where error occurs' },
      language: { type: 'string', description: 'Programming language', default: 'javascript' }
    },
    handler: async (args) => {
      const { error, code = '', language = 'javascript' } = args;
      validateString(error, 'error message');
      
      const prompt = `Debug this ${language} error:

**Error:** ${error}

${code ? `**Code:**\n\`\`\`${language}\n${code}\n\`\`\`` : ''}

Provide:
1. Root cause analysis
2. Step-by-step debugging approach
3. Potential fixes with code examples
4. Prevention strategies
5. Common pitfalls to avoid`;

      const result = await aiClient.call(prompt, 'debug');
      return `🐛 **Debug Analysis**\n\n${result}`;
    }
  }
};