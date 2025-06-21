#!/usr/bin/env node

import { program } from 'commander';
import { logger } from './utils/logger.js';
import { validateConfig } from './config.js';
import { toolRegistry } from './tools/registry.js';

program
  .name('gemini-mcp')
  .description('Gemini MCP Server - AI-powered development tools')
  .version('3.0.0');

program
  .command('start')
  .description('Start the MCP server')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-v, --verbose', 'Verbose logging')
  .action(async (options) => {
    try {
      if (options.verbose) {
        process.env.LOG_LEVEL = 'debug';
      }
      
      logger.info('Starting Gemini MCP Server', { version: '3.0.0' });
      
      // Import and start server
      const { GeminiMCPServer } = await import('./server.js');
      const server = new GeminiMCPServer();
      await server.start();
      
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      process.exit(1);
    }
  });

program
  .command('list-tools')
  .description('List available tools')
  .action(() => {
    const tools = toolRegistry.getToolList();
    console.log(`\\n📋 **Available Tools** (${tools.length} total):\\n`);
    
    tools.forEach(tool => {
      console.log(`🔧 **${tool.name}**`);
      console.log(`   ${tool.description}`);
      console.log('');
    });
  });

program
  .command('test')
  .description('Test server configuration')
  .action(async () => {
    try {
      validateConfig();
      logger.info('Configuration valid');
      
      const tools = toolRegistry.getToolList();
      logger.info('Tools loaded successfully', { count: tools.length });
      
      console.log('✅ All tests passed!');
    } catch (error) {
      logger.error('Test failed', { error: error.message });
      process.exit(1);
    }
  });

program
  .command('info')
  .description('Show server information')
  .action(() => {
    console.log(`
🤖 **Gemini MCP Server v3.0.0**

📊 **Stats:**
• Tools: ${toolRegistry.getToolList().length}
• Node.js: ${process.version}
• Platform: ${process.platform}

🔧 **Configuration:**
• API Key: ${process.env.OPENROUTER_API_KEY ? '✅ Set' : '❌ Missing'}
• Log Level: ${process.env.LOG_LEVEL || 'info'}

📚 **Documentation:**
• GitHub: https://github.com/emmron/gemini-mcp
• Issues: https://github.com/emmron/gemini-mcp/issues
    `);
  });

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason: reason.toString() });
  process.exit(1);
});

program.parse();