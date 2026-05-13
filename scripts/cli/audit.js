#!/usr/bin/env node
/**
 * Wirth-Dawn Unified Audit CLI
 * 
 * Usage:
 *   node scripts/cli/audit.js <command> [options]
 * 
 * Commands:
 *   text-length     Check scenario text node character counts
 *   actions         Check enemy_actions.csv coverage (all enemies have actions)
 *   groups          Check enemy_groups.csv integrity (all referenced groups exist)
 *   assets          Check assets.ts for missing background keys used in scenarios
 *   all             Run all audit checks
 * 
 * Options:
 *   --threshold N          Text length threshold (default: 45, for text-length)
 *   --exclude-prefix P     Exclude scenario files starting with P (repeatable)
 *   --json                 Output JSON instead of console
 *   --verbose              Show all violations
 * 
 * Examples:
 *   node scripts/cli/audit.js text-length --threshold 45 --exclude-prefix 8
 *   node scripts/cli/audit.js actions
 *   node scripts/cli/audit.js all --exclude-prefix 8
 */
const path = require('path');
const csv = require('../lib/csv-parser');
const reporter = require('../lib/reporter');

// Parse CLI args
const args = process.argv.slice(2);
const command = args[0] || 'all';
let threshold = 45;
const excludePrefixes = ['8']; // default: exclude legacy 8xxx
let jsonOutput = false;
let verbose = false;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--threshold' && args[i+1]) { threshold = parseInt(args[i+1]); i++; }
  else if (args[i] === '--exclude-prefix' && args[i+1]) { excludePrefixes.push(args[i+1]); i++; }
  else if (args[i] === '--json') { jsonOutput = true; }
  else if (args[i] === '--verbose') { verbose = true; }
}

const results = {};

// ─── TEXT LENGTH ───
function auditTextLength() {
  const files = csv.getScenarioFiles({ excludePrefixes });
  const skipTypes = new Set(['battle','choice','guest_join','leave','check_delivery',
    'random_branch','reward','hp_damage']);
  let totalText = 0;
  const violations = [];

  for (const f of files) {
    const nodes = csv.parseScenarioCSV(f);
    for (const node of nodes) {
      if (node.rowType !== 'NODE') continue;
      if (!node.textLabel) continue;
      const nodeType = node.parsedParams?.type || 'text';
      if (skipTypes.has(nodeType)) continue;
      totalText++;
      const len = [...node.textLabel].length;
      if (len > threshold) {
        violations.push({
          file: f, node: node.nodeId, type: nodeType, len,
          text: node.textLabel.substring(0, 80)
        });
      }
    }
  }

  const over50 = violations.filter(v => v.len > 50).length;
  const over60 = violations.filter(v => v.len > 60).length;
  const over80 = violations.filter(v => v.len > 80).length;

  results.textLength = {
    threshold, totalText, overThreshold: violations.length,
    over50, over60, over80, violations
  };

  if (!jsonOutput) {
    reporter.printSummary('Text Length (>' + threshold + ' chars)', {
      'Files scanned': files.length,
      'Total text nodes': totalText,
      'Over threshold': violations.length + ' (' + (violations.length/totalText*100).toFixed(1) + '%)',
      'Over 50': over50, 'Over 60': over60, 'Over 80': over80
    });
    violations.sort((a, b) => b.len - a.len);
    const show = verbose ? violations : violations.slice(0, 15);
    reporter.printList('Top violations', show, v =>
      v.len + 'c | ' + v.file.replace('.csv','') + ' | ' + v.node + ' | ' + v.text
    );
    reporter.printGroupedCounts('Per-file', violations, v => v.file);
  }
}

