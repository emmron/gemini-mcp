import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';

// License tiers with features and limits
export const LICENSE_TIERS = {
  FREE: {
    name: 'Free',
    maxCallsPerDay: 50,
    maxCallsPerMonth: 1000,
    features: ['ai_chat', 'code_analyze', 'create_project_tasks', 'system_status'],
    restrictions: {
      maxCodeSize: 5000, // characters
      maxResponseTime: 30000, // 30 seconds
      noBusinessTools: true,
      noEnhancedTools: true
    },
    price: 0
  },
  PRO: {
    name: 'Professional',
    maxCallsPerDay: 1000,
    maxCallsPerMonth: 25000,
    features: [
      'ai_chat', 'code_analyze', 'create_project_tasks', 'system_status',
      'generate_component', 'generate_api', 'refactor_suggestions',
      'analyze_codebase', 'debug_analysis',
      // Enhanced tools
      'chat_plus', 'thinkdeep_enhanced', 'planner_pro', 'consensus_advanced',
      'codereview_expert', 'debug_master', 'analyze_intelligence',
      'refactor_genius', 'precommit_guardian', 'secaudit_quantum'
    ],
    restrictions: {
      maxCodeSize: 50000, // characters
      maxResponseTime: 120000, // 2 minutes
      noBusinessTools: false,
      priority: 'normal'
    },
    price: 49 // per month
  },
  ENTERPRISE: {
    name: 'Enterprise',
    maxCallsPerDay: Infinity,
    maxCallsPerMonth: Infinity,
    features: '*', // All features
    restrictions: {
      maxCodeSize: Infinity,
      maxResponseTime: 600000, // 10 minutes
      priority: 'high',
      dedicated: true,
      customModels: true,
      analytics: true,
      teamAccess: true
    },
    price: 499 // per month
  },
  TRIAL: {
    name: 'Trial',
    maxCallsPerDay: 100,
    maxCallsPerMonth: 500,
    features: '*', // All features during trial
    restrictions: {
      maxCodeSize: 20000,
      maxResponseTime: 60000,
      trialDays: 14
    },
    price: 0,
    isTrialOnly: true
  }
};

class LicenseManager {
  constructor() {
    this.licensePath = path.join(process.cwd(), '.license');
    this.usagePath = path.join(process.cwd(), '.usage');
    this.currentLicense = null;
    this.usageData = {
      daily: {},
      monthly: {},
      total: 0
    };
  }

  /**
   * Initialize license manager and load existing license
   */
  async initialize() {
    try {
      // Load license if exists
      await this.loadLicense();

      // Load usage data
      await this.loadUsage();

      // Validate license
      const validation = await this.validateLicense();

      if (!validation.valid) {
        logger.warn('License validation failed', { reason: validation.reason });
        // Fall back to FREE tier
        this.currentLicense = this.createFreeLicense();
      }

      logger.info('License manager initialized', {
        tier: this.currentLicense?.tier || 'FREE',
        valid: validation.valid
      });

      return validation;
    } catch (error) {
      logger.error('License initialization failed', { error: error.message });
      this.currentLicense = this.createFreeLicense();
      return { valid: true, tier: 'FREE' };
    }
  }

  /**
   * Create a free tier license
   */
  createFreeLicense() {
    return {
      tier: 'FREE',
      key: 'FREE-LICENSE',
      issued: new Date().toISOString(),
      expires: null, // Never expires for free tier
      features: LICENSE_TIERS.FREE.features,
      restrictions: LICENSE_TIERS.FREE.restrictions
    };
  }

  /**
   * Generate a license key
   */
  generateLicenseKey(tier, email, expirationMonths = 12) {
    const data = {
      tier,
      email,
      issued: new Date().toISOString(),
      expires: new Date(Date.now() + expirationMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
      id: crypto.randomBytes(16).toString('hex')
    };

    // Create signature
    const signature = this.signLicense(data);

    // Encode license
    const licenseData = Buffer.from(JSON.stringify({ ...data, signature })).toString('base64');

    return `GEMINI-MCP-${tier}-${licenseData}`;
  }

  /**
   * Sign license data
   */
  signLicense(data) {
    const secret = process.env.LICENSE_SECRET || 'gemini-mcp-default-secret-change-in-production';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(data));
    return hmac.digest('hex');
  }

