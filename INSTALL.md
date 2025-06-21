# Gemini MCP Server - Context7-Quality Installation

Real-time AI assistance with context awareness for development workflows.

## Quick Start

```bash
npx gemini-mcp
```

## Claude Desktop Configuration

Add to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gemini-mcp": {
      "command": "npx",
      "args": ["gemini-mcp"]
    }
  }
}
```

## Usage

Like Context7, simply use the tools in your prompts:

### Real-Time AI Assistance
```
Use get_gemini_context to ask: "How do I implement JWT authentication in Next.js?"
```

### Project Context Analysis  
```
Use analyze_current_context to understand my current project structure and dependencies
```

## Tools Available

### `get_gemini_context`
- **Purpose:** Real-time AI assistance with current context awareness
- **Parameters:**
  - `query` (required) - Your development question
  - `context_type` - Type of assistance (code, debug, architecture, best_practices, implementation)  
  - `framework` - Current technology stack
  - `include_examples` - Include practical code examples

### `analyze_current_context`
- **Purpose:** Analyze current working directory and provide insights
- **Parameters:**
  - `focus` - What to analyze (structure, dependencies, patterns, issues, improvements)
  - `depth` - Analysis level (quick, detailed, comprehensive)

## Why Gemini MCP?

Like Context7 provides up-to-date documentation, Gemini MCP provides:

✅ **Real-time AI assistance** with current best practices  
✅ **Context-aware responses** based on your actual project  
✅ **Practical examples** that work with your tech stack  
✅ **Smart project analysis** with actionable recommendations  
✅ **Universal compatibility** with all MCP clients  

## API Configuration

Set your OpenRouter API key (optional - has built-in fallback):

```bash
export OPENROUTER_API_KEY="your-key-here"
```

## Compatibility

- ✅ Claude Desktop
- ✅ Cursor  
- ✅ VS Code (with MCP extension)
- ✅ Windsurf
- ✅ Any MCP-compatible client

## Support

- GitHub: https://github.com/emmron/gemini-mcp
- Issues: https://github.com/emmron/gemini-mcp/issues