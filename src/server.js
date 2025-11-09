#!/usr/bin/env node

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { validateConfig } from './config.js';
import { logger } from './utils/logger.js';
import { aiClient } from './ai/client.js';
import { storage } from './storage/storage.js';
import { validateString, sanitizeInput } from './utils/validation.js';
import { toolRegistry } from './tools/registry.js';
import { licenseManager } from './utils/license.js';

class GeminiMCPServer {
  constructor() {
    try {
      validateConfig();
      this.server = new Server(
        {
          name: 'gemini-mcp',
          version: '4.0.0',
          protocolVersion: '2024-11-05'
        },
        {
          capabilities: {
            tools: {},
            logging: {}
          }
        }
      );

      this.licenseInitialized = false;
      this.setupHandlers();
      logger.info('Gemini MCP Server initialized');
    } catch (error) {
      logger.error('Server initialization failed', { error: error.message });
      process.exit(1);
    }
  }

  async initializeLicense() {
    try {
      const validation = await licenseManager.initialize();
      this.licenseInitialized = true;
      logger.info('License initialized', {
        tier: validation.tier || 'FREE',
        valid: validation.valid
      });
      return validation;
    } catch (error) {
      logger.error('License initialization failed', { error: error.message });
      this.licenseInitialized = true; // Continue with FREE tier
    }
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Ensure license is initialized
      if (!this.licenseInitialized) {
        await this.initializeLicense();
      }

      // Return only tools allowed by current license
      const allTools = toolRegistry.getToolList();
      const licenseInfo = licenseManager.getLicenseInfo();

      const allowedTools = allTools.filter(tool => {
        const toolName = tool.name.replace('mcp__gemini__', '');
        return licenseManager.isToolAllowed(toolName);
      });

      logger.debug('Tools filtered by license', {
        total: allTools.length,
        allowed: allowedTools.length,
        tier: licenseInfo.tier
      });

      return { tools: allowedTools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Ensure license is initialized
        if (!this.licenseInitialized) {
          await this.initializeLicense();
        }

        // Validate license
        const validation = await licenseManager.validateLicense();
        if (!validation.valid) {
          throw new Error(`License invalid: ${validation.reason}. Please upgrade or renew your license at https://gemini-mcp.com/pricing`);
        }

        // Check usage limits
        const usageCheck = licenseManager.checkUsageLimits();
        if (!usageCheck.allowed) {
          const upgradeMsg = usageCheck.reason === 'Daily limit exceeded'
            ? `Daily limit of ${usageCheck.limit} calls exceeded. Resets at ${new Date(usageCheck.resetAt).toLocaleString()}.`
            : `Monthly limit of ${usageCheck.limit} calls exceeded. Resets at ${new Date(usageCheck.resetAt).toLocaleString()}.`;

          throw new Error(`${upgradeMsg} Upgrade to Pro or Enterprise at https://gemini-mcp.com/pricing for higher limits.`);
        }

        // Check if tool is allowed
        const toolName = name.replace('mcp__gemini__', '');
        if (!licenseManager.isToolAllowed(toolName)) {
          const licenseInfo = licenseManager.getLicenseInfo();
          throw new Error(`Tool '${name}' not available in ${licenseInfo.tierName} tier. Upgrade to access this feature at https://gemini-mcp.com/pricing`);
        }

        logger.debug('Tool call received', { name, args });

        // Track usage
        const usage = await licenseManager.trackUsage(toolName);

        const result = await toolRegistry.executeTool(name, args);

        logger.info('Tool call completed', { name, success: true, usage });
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
    // Initialize license before starting server
    await this.initializeLicense();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    const licenseInfo = licenseManager.getLicenseInfo();
    logger.info('Gemini MCP Server started', {
      version: '4.0.0',
      license: licenseInfo.tier,
      features: Array.isArray(licenseInfo.features) ? licenseInfo.features.length : 'All'
    });
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