  /**
   * Verify license signature
   */
  verifyLicenseSignature(data, signature) {
    const expectedSignature = this.signLicense(data);
    return signature === expectedSignature;
  }

  /**
   * Parse and validate a license key
   */
  parseLicenseKey(licenseKey) {
    try {
      if (licenseKey === 'FREE-LICENSE') {
        return this.createFreeLicense();
      }

      // Parse license format: GEMINI-MCP-{TIER}-{BASE64_DATA}
      const parts = licenseKey.split('-');
      if (parts[0] !== 'GEMINI' || parts[1] !== 'MCP') {
        throw new Error('Invalid license key format');
      }

      const tier = parts[2];
      const encodedData = parts.slice(3).join('-');

      // Decode license data
      const licenseJson = Buffer.from(encodedData, 'base64').toString('utf-8');
      const license = JSON.parse(licenseJson);

      // Verify signature
      const { signature, ...data } = license;
      if (!this.verifyLicenseSignature(data, signature)) {
        throw new Error('Invalid license signature');
      }

      // Verify tier matches
      if (data.tier !== tier) {
        throw new Error('License tier mismatch');
      }

      return {
        tier: data.tier,
        key: licenseKey,
        email: data.email,
        issued: data.issued,
        expires: data.expires,
        id: data.id,
        features: LICENSE_TIERS[tier].features,
        restrictions: LICENSE_TIERS[tier].restrictions
      };
    } catch (error) {
      logger.error('License parsing failed', { error: error.message });
      throw new Error(`Invalid license key: ${error.message}`);
    }
  }

