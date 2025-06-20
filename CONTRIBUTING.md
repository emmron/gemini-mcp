# Contributing to Gemini MCP

🎉 Thank you for your interest in contributing to Gemini MCP! This project thrives on community contributions and we welcome developers of all skill levels.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Adding New Tools](#-adding-new-tools)
- [Testing Guidelines](#-testing-guidelines)
- [Documentation](#-documentation)
- [Pull Request Process](#-pull-request-process)
- [Release Process](#-release-process)

## 🤝 Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/). Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming environment for all contributors.

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **Git**
- **Claude Code** (for testing)
- **OpenRouter API Key** (for AI features)

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/gemini-mcp.git
   cd gemini-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenRouter API key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Test with Claude Code**
   ```bash
   claude add mcp gemini-dev node ./src/server.js
   ```

## 🔄 Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical production fixes

### Workflow Steps

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(analysis): add AI-powered risk assessment
fix(api): resolve memory leak in code scanning
docs(readme): update installation instructions
test(tools): add unit tests for component generator
```

## 🛠️ Adding New Tools

### Tool Structure

Each MCP tool consists of two parts:

1. **Tool Definition** (in `ListToolsRequestSchema` handler)
2. **Tool Implementation** (in `CallToolRequestSchema` handler)

### Step-by-Step Guide

#### 1. Define the Tool Schema

Add to the tools array in `ListToolsRequestSchema`:

```javascript
{
  name: 'your_tool_name',
  description: 'Clear description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { 
        type: 'string', 
        description: 'Parameter description' 
      },
      param2: { 
        type: 'array',
        items: { type: 'string' },
        default: [],
        description: 'Array parameter description'
      }
    },
    required: ['param1']
  }
}
```

#### 2. Implement Tool Logic

Add to the `CallToolRequestSchema` handler:

```javascript
if (request.params.name === 'your_tool_name') {
  const { param1, param2 = [] } = request.params.arguments;
  
  try {
    // Implement your tool logic here
    const result = await yourToolFunction(param1, param2);
    
    return {
      content: [{
        type: 'text',
        text: result
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
```

#### 3. Tool Implementation Best Practices

- **Error Handling**: Always wrap in try-catch
- **Validation**: Validate inputs before processing
- **Documentation**: Include JSDoc comments
- **Performance**: Consider async operations and timeouts
- **Security**: Sanitize inputs and outputs

#### 4. Example: Simple Tool Implementation

```javascript
// Tool definition
{
  name: 'count_lines',
  description: 'Count lines in a file',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: { 
        type: 'string', 
        description: 'Path to file to analyze' 
      }
    },
    required: ['filePath']
  }
}

// Tool implementation
if (request.params.name === 'count_lines') {
  const { filePath } = request.params.arguments;
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lineCount = content.split('\n').length;
    
    return {
      content: [{
        type: 'text',
        text: `File ${filePath} has ${lineCount} lines`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error reading file: ${error.message}`
      }]
    };
  }
}
```

## 🧪 Testing Guidelines

### Test Structure

```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for tool workflows
├── fixtures/       # Test data and mock files
└── helpers/        # Test utilities and helpers
```

### Writing Tests

1. **Unit Tests** - Test individual functions
   ```javascript
   describe('analyzeDependencies', () => {
     it('should detect vulnerabilities', async () => {
       const result = await analyzeDependencies('./fixtures/package.json');
       expect(result.vulnerabilities).toBeDefined();
     });
   });
   ```

2. **Integration Tests** - Test complete tool workflows
   ```javascript
   describe('analyze_codebase tool', () => {
     it('should return analysis for valid project', async () => {
       const request = {
         params: {
           name: 'analyze_codebase',
           arguments: { path: './fixtures/sample-project' }
         }
       };
       const result = await handleToolRequest(request);
       expect(result.content[0].text).toContain('Analysis completed');
     });
   });
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/analysis.test.js

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📖 Documentation

### Documentation Standards

- **README**: Keep main README up-to-date with new features
- **JSDoc**: Document all functions with parameters and return values
- **Examples**: Provide usage examples for new tools
- **API Docs**: Update tool documentation in README

### JSDoc Example

```javascript
/**
 * Analyzes code complexity and quality metrics
 * @param {string} filePath - Path to the file to analyze
 * @param {Object} options - Analysis options
 * @param {boolean} options.includeMetrics - Include detailed metrics
 * @returns {Promise<Object>} Analysis results with quality scores
 * @throws {Error} When file cannot be read or analyzed
 */
async function analyzeCodeFile(filePath, options = {}) {
  // Implementation
}
```

### Adding Tool Documentation

When adding a new tool, update the README.md with:

1. **Tool table entry**
2. **Usage example**
3. **Parameter documentation**
4. **Output format description**

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm test`)
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] No sensitive data in commits

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Documentation
- [ ] README updated
- [ ] JSDoc comments added
- [ ] Examples provided
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests
2. **Code Review**: Maintainer reviews code quality
3. **Testing**: Manual testing of new features
4. **Documentation**: Review of documentation updates
5. **Approval**: Two maintainer approvals required
6. **Merge**: Squash and merge to main

## 📦 Release Process

### Version Numbering

Following [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update Version**
   ```bash
   npm version patch|minor|major
   ```

2. **Update Changelog**
   - Add new version section
   - Document all changes
   - Include migration notes

3. **Create Release**
   - Tag the release
   - Generate release notes
   - Publish to npm (if applicable)

## 🏗️ Architecture Guidelines

### Code Organization

- **Single Responsibility**: Each function has one clear purpose
- **Modularity**: Break complex logic into smaller functions
- **Error Handling**: Consistent error handling patterns
- **Performance**: Consider async operations and memory usage

### Design Patterns

- **Factory Pattern**: For creating different types of generators
- **Strategy Pattern**: For different analysis algorithms
- **Observer Pattern**: For event-driven updates
- **Command Pattern**: For tool execution

## 💡 Feature Ideas

Looking for contribution ideas? Here are some areas we'd love help with:

### High Priority
- [ ] **Real-time Analysis**: File watcher for continuous analysis
- [ ] **Visual Dashboard**: Web-based analytics interface
- [ ] **Custom Rules**: User-defined analysis patterns
- [ ] **Performance Optimization**: Faster analysis algorithms

### Medium Priority
- [ ] **IDE Integration**: VS Code extension
- [ ] **CI/CD Integration**: GitHub Actions integration
- [ ] **Team Features**: Multi-user collaboration
- [ ] **Plugin System**: External tool integration

### Low Priority
- [ ] **Mobile Support**: React Native tools
- [ ] **Cloud Integration**: AWS/GCP deployment tools
- [ ] **Database Tools**: Schema migration generators
- [ ] **Security Tools**: Advanced vulnerability scanning

## 🆘 Getting Help

- **Discord**: [Join our Discord server](https://discord.gg/gemini-mcp)
- **Discussions**: [GitHub Discussions](https://github.com/emmron/gemini-mcp/discussions)
- **Issues**: [Report bugs or request features](https://github.com/emmron/gemini-mcp/issues)
- **Email**: maintainers@gemini-mcp.dev

## 🙏 Recognition

Contributors are recognized in:
- **README**: Contributors section
- **Changelog**: Credit for specific contributions
- **Releases**: Release notes mention contributors
- **Hall of Fame**: Top contributors highlighted

Thank you for contributing to Gemini MCP! 🚀