# Gemini MCP Examples

## Basic Usage

### AI Chat
```bash
# Simple chat
mcp__gemini__ai_chat --message "Explain async/await in JavaScript" --model main

# Code-focused chat
mcp__gemini__ai_chat --message "Help me optimize this React component" --model coding
```

### Code Analysis
```bash
# Analyze code quality
mcp__gemini__code_analyze --code "function example() { return true; }" --language javascript

# Security analysis
mcp__gemini__code_analyze --code "SELECT * FROM users WHERE id = ${userId}" --analysis_type security
```

### Code Generation
```bash
# Generate React component
mcp__gemini__generate_component --name UserCard --framework react --styling tailwind --features "props,state,effects"

# Generate API endpoints
mcp__gemini__generate_api --resource users --methods "GET,POST,PUT,DELETE" --framework express
```

## Advanced Examples

### Project Setup
```javascript
// Create comprehensive project tasks
const tasks = await mcp.call('mcp__gemini__create_project_tasks', {
  requirements: 'Build a task management app with user auth, real-time updates, and mobile support',
  project_type: 'web_app',
  complexity: 'complex'
});
```

### Codebase Analysis
```javascript
// Analyze entire codebase
const analysis = await mcp.call('mcp__gemini__analyze_codebase', {
  path: './src',
  includeAnalysis: true,
  reportType: 'comprehensive'
});
```

### Debug Assistance
```javascript
// Get debugging help
const debug = await mcp.call('mcp__gemini__debug_analysis', {
  error: 'TypeError: Cannot read property \'map\' of undefined',
  code: 'const items = data.items.map(item => item.name);',
  language: 'javascript'
});
```

## Integration Examples

### With Claude Code
```json
{
  "mcpServers": {
    "gemini": {
      "command": "node",
      "args": ["/path/to/gemini-mcp/src/server.js"],
      "env": {
        "OPENROUTER_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Environment Setup
```bash
# Set up environment
cp .env.example .env
echo "OPENROUTER_API_KEY=your-key-here" >> .env

# Test installation
npm test
npm run demo
```

## Best Practices

### Error Handling
```javascript
try {
  const result = await mcp.call('mcp__gemini__ai_chat', {
    message: 'Help me with this code'
  });
} catch (error) {
  console.error('MCP call failed:', error.message);
}
```

### Performance Monitoring
```javascript
// The server automatically tracks performance metrics
// Check logs for performance data
```

### Security
```javascript
// Always validate inputs
const userInput = sanitizeInput(rawInput);
const result = await mcp.call('tool_name', { input: userInput });
```