  /**
   * Activate a license
   */
  async activateLicense(licenseKey) {
    try {
      const license = this.parseLicenseKey(licenseKey);

      // Validate expiration
      if (license.expires && new Date(license.expires) < new Date()) {
        throw new Error('License has expired');
      }

      // Save license
      await fs.writeFile(this.licensePath, JSON.stringify(license, null, 2));
      this.currentLicense = license;

      logger.info('License activated', {
        tier: license.tier,
        expires: license.expires
      });

      return { success: true, license };
    } catch (error) {
      logger.error('License activation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Load license from file
   */
  async loadLicense() {
    try {
      // Check environment variable first
      if (process.env.GEMINI_MCP_LICENSE) {
        const license = this.parseLicenseKey(process.env.GEMINI_MCP_LICENSE);
        this.currentLicense = license;
        return license;
      }

      // Load from file
      const licenseData = await fs.readFile(this.licensePath, 'utf-8');
      this.currentLicense = JSON.parse(licenseData);
      return this.currentLicense;
    } catch (error) {
      // No license file, use FREE tier
      this.currentLicense = this.createFreeLicense();
      return this.currentLicense;
    }
  }

  /**
   * Validate current license
   */
  async validateLicense() {
    if (!this.currentLicense) {
      return { valid: false, reason: 'No license found' };
    }

    // Check expiration
    if (this.currentLicense.expires) {
      const expirationDate = new Date(this.currentLicense.expires);
      if (expirationDate < new Date()) {
        return { valid: false, reason: 'License expired', expiredOn: this.currentLicense.expires };
      }
    }

    // Check trial period
    if (this.currentLicense.tier === 'TRIAL') {
      const issuedDate = new Date(this.currentLicense.issued);
      const trialDays = LICENSE_TIERS.TRIAL.restrictions.trialDays;
      const trialEnd = new Date(issuedDate.getTime() + trialDays * 24 * 60 * 60 * 1000);

      if (new Date() > trialEnd) {
        return { valid: false, reason: 'Trial period expired', trialEnd: trialEnd.toISOString() };
      }
    }

    return { valid: true, tier: this.currentLicense.tier };
  }

  /**
   * Check if a tool is allowed for current license
   */
  isToolAllowed(toolName) {
    if (!this.currentLicense) {
      return false;
    }

    const tierConfig = LICENSE_TIERS[this.currentLicense.tier];

    // Enterprise and Trial have access to all tools
    if (tierConfig.features === '*') {
      return true;
    }

    // Check if tool is in allowed features
    return tierConfig.features.includes(toolName);
  }

  /**
   * Track tool usage
   */
  async trackUsage(toolName) {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    // Initialize counters
    if (!this.usageData.daily[today]) {
      this.usageData.daily[today] = 0;
    }
    if (!this.usageData.monthly[thisMonth]) {
      this.usageData.monthly[thisMonth] = 0;
    }

    // Increment counters
    this.usageData.daily[today]++;
    this.usageData.monthly[thisMonth]++;
    this.usageData.total++;

    // Save usage data (async, don't wait)
    this.saveUsage().catch(err =>
      logger.error('Failed to save usage data', { error: err.message })
    );

    return {
      daily: this.usageData.daily[today],
      monthly: this.usageData.monthly[thisMonth],
      total: this.usageData.total
    };
  }

  /**
   * Check if usage limits are exceeded
   */
  checkUsageLimits() {
    if (!this.currentLicense) {
      return { allowed: false, reason: 'No license' };
    }

    const tierConfig = LICENSE_TIERS[this.currentLicense.tier];
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    const dailyUsage = this.usageData.daily[today] || 0;
    const monthlyUsage = this.usageData.monthly[thisMonth] || 0;

    // Check daily limit
    if (dailyUsage >= tierConfig.maxCallsPerDay) {
      return {
        allowed: false,
        reason: 'Daily limit exceeded',
        limit: tierConfig.maxCallsPerDay,
        used: dailyUsage,
        resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      };
    }

    // Check monthly limit
    if (monthlyUsage >= tierConfig.maxCallsPerMonth) {
      return {
        allowed: false,
        reason: 'Monthly limit exceeded',
        limit: tierConfig.maxCallsPerMonth,
        used: monthlyUsage,
        resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      };
    }

    return {
      allowed: true,
      daily: { used: dailyUsage, limit: tierConfig.maxCallsPerDay },
      monthly: { used: monthlyUsage, limit: tierConfig.maxCallsPerMonth }
    };
  }

  /**
   * Load usage data
   */
  async loadUsage() {
    try {
      const usageData = await fs.readFile(this.usagePath, 'utf-8');
      this.usageData = JSON.parse(usageData);
    } catch (error) {
      // No usage file, start fresh
      this.usageData = { daily: {}, monthly: {}, total: 0 };
    }
  }

  /**
   * Save usage data
   */
  async saveUsage() {
    try {
      await fs.writeFile(this.usagePath, JSON.stringify(this.usageData, null, 2));
    } catch (error) {
      logger.error('Failed to save usage data', { error: error.message });
    }
  }

  /**
   * Get license info
   */
  getLicenseInfo() {
    if (!this.currentLicense) {
      return { tier: 'FREE', status: 'inactive' };
    }

    const tierConfig = LICENSE_TIERS[this.currentLicense.tier];
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    return {
      tier: this.currentLicense.tier,
      tierName: tierConfig.name,
      issued: this.currentLicense.issued,
      expires: this.currentLicense.expires,
      features: this.currentLicense.features,
      restrictions: this.currentLicense.restrictions,
      usage: {
        daily: {
          used: this.usageData.daily[today] || 0,
          limit: tierConfig.maxCallsPerDay
        },
        monthly: {
          used: this.usageData.monthly[thisMonth] || 0,
          limit: tierConfig.maxCallsPerMonth
        },
        total: this.usageData.total
      },
      price: tierConfig.price
    };
  }

  /**
   * Start a trial
   */
  async startTrial(email) {
    try {
      // Generate trial license
      const licenseKey = this.generateLicenseKey('TRIAL', email, 0.5); // 14 days

      // Activate trial
      await this.activateLicense(licenseKey);

      logger.info('Trial started', { email });

      return {
        success: true,
        licenseKey,
        expiresIn: '14 days',
        tier: 'TRIAL'
      };
    } catch (error) {
      logger.error('Trial activation failed', { error: error.message });
      throw error;
    }
  }
}

export const licenseManager = new LicenseManager();