// ─── ACTIONS ───
function auditActions() {
  const enemies = csv.getEnemies();
  const actions = csv.getEnemyActions();
  const actionSlugs = new Set(actions.map(a => a.enemy_slug));
  const missing = enemies.filter(e => !actionSlugs.has(e.slug));

  results.actions = {
    totalEnemies: enemies.length,
    withActions: actionSlugs.size,
    missing: missing.map(e => ({ slug: e.slug, name: e.name, level: e.level }))
  };

  if (!jsonOutput) {
    reporter.printSummary('Enemy Actions Coverage', {
      'Total enemies': enemies.length,
      'With actions': actionSlugs.size,
      'Missing': missing.length
    });
    if (missing.length > 0) {
      reporter.printList('Missing action definitions', missing, e =>
        e.slug + ' (' + e.name + ' Lv' + e.level + ')'
      );
    }
  }
}

// ─── GROUPS ───
function auditGroups() {
  const groups = csv.getEnemyGroups();
  const enemies = csv.getEnemies();
  const enemySlugs = new Set(enemies.map(e => e.slug));
  const issues = [];

  for (const g of groups) {
    const members = (g.members || '').split('|').filter(m => m);
    for (const m of members) {
      if (!enemySlugs.has(m)) {
        issues.push({ groupId: g.id, groupSlug: g.slug, missingMember: m });
      }
    }
  }

  // Check scenario CSVs for referenced group IDs
  const files = csv.getScenarioFiles({ excludePrefixes });
  const groupSlugs = new Set(groups.map(g => g.slug));
  const missingGroupRefs = [];

  for (const f of files) {
    const nodes = csv.parseScenarioCSV(f);
    for (const node of nodes) {
      if (!node.parsedParams) continue;
      const gid = node.parsedParams.enemy_group_id;
      if (gid && !groupSlugs.has(gid)) {
        missingGroupRefs.push({ file: f, node: node.nodeId, groupId: gid });
      }
    }
  }

  results.groups = {
    totalGroups: groups.length,
    memberIssues: issues,
    missingGroupRefs
  };

  if (!jsonOutput) {
    reporter.printSummary('Enemy Groups Integrity', {
      'Total groups': groups.length,
      'Member reference issues': issues.length,
      'Missing group refs in scenarios': missingGroupRefs.length
    });
    if (issues.length > 0) {
      reporter.printList('Member issues', issues, i =>
        i.groupSlug + ' references missing enemy: ' + i.missingMember
      );
    }
    if (missingGroupRefs.length > 0) {
      reporter.printList('Missing group refs', missingGroupRefs, r =>
        r.file + ' | ' + r.node + ' | ' + r.groupId
      );
    }
  }
}

// ─── ASSETS ───
function auditAssets() {
  const files = csv.getScenarioFiles({ excludePrefixes });
  const assetKeys = csv.getAssetKeys();
  const usedBgs = new Set();

  for (const f of files) {
    const nodes = csv.parseScenarioCSV(f);
    for (const node of nodes) {
      if (node.parsedParams?.bg) usedBgs.add(node.parsedParams.bg);
    }
  }

  const missing = [...usedBgs].filter(bg => !assetKeys.has(bg)).sort();

  results.assets = {
    registeredKeys: assetKeys.size,
    usedInScenarios: usedBgs.size,
    missingKeys: missing
  };

  if (!jsonOutput) {
    reporter.printSummary('Background Assets', {
      'Registered in assets.ts': assetKeys.size,
      'Used in scenarios': usedBgs.size,
      'Missing keys': missing.length
    });
    if (missing.length > 0) {
      reporter.printList('Missing BG keys', missing);
    }
  }
}

// ─── MAIN ───
console.log('Wirth-Dawn Audit CLI');
console.log('Command:', command);
console.log('Exclude prefixes:', excludePrefixes.join(', ') || 'none');
console.log('');

switch (command) {
  case 'text-length': auditTextLength(); break;
  case 'actions': auditActions(); break;
  case 'groups': auditGroups(); break;
  case 'assets': auditAssets(); break;
  case 'all':
    auditActions();
    auditGroups();
    auditAssets();
    auditTextLength();
    break;
  default:
    console.log('Unknown command: ' + command);
    console.log('Available: text-length, actions, groups, assets, all');
    process.exit(1);
}

if (jsonOutput) {
  console.log(JSON.stringify(results, null, 2));
}

console.log('\n=== Audit Complete ===');
