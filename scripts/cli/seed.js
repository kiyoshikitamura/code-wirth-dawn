#!/usr/bin/env node
/**
 * Wirth-Dawn Seed CLI
 * 
 * Calls the Vercel API seed endpoints to sync CSV data with the production DB.
 * 
 * Usage:
 *   node scripts/cli/seed.js <command> [options]
 * 
 * Commands:
 *   enemies         Sync enemies.csv + enemy_actions.csv → DB
 *   groups          Sync enemy_groups.csv → DB
 *   scenarios       Sync scenario CSVs → DB (all or by ID)
 *   all             Run enemies → groups → scenarios
 * 
 * Options:
 *   --base-url URL  Override API base URL (default: https://code-wirth-dawn.vercel.app)
 *   --secret KEY    Override admin secret (default: admin_user)
 *   --id N          Scenario ID to sync (for scenarios command only)
 *   --dry-run       Show what would be called without calling
 * 
 * Examples:
 *   node scripts/cli/seed.js all
 *   node scripts/cli/seed.js scenarios --id 7010
 *   node scripts/cli/seed.js enemies --dry-run
 */

const args = process.argv.slice(2);
const command = args[0] || 'all';

let baseUrl = 'https://code-wirth-dawn.vercel.app';
let secret = 'admin_user';
let scenarioId = null;
let dryRun = false;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--base-url' && args[i+1]) { baseUrl = args[i+1]; i++; }
  else if (args[i] === '--secret' && args[i+1]) { secret = args[i+1]; i++; }
  else if (args[i] === '--id' && args[i+1]) { scenarioId = args[i+1]; i++; }
  else if (args[i] === '--dry-run') { dryRun = true; }
}

const ENDPOINTS = {
  enemies: '/api/debug/seed-enemies',
  groups: '/api/debug/seed-enemy-groups',
  scenarios: '/api/debug/sync-csv-scenarios',
};

async function callEndpoint(name, params = {}) {
  const ep = ENDPOINTS[name];
  if (!ep) { console.error('Unknown endpoint:', name); return null; }

  let url = baseUrl + ep + '?secret=' + secret;
  for (const [k, v] of Object.entries(params)) {
    url += '&' + k + '=' + encodeURIComponent(v);
  }

  if (dryRun) {
    console.log('[DRY] Would call:', url);
    return { success: true, dry: true };
  }

  console.log('[CALL] ' + name + '...');
  try {
    const r = await fetch(url);
    const text = await r.text();
    try {
      const d = JSON.parse(text);
      const total = d.summary?.total || d.total || '?';
      const errors = d.summary?.errors || d.errors || 0;
      console.log('[OK] ' + name + ': success=' + d.success + ' total=' + total + ' errors=' + errors);
      return d;
    } catch (e) {
      // Non-JSON response (likely 404 HTML)
      console.error('[ERR] ' + name + ': Non-JSON response (endpoint may not exist)');
      console.error('  Status:', r.status, r.statusText);
      return null;
    }
  } catch (e) {
    console.error('[ERR] ' + name + ':', e.message);
    return null;
  }
}

async function main() {
  console.log('Wirth-Dawn Seed CLI');
  console.log('Base URL:', baseUrl);
  console.log('Command:', command);
  if (dryRun) console.log('Mode: DRY RUN');
  console.log('');

  switch (command) {
    case 'enemies':
      await callEndpoint('enemies');
      break;
    case 'groups':
      await callEndpoint('groups');
      break;
    case 'scenarios': {
      const params = scenarioId ? { id: scenarioId } : {};
      await callEndpoint('scenarios', params);
      break;
    }
    case 'all':
      await callEndpoint('enemies');
      await callEndpoint('groups');
      // scenarios requires deployed CSVs, call last
      await callEndpoint('scenarios');
      break;
    default:
      console.log('Commands: enemies, groups, scenarios, all');
      console.log('Use --id N with scenarios for a single quest');
  }
}

main();
