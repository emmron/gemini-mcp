# Installation Guide - Gemini MCP Server

## Quick Start

```bash
npx gemini-mcp
```

## Claude Desktop Setup

Add to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gemini-mcp": {
      "command": "npx",
      "args": ["gemini-mcp"],
      "env": {
        "OPENROUTER_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Cursor Setup

Add to your Cursor settings:

```json
{
  "mcp.servers": {
    "gemini-mcp": {
      "command": "npx",
      "args": ["gemini-mcp"]
    }
  }
}
```

## VS Code Setup

Install the MCP extension and add:

```json
{
  "mcp.servers": [
    {
      "name": "gemini-mcp",
      "command": "npx",
      "args": ["gemini-mcp"]
    }
  ]
}
```

## API Key Configuration

Set your OpenRouter API key:

```bash
export OPENROUTER_API_KEY="your-key-here"
```

Or it will use the built-in fallback key.

## Available Tools

✅ **ask_gemini** - Real-time Gemini AI assistance
✅ **create_task** - Task management
✅ **list_tasks** - View all tasks  
✅ **update_task** - Modify tasks
✅ **delete_task** - Remove tasks
✅ **analyze_codebase** - Comprehensive code analysis
✅ **generate_component** - React/Vue/Angular components
✅ **scaffold_project** - Project templates
✅ **optimize_code** - Performance optimization
✅ **generate_styles** - CSS/SCSS generation
✅ **generate_api** - REST API endpoints
✅ **generate_schema** - Database schemas
✅ **generate_tests** - Unit/integration tests
✅ **generate_hook** - React hooks
✅ **generate_dockerfile** - Container configuration
✅ **generate_deployment** - K8s/Docker deployment
✅ **generate_env** - Environment configuration
✅ **generate_monitoring** - Observability setup
✅ **generate_middleware** - Express/Fastify middleware

## Troubleshooting

- Ensure Node.js 18+ is installed
- Check your MCP client supports the latest protocol
- Verify API key permissions
- Use `npm run test` to validate installation