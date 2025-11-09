import { licenseManager, LICENSE_TIERS } from '../utils/license.js';
import { logger } from '../utils/logger.js';
import { validateString } from '../utils/validation.js';

export const licenseTools = {
  'mcp__gemini__license_info': {
    description: 'Get detailed information about your current license, usage, and features',
    parameters: {
      include_usage: {
        type: 'boolean',
        description: 'Include detailed usage statistics',
        default: true
      }
    },
    handler: async (args) => {
      const { include_usage = true } = args;

      const licenseInfo = licenseManager.getLicenseInfo();
      const validation = await licenseManager.validateLicense();

      let response = `# 📜 License Information

**Current License**: ${licenseInfo.tierName} (${licenseInfo.tier})
**Status**: ${validation.valid ? '✅ Active' : '❌ ' + validation.reason}
**Price**: $${licenseInfo.price}${licenseInfo.price > 0 ? '/month' : ' (FREE)'}

## 📅 License Details
- **Issued**: ${licenseInfo.issued ? new Date(licenseInfo.issued).toLocaleDateString() : 'N/A'}
- **Expires**: ${licenseInfo.expires ? new Date(licenseInfo.expires).toLocaleDateString() : 'Never (FREE tier)'}`;

      if (validation.reason && !validation.valid) {
        response += `\n\n⚠️ **Issue**: ${validation.reason}`;
        if (validation.expiredOn) {
          response += `\n- Expired on: ${new Date(validation.expiredOn).toLocaleDateString()}`;
        }
        response += `\n\n🔗 **Renew License**: https://gemini-mcp.com/renew`;
      }

      if (include_usage) {
        response += `\n\n## 📊 Usage Statistics

**Daily Usage**:
- Used: ${licenseInfo.usage.daily.used}/${licenseInfo.usage.daily.limit === Infinity ? '∞' : licenseInfo.usage.daily.limit}
- Remaining: ${licenseInfo.usage.daily.limit === Infinity ? '∞' : licenseInfo.usage.daily.limit - licenseInfo.usage.daily.used}
- Reset: Tomorrow at midnight UTC

**Monthly Usage**:
- Used: ${licenseInfo.usage.monthly.used}/${licenseInfo.usage.monthly.limit === Infinity ? '∞' : licenseInfo.usage.monthly.limit}
- Remaining: ${licenseInfo.usage.monthly.limit === Infinity ? '∞' : licenseInfo.usage.monthly.limit - licenseInfo.usage.monthly.used}
- Reset: 1st of next month

**Total Lifetime**: ${licenseInfo.usage.total} calls`;
      }

      response += `\n\n## 🛠️ Available Tools`;

      if (Array.isArray(licenseInfo.features)) {
        response += `\n- **Total**: ${licenseInfo.features.length} tools`;
        response += `\n\n**Your Tools**:`;
        licenseInfo.features.forEach((tool, i) => {
          response += `\n${i + 1}. ${tool}`;
        });
      } else {
        response += `\n- **Total**: ALL 23 tools (Full Access) ✨`;
      }

      const tierConfig = LICENSE_TIERS[licenseInfo.tier];

      response += `\n\n## ⚙️ Features & Limits
- **Max Code Size**: ${tierConfig.restrictions.maxCodeSize === Infinity ? 'Unlimited' : `${tierConfig.restrictions.maxCodeSize} characters`}
- **Max Response Time**: ${tierConfig.restrictions.maxResponseTime / 1000} seconds
- **Priority**: ${tierConfig.restrictions.priority || 'Standard'}`;

      if (tierConfig.restrictions.analytics) {
        response += `\n- **Analytics**: ✅ Advanced`;
      }

      if (tierConfig.restrictions.teamAccess) {
        response += `\n- **Team Access**: ✅ Enabled`;
      }

      if (tierConfig.restrictions.customModels) {
        response += `\n- **Custom Models**: ✅ Supported`;
      }

      if (licenseInfo.tier === 'FREE') {
        response += `\n\n## 🚀 Upgrade to Pro or Enterprise

**Why Upgrade?**
- 🔓 Unlock 19-23 advanced tools
- ⚡ Higher API limits (1,000-unlimited/day)
- 🎯 Priority processing
- 💼 Business intelligence tools (Enterprise)
- 📊 Advanced analytics

**Pricing**:
- **Pro**: $49/month - Perfect for professionals
- **Enterprise**: $499/month - Full power for teams

🔗 **Upgrade Now**: https://gemini-mcp.com/pricing
🎁 **Start 14-Day Trial**: https://gemini-mcp.com/trial`;
      }

      return response;
    }
  },

  'mcp__gemini__activate_license': {
    description: 'Activate a license key to unlock premium features',
    parameters: {
      license_key: {
        type: 'string',
        description: 'Your license key from Gemini MCP',
        required: true
      }
    },
    handler: async (args) => {
      const { license_key } = args;
      validateString(license_key, 'license_key', 50, 1000);

      try {
        const result = await licenseManager.activateLicense(license_key);

        const tierConfig = LICENSE_TIERS[result.license.tier];

        return `# ✅ License Activated Successfully!

**Tier**: ${tierConfig.name} (${result.license.tier})
**Expires**: ${result.license.expires ? new Date(result.license.expires).toLocaleDateString() : 'Never'}

## 🎉 Welcome to ${tierConfig.name}!

You now have access to:
${tierConfig.features === '*' ? '- ✅ ALL 23 Tools (Full Access)' : `- ✅ ${tierConfig.features.length} Advanced Tools`}
- 📞 ${tierConfig.maxCallsPerDay === Infinity ? 'Unlimited' : tierConfig.maxCallsPerDay} API calls per day
- 📅 ${tierConfig.maxCallsPerMonth === Infinity ? 'Unlimited' : tierConfig.maxCallsPerMonth} API calls per month
${tierConfig.restrictions.priority ? `- ⚡ ${tierConfig.restrictions.priority.toUpperCase()} priority processing` : ''}
${tierConfig.restrictions.analytics ? '- 📊 Advanced analytics' : ''}
${tierConfig.restrictions.teamAccess ? '- 👥 Team collaboration' : ''}

## 🚀 Next Steps

1. **Verify Tools**: Run \`mcp__gemini__license_info\` to see your new features
2. **Explore**: Try the advanced tools like \`chat_plus\`, \`codereview_expert\`, etc.
3. **Documentation**: Visit https://gemini-mcp.com/docs for guides

**Need Help?** Contact support@gemini-mcp.com

Thank you for choosing Gemini MCP! 🎊`;
      } catch (error) {
        logger.error('License activation failed', { error: error.message });
        return `# ❌ License Activation Failed

**Error**: ${error.message}

## 🔍 Troubleshooting

1. **Check License Key**: Ensure you copied the entire key
2. **Verify Email**: Make sure you received the key from gemini-mcp.com
3. **Check Expiration**: License may have expired

## 📞 Need Help?

- **Support**: support@gemini-mcp.com
- **Purchase**: https://gemini-mcp.com/pricing
- **Documentation**: https://gemini-mcp.com/docs/activation`;
      }
    }
  },

  'mcp__gemini__start_trial': {
    description: 'Start a 14-day free trial with full access to all features',
    parameters: {
      email: {
        type: 'string',
        description: 'Your email address',
        required: true
      }
    },
    handler: async (args) => {
      const { email } = args;
      validateString(email, 'email', 5, 100);

      // Basic email validation
      if (!email.includes('@') || !email.includes('.')) {
        return `# ❌ Invalid Email

Please provide a valid email address to start your trial.

**Example**: user@example.com`;
      }

      try {
        const result = await licenseManager.startTrial(email);

        return `# 🎉 Trial Activated!

**Welcome to your 14-day Gemini MCP Trial!**

## 📧 Trial Details
- **Email**: ${email}
- **Duration**: 14 days
- **Access**: ALL 23 Premium Tools
- **Expires**: ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}

## ✨ What's Included

**All Enhanced Tools (10)**:
- Multi-model AI collaboration
- Advanced code review with risk scoring
- Quantum-grade security auditing
- Deep reasoning and planning
- And more!

**Business Intelligence (4)**:
- Financial impact analysis
- Performance prediction
- Team orchestration
- Quality monitoring

**Unlimited Features**:
- 100 API calls per day
- All 23 tools unlocked
- Priority support

## 🔑 Your Trial License Key

\`\`\`
${result.licenseKey}
\`\`\`

**Already Activated!** Start using premium features immediately.

## 🚀 Next Steps

1. **Explore Tools**: Try \`mcp__gemini__chat_plus\` for advanced AI
2. **Analyze Code**: Run \`mcp__gemini__analyze_codebase\` for insights
3. **Business Intel**: Use \`mcp__gemini__financial_impact\` for ROI analysis

## 💡 Trial Tips

- Trial expires in 14 days
- No credit card required
- Full access to all features
- Convert to paid anytime

## 📞 Questions?

- **Support**: support@gemini-mcp.com
- **Pricing**: https://gemini-mcp.com/pricing
- **Docs**: https://gemini-mcp.com/docs

**Enjoy your trial!** 🎊`;
      } catch (error) {
        logger.error('Trial activation failed', { error: error.message });
        return `# ❌ Trial Activation Failed

**Error**: ${error.message}

## 📞 Get Help

Contact support@gemini-mcp.com or visit https://gemini-mcp.com/trial`;
      }
    }
  },

  'mcp__gemini__check_upgrade': {
    description: 'Check upgrade options and pricing for your current tier',
    parameters: {},
    handler: async () => {
      const licenseInfo = licenseManager.getLicenseInfo();
      const currentTier = licenseInfo.tier;

      let response = `# 🚀 Upgrade Options

**Current Tier**: ${licenseInfo.tierName} (${currentTier})

`;

      if (currentTier === 'FREE' || currentTier === 'TRIAL') {
        response += `## 💼 Professional ($49/month)

**Perfect for professional developers**

**What You Get**:
- ✅ 19 Advanced Tools (vs your ${Array.isArray(licenseInfo.features) ? licenseInfo.features.length : '4'})
- ✅ 1,000 API calls/day (vs your 50-100)
- ✅ 25,000 API calls/month
- ✅ Enhanced AI tools (chat_plus, codereview_expert, etc.)
- ✅ Advanced analysis and debugging
- ✅ Priority support
- ✅ 50KB max code size

**Price**: $49/month
**Save**: 20% with annual billing ($470/year)

🔗 **Upgrade to Pro**: https://gemini-mcp.com/pricing/pro

---

## 🏢 Enterprise ($499/month)

**For teams and organizations**

**Everything in Pro, PLUS**:
- ✅ ALL 23 Tools (including 4 exclusive business tools)
- ✅ UNLIMITED API calls
- ✅ UNLIMITED code size
- ✅ Business intelligence tools:
  - Financial impact analysis
  - Performance prediction
  - Team orchestration
  - Quality monitoring
- ✅ Dedicated support (4h SLA)
- ✅ Team access
- ✅ Custom models
- ✅ Advanced analytics
- ✅ White-label options

**Price**: $499/month
**Save**: Custom pricing for annual contracts

🔗 **Contact Sales**: https://gemini-mcp.com/contact-sales`;
      } else if (currentTier === 'PRO') {
        response += `## 🏢 Upgrade to Enterprise

**Unlock the Full Power**

**Additional Features**:
- ✅ 4 Exclusive Business Tools:
  - Financial Impact Analysis
  - Performance Predictor
  - Team Orchestrator
  - Quality Guardian
- ✅ Unlimited API calls (vs 1,000/day)
- ✅ Unlimited code size (vs 50KB)
- ✅ Dedicated support (4h SLA)
- ✅ Team collaboration
- ✅ Custom AI models
- ✅ Advanced analytics dashboard
- ✅ On-premise deployment option

**Price**: $499/month (save with annual billing)

🔗 **Upgrade to Enterprise**: https://gemini-mcp.com/contact-sales`;
      } else {
        response += `## 🎉 You're on the Highest Tier!

You have access to ALL features and tools. Thank you for being an Enterprise customer!

**Need More?**
- Custom features
- Dedicated infrastructure
- Volume licensing
- Training and onboarding

🔗 **Contact Your Account Manager**: enterprise@gemini-mcp.com`;
      }

      response += `\n\n## 💰 Current Pricing Summary

| Tier | Price | Tools | Daily Calls | Monthly Calls |
|------|-------|-------|-------------|---------------|
| Free | $0 | 4 | 50 | 1,000 |
| Pro | $49/mo | 19 | 1,000 | 25,000 |
| Enterprise | $499/mo | 23 | Unlimited | Unlimited |

## 🎁 Special Offers

- 🎓 **Students**: 50% off Pro (verify .edu email)
- 💼 **Startups**: 3 months free Pro
- 🏢 **Volume**: Custom pricing for 10+ seats
- 📅 **Annual**: Save 20% with yearly billing

🔗 **View All Offers**: https://gemini-mcp.com/offers`;

      return response;
    }
  }
};
