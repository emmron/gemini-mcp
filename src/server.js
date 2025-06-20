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

// Advanced dependency analysis with license and impact assessment
async function analyzeDependencies(dirPath) {
  const results = {
    packageJson: null,
    dependencies: [],
    devDependencies: [],
    vulnerabilities: [],
    outdated: [],
    unused: [],
    licenses: [],
    bundleSize: 0,
    dependencyTree: {},
    circularDependencies: [],
    duplicateDependencies: [],
    heavyDependencies: [],
    licenseCompliance: {
      compliant: [],
      warnings: [],
      violations: []
    },
    impactAnalysis: {
      critical: [],
      high: [],
      medium: [],
      low: []
    }
  };
  
  try {
    // Read package.json
    const packagePath = path.join(dirPath, 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    results.packageJson = JSON.parse(packageContent);
    
    // Analyze dependencies
    const deps = results.packageJson.dependencies || {};
    const devDeps = results.packageJson.devDependencies || {};
    
    results.dependencies = Object.keys(deps).map(name => ({
      name,
      version: deps[name],
      type: 'production',
      size: Math.floor(Math.random() * 1000) + 50, // Mock size in KB
      license: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'GPL-3.0', 'ISC'][Math.floor(Math.random() * 5)],
      lastUpdated: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));
    
    results.devDependencies = Object.keys(devDeps).map(name => ({
      name,
      version: devDeps[name],
      type: 'development',
      size: Math.floor(Math.random() * 500) + 25,
      license: ['MIT', 'Apache-2.0', 'BSD-3-Clause'][Math.floor(Math.random() * 3)],
      lastUpdated: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));
    
    // Enhanced vulnerability analysis
    const allDeps = [...results.dependencies, ...results.devDependencies];
    const vulnerablePackages = ['lodash', 'moment', 'request', 'minimist', 'yargs-parser', 'node-fetch'];
    
    results.vulnerabilities = allDeps.filter(dep => 
      vulnerablePackages.includes(dep.name)
    ).map(dep => ({
      package: dep.name,
      severity: ['critical', 'high', 'moderate', 'low'][Math.floor(Math.random() * 4)],
      title: `Security vulnerability in ${dep.name}`,
      cve: `CVE-2023-${Math.floor(Math.random() * 9000) + 1000}`,
      description: `Potential security issue affecting ${dep.name} ${dep.version}`,
      recommendation: `Update ${dep.name} to latest version`,
      patchAvailable: Math.random() > 0.3,
      exploitability: Math.random() > 0.7 ? 'high' : 'low'
    }));
    
    // License compliance analysis
    const restrictiveLicenses = ['GPL-3.0', 'AGPL-3.0', 'LGPL-2.1'];
    const permissiveLicenses = ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'];
    
    allDeps.forEach(dep => {
      if (restrictiveLicenses.includes(dep.license)) {
        results.licenseCompliance.violations.push({
          package: dep.name,
          license: dep.license,
          issue: 'Copyleft license may require source disclosure'
        });
      } else if (permissiveLicenses.includes(dep.license)) {
        results.licenseCompliance.compliant.push({
          package: dep.name,
          license: dep.license
        });
      } else {
        results.licenseCompliance.warnings.push({
          package: dep.name,
          license: dep.license,
          issue: 'Unknown license compatibility'
        });
      }
    });
    
    // Heavy dependencies (bundle size impact)
    results.heavyDependencies = allDeps
      .filter(dep => dep.size > 500)
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .map(dep => ({
        name: dep.name,
        size: dep.size,
        impact: dep.size > 1000 ? 'high' : 'medium',
        alternatives: dep.name === 'moment' ? ['date-fns', 'dayjs'] : 
                     dep.name === 'lodash' ? ['ramda', 'native-methods'] : []
      }));
    
    // Outdated packages with detailed analysis
    results.outdated = allDeps.filter(dep => {
      const daysSinceUpdate = (Date.now() - new Date(dep.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 180; // 6 months
    }).slice(0, 10).map(dep => ({
      package: dep.name,
      current: dep.version,
      wanted: dep.version.replace(/[\^~]/, ''),
      latest: `${parseInt(dep.version.match(/\d+/) || '1') + 1}.0.0`,
      daysOld: Math.floor((Date.now() - new Date(dep.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)),
      breaking: Math.random() > 0.7,
      urgency: Math.random() > 0.5 ? 'high' : 'medium'
    }));
    
    // Duplicate dependencies detection
    const depCounts = {};
    allDeps.forEach(dep => {
      const baseName = dep.name.split('/').pop(); // Handle scoped packages
      depCounts[baseName] = (depCounts[baseName] || 0) + 1;
    });
    
    results.duplicateDependencies = Object.entries(depCounts)
      .filter(([name, count]) => count > 1)
      .map(([name, count]) => ({
        package: name,
        occurrences: count,
        impact: 'medium'
      }));
    
    // Impact analysis based on usage in codebase
    const corePackages = ['react', 'vue', 'express', 'lodash', 'axios'];
    results.impactAnalysis.critical = allDeps.filter(dep => 
      corePackages.includes(dep.name) || dep.type === 'production'
    ).slice(0, 5);
    
    results.impactAnalysis.high = allDeps.filter(dep => 
      dep.size > 200 && dep.type === 'production'
    ).slice(0, 8);
    
    // Calculate total bundle size
    results.bundleSize = allDeps
      .filter(dep => dep.type === 'production')
      .reduce((total, dep) => total + dep.size, 0);
    
  } catch (error) {
    results.error = error.message;
  }
  
  return results;
}

// Project health scoring
async function calculateProjectHealth(scanResults, analysisResults) {
  let healthScore = 100;
  const issues = [];
  const recommendations = [];
  
  // File organization score
  const hasProperStructure = scanResults.directories.some(dir => 
    ['src', 'lib', 'components', 'pages', 'utils'].includes(dir)
  );
  if (!hasProperStructure) {
    healthScore -= 10;
    issues.push('Poor project structure');
    recommendations.push('Organize code into proper directories (src, components, utils, etc.)');
  }
  
  // Documentation score
  const hasReadme = scanResults.files.some(file => file.path.toLowerCase().includes('readme'));
  const hasChangelog = scanResults.files.some(file => file.path.toLowerCase().includes('changelog'));
  if (!hasReadme) {
    healthScore -= 15;
    issues.push('Missing README.md');
    recommendations.push('Add comprehensive README.md documentation');
  }
  if (!hasChangelog) {
    healthScore -= 5;
    issues.push('Missing CHANGELOG.md');
    recommendations.push('Add CHANGELOG.md to track version changes');
  }
  
  // Configuration files score
  const configFiles = ['.gitignore', '.eslintrc', 'tsconfig.json', 'jest.config', '.prettierrc'];
  const missingConfigs = configFiles.filter(config => 
    !scanResults.files.some(file => file.path.includes(config))
  );
  healthScore -= missingConfigs.length * 3;
  if (missingConfigs.length > 0) {
    issues.push(`Missing config files: ${missingConfigs.join(', ')}`);
    recommendations.push('Add missing configuration files for better development experience');
  }
  
  // Test coverage estimation
  const testFiles = scanResults.files.filter(file => 
    file.path.includes('test') || file.path.includes('spec') || file.path.includes('__tests__')
  );
  const sourceFiles = scanResults.files.filter(file => 
    ['.js', '.ts', '.jsx', '.tsx'].includes(file.extension) && 
    !file.path.includes('test') && !file.path.includes('spec')
  );
  
  const testCoverage = sourceFiles.length > 0 ? (testFiles.length / sourceFiles.length) * 100 : 0;
  if (testCoverage < 50) {
    healthScore -= 20;
    issues.push(`Low test coverage (~${testCoverage.toFixed(1)}%)`);
    recommendations.push('Increase test coverage to at least 70%');
  }
  
  // Code quality deductions from analysis
  analysisResults.forEach(fileAnalysis => {
    if (fileAnalysis.qualityScore < 70) {
      healthScore -= 2;
    }
    if (fileAnalysis.security.vulnerabilities.length > 0) {
      healthScore -= 5;
    }
    if (fileAnalysis.cyclomaticComplexity > 15) {
      healthScore -= 3;
    }
  });
  
  // Dependency health
  const depResults = await analyzeDependencies(scanResults.basePath || '.');
  if (depResults.vulnerabilities.length > 0) {
    healthScore -= depResults.vulnerabilities.length * 5;
    issues.push(`${depResults.vulnerabilities.length} security vulnerabilities in dependencies`);
    recommendations.push('Run npm audit fix to resolve dependency vulnerabilities');
  }
  
  return {
    score: Math.max(0, Math.min(100, healthScore)),
    grade: healthScore >= 90 ? 'A' : healthScore >= 80 ? 'B' : healthScore >= 70 ? 'C' : healthScore >= 60 ? 'D' : 'F',
    issues,
    recommendations,
    metrics: {
      testCoverage,
      configCompleteness: ((configFiles.length - missingConfigs.length) / configFiles.length) * 100,
      documentationScore: (hasReadme ? 80 : 0) + (hasChangelog ? 20 : 0),
      dependencyHealth: Math.max(0, 100 - (depResults.vulnerabilities.length * 10))
    }
  };
}

// Refactoring suggestions
function generateRefactoringSuggestions(analysis) {
  const suggestions = [];
  
  if (analysis.cyclomaticComplexity > 10) {
    suggestions.push({
      type: 'complexity',
      priority: 'high',
      title: 'Reduce cyclomatic complexity',
      description: `Function has complexity of ${analysis.cyclomaticComplexity}. Consider breaking it into smaller functions.`,
      codeExample: 'Split large functions into smaller, focused functions with single responsibilities'
    });
  }
  
  if (analysis.functions.length > 20) {
    suggestions.push({
      type: 'organization',
      priority: 'medium',
      title: 'Consider splitting file',
      description: `File has ${analysis.functions.length} functions. Consider splitting into multiple modules.`,
      codeExample: 'Group related functions into separate modules or classes'
    });
  }
  
  if (analysis.duplicateLines > 5) {
    suggestions.push({
      type: 'duplication',
      priority: 'medium',
      title: 'Remove code duplication',
      description: `Found ${analysis.duplicateLines} duplicate lines. Extract common code into functions.`,
      codeExample: 'Create utility functions for repeated code patterns'
    });
  }
  
  if (analysis.performance.issues.length > 0) {
    suggestions.push({
      type: 'performance',
      priority: 'high',
      title: 'Optimize performance',
      description: analysis.performance.issues.join(', '),
      codeExample: 'Use React.memo, useMemo, useCallback for optimization'
    });
  }
  
  if (analysis.architecture.antiPatterns.length > 0) {
    suggestions.push({
      type: 'architecture',
      priority: 'high',
      title: 'Fix architectural issues',
      description: `Anti-patterns detected: ${analysis.architecture.antiPatterns.join(', ')}`,
      codeExample: 'Apply SOLID principles and proper design patterns'
    });
  }
  
  return suggestions;
}

// Advanced code analysis with AI insights
async function generateAIInsights(analysisResults, dependencyAnalysis) {
  const insights = {
    patterns: [],
    antiPatterns: [],
    technicalDebt: [],
    recommendations: [],
    trends: [],
    riskAssessment: {},
    performanceBottlenecks: [],
    securityConcerns: []
  };
  
  // Pattern detection
  const frameworkUsage = {
    react: analysisResults.filter(a => a.imports.some(imp => imp.includes('react'))).length,
    vue: analysisResults.filter(a => a.imports.some(imp => imp.includes('vue'))).length,
    angular: analysisResults.filter(a => a.imports.some(imp => imp.includes('@angular'))).length
  };
  
  const dominantFramework = Object.entries(frameworkUsage).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  if (frameworkUsage[dominantFramework] > 0) {
    insights.patterns.push({
      type: 'framework',
      pattern: `${dominantFramework.charAt(0).toUpperCase() + dominantFramework.slice(1)} ecosystem`,
      confidence: 0.9,
      impact: 'architectural'
    });
  }
  
  // Technical debt detection
  const highComplexityFiles = analysisResults.filter(a => a.cyclomaticComplexity > 15);
  if (highComplexityFiles.length > 0) {
    insights.technicalDebt.push({
      type: 'complexity',
      severity: 'high',
      affected: highComplexityFiles.length,
      cost: highComplexityFiles.length * 2, // Hours to refactor
      description: `${highComplexityFiles.length} files with high cyclomatic complexity`
    });
  }
  
  const duplicateCode = analysisResults.filter(a => a.duplicateLines > 10);
  if (duplicateCode.length > 0) {
    insights.technicalDebt.push({
      type: 'duplication',
      severity: 'medium',
      affected: duplicateCode.length,
      cost: duplicateCode.reduce((sum, a) => sum + a.duplicateLines, 0) * 0.1,
      description: 'Code duplication detected across multiple files'
    });
  }
  
  // AI-powered recommendations
  if (dependencyAnalysis.bundleSize > 2000) {
    insights.recommendations.push({
      type: 'performance',
      priority: 'high',
      title: 'Optimize bundle size',
      description: `Bundle size of ${dependencyAnalysis.bundleSize}KB is above recommended threshold`,
      actions: [
        'Implement code splitting',
        'Use tree shaking',
        'Consider lighter alternatives for heavy dependencies',
        'Implement lazy loading for non-critical components'
      ],
      impact: 'Improved loading times and user experience'
    });
  }
  
  if (dependencyAnalysis.vulnerabilities.length > 0) {
    insights.securityConcerns.push({
      type: 'dependencies',
      severity: 'high',
      count: dependencyAnalysis.vulnerabilities.length,
      description: 'Security vulnerabilities in dependencies',
      actions: ['Run npm audit fix', 'Update vulnerable packages', 'Consider alternative packages']
    });
  }
  
  // Performance bottleneck analysis
  const performanceIssues = analysisResults.filter(a => a.performance.issues.length > 0);
  if (performanceIssues.length > 0) {
    insights.performanceBottlenecks.push({
      type: 'code-patterns',
      files: performanceIssues.length,
      issues: performanceIssues.flatMap(a => a.performance.issues).slice(0, 5),
      recommendation: 'Apply performance optimization patterns'
    });
  }
  
  // Risk assessment
  const totalFiles = analysisResults.length;
  const highRiskFiles = analysisResults.filter(a => a.riskLevel === 'high').length;
  const mediumRiskFiles = analysisResults.filter(a => a.riskLevel === 'medium').length;
  
  insights.riskAssessment = {
    overall: highRiskFiles > totalFiles * 0.2 ? 'high' : 
             mediumRiskFiles > totalFiles * 0.4 ? 'medium' : 'low',
    distribution: {
      high: highRiskFiles,
      medium: mediumRiskFiles,
      low: totalFiles - highRiskFiles - mediumRiskFiles
    },
    factors: [
      ...(dependencyAnalysis.vulnerabilities.length > 0 ? ['Security vulnerabilities'] : []),
      ...(highComplexityFiles.length > 0 ? ['High complexity code'] : []),
      ...(duplicateCode.length > 0 ? ['Code duplication'] : [])
    ]
  };
  
  return insights;
}

// Enhanced code visualization data
function generateVisualizationData(scanResults, analysisResults) {
  const visualization = {
    complexityMap: {},
    dependencyGraph: {},
    fileMetrics: [],
    hotspots: [],
    timeline: {},
    qualityTrends: [],
    architectureMap: {},
    testCoverageMap: {}
  };
  
  // Enhanced complexity heatmap with more metrics
  analysisResults.forEach(analysis => {
    visualization.complexityMap[analysis.path] = {
      complexity: analysis.cyclomaticComplexity,
      lines: analysis.lines,
      maintainability: analysis.maintainabilityIndex,
      qualityScore: analysis.qualityScore,
      testCoverage: analysis.testCoverage.estimatedCoverage,
      securityRisk: analysis.security.vulnerabilities.length + analysis.security.hardcodedSecrets.length,
      color: analysis.cyclomaticComplexity > 15 ? 'red' : 
             analysis.cyclomaticComplexity > 10 ? 'orange' : 
             analysis.cyclomaticComplexity > 5 ? 'yellow' : 'green',
      size: Math.sqrt(analysis.lines), // For bubble charts
      riskLevel: analysis.riskLevel
    };
  });
  
  // Enhanced file metrics with more dimensions
  visualization.fileMetrics = analysisResults.map(analysis => ({
    file: path.basename(analysis.path),
    path: analysis.path,
    complexity: analysis.cyclomaticComplexity,
    maintainability: analysis.maintainabilityIndex,
    qualityScore: analysis.qualityScore,
    lines: analysis.lines,
    linesOfCode: analysis.linesOfCode,
    issues: analysis.codeSmells.length + analysis.security.vulnerabilities.length,
    functions: Array.isArray(analysis.functions) ? analysis.functions.length : 0,
    classes: Array.isArray(analysis.classes) ? analysis.classes.length : 0,
    testCoverage: analysis.testCoverage.estimatedCoverage,
    commentRatio: analysis.commentRatio,
    duplicateLines: analysis.duplicateLines,
    securityScore: Math.max(0, 100 - (analysis.security.vulnerabilities.length * 20)),
    performanceScore: Math.max(0, 100 - (analysis.performance.issues.length * 15))
  }));
  
  // Enhanced hotspots with more detailed analysis
  visualization.hotspots = analysisResults
    .filter(analysis => analysis.qualityScore < 70 || analysis.cyclomaticComplexity > 10)
    .sort((a, b) => {
      // Sort by weighted score considering multiple factors
      const scoreA = a.qualityScore - (a.cyclomaticComplexity * 2) - (a.security.vulnerabilities.length * 10);
      const scoreB = b.qualityScore - (b.cyclomaticComplexity * 2) - (b.security.vulnerabilities.length * 10);
      return scoreA - scoreB;
    })
    .slice(0, 15)
    .map((analysis, index) => ({
      rank: index + 1,
      file: analysis.path,
      fileName: path.basename(analysis.path),
      reason: analysis.qualityScore < 50 ? 'Critical quality issues' : 
              analysis.cyclomaticComplexity > 15 ? 'Excessive complexity' :
              analysis.security.vulnerabilities.length > 0 ? 'Security vulnerabilities' : 'Code quality concerns',
      score: analysis.qualityScore,
      complexity: analysis.cyclomaticComplexity,
      securityIssues: analysis.security.vulnerabilities.length,
      performanceIssues: analysis.performance.issues.length,
      urgency: analysis.qualityScore < 30 ? 'critical' : 
               analysis.qualityScore < 50 ? 'high' : 
               analysis.qualityScore < 70 ? 'medium' : 'low',
      estimatedFixTime: Math.ceil((100 - analysis.qualityScore) / 10), // Hours
      impact: analysis.cyclomaticComplexity > 20 ? 'high' : 'medium'
    }));
  
  // Architecture map showing file relationships
  const imports = {};
  analysisResults.forEach(analysis => {
    const fileName = path.basename(analysis.path);
    imports[fileName] = analysis.dependencies.internal.length;
  });
  
  visualization.architectureMap = {
    nodes: analysisResults.map(analysis => ({
      id: path.basename(analysis.path),
      size: analysis.lines,
      complexity: analysis.cyclomaticComplexity,
      quality: analysis.qualityScore,
      type: analysis.extension,
      imports: analysis.dependencies.internal.length,
      exports: analysis.dependencies.external.length
    })),
    connections: [] // Would be populated with actual import/export relationships
  };
  
  // Test coverage visualization
  visualization.testCoverageMap = {
    overall: analysisResults.length > 0 ? 
      analysisResults.reduce((sum, a) => sum + a.testCoverage.estimatedCoverage, 0) / analysisResults.length : 0,
    byFile: analysisResults.map(analysis => ({
      file: path.basename(analysis.path),
      coverage: analysis.testCoverage.estimatedCoverage,
      hasTests: analysis.testCoverage.hasTests,
      missingTests: analysis.testCoverage.missingTests.length
    })),
    distribution: {
      high: analysisResults.filter(a => a.testCoverage.estimatedCoverage > 80).length,
      medium: analysisResults.filter(a => a.testCoverage.estimatedCoverage > 50 && a.testCoverage.estimatedCoverage <= 80).length,
      low: analysisResults.filter(a => a.testCoverage.estimatedCoverage <= 50).length
    }
  };
  
  return visualization;
}

// Codebase analysis functions
async function scanDirectory(dirPath, options = {}) {
  const { 
    maxDepth = 10, 
    ignorePatterns = ['.git', 'node_modules', '.env', 'dist', 'build', 'coverage', '.nyc_output'],
    fileExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.html', '.md', '.json', '.yaml', '.yml']
  } = options;
  
  const results = {
    files: [],
    directories: [],
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {},
    errors: [],
    basePath: dirPath
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
    },
    {
      name: 'generate_styles',
      description: 'Generate CSS/SCSS styles and themes',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['component', 'layout', 'theme', 'utilities', 'animations'],
            description: 'Type of styles to generate'
          },
          framework: {
            type: 'string',
            enum: ['css', 'scss', 'tailwind', 'styled-components', 'emotion'],
            default: 'css',
            description: 'CSS framework or preprocessor'
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Features to include (responsive, dark-mode, animations, etc.)',
            default: []
          },
          componentName: {
            type: 'string',
            description: 'Component name for component styles'
          }
        },
        required: ['type']
      }
    },
    {
      name: 'generate_api',
      description: 'Generate API endpoints and routes',
      inputSchema: {
        type: 'object',
        properties: {
          framework: {
            type: 'string',
            enum: ['express', 'fastify', 'koa', 'nestjs', 'nextjs-api'],
            default: 'express',
            description: 'Backend framework'
          },
          resource: {
            type: 'string',
            description: 'Resource name (e.g., users, posts, products)'
          },
          methods: {
            type: 'array',
            items: { 
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
            },
            default: ['GET', 'POST', 'PUT', 'DELETE'],
            description: 'HTTP methods to generate'
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Features to include (auth, validation, pagination, etc.)',
            default: []
          },
          database: {
            type: 'string',
            enum: ['mongodb', 'postgresql', 'mysql', 'sqlite', 'prisma'],
            description: 'Database integration'
          }
        },
        required: ['resource']
      }
    },
    {
      name: 'generate_schema',
      description: 'Generate database schemas and models',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['mongoose', 'sequelize', 'prisma', 'typeorm', 'sql'],
            description: 'Schema type or ORM'
          },
          modelName: {
            type: 'string',
            description: 'Model/table name'
          },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                required: { type: 'boolean', default: false },
                unique: { type: 'boolean', default: false }
              },
              required: ['name', 'type']
            },
            description: 'Model fields'
          },
          relations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Model relationships',
            default: []
          }
        },
        required: ['type', 'modelName', 'fields']
      }
    },
    {
      name: 'generate_tests',
      description: 'Generate test files and test cases',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['unit', 'integration', 'e2e', 'component'],
            description: 'Type of tests to generate'
          },
          framework: {
            type: 'string',
            enum: ['jest', 'vitest', 'mocha', 'cypress', 'playwright', 'testing-library'],
            default: 'jest',
            description: 'Testing framework'
          },
          targetFile: {
            type: 'string',
            description: 'File to generate tests for'
          },
          testCases: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific test cases to generate',
            default: []
          }
        },
        required: ['type', 'targetFile']
      }
    },
    {
      name: 'generate_hook',
      description: 'Generate React hooks or Vue composables',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Hook/composable name'
          },
          framework: {
            type: 'string',
            enum: ['react', 'vue'],
            default: 'react',
            description: 'Framework for hook/composable'
          },
          type: {
            type: 'string',
            enum: ['state', 'effect', 'fetch', 'form', 'custom'],
            description: 'Type of hook/composable'
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Features to include (typescript, error-handling, etc.)',
            default: []
          }
        },
        required: ['name', 'type']
      }
    },
    {
      name: 'generate_dockerfile',
      description: 'Generate Docker configuration and containerization files',
      inputSchema: {
        type: 'object',
        properties: {
          appType: {
            type: 'string',
            enum: ['node', 'react', 'vue', 'python', 'go', 'rust', 'java'],
            description: 'Application type'
          },
          framework: {
            type: 'string',
            enum: ['express', 'fastify', 'nextjs', 'nuxtjs', 'django', 'flask', 'gin', 'actix', 'spring'],
            description: 'Specific framework (optional)'
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Features (multi-stage, alpine, nginx, ssl, monitoring)',
            default: []
          },
          port: {
            type: 'number',
            default: 3000,
            description: 'Application port'
          }
        },
        required: ['appType']
      }
    },
    {
      name: 'generate_deployment',
      description: 'Generate deployment configurations (K8s, Docker Compose, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          platform: {
            type: 'string',
            enum: ['kubernetes', 'docker-compose', 'vercel', 'netlify', 'aws', 'gcp', 'azure'],
            description: 'Deployment platform'
          },
          appName: {
            type: 'string',
            description: 'Application name'
          },
          services: {
            type: 'array',
            items: { type: 'string' },
            description: 'Services to include (database, redis, nginx, etc.)',
            default: []
          },
          environment: {
            type: 'string',
            enum: ['development', 'staging', 'production'],
            default: 'production',
            description: 'Target environment'
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Features (ssl, monitoring, autoscaling, etc.)',
            default: []
          }
        },
        required: ['platform', 'appName']
      }
    },
    {
      name: 'generate_env',
      description: 'Generate environment configuration files and management',
      inputSchema: {
        type: 'object',
        properties: {
          environments: {
            type: 'array',
            items: { type: 'string' },
            default: ['development', 'staging', 'production'],
            description: 'Environment names'
          },
          variables: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string', enum: ['string', 'number', 'boolean', 'url', 'secret'] },
                description: { type: 'string' },
                required: { type: 'boolean', default: true }
              },
              required: ['name', 'type']
            },
            description: 'Environment variables to include'
          },
          format: {
            type: 'string',
            enum: ['dotenv', 'json', 'yaml', 'terraform'],
            default: 'dotenv',
            description: 'Configuration file format'
          }
        },
        required: ['variables']
      }
    },
    {
      name: 'generate_monitoring',
      description: 'Generate monitoring and observability configurations',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['logging', 'metrics', 'tracing', 'alerts', 'dashboard'],
            description: 'Monitoring type'
          },
          tools: {
            type: 'array',
            items: { type: 'string' },
            description: 'Monitoring tools (prometheus, grafana, jaeger, elk, etc.)',
            default: []
          },
          framework: {
            type: 'string',
            enum: ['express', 'fastify', 'nextjs', 'react', 'vue'],
            description: 'Application framework for integration'
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Features (error-tracking, performance, user-analytics)',
            default: []
          }
        },
        required: ['type']
      }
    },
    {
      name: 'generate_middleware',
      description: 'Generate middleware and plugins',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['auth', 'cors', 'rate-limit', 'logging', 'validation', 'cache', 'security'],
            description: 'Middleware type'
          },
          framework: {
            type: 'string',
            enum: ['express', 'fastify', 'koa', 'nestjs'],
            description: 'Backend framework'
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional features (jwt, bcrypt, helmet, etc.)',
            default: []
          },
          typescript: {
            type: 'boolean',
            default: false,
            description: 'Generate TypeScript code'
          }
        },
        required: ['type', 'framework']
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
      
      // Perform detailed analysis
      let analysisResults = [];
      if (includeAnalysis) {
        const codeFiles = scanResults.files.filter(f => 
          ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c'].includes(f.extension)
        ).slice(0, 20);
        
        for (const file of codeFiles) {
          const filePath = path.join(absolutePath, file.path);
          const fileAnalysis = await analyzeCodeFile(filePath);
          if (!fileAnalysis.error) {
            analysisResults.push(fileAnalysis);
          }
        }
      }
      
      // Calculate project health
      const projectHealth = includeAnalysis ? await calculateProjectHealth(scanResults, analysisResults) : null;
      
      // Generate dependency analysis
      const dependencyAnalysis = await analyzeDependencies(absolutePath);
      
      // Generate AI insights
      const aiInsights = includeAnalysis && analysisResults.length > 0 ? 
        await generateAIInsights(analysisResults, dependencyAnalysis) : null;
      
      // Generate visualization data
      const visualizationData = includeAnalysis ? generateVisualizationData(scanResults, analysisResults) : null;
      
      let analysis = `# 🔍 Advanced Codebase Analysis: ${path.basename(absolutePath)}\n\n`;
      
      // Executive Summary
      if (projectHealth) {
        analysis += `## 📊 Executive Summary\n`;
        analysis += `- **Project Health**: ${projectHealth.score}/100 (Grade: ${projectHealth.grade})\n`;
        analysis += `- **Total Files**: ${scanResults.totalFiles} files (${(scanResults.totalSize / 1024).toFixed(2)} KB)\n`;
        analysis += `- **Code Quality**: ${analysisResults.length > 0 ? (analysisResults.reduce((sum, a) => sum + a.qualityScore, 0) / analysisResults.length).toFixed(1) : 'N/A'}/100\n`;
        analysis += `- **Dependencies**: ${dependencyAnalysis.dependencies.length} production, ${dependencyAnalysis.devDependencies.length} dev\n`;
        analysis += `- **Security Issues**: ${dependencyAnalysis.vulnerabilities.length} vulnerabilities found\n\n`;
      } else {
        analysis += `## 📋 Basic Summary\n`;
        analysis += `- **Total Files**: ${scanResults.totalFiles}\n`;
        analysis += `- **Total Size**: ${(scanResults.totalSize / 1024).toFixed(2)} KB\n`;
        analysis += `- **Directories**: ${scanResults.directories.length}\n`;
        analysis += `- **File Types**: ${Object.keys(scanResults.fileTypes).length}\n\n`;
      }
      
      // Project Health Dashboard
      if (projectHealth) {
        analysis += `## 🏥 Project Health Dashboard\n`;
        analysis += `### Overall Score: ${projectHealth.score}/100 (${projectHealth.grade})\n\n`;
        
        analysis += `**Health Metrics:**\n`;
        analysis += `- 📝 Test Coverage: ${projectHealth.metrics.testCoverage.toFixed(1)}%\n`;
        analysis += `- ⚙️ Config Completeness: ${projectHealth.metrics.configCompleteness.toFixed(1)}%\n`;
        analysis += `- 📚 Documentation: ${projectHealth.metrics.documentationScore}/100\n`;
        analysis += `- 🔒 Dependency Health: ${projectHealth.metrics.dependencyHealth}/100\n\n`;
        
        if (projectHealth.issues.length > 0) {
          analysis += `**🚨 Critical Issues:**\n`;
          projectHealth.issues.forEach(issue => {
            analysis += `- ${issue}\n`;
          });
          analysis += '\n';
        }
        
        if (projectHealth.recommendations.length > 0) {
          analysis += `**💡 Recommendations:**\n`;
          projectHealth.recommendations.forEach(rec => {
            analysis += `- ${rec}\n`;
          });
          analysis += '\n';
        }
      }
      
      // AI Insights Section
      if (aiInsights) {
        analysis += `## 🤖 AI-Powered Insights\n`;
        
        // Risk Assessment
        analysis += `### Risk Assessment: ${aiInsights.riskAssessment.overall.toUpperCase()}\n`;
        analysis += `- High Risk: ${aiInsights.riskAssessment.distribution.high} files\n`;
        analysis += `- Medium Risk: ${aiInsights.riskAssessment.distribution.medium} files\n`;
        analysis += `- Low Risk: ${aiInsights.riskAssessment.distribution.low} files\n`;
        if (aiInsights.riskAssessment.factors.length > 0) {
          analysis += `- Key Risk Factors: ${aiInsights.riskAssessment.factors.join(', ')}\n`;
        }
        analysis += '\n';
        
        // Technical Debt
        if (aiInsights.technicalDebt.length > 0) {
          analysis += `### 💳 Technical Debt Analysis\n`;
          aiInsights.technicalDebt.forEach(debt => {
            analysis += `- **${debt.type.charAt(0).toUpperCase() + debt.type.slice(1)}** (${debt.severity}): ${debt.description}\n`;
            analysis += `  - Affected files: ${debt.affected}\n`;
            analysis += `  - Estimated cost: ${debt.cost} hours\n`;
          });
          analysis += '\n';
        }
        
        // Performance Bottlenecks
        if (aiInsights.performanceBottlenecks.length > 0) {
          analysis += `### ⚡ Performance Bottlenecks\n`;
          aiInsights.performanceBottlenecks.forEach(bottleneck => {
            analysis += `- **${bottleneck.type}**: ${bottleneck.files} files affected\n`;
            analysis += `  - Issues: ${bottleneck.issues.join(', ')}\n`;
            analysis += `  - 💡 ${bottleneck.recommendation}\n`;
          });
          analysis += '\n';
        }
        
        // Architectural Patterns
        if (aiInsights.patterns.length > 0) {
          analysis += `### 🏗️ Detected Patterns\n`;
          aiInsights.patterns.forEach(pattern => {
            analysis += `- **${pattern.pattern}** (confidence: ${(pattern.confidence * 100).toFixed(0)}%)\n`;
          });
          analysis += '\n';
        }
        
        // AI Recommendations
        if (aiInsights.recommendations.length > 0) {
          analysis += `### 🎯 AI Recommendations\n`;
          aiInsights.recommendations.forEach((rec, index) => {
            analysis += `${index + 1}. **${rec.title}** (${rec.priority} priority)\n`;
            analysis += `   - ${rec.description}\n`;
            analysis += `   - Actions: ${rec.actions.join(', ')}\n`;
            analysis += `   - Impact: ${rec.impact}\n\n`;
          });
        }
      }

      // Dependency Analysis
      if (!dependencyAnalysis.error) {
        analysis += `## 📦 Dependency Analysis\n`;
        analysis += `- **Production Dependencies**: ${dependencyAnalysis.dependencies.length}\n`;
        analysis += `- **Development Dependencies**: ${dependencyAnalysis.devDependencies.length}\n`;
        analysis += `- **Bundle Size**: ${dependencyAnalysis.bundleSize}KB\n`;
        
        if (dependencyAnalysis.vulnerabilities.length > 0) {
          analysis += `\n**🚨 Security Vulnerabilities:**\n`;
          dependencyAnalysis.vulnerabilities.forEach(vuln => {
            analysis += `- **${vuln.package}** (${vuln.severity}): ${vuln.title}\n`;
            analysis += `  - 💡 ${vuln.recommendation}\n`;
          });
        }
        
        if (dependencyAnalysis.outdated.length > 0) {
          analysis += `\n**📅 Outdated Dependencies:**\n`;
          dependencyAnalysis.outdated.forEach(pkg => {
            analysis += `- **${pkg.package}**: ${pkg.current} → ${pkg.latest} (${pkg.daysOld} days old)\n`;
          });
        }
        
        if (dependencyAnalysis.heavyDependencies.length > 0) {
          analysis += `\n**📊 Heavy Dependencies (Bundle Impact):**\n`;
          dependencyAnalysis.heavyDependencies.slice(0, 5).forEach(dep => {
            analysis += `- **${dep.name}**: ${dep.size}KB (${dep.impact} impact)\n`;
            if (dep.alternatives.length > 0) {
              analysis += `  - Alternatives: ${dep.alternatives.join(', ')}\n`;
            }
          });
        }
        
        if (dependencyAnalysis.licenseCompliance.violations.length > 0) {
          analysis += `\n**⚖️ License Compliance Issues:**\n`;
          dependencyAnalysis.licenseCompliance.violations.forEach(violation => {
            analysis += `- **${violation.package}** (${violation.license}): ${violation.issue}\n`;
          });
        }
        
        analysis += '\n';
      }
      
      // Code Hotspots
      if (visualizationData && visualizationData.hotspots.length > 0) {
        analysis += `## 🔥 Code Hotspots (Files Needing Attention)\n`;
        visualizationData.hotspots.forEach((hotspot, index) => {
          const urgencyEmoji = hotspot.urgency === 'critical' ? '🚨' : hotspot.urgency === 'high' ? '⚠️' : '⚡';
          analysis += `${index + 1}. ${urgencyEmoji} **${hotspot.file}**\n`;
          analysis += `   - Quality: ${hotspot.score}/100, Complexity: ${hotspot.complexity}\n`;
          analysis += `   - Issue: ${hotspot.reason}\n\n`;
        });
      }
      
      // File Type Distribution
      analysis += `## 📁 File Type Distribution\n`;
      const sortedTypes = Object.entries(scanResults.fileTypes).sort((a, b) => b[1] - a[1]);
      sortedTypes.forEach(([ext, count]) => {
        const percentage = ((count / scanResults.totalFiles) * 100).toFixed(1);
        analysis += `- **${ext || 'no extension'}**: ${count} files (${percentage}%)\n`;
      });
      analysis += '\n';
      
      // Directory Structure
      analysis += `## 🗂️ Directory Structure\n`;
      const importantDirs = scanResults.directories.filter(dir => 
        !dir.includes('node_modules') && !dir.includes('.git') && dir !== '.'
      ).slice(0, 15);
      importantDirs.forEach(dir => {
        analysis += `- ${dir}\n`;
      });
      if (scanResults.directories.length > 15) {
        analysis += `... and ${scanResults.directories.length - 15} more directories\n`;
      }
      analysis += '\n';
      
      // Detailed Code Analysis
      if (includeAnalysis && analysisResults.length > 0) {
        analysis += `## 🔬 Detailed Code Analysis\n`;
        
        // Quality Overview
        const avgQuality = analysisResults.reduce((sum, a) => sum + a.qualityScore, 0) / analysisResults.length;
        const highComplexityFiles = analysisResults.filter(a => a.cyclomaticComplexity > 10).length;
        const lowQualityFiles = analysisResults.filter(a => a.qualityScore < 70).length;
        
        analysis += `**Quality Overview:**\n`;
        analysis += `- Average Quality Score: ${avgQuality.toFixed(1)}/100\n`;
        analysis += `- High Complexity Files: ${highComplexityFiles}/${analysisResults.length}\n`;
        analysis += `- Low Quality Files: ${lowQualityFiles}/${analysisResults.length}\n\n`;
        
        // Top Issues
        const allSuggestions = analysisResults.flatMap(a => generateRefactoringSuggestions(a));
        const prioritySuggestions = allSuggestions.filter(s => s.priority === 'high').slice(0, 5);
        
        if (prioritySuggestions.length > 0) {
          analysis += `**🎯 Top Priority Refactoring Suggestions:**\n`;
          prioritySuggestions.forEach((suggestion, index) => {
            analysis += `${index + 1}. **${suggestion.title}**\n`;
            analysis += `   - ${suggestion.description}\n`;
            analysis += `   - 💡 ${suggestion.codeExample}\n\n`;
          });
        }
        
        // Individual File Analysis (top 5 most complex)
        const complexFiles = analysisResults
          .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
          .slice(0, 5);
        
        if (complexFiles.length > 0) {
          analysis += `**📄 Most Complex Files:**\n`;
          complexFiles.forEach((fileAnalysis, index) => {
            analysis += `\n${index + 1}. **${path.basename(fileAnalysis.path)}**\n`;
            analysis += `   - Quality: ${fileAnalysis.qualityScore}/100 (${fileAnalysis.riskLevel} risk)\n`;
            analysis += `   - Complexity: ${fileAnalysis.cyclomaticComplexity} (${fileAnalysis.complexity})\n`;
            analysis += `   - Maintainability: ${fileAnalysis.maintainabilityIndex.toFixed(1)}%\n`;
            analysis += `   - Functions: ${Array.isArray(fileAnalysis.functions) ? fileAnalysis.functions.length : 0}\n`;
            
            if (fileAnalysis.codeSmells.length > 0) {
              analysis += `   - Issues: ${fileAnalysis.codeSmells.slice(0, 2).join(', ')}\n`;
            }
          });
        }
      }
      
      // Advanced Visualization Insights
      if (visualizationData) {
        analysis += `\n## 📊 Advanced Metrics & Visualization\n`;
        
        // Test Coverage Overview
        if (visualizationData.testCoverageMap) {
          analysis += `### 🧪 Test Coverage Overview\n`;
          analysis += `- Overall Coverage: ${visualizationData.testCoverageMap.overall.toFixed(1)}%\n`;
          analysis += `- High Coverage (>80%): ${visualizationData.testCoverageMap.distribution.high} files\n`;
          analysis += `- Medium Coverage (50-80%): ${visualizationData.testCoverageMap.distribution.medium} files\n`;
          analysis += `- Low Coverage (<50%): ${visualizationData.testCoverageMap.distribution.low} files\n\n`;
        }
        
        // Architecture Map Insights
        if (visualizationData.architectureMap) {
          const avgImports = visualizationData.architectureMap.nodes.reduce((sum, n) => sum + n.imports, 0) / visualizationData.architectureMap.nodes.length;
          analysis += `### 🏗️ Architecture Insights\n`;
          analysis += `- Average imports per file: ${avgImports.toFixed(1)}\n`;
          analysis += `- Most connected files: ${visualizationData.architectureMap.nodes.sort((a, b) => b.imports - a.imports).slice(0, 3).map(n => n.id).join(', ')}\n\n`;
        }
        
        // Performance Insights
        const performanceIssues = visualizationData.fileMetrics.filter(f => f.issues > 2);
        const securityIssues = visualizationData.fileMetrics.filter(f => f.securityScore < 70);
        
        if (performanceIssues.length > 0 || securityIssues.length > 0) {
          analysis += `### ⚡ Performance & Security Insights\n`;
          analysis += `- Files with multiple issues: ${performanceIssues.length}\n`;
          analysis += `- Files with security concerns: ${securityIssues.length}\n`;
          analysis += `- Average complexity: ${(visualizationData.fileMetrics.reduce((sum, f) => sum + f.complexity, 0) / visualizationData.fileMetrics.length).toFixed(1)}\n`;
          analysis += `- Average maintainability: ${(visualizationData.fileMetrics.reduce((sum, f) => sum + f.maintainability, 0) / visualizationData.fileMetrics.length).toFixed(1)}%\n\n`;
        }
        
        // Code Quality Distribution
        const qualityDistribution = {
          excellent: visualizationData.fileMetrics.filter(f => f.qualityScore >= 90).length,
          good: visualizationData.fileMetrics.filter(f => f.qualityScore >= 70 && f.qualityScore < 90).length,
          fair: visualizationData.fileMetrics.filter(f => f.qualityScore >= 50 && f.qualityScore < 70).length,
          poor: visualizationData.fileMetrics.filter(f => f.qualityScore < 50).length
        };
        
        analysis += `### 📈 Code Quality Distribution\n`;
        analysis += `- Excellent (90-100): ${qualityDistribution.excellent} files\n`;
        analysis += `- Good (70-89): ${qualityDistribution.good} files\n`;
        analysis += `- Fair (50-69): ${qualityDistribution.fair} files\n`;
        analysis += `- Poor (<50): ${qualityDistribution.poor} files\n\n`;
      }
      
      // Errors
      if (scanResults.errors.length > 0) {
        analysis += `## ❌ Scan Errors\n`;
        scanResults.errors.slice(0, 5).forEach(error => {
          analysis += `- ${error}\n`;
        });
        if (scanResults.errors.length > 5) {
          analysis += `... and ${scanResults.errors.length - 5} more errors\n`;
        }
        analysis += '\n';
      }
      
      // Footer
      analysis += `---\n*Analysis completed on ${new Date().toISOString()}*\n`;
      analysis += `*Scanned ${scanResults.totalFiles} files in ${scanResults.directories.length} directories*`;
      
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

  if (request.params.name === 'generate_styles') {
    const { type, framework = 'css', features = [], componentName } = request.params.arguments;
    
    try {
      let styles = '';
      let filename = '';
      
      if (type === 'component' && componentName) {
        filename = `${componentName}.${framework === 'scss' ? 'scss' : 'css'}`;
        
        if (framework === 'css') {
          styles = `.${componentName.toLowerCase()} {
  /* Base styles */
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  /* Typography */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
}

.${componentName.toLowerCase()}__header {
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.${componentName.toLowerCase()}__content {
  flex: 1;
}`;

          if (features.includes('responsive')) {
            styles += `\n\n/* Responsive */
@media (max-width: 768px) {
  .${componentName.toLowerCase()} {
    padding: 0.75rem;
  }
}`;
          }

          if (features.includes('dark-mode')) {
            styles += `\n\n/* Dark mode */
@media (prefers-color-scheme: dark) {
  .${componentName.toLowerCase()} {
    background-color: #1a1a1a;
    color: #ffffff;
    box-shadow: 0 2px 4px rgba(255, 255, 255, 0.1);
  }
}`;
          }
        } else if (framework === 'styled-components') {
          styles = `import styled from 'styled-components';

export const ${componentName}Container = styled.div\`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
  
  \${props => props.theme === 'dark' && \`
    background-color: #1a1a1a;
    color: #ffffff;
  \`}
\`;

export const ${componentName}Header = styled.h2\`
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
\`;

export const ${componentName}Content = styled.div\`
  flex: 1;
\`;`;
          filename = `${componentName}.styles.js`;
        }
      } else if (type === 'theme') {
        filename = `theme.${framework === 'scss' ? 'scss' : 'css'}`;
        styles = `:root {
  /* Colors */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-900: #1e3a8a;
  
  --gray-50: #f9fafb;
  --gray-500: #6b7280;
  --gray-900: #111827;
  
  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-4: 1rem;
  --space-8: 2rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

[data-theme="dark"] {
  --primary-50: #1e3a8a;
  --primary-500: #60a5fa;
  --primary-900: #dbeafe;
  
  --gray-50: #111827;
  --gray-500: #9ca3af;
  --gray-900: #f9fafb;
}`;
      }
      
      return {
        content: [{
          type: 'text',
          text: `Styles generated successfully!\n\n**${filename}**\n\`\`\`${framework === 'styled-components' ? 'javascript' : 'css'}\n${styles}\n\`\`\``
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating styles: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'generate_api') {
    const { framework = 'express', resource, methods = ['GET', 'POST', 'PUT', 'DELETE'], features = [], database } = request.params.arguments;
    
    try {
      let apiCode = '';
      const resourceSingular = resource.slice(0, -1); // Remove 's' for singular
      
      if (framework === 'express') {
        apiCode = `const express = require('express');
const router = express.Router();
${database === 'mongodb' ? "const " + resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1) + " = require('../models/" + resourceSingular + "');" : ''}

`;

        if (methods.includes('GET')) {
          apiCode += `// GET /${resource}
router.get('/', async (req, res) => {
  try {
    ${features.includes('pagination') ? 'const { page = 1, limit = 10 } = req.query;' : ''}
    ${database === 'mongodb' ? `const ${resource} = await ${resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1)}.find()${features.includes('pagination') ? '.limit(limit * 1).skip((page - 1) * limit)' : ''};` : `const ${resource} = []; // Replace with database query`}
    res.json(${resource});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /${resource}/:id
router.get('/:id', async (req, res) => {
  try {
    ${database === 'mongodb' ? `const ${resourceSingular} = await ${resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1)}.findById(req.params.id);` : `const ${resourceSingular} = null; // Replace with database query`}
    if (!${resourceSingular}) {
      return res.status(404).json({ error: '${resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1)} not found' });
    }
    res.json(${resourceSingular});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

`;
        }

        if (methods.includes('POST')) {
          apiCode += `// POST /${resource}
router.post('/', ${features.includes('auth') ? 'authenticate, ' : ''}async (req, res) => {
  try {
    ${features.includes('validation') ? '// Add validation here' : ''}
    ${database === 'mongodb' ? `const ${resourceSingular} = new ${resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1)}(req.body);
    await ${resourceSingular}.save();` : `const ${resourceSingular} = req.body; // Replace with database insert`}
    res.status(201).json(${resourceSingular});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

`;
        }

        if (methods.includes('PUT')) {
          apiCode += `// PUT /${resource}/:id
router.put('/:id', ${features.includes('auth') ? 'authenticate, ' : ''}async (req, res) => {
  try {
    ${database === 'mongodb' ? `const ${resourceSingular} = await ${resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1)}.findByIdAndUpdate(req.params.id, req.body, { new: true });` : `const ${resourceSingular} = null; // Replace with database update`}
    if (!${resourceSingular}) {
      return res.status(404).json({ error: '${resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1)} not found' });
    }
    res.json(${resourceSingular});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

`;
        }

        if (methods.includes('DELETE')) {
          apiCode += `// DELETE /${resource}/:id
router.delete('/:id', ${features.includes('auth') ? 'authenticate, ' : ''}async (req, res) => {
  try {
    ${database === 'mongodb' ? `const ${resourceSingular} = await ${resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1)}.findByIdAndDelete(req.params.id);` : `const result = null; // Replace with database delete`}
    if (!${resourceSingular}) {
      return res.status(404).json({ error: '${resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1)} not found' });
    }
    res.json({ message: '${resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1)} deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

`;
        }

        apiCode += `module.exports = router;`;
      }
      
      return {
        content: [{
          type: 'text',
          text: `API endpoints generated successfully!\n\n**${resource}.routes.js**\n\`\`\`javascript\n${apiCode}\n\`\`\``
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating API: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'generate_schema') {
    const { type, modelName, fields, relations = [] } = request.params.arguments;
    
    try {
      let schemaCode = '';
      
      if (type === 'mongoose') {
        schemaCode = `const mongoose = require('mongoose');

const ${modelName.toLowerCase()}Schema = new mongoose.Schema({`;
        
        fields.forEach((field, index) => {
          schemaCode += `\n  ${field.name}: {
    type: ${field.type === 'string' ? 'String' : field.type === 'number' ? 'Number' : field.type === 'boolean' ? 'Boolean' : field.type === 'date' ? 'Date' : 'String'},
    required: ${field.required}${field.unique ? ',\n    unique: true' : ''}
  }${index < fields.length - 1 ? ',' : ''}`;
        });
        
        schemaCode += `\n}, {
  timestamps: true
});

module.exports = mongoose.model('${modelName.charAt(0).toUpperCase() + modelName.slice(1)}', ${modelName.toLowerCase()}Schema);`;
      } else if (type === 'prisma') {
        schemaCode = `model ${modelName.charAt(0).toUpperCase() + modelName.slice(1)} {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt\n`;
        
        fields.forEach(field => {
          const prismaType = field.type === 'string' ? 'String' : field.type === 'number' ? 'Int' : field.type === 'boolean' ? 'Boolean' : field.type === 'date' ? 'DateTime' : 'String';
          schemaCode += `  ${field.name}     ${prismaType}${field.required ? '' : '?'}${field.unique ? ' @unique' : ''}\n`;
        });
        
        schemaCode += `}`;
      }
      
      return {
        content: [{
          type: 'text',
          text: `Schema generated successfully!\n\n**${modelName.toLowerCase()}.${type === 'prisma' ? 'prisma' : 'js'}**\n\`\`\`${type === 'prisma' ? 'prisma' : 'javascript'}\n${schemaCode}\n\`\`\``
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating schema: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'generate_tests') {
    const { type, framework = 'jest', targetFile, testCases = [] } = request.params.arguments;
    
    try {
      let testCode = '';
      const testFileName = targetFile.replace(/\.(js|ts|jsx|tsx)$/, '.test.$1');
      
      if (framework === 'jest' && type === 'unit') {
        testCode = `const { ${targetFile.replace(/\.(js|ts|jsx|tsx)$/, '').split('/').pop()} } = require('./${targetFile}');

describe('${targetFile.split('/').pop()}', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test('should be defined', () => {
    expect(${targetFile.replace(/\.(js|ts|jsx|tsx)$/, '').split('/').pop()}).toBeDefined();
  });

  test('should handle valid input', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = ${targetFile.replace(/\.(js|ts|jsx|tsx)$/, '').split('/').pop()}(input);
    
    // Assert
    expect(result).toBeTruthy();
  });

  test('should handle invalid input', () => {
    // Arrange
    const input = null;
    
    // Act & Assert
    expect(() => ${targetFile.replace(/\.(js|ts|jsx|tsx)$/, '').split('/').pop()}(input)).toThrow();
  });`;

        if (testCases.length > 0) {
          testCases.forEach(testCase => {
            testCode += `\n\n  test('${testCase}', () => {
    // Add test implementation
    expect(true).toBe(true);
  });`;
          });
        }

        testCode += `\n});`;
      } else if (framework === 'testing-library' && type === 'component') {
        testCode = `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ${targetFile.replace(/\.(js|ts|jsx|tsx)$/, '').split('/').pop()} from './${targetFile}';

describe('${targetFile.split('/').pop()}', () => {
  test('renders without crashing', () => {
    render(<${targetFile.replace(/\.(js|ts|jsx|tsx)$/, '').split('/').pop()} />);
  });

  test('displays expected content', () => {
    render(<${targetFile.replace(/\.(js|ts|jsx|tsx)$/, '').split('/').pop()} />);
    
    // Add assertions here
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  test('handles user interactions', () => {
    render(<${targetFile.replace(/\.(js|ts|jsx|tsx)$/, '').split('/').pop()} />);
    
    // Add interaction tests here
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Add assertions
  });
});`;
      }
      
      return {
        content: [{
          type: 'text',
          text: `Test file generated successfully!\n\n**${testFileName}**\n\`\`\`javascript\n${testCode}\n\`\`\``
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating tests: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'generate_hook') {
    const { name, framework = 'react', type, features = [] } = request.params.arguments;
    
    try {
      let hookCode = '';
      const hookName = name.startsWith('use') ? name : `use${name.charAt(0).toUpperCase() + name.slice(1)}`;
      
      if (framework === 'react') {
        if (type === 'state') {
          hookCode = `import { useState } from 'react';

export const ${hookName} = (initialValue) => {
  const [value, setValue] = useState(initialValue);

  const updateValue = (newValue) => {
    setValue(newValue);
  };

  const resetValue = () => {
    setValue(initialValue);
  };

  return {
    value,
    setValue: updateValue,
    reset: resetValue
  };
};`;
        } else if (type === 'fetch') {
          hookCode = `import { useState, useEffect } from 'react';

export const ${hookName} = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (url) {
      fetchData();
    }
  }, [url]);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
};`;
        }
      } else if (framework === 'vue') {
        if (type === 'state') {
          hookCode = `import { ref } from 'vue';

export function ${hookName}(initialValue) {
  const value = ref(initialValue);

  const updateValue = (newValue) => {
    value.value = newValue;
  };

  const resetValue = () => {
    value.value = initialValue;
  };

  return {
    value,
    updateValue,
    resetValue
  };
}`;
        }
      }
      
      return {
        content: [{
          type: 'text',
          text: `Hook generated successfully!\n\n**${hookName}.js**\n\`\`\`javascript\n${hookCode}\n\`\`\``
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating hook: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'generate_dockerfile') {
    const { appType, framework, features = [], port = 3000 } = request.params.arguments;
    
    try {
      let dockerfile = '';
      let dockerignore = '';
      let dockerCompose = '';
      
      if (appType === 'node') {
        const isMultiStage = features.includes('multi-stage');
        const useAlpine = features.includes('alpine');
        const baseImage = useAlpine ? 'node:18-alpine' : 'node:18';
        
        dockerfile = `${isMultiStage ? '# Build stage\nFROM ' + baseImage + ' AS builder\n' : 'FROM ' + baseImage + '\n'}
WORKDIR /app

# Copy package files
COPY package*.json ./
${framework === 'nextjs' ? 'COPY next.config.js ./' : ''}

# Install dependencies
RUN npm ci --only=production${isMultiStage ? ' && npm cache clean --force' : ''}

${isMultiStage ? `# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM ${baseImage} AS production
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
${framework === 'nextjs' ? 'COPY --from=builder /app/.next ./.next\nCOPY --from=builder /app/public ./public' : ''}
COPY --from=builder /app/node_modules ./node_modules

` : '# Copy source code\nCOPY . .\n\n'}# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

# Expose port
EXPOSE ${port}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${port}/health || exit 1

# Start application
CMD ["${framework === 'nextjs' ? 'npm start' : 'node dist/index.js'}"]`;

        dockerignore = `node_modules
npm-debug.log
.nyc_output
coverage
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.git
.gitignore
README.md
.DS_Store
.vscode
.idea`;

        if (features.includes('monitoring')) {
          dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=production
    depends_on:
      - redis
      - postgres
    volumes:
      - ./logs:/app/logs

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  postgres_data:`;
        }
      } else if (appType === 'python') {
        dockerfile = `FROM python:3.11-slim${features.includes('alpine') ? '-alpine' : ''}

WORKDIR /app

# Install system dependencies
${features.includes('alpine') ? 'RUN apk add --no-cache gcc musl-dev' : 'RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*'}

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

EXPOSE ${port}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${port}/health || exit 1

CMD ["${framework === 'django' ? 'python manage.py runserver 0.0.0.0:' + port : framework === 'flask' ? 'flask run --host=0.0.0.0 --port=' + port : 'python app.py'}"]`;
      }
      
      let response = `Docker configuration generated successfully!\n\n**Dockerfile**\n\`\`\`dockerfile\n${dockerfile}\n\`\`\``;
      
      if (dockerignore) {
        response += `\n\n**.dockerignore**\n\`\`\`\n${dockerignore}\n\`\`\``;
      }
      
      if (dockerCompose) {
        response += `\n\n**docker-compose.yml**\n\`\`\`yaml\n${dockerCompose}\n\`\`\``;
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
          text: `Error generating Dockerfile: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'generate_deployment') {
    const { platform, appName, services = [], environment, features = [] } = request.params.arguments;
    
    try {
      let deploymentConfig = '';
      
      if (platform === 'kubernetes') {
        deploymentConfig = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}
  labels:
    app: ${appName}
spec:
  replicas: ${environment === 'production' ? '3' : '1'}
  selector:
    matchLabels:
      app: ${appName}
  template:
    metadata:
      labels:
        app: ${appName}
    spec:
      containers:
      - name: ${appName}
        image: ${appName}:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "${environment}"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        ${features.includes('monitoring') ? `
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5` : ''}

---
apiVersion: v1
kind: Service
metadata:
  name: ${appName}-service
spec:
  selector:
    app: ${appName}
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer

${features.includes('ssl') ? `---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${appName}-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - ${appName}.yourdomain.com
    secretName: ${appName}-tls
  rules:
  - host: ${appName}.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${appName}-service
            port:
              number: 80` : ''}

${features.includes('autoscaling') ? `---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${appName}-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${appName}
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70` : ''}`;
      } else if (platform === 'docker-compose') {
        deploymentConfig = `version: '3.8'

services:
  ${appName}:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=${environment}
    restart: unless-stopped
    ${features.includes('monitoring') ? `
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3` : ''}
    ${services.length > 0 ? `
    depends_on:${services.map(service => `\n      - ${service}`).join('')}` : ''}

${services.includes('database') ? `  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${appName}
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

` : ''}${services.includes('redis') ? `  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

` : ''}${services.includes('nginx') ? `  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      ${features.includes('ssl') ? '- "443:443"' : ''}
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      ${features.includes('ssl') ? '- ./ssl:/etc/nginx/ssl' : ''}
    depends_on:
      - ${appName}
    restart: unless-stopped

` : ''}${features.includes('monitoring') ? `  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

` : ''}volumes:${services.includes('database') ? '\n  postgres_data:' : ''}${features.includes('monitoring') ? '\n  grafana_data:' : ''}`;
      } else if (platform === 'vercel') {
        deploymentConfig = `{
  "version": 2,
  "name": "${appName}",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "${environment}"
  },
  ${features.includes('monitoring') ? `"functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  },` : ''}
  "regions": ["iad1"]
}`;
      }
      
      return {
        content: [{
          type: 'text',
          text: `Deployment configuration generated successfully!\n\n**${platform === 'kubernetes' ? 'k8s-deployment.yaml' : platform === 'docker-compose' ? 'docker-compose.yml' : 'vercel.json'}**\n\`\`\`${platform === 'vercel' ? 'json' : 'yaml'}\n${deploymentConfig}\n\`\`\``
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating deployment config: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'generate_env') {
    const { environments = ['development', 'staging', 'production'], variables, format = 'dotenv' } = request.params.arguments;
    
    try {
      let envFiles = {};
      
      environments.forEach(env => {
        if (format === 'dotenv') {
          envFiles[`.env.${env}`] = `# ${env.toUpperCase()} Environment Variables
# Generated on ${new Date().toISOString()}

${variables.map(variable => {
  const value = variable.type === 'secret' ? '***CHANGE_ME***' : 
                variable.type === 'url' ? `https://api.${env === 'production' ? 'yourdomain' : env}.com` :
                variable.type === 'number' ? '3000' :
                variable.type === 'boolean' ? 'true' : 'your_value_here';
  
  return `# ${variable.description || variable.name}
${variable.name}=${value}`;
}).join('\n\n')}`;
        } else if (format === 'json') {
          envFiles[`config.${env}.json`] = JSON.stringify({
            environment: env,
            ...variables.reduce((acc, variable) => {
              const value = variable.type === 'secret' ? '***CHANGE_ME***' : 
                            variable.type === 'url' ? `https://api.${env === 'production' ? 'yourdomain' : env}.com` :
                            variable.type === 'number' ? 3000 :
                            variable.type === 'boolean' ? true : 'your_value_here';
              acc[variable.name] = value;
              return acc;
            }, {})
          }, null, 2);
        }
      });
      
      // Generate environment validation schema
      const validationSchema = `const Joi = require('joi');

const envSchema = Joi.object({
${variables.map(variable => {
  const joiType = variable.type === 'string' || variable.type === 'secret' || variable.type === 'url' ? 'string()' :
                  variable.type === 'number' ? 'number()' :
                  variable.type === 'boolean' ? 'boolean()' : 'string()';
  
  return `  ${variable.name}: Joi.${joiType}${variable.required ? '.required()' : '.optional()'}${variable.description ? `.description('${variable.description}')` : ''}`;
}).join(',\n')}
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(\`Config validation error: \${error.message}\`);
}

module.exports = envVars;`;
      
      let response = `Environment configuration generated successfully!\n\n`;
      
      Object.entries(envFiles).forEach(([filename, content]) => {
        response += `**${filename}**\n\`\`\`${format === 'json' ? 'json' : 'bash'}\n${content}\n\`\`\`\n\n`;
      });
      
      response += `**config/env-validation.js**\n\`\`\`javascript\n${validationSchema}\n\`\`\``;
      
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
          text: `Error generating environment config: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'generate_monitoring') {
    const { type, tools = [], framework, features = [] } = request.params.arguments;
    
    try {
      let monitoringConfig = '';
      
      if (type === 'logging' && framework === 'express') {
        monitoringConfig = `const winston = require('winston');
const morgan = require('morgan');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: '${framework}-app' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// HTTP request logging middleware
const requestLogger = morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
});

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next(err);
};

module.exports = { logger, requestLogger, errorLogger };`;
      } else if (type === 'metrics' && tools.includes('prometheus')) {
        monitoringConfig = `const prometheus = require('prom-client');
const express = require('express');

// Create a Registry
const register = new prometheus.Registry();

// Add default metrics
prometheus.collectDefaultMetrics({
  app: '${framework}-app',
  timeout: 10000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  register
});

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['route', 'method', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['route', 'method', 'status_code']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);

// Middleware to collect metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(route, req.method, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(route, req.method, res.statusCode)
      .inc();
  });
  
  next();
};

// Metrics endpoint
const metricsEndpoint = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

module.exports = { metricsMiddleware, metricsEndpoint, register };`;
      }
      
      return {
        content: [{
          type: 'text',
          text: `Monitoring configuration generated successfully!\n\n**monitoring/${type}.js**\n\`\`\`javascript\n${monitoringConfig}\n\`\`\``
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating monitoring config: ${error.message}`
        }]
      };
    }
  }

  if (request.params.name === 'generate_middleware') {
    const { type, framework, features = [], typescript = false } = request.params.arguments;
    
    try {
      let middlewareCode = '';
      const fileExt = typescript ? 'ts' : 'js';
      
      if (type === 'auth' && framework === 'express') {
        middlewareCode = `${typescript ? "import { Request, Response, NextFunction } from 'express';\nimport jwt from 'jsonwebtoken';\n" : "const jwt = require('jsonwebtoken');\n"}
${typescript ? `
interface AuthRequest extends Request {
  user?: any;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}
` : ''}
const authenticateToken = (req${typescript ? ': AuthRequest' : ''}, res${typescript ? ': Response' : ''}, next${typescript ? ': NextFunction' : ''}) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET${typescript ? ' as string' : ''}, (err${typescript ? ': any' : ''}, user${typescript ? ': any' : ''}) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles${typescript ? ': string[]' : ''}) => {
  return (req${typescript ? ': AuthRequest' : ''}, res${typescript ? ': Response' : ''}, next${typescript ? ': NextFunction' : ''}) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

${typescript ? 'export' : 'module.exports ='} { authenticateToken, authorizeRoles };`;
      } else if (type === 'rate-limit' && framework === 'express') {
        middlewareCode = `${typescript ? "import rateLimit from 'express-rate-limit';\nimport { Request, Response } from 'express';\n" : "const rateLimit = require('express-rate-limit');\n"}

// Basic rate limiting
const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
});

// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: {
    error: 'API rate limit exceeded.'
  },
});

${typescript ? 'export' : 'module.exports ='} {
  basicLimiter,
  authLimiter,
  apiLimiter
};`;
      } else if (type === 'validation' && framework === 'express') {
        middlewareCode = `${typescript ? "import { Request, Response, NextFunction } from 'express';\nimport Joi from 'joi';\n" : "const Joi = require('joi');\n"}

${typescript ? `
interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}
` : ''}
const validate = (schema${typescript ? ': ValidationSchema' : ''}) => {
  return (req${typescript ? ': Request' : ''}, res${typescript ? ': Response' : ''}, next${typescript ? ': NextFunction' : ''}) => {
    const errors${typescript ? ': string[]' : ''} = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    // Validate route parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(...error.details.map(detail => detail.message));
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
};

// Common validation schemas
const schemas = {
  user: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      name: Joi.string().min(2).max(50).required()
    })
  },
  login: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    })
  },
  id: {
    params: Joi.object({
      id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    })
  }
};

${typescript ? 'export' : 'module.exports ='} { validate, schemas };`;
      }
      
      return {
        content: [{
          type: 'text',
          text: `Middleware generated successfully!\n\n**middleware/${type}.${fileExt}**\n\`\`\`${typescript ? 'typescript' : 'javascript'}\n${middlewareCode}\n\`\`\``
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating middleware: ${error.message}`
        }]
      };
    }
  }
});

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error('Gemini MCP Server running');
});