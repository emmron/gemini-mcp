#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { validateConfig } from './config.js';
import { logger } from './utils/logger.js';
import { aiClient } from './ai/client.js';
import { storage } from './storage/storage.js';
import { validateString, sanitizeInput } from './utils/validation.js';
import { toolRegistry } from './tools/registry.js';

class GeminiMCPServer {
  constructor() {
    try {
      validateConfig();
      this.server = new Server(
        { 
          name: 'gemini-mcp', 
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
      
      this.setupHandlers();
      logger.info('Gemini MCP Server initialized');
    } catch (error) {
      logger.error('Server initialization failed', { error: error.message });
      process.exit(1);
    }
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: toolRegistry.getToolList() };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        logger.debug('Tool call received', { name, args });
        
        const result = await toolRegistry.executeTool(name, args);
        
        logger.info('Tool call completed', { name, success: true });
        return { content: [{ type: 'text', text: result }] };
        
      } catch (error) {
        logger.error('Tool call failed', { name, error: error.message });
        return { 
          content: [{ 
            type: 'text', 
            text: `Error: ${error.message}` 
          }],
          isError: true 
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Gemini MCP Server started');
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start server
const server = new GeminiMCPServer();
server.start().catch(error => {
  logger.error('Server startup failed', { error: error.message });
  process.exit(1);
});