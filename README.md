# Gemini MCP for Claude Code

A Model Context Protocol (MCP) server that integrates Gemini AI models with Claude Code.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set your OpenRouter API key as an environment variable:
```bash
export OPENROUTER_API_KEY="your-api-key-here"
```

## Usage with Claude Code

### Method 1: Direct Addition
Add this MCP server to Claude Code:
```bash
claude add mcp gemini node /home/emmet/geminimcp/src/server.js
```

### Method 2: Configuration File
Use the provided configuration file:
```bash
claude config set mcp.servers.gemini.command node
claude config set mcp.servers.gemini.args '["/home/emmet/geminimcp/src/server.js"]'
claude config set mcp.servers.gemini.env.OPENROUTER_API_KEY "your-key-here"
```

## Available Tools

- `ask_gemini`: Ask Gemini AI a question
  - `question` (required): The question to ask
  - `model` (optional): `google/gemini-flash-1.5` or `google/gemini-pro-1.5`

## Example

Once configured, the tool appears as `mcp__gemini__ask_gemini` in Claude Code.