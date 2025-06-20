# 🤖 Gemini MCP - Advanced Development Tools

<div align="center">

![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18%2B-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)
![AI Powered](https://img.shields.io/badge/AI-Powered-purple.svg)

**A comprehensive Model Context Protocol (MCP) server that supercharges Claude Code with AI-powered development tools, advanced codebase analysis, and intelligent code generation.**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Tools](#-available-tools) • [Examples](#-examples) • [Contributing](#-contributing)

</div>

## 🌟 Features

### 🤖 **AI Integration**
- **Gemini AI Chat**: Direct integration with Google's Gemini models
- **Smart Code Analysis**: AI-powered insights for code quality and architecture
- **Intelligent Recommendations**: Context-aware suggestions for improvements

### 🔍 **Advanced Codebase Analysis**
- **Comprehensive Code Scanning**: Multi-language support (JS, TS, Python, Java, C++, etc.)
- **Quality Metrics**: Cyclomatic complexity, maintainability index, technical debt analysis
- **Security Assessment**: Vulnerability detection, hardcoded secrets scanning
- **Performance Analysis**: Bottleneck identification and optimization suggestions
- **Project Health Scoring**: Overall project assessment with actionable insights

### 📦 **Dependency Management**
- **License Compliance**: Automated license compatibility checking
- **Security Auditing**: Vulnerability scanning with severity assessment
- **Bundle Analysis**: Size impact and optimization recommendations
- **Update Tracking**: Outdated package detection with update urgency

### 🏗️ **Code Generation & Scaffolding**
- **Component Generation**: React, Vue, Angular, Svelte components
- **Project Scaffolding**: Full-stack project templates
- **API Generation**: REST endpoints with database integration
- **Test Generation**: Automated test file creation
- **Docker & Deployment**: Containerization and deployment configs

### 📊 **Visualization & Insights**
- **Complexity Heatmaps**: Visual representation of code complexity
- **Architecture Mapping**: Dependency graphs and file relationships
- **Test Coverage Analysis**: Comprehensive coverage reporting
- **Risk Assessment**: AI-powered risk evaluation and mitigation

## 🚀 Installation

### Prerequisites
- **Node.js 18+**
- **Claude Code** (latest version)
- **OpenRouter API Key** (for Gemini AI integration)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/emmron/gemini-mcp.git
   cd gemini-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   # Option 1: Environment variable
   export OPENROUTER_API_KEY="your-openrouter-api-key"
   
   # Option 2: Create .env file
   echo "OPENROUTER_API_KEY=your-openrouter-api-key" > .env
   ```

4. **Add to Claude Code**
   ```bash
   # Method 1: Direct addition
   claude add mcp gemini node /path/to/gemini-mcp/src/server.js
   
   # Method 2: Configuration
   claude config set mcp.servers.gemini.command node
   claude config set mcp.servers.gemini.args '["/path/to/gemini-mcp/src/server.js"]'
   claude config set mcp.servers.gemini.env.OPENROUTER_API_KEY "your-key-here"
   ```

## 💡 Usage

Once installed, all tools become available in Claude Code with the `mcp__gemini__` prefix:

```bash
# Analyze your codebase
mcp__gemini__analyze_codebase --path ./src --includeAnalysis true

# Generate a React component
mcp__gemini__generate_component --name UserProfile --framework react --features state,props

# Ask Gemini AI
mcp__gemini__ask_gemini --question "How can I optimize this React component?"
```

## 🛠️ Available Tools

### 🤖 **AI & Intelligence**
| Tool | Description | Key Features |
|------|-------------|--------------|
| `ask_gemini` | Chat with Gemini AI | Multi-model support, context-aware responses |
| `analyze_codebase` | Comprehensive code analysis | AI insights, quality metrics, security scanning |

### 📋 **Task Management**
| Tool | Description | Key Features |
|------|-------------|--------------|
| `create_task` | Create development tasks | Priority levels, status tracking |
| `list_tasks` | View and filter tasks | Status filtering, detailed information |
| `update_task` | Modify existing tasks | Status updates, priority changes |
| `delete_task` | Remove tasks | Clean task management |

### 🎨 **Frontend Development**
| Tool | Description | Supported Frameworks |
|------|-------------|---------------------|
| `generate_component` | Create UI components | React, Vue, Angular, Svelte |
| `generate_styles` | Generate CSS/SCSS | CSS, SCSS, Styled-components, Tailwind |
| `generate_hook` | Create hooks/composables | React hooks, Vue composables |
| `scaffold_project` | Full project setup | React, Vue, Next.js, Nuxt.js |

### 🔧 **Backend Development**
| Tool | Description | Supported Technologies |
|------|-------------|----------------------|
| `generate_api` | REST API endpoints | Express, Fastify, NestJS, Koa |
| `generate_schema` | Database schemas | MongoDB, PostgreSQL, Prisma |
| `generate_middleware` | Server middleware | Auth, CORS, validation, security |

### 🧪 **Testing & Quality**
| Tool | Description | Supported Frameworks |
|------|-------------|---------------------|
| `generate_tests` | Test file generation | Jest, Vitest, Cypress, Playwright |
| `optimize_code` | Code optimization | Performance, security, readability |

### 🐳 **DevOps & Deployment**
| Tool | Description | Supported Platforms |
|------|-------------|-------------------|
| `generate_dockerfile` | Container configuration | Multi-stage builds, Alpine, security |
| `generate_deployment` | Deployment configs | Kubernetes, Docker Compose, Cloud |
| `generate_env` | Environment management | Multi-env setup, secret management |
| `generate_monitoring` | Observability setup | Prometheus, Grafana, logging |

## 📖 Examples

### 🔍 **Comprehensive Codebase Analysis**
```bash
# Full analysis with AI insights
mcp__gemini__analyze_codebase \
  --path ./my-project \
  --includeAnalysis true \
  --maxDepth 5
```

**Sample Output:**
```markdown
# 🔍 Advanced Codebase Analysis: my-project

## 📊 Executive Summary
- **Project Health**: 87/100 (Grade: B)
- **Total Files**: 156 files (2.3 MB)
- **Code Quality**: 82.4/100
- **Dependencies**: 34 production, 28 dev
- **Security Issues**: 2 vulnerabilities found

## 🤖 AI-Powered Insights
### Risk Assessment: MEDIUM
- High Risk: 3 files
- Medium Risk: 12 files
- Key Risk Factors: Security vulnerabilities, High complexity code

### 💳 Technical Debt Analysis
- **Complexity** (high): 8 files with high cyclomatic complexity
  - Estimated cost: 16 hours

### 🎯 AI Recommendations
1. **Optimize bundle size** (high priority)
   - Bundle size of 2.1MB is above recommended threshold
   - Actions: Implement code splitting, Use tree shaking
```

### 🎨 **Generate React Component**
```bash
# Create a modern React component with TypeScript
mcp__gemini__generate_component \
  --name UserDashboard \
  --framework react \
  --type functional \
  --features state,effects,props \
  --styling styled-components
```

### 🔧 **Generate REST API**
```bash
# Create Express API with MongoDB integration
mcp__gemini__generate_api \
  --framework express \
  --resource users \
  --methods GET,POST,PUT,DELETE \
  --features auth,validation,pagination \
  --database mongodb
```

### 🐳 **Generate Docker Configuration**
```bash
# Multi-stage Docker setup for Node.js
mcp__gemini__generate_dockerfile \
  --appType node \
  --framework express \
  --features multi-stage,alpine,nginx \
  --port 3000
```

## 📊 Analysis Capabilities

### **Code Quality Metrics**
- **Cyclomatic Complexity**: Function and file-level complexity analysis
- **Maintainability Index**: Code maintainability scoring (0-100)
- **Technical Debt**: Quantified technical debt with cost estimation
- **Code Duplication**: Duplicate code detection and impact analysis

### **Security Analysis**
- **Vulnerability Scanning**: Known CVE detection in dependencies
- **Secret Detection**: Hardcoded credentials and API keys
- **Security Patterns**: SQL injection, XSS, CSRF risk assessment
- **License Compliance**: Automated license compatibility checking

### **Performance Insights**
- **Bundle Analysis**: Size impact and optimization opportunities
- **Memory Leaks**: Event listener and timer leak detection
- **Optimization Patterns**: Framework-specific performance recommendations
- **Big O Analysis**: Algorithm complexity assessment

### **Architecture Assessment**
- **Pattern Detection**: Design pattern recognition (Factory, Observer, etc.)
- **Anti-Pattern Identification**: God objects, deep nesting detection
- **Dependency Analysis**: Import/export relationship mapping
- **Modularity Scoring**: Coupling and cohesion measurement

## 🏗️ Architecture

```
gemini-mcp/
├── src/
│   └── server.js              # Main MCP server implementation
├── tasks.json                 # Task management storage
├── package.json               # Dependencies and scripts
├── README.md                  # This file
├── CHANGELOG.md              # Version history
├── CONTRIBUTING.md           # Contribution guidelines
└── LICENSE                   # GPL-3.0 license
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Setup**
```bash
# Fork and clone the repository
git clone https://github.com/yourusername/gemini-mcp.git
cd gemini-mcp

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

### **Adding New Tools**
1. Add tool definition to `ListToolsRequestSchema` handler
2. Implement tool logic in `CallToolRequestSchema` handler
3. Add comprehensive documentation and examples
4. Include unit tests for the new functionality

## 📋 Roadmap

- [ ] **Visual Dashboard**: Web-based analytics dashboard
- [ ] **Real-time Analysis**: File watcher for continuous analysis
- [ ] **Team Collaboration**: Multi-user insights and sharing
- [ ] **Custom Rules**: User-defined analysis patterns
- [ ] **IDE Integration**: VS Code and JetBrains extensions
- [ ] **CI/CD Integration**: GitHub Actions and pipeline integration

## 📜 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter** for Gemini AI API access
- **Anthropic** for Claude Code and MCP framework
- **Google** for Gemini AI models
- **Open Source Community** for inspiration and tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/emmron/gemini-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/emmron/gemini-mcp/discussions)
- **Documentation**: [Wiki](https://github.com/emmron/gemini-mcp/wiki)

---

<div align="center">

**Made with ❤️ for the development community**

[⭐ Star this repo](https://github.com/emmron/gemini-mcp) • [🐛 Report Bug](https://github.com/emmron/gemini-mcp/issues) • [💡 Request Feature](https://github.com/emmron/gemini-mcp/issues)

</div>