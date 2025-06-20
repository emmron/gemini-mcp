#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
if (!OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY required');
  process.exit(1);
}

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY,
});

const TASKS_FILE = path.join(process.cwd(), 'tasks.json');

// Task management functions
async function loadTasks() {
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveTasks(tasks) {
  await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Codebase analysis functions
async function scanDirectory(dirPath, options = {}) {
  const { 
    maxDepth = 10, 
    ignorePatterns = ['.git', 'node_modules', '.env', 'dist', 'build'],
    fileExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.html', '.md', '.json', '.yaml', '.yml']
  } = options;
  
  const results = {
    files: [],
    directories: [],
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {},
    errors: []
  };
  
  async function scan(currentPath, depth = 0) {
    if (depth > maxDepth) return;
    
    try {
      const stats = await fs.stat(currentPath);
      const relativePath = path.relative(dirPath, currentPath);
      
      if (stats.isDirectory()) {
        const dirName = path.basename(currentPath);
        if (ignorePatterns.some(pattern => dirName.includes(pattern))) return;
        
        results.directories.push(relativePath || '.');
        
        const entries = await fs.readdir(currentPath);
        for (const entry of entries) {
          await scan(path.join(currentPath, entry), depth + 1);
        }
      } else if (stats.isFile()) {
        const ext = path.extname(currentPath);
        if (fileExtensions.length === 0 || fileExtensions.includes(ext)) {
          results.files.push({
            path: relativePath,
            size: stats.size,
            extension: ext,
            modified: stats.mtime
          });
          results.totalFiles++;
          results.totalSize += stats.size;
          results.fileTypes[ext] = (results.fileTypes[ext] || 0) + 1;
        }
      }
    } catch (error) {
      results.errors.push(`Error scanning ${currentPath}: ${error.message}`);
    }
  }
  
  await scan(dirPath);
  return results;
}

async function analyzeCodeFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const ext = path.extname(filePath);
    
    const analysis = {
      path: filePath,
      extension: ext,
      lines: lines.length,
      size: content.length,
      isEmpty: content.trim().length === 0,
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      variables: [],
      complexity: 'low',
      maintainabilityIndex: 0,
      cyclomaticComplexity: 0,
      duplicateLines: 0,
      codeSmells: [],
      security: {
        vulnerabilities: [],
        hardcodedSecrets: [],
        unsafePatterns: [],
        sqlInjectionRisk: false,
        xssRisk: false,
        csrfRisk: false
      },
      performance: {
        issues: [],
        suggestions: [],
        bigONotation: 'O(1)',
        memoryLeaks: [],
        inefficientLoops: 0
      },
      dependencies: {
        external: [],
        internal: [],
        unused: [],
        outdated: [],
        vulnerable: []
      },
      testCoverage: {
        hasTests: false,
        testFiles: [],
        testFrameworks: [],
        estimatedCoverage: 0,
        missingTests: []
      },
      documentation: {
        hasDocstrings: false,
        hasComments: false,
        todoCount: 0,
        readmeScore: 0,
        apiDocumentation: false,
        exampleUsage: false
      },
      architecture: {
        patterns: [],
        antiPatterns: [],
        designPrinciples: [],
        coupling: 'low',
        cohesion: 'high'
      },
      accessibility: {
        issues: [],
        ariaSupport: false,
        keyboardNavigation: false
      },
      i18n: {
        hasInternationalization: false,
        hardcodedStrings: 0,
        supportedLanguages: []
      }
    };
    
    // Basic code analysis based on file extension
    if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
      // Enhanced JavaScript/TypeScript analysis
      const functionMatches = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:\([^)]*\)\s*)?=>|class\s+\w+\s*\{[^}]*\s*\w+\s*\([^)]*\)\s*\{|\w+\s*:\s*(?:async\s+)?function)/g) || [];
      analysis.functions = functionMatches.map(match => {
        const name = match.match(/(?:function\s+(\w+)|const\s+(\w+)|(\w+)\s*:)/);
        return name ? (name[1] || name[2] || name[3]) : 'anonymous';
      });
      
      analysis.classes = (content.match(/class\s+(\w+)/g) || []).map(match => match.match(/class\s+(\w+)/)[1]);
      analysis.imports = (content.match(/import\s+.*?from\s+['"][^'"]+['"]|require\s*\(\s*['"][^'"]+['"]\s*\)/g) || []);
      analysis.exports = (content.match(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+\w+|module\.exports\s*=|exports\.\w+/g) || []);
      analysis.variables = (content.match(/(?:const|let|var)\s+(\w+)/g) || []).map(match => match.match(/(?:const|let|var)\s+(\w+)/)[1]);
      
      // Enhanced code smells detection
      const consoleCount = (content.match(/console\.log/g) || []).length;
      if (consoleCount > 5) analysis.codeSmells.push(`Excessive console.log statements (${consoleCount})`);
      if (content.match(/debugger/g)) analysis.codeSmells.push('Debugger statements found');
      if (content.match(/alert\(/g)) analysis.codeSmells.push('Alert statements found');
      if (content.match(/TODO|FIXME|HACK/gi)) {
        const todoCount = (content.match(/TODO|FIXME|HACK/gi) || []).length;
        analysis.codeSmells.push(`TODO/FIXME comments present (${todoCount})`);
        analysis.documentation.todoCount = todoCount;
      }
      if (analysis.functions.filter(f => f === 'anonymous').length > 3) analysis.codeSmells.push('Too many anonymous functions');
      if (content.match(/eval\(/g)) analysis.codeSmells.push('Use of eval() detected');
      if (content.match(/var\s+/g)) analysis.codeSmells.push('Use of var instead of let/const');
      
      // Security analysis
      const securityPatterns = {
        secrets: [/(?:password|pwd|secret|key|token|auth)\s*[:=]\s*['"][^'"]*['"]/gi, /api_key\s*[:=]\s*['"][^'"]*['"]/gi],
        vulnerabilities: [/innerHTML\s*=/, /document\.write/, /\.html\(/, /dangerouslySetInnerHTML/],
        unsafe: [/exec\(/, /system\(/, /subprocess/, /shell_exec/]
      };
      
      securityPatterns.secrets.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) analysis.security.hardcodedSecrets.push(...matches);
      });
      
      securityPatterns.vulnerabilities.forEach(pattern => {
        if (content.match(pattern)) analysis.security.vulnerabilities.push(pattern.source);
      });
      
      securityPatterns.unsafe.forEach(pattern => {
        if (content.match(pattern)) analysis.security.unsafePatterns.push(pattern.source);
      });
      
      // Advanced security analysis
      analysis.security.sqlInjectionRisk = !!content.match(/['"].*\+.*['"].*query|query.*\+.*['"]|sql.*\+/i);
      analysis.security.xssRisk = !!content.match(/innerHTML|dangerouslySetInnerHTML|document\.write/);
      analysis.security.csrfRisk = !!content.match(/fetch\(|axios\.|XMLHttpRequest/) && !content.match(/csrf|xsrf/i);
      
      // Enhanced performance analysis
      const nestedLoops = (content.match(/for\s*\([^}]*for\s*\(|while\s*\([^}]*while\s*\(|for\s*\([^}]*while\s*\(|while\s*\([^}]*for\s*\(/g) || []).length;
      if (nestedLoops > 0) {
        analysis.performance.issues.push(`Nested loops detected (${nestedLoops})`);
        analysis.performance.bigONotation = nestedLoops > 2 ? 'O(n³+)' : 'O(n²)';
        analysis.performance.inefficientLoops = nestedLoops;
      }
      
      if (content.match(/for\s*\([^)]*\.length/g)) analysis.performance.issues.push('Loop with array.length in condition');
      if (content.match(/document\.getElementById/g)?.length > 5) analysis.performance.issues.push('Excessive DOM queries');
      if (content.match(/\+\s*['"]/g)) analysis.performance.issues.push('String concatenation instead of template literals');
      if (content.match(/setInterval|setTimeout/g)?.length > 3) analysis.performance.memoryLeaks.push('Multiple timers without cleanup');
      if (content.match(/addEventListener/g) && !content.match(/removeEventListener/g)) analysis.performance.memoryLeaks.push('Event listeners without cleanup');
      
      // Architecture pattern detection
      if (content.match(/class\s+\w+Factory/)) analysis.architecture.patterns.push('Factory Pattern');
      if (content.match(/class\s+\w+Singleton/)) analysis.architecture.patterns.push('Singleton Pattern');
      if (content.match(/observer|subscribe|publish/i)) analysis.architecture.patterns.push('Observer Pattern');
      if (content.match(/middleware|next\(\)/)) analysis.architecture.patterns.push('Middleware Pattern');
      if (content.match(/redux|useReducer/)) analysis.architecture.patterns.push('Redux Pattern');
      
      // Anti-patterns
      if (content.match(/god|manager|helper|util/i)) analysis.architecture.antiPatterns.push('God Object/Class');
      if (content.match(/var\s+.*=.*function/g)?.length > 5) analysis.architecture.antiPatterns.push('Excessive global variables');
      if (content.match(/if\s*\([^)]*\)\s*{[^}]*if\s*\([^)]*\)\s*{[^}]*if/g)) analysis.architecture.antiPatterns.push('Deep nesting');
      
      // Accessibility analysis (for React/JSX)
      if (['.jsx', '.tsx'].includes(ext)) {
        if (!content.match(/aria-|role=/)) analysis.accessibility.issues.push('Missing ARIA attributes');
        if (!content.match(/alt=/)) analysis.accessibility.issues.push('Missing alt attributes');
        if (!content.match(/tabIndex|onKeyDown|onKeyPress/)) analysis.accessibility.issues.push('Missing keyboard navigation');
        analysis.accessibility.ariaSupport = !!content.match(/aria-|role=/);
        analysis.accessibility.keyboardNavigation = !!content.match(/tabIndex|onKeyDown|onKeyPress/);
      }
      
      // Internationalization analysis
      const hardcodedStrings = (content.match(/['"][^'"]*[a-zA-Z]{3,}[^'"]*['"]/g) || []).filter(str => 
        !str.match(/console|error|debug|log|import|export|function|class|const|let|var/)
      );
      analysis.i18n.hardcodedStrings = hardcodedStrings.length;
      analysis.i18n.hasInternationalization = !!content.match(/i18n|intl|translate|t\(|locale/i);
      if (content.match(/en|es|fr|de|it|pt|ru|zh|ja|ko/i)) {
        analysis.i18n.supportedLanguages = (content.match(/['"](?:en|es|fr|de|it|pt|ru|zh|ja|ko)['"]/gi) || [])
          .map(lang => lang.replace(/['"]/g, ''));
      }
      
      // Enhanced test analysis
      const testPatterns = [/describe\(/, /it\(/, /test\(/, /expect\(/, /assert/, /jest/, /mocha/, /chai/];
      analysis.testCoverage.hasTests = testPatterns.some(pattern => content.match(pattern));
      if (analysis.testCoverage.hasTests) {
        testPatterns.forEach(pattern => {
          if (content.match(pattern)) {
            const framework = pattern.source.replace(/[\\()]/g, '');
            if (!analysis.testCoverage.testFrameworks.includes(framework)) {
              analysis.testCoverage.testFrameworks.push(framework);
            }
          }
        });
        
        // Estimate test coverage based on test cases
        const testCases = (content.match(/it\(|test\(/g) || []).length;
        const functionCount = analysis.functions.length;
        analysis.testCoverage.estimatedCoverage = functionCount > 0 ? Math.min(100, (testCases / functionCount) * 100) : 0;
      }
      
      // Find untested functions
      if (!analysis.testCoverage.hasTests && analysis.functions.length > 0) {
        analysis.testCoverage.missingTests = analysis.functions.slice(0, 5); // Show first 5 untested functions
      }
      
      // Enhanced documentation analysis
      analysis.documentation.hasComments = content.includes('//') || content.includes('/*');
      analysis.documentation.hasDocstrings = content.match(/\/\*\*[\s\S]*?\*\//) !== null;
      analysis.documentation.apiDocumentation = !!content.match(/@param|@returns|@throws|@api/);
      analysis.documentation.exampleUsage = !!content.match(/@example|\/\*\*[\s\S]*example[\s\S]*\*\//i);
      
    } else if (ext === '.py') {
      // Enhanced Python analysis
      analysis.functions = (content.match(/def\s+(\w+)/g) || []).map(match => match.match(/def\s+(\w+)/)[1]);
      analysis.classes = (content.match(/class\s+(\w+)/g) || []).map(match => match.match(/class\s+(\w+)/)[1]);
      analysis.imports = (content.match(/(?:import\s+\w+|from\s+\w+\s+import)/g) || []);
      analysis.variables = (content.match(/(\w+)\s*=/g) || []).map(match => match.match(/(\w+)\s*=/)[1]);
      
      // Enhanced Python-specific analysis
      const printCount = (content.match(/print\(/g) || []).length;
      if (printCount > 5) analysis.codeSmells.push(`Excessive print statements (${printCount})`);
      if (content.match(/except:\s*$/gm)) analysis.codeSmells.push('Bare except clauses');
      if (content.match(/global\s+\w+/g)) analysis.codeSmells.push('Use of global variables');
      if (content.match(/eval\(/g)) analysis.codeSmells.push('Use of eval() detected');
      if (content.match(/exec\(/g)) analysis.codeSmells.push('Use of exec() detected');
      
      // Python security analysis
      const pySecurityPatterns = {
        secrets: [/(?:password|pwd|secret|key|token|auth)\s*=\s*['"][^'"]*['"]/gi],
        vulnerabilities: [/subprocess\.call/, /os\.system/, /pickle\.loads/, /yaml\.load/],
        unsafe: [/input\(\)/, /raw_input\(\)/, /__import__/]
      };
      
      pySecurityPatterns.secrets.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) analysis.security.hardcodedSecrets.push(...matches);
      });
      
      pySecurityPatterns.vulnerabilities.forEach(pattern => {
        if (content.match(pattern)) analysis.security.vulnerabilities.push(pattern.source);
      });
      
      pySecurityPatterns.unsafe.forEach(pattern => {
        if (content.match(pattern)) analysis.security.unsafePatterns.push(pattern.source);
      });
      
      // Python performance analysis
      if (content.match(/for\s+\w+\s+in\s+range\(len\(/g)) analysis.performance.issues.push('Use enumerate() instead of range(len())');
      if (content.match(/\+\s*=.*\[/g)) analysis.performance.issues.push('List concatenation in loop (use extend or list comprehension)');
      
      // Python test detection
      const pyTestPatterns = [/def\s+test_/, /import\s+unittest/, /import\s+pytest/, /assert\s+/, /@pytest/];
      analysis.testCoverage.hasTests = pyTestPatterns.some(pattern => content.match(pattern));
      if (analysis.testCoverage.hasTests) {
        if (content.match(/unittest/)) analysis.testCoverage.testFrameworks.push('unittest');
        if (content.match(/pytest/)) analysis.testCoverage.testFrameworks.push('pytest');
      }
      
      // Enhanced Python analysis continued
      // Architecture patterns for Python
      if (content.match(/class\s+\w*Factory/)) analysis.architecture.patterns.push('Factory Pattern');
      if (content.match(/class\s+\w*Singleton/)) analysis.architecture.patterns.push('Singleton Pattern');
      if (content.match(/def\s+__enter__|def\s+__exit__/)) analysis.architecture.patterns.push('Context Manager');
      if (content.match(/@decorator|@property|@staticmethod|@classmethod/)) analysis.architecture.patterns.push('Decorator Pattern');
      
      // Python performance analysis
      const pyNestedLoops = (content.match(/for\s+\w+\s+in[^:]*:\s*\n[\s]*for\s+\w+\s+in/g) || []).length;
      if (pyNestedLoops > 0) {
        analysis.performance.issues.push(`Nested loops detected (${pyNestedLoops})`);
        analysis.performance.bigONotation = pyNestedLoops > 2 ? 'O(n³+)' : 'O(n²)';
        analysis.performance.inefficientLoops = pyNestedLoops;
      }
      
      // Python test coverage
      if (analysis.testCoverage.hasTests) {
        const testCases = (content.match(/def\s+test_/g) || []).length;
        const functionCount = analysis.functions.length;
        analysis.testCoverage.estimatedCoverage = functionCount > 0 ? Math.min(100, (testCases / functionCount) * 100) : 0;
      }
      
      // Python documentation analysis
      analysis.documentation.hasComments = content.includes('#');
      analysis.documentation.hasDocstrings = content.match(/'''[\s\S]*?'''|"""[\s\S]*?"""/) !== null;
      analysis.documentation.apiDocumentation = !!content.match(/:param|:returns|:raises|:type/);
      analysis.documentation.exampleUsage = !!content.match(/>>>|doctest|Example:/i);
      
    } else if (['.java', '.cpp', '.c'].includes(ext)) {
      // C/C++/Java analysis
      analysis.functions = (content.match(/(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/g) || []).map(match => match.match(/(\w+)\s*\(/)[1]);
      analysis.classes = (content.match(/(?:public|private)?\s*class\s+(\w+)/g) || []).map(match => match.match(/class\s+(\w+)/)[1]);
      analysis.imports = (content.match(/#include\s*[<"][^>"]+[>"]|import\s+[\w.]+/g) || []);
    }
    
    // Advanced complexity analysis
    const complexityPatterns = {
      conditionals: content.match(/if\s*\(|else\s+if|switch\s*\(/gi) || [],
      loops: content.match(/for\s*\(|while\s*\(|do\s*\{/gi) || [],
      exceptions: content.match(/try\s*\{|catch\s*\(/gi) || [],
      logicalOperators: content.match(/&&|\|\||and\s+|or\s+/g) || []
    };
    
    analysis.cyclomaticComplexity = 1 + 
      complexityPatterns.conditionals.length + 
      complexityPatterns.loops.length + 
      complexityPatterns.exceptions.length + 
      complexityPatterns.logicalOperators.length;
    
    // Complexity classification
    if (analysis.cyclomaticComplexity > 30) analysis.complexity = 'very high';
    else if (analysis.cyclomaticComplexity > 20) analysis.complexity = 'high';
    else if (analysis.cyclomaticComplexity > 10) analysis.complexity = 'medium';
    else if (analysis.cyclomaticComplexity > 5) analysis.complexity = 'low-medium';
    
    // Duplicate line detection (simplified)
    const lineMap = {};
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 10) {
        lineMap[trimmed] = (lineMap[trimmed] || 0) + 1;
      }
    });
    analysis.duplicateLines = Object.values(lineMap).filter(count => count > 1).reduce((sum, count) => sum + count - 1, 0);
    
    // Maintainability index (simplified version)
    const halsteadVolume = Math.log2(analysis.functions.length + analysis.variables.length + 1) * lines.length;
    analysis.maintainabilityIndex = Math.max(0, (171 - 5.2 * Math.log(halsteadVolume) - 0.23 * analysis.cyclomaticComplexity - 16.2 * Math.log(lines.length)) * 100 / 171);
    
    // Additional metrics
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || trimmed.startsWith('#') || 
             trimmed.startsWith('/*') || trimmed.startsWith('*') || 
             trimmed.startsWith('"""') || trimmed.startsWith("'''");
    }).length;
    
    analysis.linesOfCode = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('#') && 
             !trimmed.startsWith('/*') && !trimmed.startsWith('*');
    }).length;
    
    analysis.commentRatio = commentLines / lines.length;
    analysis.averageLineLength = content.length / lines.length;
    
    // Dependency analysis
    if (analysis.imports.length > 0) {
      analysis.dependencies.external = analysis.imports.filter(imp => 
        !imp.includes('./') && !imp.includes('../') && !imp.includes('/src/')
      );
      analysis.dependencies.internal = analysis.imports.filter(imp => 
        imp.includes('./') || imp.includes('../') || imp.includes('/src/')
      );
    }
    
    // Enhanced quality scoring
    let qualityScore = 100;
    
    // Penalties
    qualityScore -= analysis.codeSmells.length * 3;
    qualityScore -= analysis.security.vulnerabilities.length * 15;
    qualityScore -= analysis.security.hardcodedSecrets.length * 20;
    qualityScore -= analysis.performance.issues.length * 2;
    qualityScore -= analysis.performance.memoryLeaks.length * 10;
    qualityScore -= analysis.architecture.antiPatterns.length * 8;
    qualityScore -= analysis.accessibility.issues.length * 5;
    qualityScore -= (analysis.i18n.hardcodedStrings > 10 ? 15 : 0);
    qualityScore -= (analysis.cyclomaticComplexity > 20 ? 20 : analysis.cyclomaticComplexity > 10 ? 10 : 0);
    qualityScore -= (analysis.duplicateLines > 0 ? analysis.duplicateLines * 0.5 : 0);
    
    // Security risk penalties
    if (analysis.security.sqlInjectionRisk) qualityScore -= 25;
    if (analysis.security.xssRisk) qualityScore -= 20;
    if (analysis.security.csrfRisk) qualityScore -= 15;
    
    // Bonuses
    qualityScore += analysis.documentation.hasComments ? 3 : 0;
    qualityScore += analysis.documentation.hasDocstrings ? 8 : 0;
    qualityScore += analysis.documentation.apiDocumentation ? 5 : 0;
    qualityScore += analysis.documentation.exampleUsage ? 3 : 0;
    qualityScore += analysis.testCoverage.hasTests ? 10 : 0;
    qualityScore += (analysis.testCoverage.estimatedCoverage > 80 ? 15 : analysis.testCoverage.estimatedCoverage > 50 ? 8 : 0);
    qualityScore += analysis.architecture.patterns.length * 3;
    qualityScore += analysis.accessibility.ariaSupport ? 5 : 0;
    qualityScore += analysis.i18n.hasInternationalization ? 5 : 0;
    
    analysis.qualityScore = Math.max(0, Math.min(100, qualityScore));
    
    // Risk assessment
    analysis.riskLevel = 'low';
    if (analysis.security.vulnerabilities.length > 0 || analysis.security.hardcodedSecrets.length > 0) {
      analysis.riskLevel = 'high';
    } else if (analysis.cyclomaticComplexity > 20 || analysis.codeSmells.length > 5) {
      analysis.riskLevel = 'medium';
    }
    
    return analysis;
  } catch (error) {
    return { path: filePath, error: error.message };
  }
}

const server = new Server(
  { name: 'gemini-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'ask_gemini',
      description: 'Ask Gemini AI a question',
      inputSchema: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'Question to ask Gemini' },
          model: { 
            type: 'string', 
            enum: ['google/gemini-flash-1.5', 'google/gemini-pro-1.5'],
            default: 'google/gemini-flash-1.5',
            description: 'Gemini model to use'
          }
        },
        required: ['question']
      }
    },
    {
      name: 'create_task',
      description: 'Create a new task',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title' },
          description: { type: 'string', description: 'Task description' },
          priority: { 
            type: 'string', 
            enum: ['low', 'medium', 'high'],
            default: 'medium',
            description: 'Task priority'
          },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed'],
            default: 'pending',
            description: 'Task status'
          }
        },
        required: ['title']
      }
    },
    {
      name: 'list_tasks',
      description: 'List all tasks',
      inputSchema: {
        type: 'object',
        properties: {
          status: { 
            type: 'string', 
            enum: ['pending', 'in_progress', 'completed'],
            description: 'Filter by status (optional)'
          }
        }
      }
    },
    {
      name: 'update_task',
      description: 'Update an existing task',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID' },
          title: { type: 'string', description: 'New task title' },
          description: { type: 'string', description: 'New task description' },
          priority: { 
            type: 'string', 
            enum: ['low', 'medium', 'high'],
            description: 'New task priority'
          },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed'],
            description: 'New task status'
          }
        },
        required: ['id']
      }
    },
    {
      name: 'delete_task',
      description: 'Delete a task',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Task ID to delete' }
        },
        required: ['id']
      }
    },
    {
      name: 'analyze_codebase',
      description: 'Analyze a codebase directory structure and files',
      inputSchema: {
        type: 'object',
        properties: {
          path: { 
            type: 'string', 
            description: 'Directory path to analyze (defaults to current directory)',
            default: '.'
          },
          maxDepth: {
            type: 'number',
            description: 'Maximum directory depth to scan',
            default: 10
          },
          includeAnalysis: {
            type: 'boolean',
            description: 'Include detailed code analysis for each file',
            default: false
          },
          fileExtensions: {
            type: 'array',
            items: { type: 'string' },
            description: 'File extensions to include (empty array includes all)',
            default: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.html', '.md', '.json']
          }
        }
      }
    },
    {
      name: 'generate_component',
      description: 'Generate frontend component code (React, Vue, Angular)',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Component name' },
          framework: { 
            type: 'string', 
            enum: ['react', 'vue', 'angular', 'svelte'],
            default: 'react',
            description: 'Frontend framework'
          },
          type: {
            type: 'string',
            enum: ['functional', 'class', 'hook'],
            default: 'functional',
            description: 'Component type'
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Features to include (state, props, effects, etc.)',
            default: []
          },
          styling: {
            type: 'string',
            enum: ['css', 'scss', 'styled-components', 'tailwind', 'module'],
            default: 'css',
            description: 'Styling approach'
          }
        },
        required: ['name']
      }
    },
    {
      name: 'scaffold_project',
      description: 'Generate project structure and boilerplate code',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Project name' },
          type: {
            type: 'string',
            enum: ['react-app', 'vue-app', 'node-api', 'express-api', 'next-app', 'nuxt-app', 'svelte-app'],
            description: 'Project type'
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Features to include (typescript, testing, linting, etc.)',
            default: []
          },
          packageManager: {
            type: 'string',
            enum: ['npm', 'yarn', 'pnpm'],
            default: 'npm',
            description: 'Package manager'
          }
        },
        required: ['name', 'type']
      }
    },
    {
      name: 'optimize_code',
      description: 'Optimize code for performance and best practices',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to file to optimize' },
          optimizations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Types of optimizations (performance, security, readability)',
            default: ['performance', 'security', 'readability']
          },
          framework: {
            type: 'string',
            enum: ['react', 'vue', 'angular', 'node', 'vanilla'],
            description: 'Framework context for optimization'
          }
        },
        required: ['filePath']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'ask_gemini') {
    const { question, model = 'google/gemini-flash-1.5' } = request.params.arguments;
    
    try {
      const response = await openrouter.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: question }],
        max_tokens: 2000
      });

      return {
        content: [{
          type: 'text',
          text: response.choices[0]?.message?.content || 'No response'
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'create_task') {
    const { title, description = '', priority = 'medium', status = 'pending' } = request.params.arguments;
    
    try {
      const tasks = await loadTasks();
      const newTask = {
        id: generateId(),
        title,
        description,
        priority,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      tasks.push(newTask);
      await saveTasks(tasks);
      
      return {
        content: [{
          type: 'text',
          text: `Task created successfully: ${newTask.title} (ID: ${newTask.id})`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating task: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'list_tasks') {
    const { status } = request.params.arguments || {};
    
    try {
      let tasks = await loadTasks();
      
      if (status) {
        tasks = tasks.filter(task => task.status === status);
      }
      
      if (tasks.length === 0) {
        return {
          content: [{
            type: 'text',
            text: status ? `No tasks found with status: ${status}` : 'No tasks found'
          }]
        };
      }
      
      const taskList = tasks.map(task => 
        `ID: ${task.id}\nTitle: ${task.title}\nStatus: ${task.status}\nPriority: ${task.priority}\nDescription: ${task.description}\nCreated: ${task.createdAt}\n`
      ).join('\n---\n');
      
      return {
        content: [{
          type: 'text',
          text: `Found ${tasks.length} task(s):\n\n${taskList}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing tasks: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'update_task') {
    const { id, title, description, priority, status } = request.params.arguments;
    
    try {
      const tasks = await loadTasks();
      const taskIndex = tasks.findIndex(task => task.id === id);
      
      if (taskIndex === -1) {
        return {
          content: [{
            type: 'text',
            text: `Task not found with ID: ${id}`
          }]
        };
      }
      
      const task = tasks[taskIndex];
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (status !== undefined) task.status = status;
      task.updatedAt = new Date().toISOString();
      
      await saveTasks(tasks);
      
      return {
        content: [{
          type: 'text',
          text: `Task updated successfully: ${task.title}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error updating task: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'delete_task') {
    const { id } = request.params.arguments;
    
    try {
      const tasks = await loadTasks();
      const taskIndex = tasks.findIndex(task => task.id === id);
      
      if (taskIndex === -1) {
        return {
          content: [{
            type: 'text',
            text: `Task not found with ID: ${id}`
          }]
        };
      }
      
      const deletedTask = tasks.splice(taskIndex, 1)[0];
      await saveTasks(tasks);
      
      return {
        content: [{
          type: 'text',
          text: `Task deleted successfully: ${deletedTask.title}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error deleting task: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'analyze_codebase') {
    const { 
      path: targetPath = '.', 
      maxDepth = 10, 
      includeAnalysis = false,
      fileExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.html', '.md', '.json']
    } = request.params.arguments || {};
    
    try {
      const absolutePath = path.resolve(targetPath);
      
      // Check if path exists
      try {
        await fs.access(absolutePath);
      } catch {
        return {
          content: [{
            type: 'text',
            text: `Path does not exist: ${absolutePath}`
          }]
        };
      }
      
      const scanResults = await scanDirectory(absolutePath, {
        maxDepth,
        fileExtensions
      });
      
      let analysis = `# Codebase Analysis: ${absolutePath}\n\n`;
      analysis += `## Summary\n`;
      analysis += `- **Total Files**: ${scanResults.totalFiles}\n`;
      analysis += `- **Total Size**: ${(scanResults.totalSize / 1024).toFixed(2)} KB\n`;
      analysis += `- **Directories**: ${scanResults.directories.length}\n`;
      analysis += `- **File Types**: ${Object.keys(scanResults.fileTypes).length}\n\n`;
      
      // File type breakdown
      analysis += `## File Types\n`;
      for (const [ext, count] of Object.entries(scanResults.fileTypes)) {
        analysis += `- **${ext || 'no extension'}**: ${count} files\n`;
      }
      analysis += '\n';
      
      // Directory structure
      analysis += `## Directory Structure\n`;
      scanResults.directories.slice(0, 20).forEach(dir => {
        analysis += `- ${dir}\n`;
      });
      if (scanResults.directories.length > 20) {
        analysis += `... and ${scanResults.directories.length - 20} more directories\n`;
      }
      analysis += '\n';
      
      // Files list
      analysis += `## Files\n`;
      scanResults.files.slice(0, 50).forEach(file => {
        const sizeKB = (file.size / 1024).toFixed(2);
        analysis += `- **${file.path}** (${sizeKB} KB)\n`;
      });
      if (scanResults.files.length > 50) {
        analysis += `... and ${scanResults.files.length - 50} more files\n`;
      }
      
      // Detailed analysis if requested
      if (includeAnalysis) {
        analysis += `\n## Code Analysis\n`;
        const codeFiles = scanResults.files.filter(f => 
          ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c'].includes(f.extension)
        ).slice(0, 10);
        
        for (const file of codeFiles) {
          const filePath = path.join(absolutePath, file.path);
          const fileAnalysis = await analyzeCodeFile(filePath);
          
          if (!fileAnalysis.error) {
            analysis += `\n### ${file.path}\n`;
            analysis += `- **Lines**: ${fileAnalysis.lines} (${fileAnalysis.linesOfCode} code)\n`;
            analysis += `- **Quality Score**: ${fileAnalysis.qualityScore}/100 (Risk: ${fileAnalysis.riskLevel})\n`;
            analysis += `- **Functions**: ${Array.isArray(fileAnalysis.functions) ? fileAnalysis.functions.length : fileAnalysis.functions} ${Array.isArray(fileAnalysis.functions) ? `(${fileAnalysis.functions.slice(0, 3).join(', ')}${fileAnalysis.functions.length > 3 ? '...' : ''})` : ''}\n`;
            analysis += `- **Classes**: ${Array.isArray(fileAnalysis.classes) ? fileAnalysis.classes.length : fileAnalysis.classes} ${Array.isArray(fileAnalysis.classes) && fileAnalysis.classes.length > 0 ? `(${fileAnalysis.classes.join(', ')})` : ''}\n`;
            analysis += `- **Dependencies**: ${fileAnalysis.dependencies.external.length} external, ${fileAnalysis.dependencies.internal.length} internal\n`;
            analysis += `- **Complexity**: ${fileAnalysis.complexity} (Cyclomatic: ${fileAnalysis.cyclomaticComplexity})\n`;
            analysis += `- **Maintainability**: ${fileAnalysis.maintainabilityIndex.toFixed(1)}%\n`;
            analysis += `- **Comment Ratio**: ${(fileAnalysis.commentRatio * 100).toFixed(1)}%\n`;
            
            // Security Analysis
            const securityRisks = [];
            if (fileAnalysis.security.sqlInjectionRisk) securityRisks.push('SQL Injection');
            if (fileAnalysis.security.xssRisk) securityRisks.push('XSS');
            if (fileAnalysis.security.csrfRisk) securityRisks.push('CSRF');
            
            if (fileAnalysis.security.vulnerabilities.length > 0 || fileAnalysis.security.hardcodedSecrets.length > 0 || securityRisks.length > 0) {
              analysis += `- **Security**: ${fileAnalysis.security.vulnerabilities.length} vulnerabilities, ${fileAnalysis.security.hardcodedSecrets.length} secrets`;
              if (securityRisks.length > 0) analysis += `, Risks: ${securityRisks.join(', ')}`;
              analysis += '\n';
            }
            
            // Performance Analysis
            if (fileAnalysis.performance.issues.length > 0 || fileAnalysis.performance.memoryLeaks.length > 0) {
              analysis += `- **Performance**: ${fileAnalysis.performance.bigONotation} complexity`;
              if (fileAnalysis.performance.issues.length > 0) analysis += `, Issues: ${fileAnalysis.performance.issues.slice(0, 2).join(', ')}`;
              if (fileAnalysis.performance.memoryLeaks.length > 0) analysis += `, Memory leaks: ${fileAnalysis.performance.memoryLeaks.length}`;
              analysis += '\n';
            }
            
            // Architecture Analysis
            if (fileAnalysis.architecture.patterns.length > 0 || fileAnalysis.architecture.antiPatterns.length > 0) {
              analysis += `- **Architecture**: `;
              if (fileAnalysis.architecture.patterns.length > 0) analysis += `Patterns: ${fileAnalysis.architecture.patterns.join(', ')}`;
              if (fileAnalysis.architecture.antiPatterns.length > 0) {
                if (fileAnalysis.architecture.patterns.length > 0) analysis += ', ';
                analysis += `Anti-patterns: ${fileAnalysis.architecture.antiPatterns.join(', ')}`;
              }
              analysis += '\n';
            }
            
            // Testing Analysis
            let testingInfo = fileAnalysis.testCoverage.hasTests ? 
              `Yes (${fileAnalysis.testCoverage.testFrameworks.join(', ')}, ${fileAnalysis.testCoverage.estimatedCoverage.toFixed(1)}% coverage)` : 
              'No tests found';
            if (fileAnalysis.testCoverage.missingTests.length > 0) {
              testingInfo += `, Missing: ${fileAnalysis.testCoverage.missingTests.slice(0, 3).join(', ')}`;
            }
            analysis += `- **Testing**: ${testingInfo}\n`;
            
            // Documentation Analysis
            let docInfo = [];
            if (fileAnalysis.documentation.hasDocstrings) docInfo.push('docstrings');
            if (fileAnalysis.documentation.apiDocumentation) docInfo.push('API docs');
            if (fileAnalysis.documentation.exampleUsage) docInfo.push('examples');
            if (fileAnalysis.documentation.hasComments) docInfo.push('comments');
            analysis += `- **Documentation**: ${docInfo.length > 0 ? docInfo.join(', ') : 'No documentation'}\n`;
            
            // Accessibility & i18n (for web files)
            if (fileAnalysis.accessibility.issues.length > 0 || fileAnalysis.i18n.hardcodedStrings > 5) {
              analysis += `- **Web Standards**: `;
              if (fileAnalysis.accessibility.issues.length > 0) analysis += `${fileAnalysis.accessibility.issues.length} accessibility issues`;
              if (fileAnalysis.i18n.hardcodedStrings > 5) {
                if (fileAnalysis.accessibility.issues.length > 0) analysis += ', ';
                analysis += `${fileAnalysis.i18n.hardcodedStrings} hardcoded strings`;
              }
              analysis += '\n';
            }
            
            // Additional Issues
            const additionalIssues = [];
            if (fileAnalysis.duplicateLines > 0) additionalIssues.push(`${fileAnalysis.duplicateLines} duplicate lines`);
            if (fileAnalysis.codeSmells && fileAnalysis.codeSmells.length > 0) additionalIssues.push(`${fileAnalysis.codeSmells.length} code smells`);
            if (fileAnalysis.documentation.todoCount > 0) additionalIssues.push(`${fileAnalysis.documentation.todoCount} TODOs`);
            
            if (additionalIssues.length > 0) {
              analysis += `- **Issues**: ${additionalIssues.join(', ')}\n`;
            }
          }
        }
      }
      
      // Errors
      if (scanResults.errors.length > 0) {
        analysis += `\n## Errors\n`;
        scanResults.errors.forEach(error => {
          analysis += `- ${error}\n`;
        });
      }
      
      return {
        content: [{
          type: 'text',
          text: analysis
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error analyzing codebase: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'generate_component') {
    const { name, framework = 'react', type = 'functional', features = [], styling = 'css' } = request.params.arguments;
    
    try {
      let componentCode = '';
      const componentName = name.charAt(0).toUpperCase() + name.slice(1);
      
      if (framework === 'react') {
        if (type === 'functional') {
          componentCode = `import React${features.includes('state') ? ', { useState }' : ''}${features.includes('effects') ? ', { useEffect }' : ''} from 'react';\n`;
          if (styling === 'styled-components') {
            componentCode += `import styled from 'styled-components';\n`;
          }
          componentCode += `\n`;
          
          if (styling === 'styled-components') {
            componentCode += `const Container = styled.div\`
  /* Add your styles here */
\`;\n\n`;
          }
          
          componentCode += `const ${componentName} = (${features.includes('props') ? '{ children, ...props }' : ''}) => {\n`;
          
          if (features.includes('state')) {
            componentCode += `  const [state, setState] = useState(null);\n\n`;
          }
          
          if (features.includes('effects')) {
            componentCode += `  useEffect(() => {
    // Add your effect logic here
  }, []);\n\n`;
          }
          
          componentCode += `  return (\n`;
          if (styling === 'styled-components') {
            componentCode += `    <Container>\n`;
          } else {
            componentCode += `    <div className="${name.toLowerCase()}">\n`;
          }
          componentCode += `      <h1>${componentName} Component</h1>\n`;
          if (features.includes('props')) {
            componentCode += `      {children}\n`;
          }
          if (styling === 'styled-components') {
            componentCode += `    </Container>\n`;
          } else {
            componentCode += `    </div>\n`;
          }
          componentCode += `  );\n};\n\nexport default ${componentName};`;
        }
      } else if (framework === 'vue') {
        componentCode = `<template>
  <div class="${name.toLowerCase()}">
    <h1>${componentName} Component</h1>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: '${componentName}',${features.includes('props') ? `
  props: {
    // Define your props here
  },` : ''}${features.includes('state') ? `
  data() {
    return {
      // Your reactive state here
    };
  },` : ''}${features.includes('effects') ? `
  mounted() {
    // Component lifecycle hook
  },` : ''}
};
</script>

<style${styling === 'scss' ? ' lang="scss"' : ''}${styling === 'module' ? ' module' : ''} scoped>
.${name.toLowerCase()} {
  /* Add your styles here */
}
</style>`;
      }
      
      // Generate corresponding CSS file if needed
      let cssCode = '';
      if (styling === 'css' && framework === 'react') {
        cssCode = `.${name.toLowerCase()} {
  /* Add your styles here */
}`;
      }
      
      let response = `Component generated successfully!\n\n**${componentName}.${framework === 'react' ? 'jsx' : 'vue'}**\n\`\`\`${framework === 'react' ? 'jsx' : 'vue'}\n${componentCode}\n\`\`\``;
      
      if (cssCode) {
        response += `\n\n**${componentName}.css**\n\`\`\`css\n${cssCode}\n\`\`\``;
      }
      
      return {
        content: [{
          type: 'text',
          text: response
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating component: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'scaffold_project') {
    const { name, type, features = [], packageManager = 'npm' } = request.params.arguments;
    
    try {
      let scaffoldStructure = `# Project Structure for ${name}\n\n`;
      let packageJson = {};
      let additionalFiles = {};
      
      if (type === 'react-app') {
        scaffoldStructure += `\`\`\`
${name}/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│   ├── App.js
│   └── index.js
├── package.json
${features.includes('testing') ? '├── jest.config.js\n' : ''}${features.includes('typescript') ? '├── tsconfig.json\n' : ''}${features.includes('linting') ? '├── .eslintrc.js\n' : ''}└── README.md
\`\`\``;

        packageJson = {
          name: name.toLowerCase(),
          version: '1.0.0',
          scripts: {
            start: 'react-scripts start',
            build: 'react-scripts build',
            test: features.includes('testing') ? 'jest' : 'react-scripts test',
            eject: 'react-scripts eject'
          },
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            'react-scripts': '^5.0.1'
          }
        };
        
        if (features.includes('typescript')) {
          packageJson.devDependencies = { 
            ...packageJson.devDependencies,
            'typescript': '^4.9.0',
            '@types/react': '^18.0.0',
            '@types/react-dom': '^18.0.0'
          };
        }
        
        additionalFiles['src/App.js'] = `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to ${name}</h1>
        <p>Your React app is ready!</p>
      </header>
    </div>
  );
}

export default App;`;

        additionalFiles['src/index.js'] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
      }
      
      let response = scaffoldStructure + '\n\n**package.json**\n```json\n' + JSON.stringify(packageJson, null, 2) + '\n```';
      
      Object.entries(additionalFiles).forEach(([filename, content]) => {
        response += `\n\n**${filename}**\n\`\`\`javascript\n${content}\n\`\`\``;
      });
      
      response += `\n\n**Setup Instructions:**\n1. Create directory: \`mkdir ${name}\`\n2. Navigate: \`cd ${name}\`\n3. Initialize: \`${packageManager} init -y\`\n4. Install dependencies: \`${packageManager} install\`\n5. Start development: \`${packageManager} start\``;
      
      return {
        content: [{
          type: 'text',
          text: response
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error scaffolding project: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'optimize_code') {
    const { filePath, optimizations = ['performance', 'security', 'readability'], framework } = request.params.arguments;
    
    try {
      // This would need to read the actual file and analyze it
      const analysis = await analyzeCodeFile(path.resolve(filePath));
      
      if (analysis.error) {
        return {
          content: [{
            type: 'text',
            text: `Error reading file: ${analysis.error}`
          }]
        };
      }
      
      let suggestions = `# Code Optimization Suggestions for ${filePath}\n\n`;
      
      if (optimizations.includes('performance')) {
        suggestions += `## Performance Optimizations\n`;
        analysis.performance.issues.forEach(issue => {
          suggestions += `- ${issue}\n`;
        });
        if (analysis.performance.memoryLeaks.length > 0) {
          suggestions += `- Memory leaks detected: ${analysis.performance.memoryLeaks.join(', ')}\n`;
        }
        suggestions += '\n';
      }
      
      if (optimizations.includes('security')) {
        suggestions += `## Security Improvements\n`;
        if (analysis.security.vulnerabilities.length > 0) {
          suggestions += `- Security vulnerabilities: ${analysis.security.vulnerabilities.join(', ')}\n`;
        }
        if (analysis.security.hardcodedSecrets.length > 0) {
          suggestions += `- Remove hardcoded secrets (${analysis.security.hardcodedSecrets.length} found)\n`;
        }
        if (analysis.security.sqlInjectionRisk) suggestions += `- SQL injection risk detected\n`;
        if (analysis.security.xssRisk) suggestions += `- XSS vulnerability risk detected\n`;
        suggestions += '\n';
      }
      
      if (optimizations.includes('readability')) {
        suggestions += `## Readability Improvements\n`;
        analysis.codeSmells.forEach(smell => {
          suggestions += `- ${smell}\n`;
        });
        if (analysis.architecture.antiPatterns.length > 0) {
          suggestions += `- Anti-patterns found: ${analysis.architecture.antiPatterns.join(', ')}\n`;
        }
        suggestions += '\n';
      }
      
      suggestions += `## Quality Score: ${analysis.qualityScore}/100 (Risk: ${analysis.riskLevel})\n`;
      suggestions += `## Complexity: ${analysis.complexity} (Cyclomatic: ${analysis.cyclomaticComplexity})\n`;
      
      return {
        content: [{
          type: 'text',
          text: suggestions
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error optimizing code: ${error.message}`
        }]
      };
    }
  }
});

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error('Gemini MCP Server running');
});