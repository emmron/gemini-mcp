#!/usr/bin/env node

/**
 * License Key Generator for Gemini MCP
 *
 * Usage:
 *   node scripts/generate-license.js <tier> <email> [months]
 *
 * Examples:
 *   node scripts/generate-license.js PRO user@example.com 12
 *   node scripts/generate-license.js ENTERPRISE company@example.com 12
 *   node scripts/generate-license.js TRIAL test@example.com
 */

import { licenseManager } from '../src/utils/license.js';
import { LICENSE_TIERS } from '../src/utils/license.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node scripts/generate-license.js <tier> <email> [months]');
    console.error('\nAvailable tiers:');
    Object.keys(LICENSE_TIERS).forEach(tier => {
      if (tier !== 'FREE') {
        const config = LICENSE_TIERS[tier];
        console.error(`  ${tier} - $${config.price}/month - ${config.name}`);
      }
    });
    process.exit(1);
  }

  const [tier, email, months = '12'] = args;

  // Validate tier
  if (!LICENSE_TIERS[tier]) {
    console.error(`Error: Invalid tier '${tier}'`);
    console.error('Available tiers:', Object.keys(LICENSE_TIERS).filter(t => t !== 'FREE').join(', '));
    process.exit(1);
  }

  if (tier === 'FREE') {
    console.error('Error: FREE tier does not require a license key');
    process.exit(1);
  }

  // Generate license
  const expirationMonths = tier === 'TRIAL' ? 0.5 : parseInt(months);
  const licenseKey = licenseManager.generateLicenseKey(tier, email, expirationMonths);

  const tierConfig = LICENSE_TIERS[tier];
  const expirationDate = new Date(Date.now() + expirationMonths * 30 * 24 * 60 * 60 * 1000);

  console.log('\n✅ License Key Generated Successfully!\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Tier:        ${tierConfig.name} (${tier})`);
  console.log(`Email:       ${email}`);
  console.log(`Price:       $${tierConfig.price}${tier === 'TRIAL' ? ' (FREE for 14 days)' : '/month'}`);
  console.log(`Expires:     ${expirationDate.toLocaleDateString()} (${expirationMonths} months)`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('License Key:');
  console.log(licenseKey);
  console.log('\n═══════════════════════════════════════════════════════════════\n');

  console.log('📋 Activation Instructions:\n');
  console.log('Option 1: Environment Variable');
  console.log(`  export GEMINI_MCP_LICENSE="${licenseKey}"\n`);

  console.log('Option 2: .env File');
  console.log(`  echo 'GEMINI_MCP_LICENSE="${licenseKey}"' >> .env\n`);

  console.log('Option 3: Programmatic Activation');
  console.log(`  node -e "import('./src/utils/license.js').then(m => m.licenseManager.activateLicense('${licenseKey}'))"\n`);

  console.log('📊 Features Included:\n');

  if (tierConfig.features === '*') {
    console.log('  ✅ ALL 23 Tools (Full Access)');
  } else {
    console.log(`  ✅ ${tierConfig.features.length} Tools`);
    tierConfig.features.slice(0, 5).forEach(feature => {
      console.log(`    - ${feature}`);
    });
    if (tierConfig.features.length > 5) {
      console.log(`    ... and ${tierConfig.features.length - 5} more`);
    }
  }

  console.log(`\n  📞 API Calls: ${tierConfig.maxCallsPerDay}/day, ${tierConfig.maxCallsPerMonth}/month`);

  if (tierConfig.restrictions.priority) {
    console.log(`  ⚡ Priority: ${tierConfig.restrictions.priority.toUpperCase()}`);
  }

  if (tierConfig.restrictions.analytics) {
    console.log('  📊 Advanced Analytics: ✅');
  }

  if (tierConfig.restrictions.teamAccess) {
    console.log('  👥 Team Access: ✅');
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('🔗 Learn More: https://gemini-mcp.com/pricing');
  console.log('📧 Support: support@gemini-mcp.com\n');
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
