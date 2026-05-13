#!/usr/bin/env node
/**
 * Wirth-Dawn Generate CLI
 * 
 * Usage:
 *   node scripts/cli/generate.js <command> [options]
 * 
 * Commands:
 *   md-to-csv [quest_id...]  Convert quest MD specs to scenario CSVs
 *   md-to-csv --all          Convert all discoverable quests
 *   skill-map                Generate ENEMY_SKILL_MAP from enemy_skills.csv
 * 
 * Examples:
 *   node scripts/cli/generate.js md-to-csv 7010 7011 7012
 *   node scripts/cli/generate.js md-to-csv --all
 *   node scripts/cli/generate.js skill-map
 */
const fs = require('fs');
const path = require('path');
const mdParser = require('../lib/md-parser');
const csvLib = require('../lib/csv-parser');

const args = process.argv.slice(2);
const command = args[0] || '';

function mdToCSV() {
  const questArgs = args.slice(1);
  const doAll = questArgs.includes('--all');
  const dryRun = questArgs.includes('--dry-run');

  let quests;
  if (doAll) {
    quests = mdParser.discoverQuests();
    console.log('Discovered', quests.length, 'quest MD files');
  } else {
    const ids = questArgs.filter(a => a.match(/^\d+$/));
    if (ids.length === 0) {
      console.log('Usage: generate.js md-to-csv <quest_id...> | --all');
      console.log('Example: generate.js md-to-csv 7010 7011');
      process.exit(1);
    }
    const all = mdParser.discoverQuests();
    quests = all.filter(q => ids.includes(q.questId));
    if (quests.length === 0) {
      console.log('No matching quests found for IDs:', ids.join(', '));
      process.exit(1);
    }
  }

  let success = 0, failed = 0;
  for (const q of quests) {
    try {
      const mdPath = path.join(mdParser.QUEST_DIR, q.md);
      const csvPath = path.join(mdParser.CSV_DIR, q.csv);
      const nodes = mdParser.parseMD(mdPath);
      const csvContent = mdParser.nodesToCSV(nodes);

      if (dryRun) {
        console.log('[DRY] ' + q.questId + ': ' + nodes.length + ' nodes → ' + q.csv);
      } else {
        fs.writeFileSync(csvPath, csvContent, 'utf8');
        console.log('[OK] ' + q.questId + ': ' + nodes.length + ' nodes → ' + q.csv);
      }
      success++;
    } catch (e) {
      console.error('[ERR] ' + q.questId + ': ' + e.message);
      failed++;
    }
  }
  console.log('\nDone: ' + success + ' succeeded, ' + failed + ' failed');
}

function skillMap() {
  const skills = csvLib.getEnemySkills();
  console.log('Generating ENEMY_SKILL_MAP from', skills.length, 'skills...');

  let map = 'export const ENEMY_SKILL_MAP: Record<string, EnemySkillDef> = {\n';
  for (const s of skills) {
    const slug = s.slug || s.skill_slug;
    const name = s.name || s.skill_name || slug;
    const power = s.power || 0;
    const type = s.type || s.skill_type || 'physical';
    const target = s.target || 'single';
    const effect = s.effect || '';
    map += "  '" + slug + "': { name: '" + name + "', power: " + power;
    map += ", type: '" + type + "', target: '" + target + "'";
    if (effect) map += ", effect: '" + effect + "'";
    map += ' },\n';
  }
  map += '};\n';

  const outPath = path.join(__dirname, '..', 'generated_map.txt');
  fs.writeFileSync(outPath, map, 'utf8');
  console.log('Written to', outPath);
}

console.log('Wirth-Dawn Generate CLI');
switch (command) {
  case 'md-to-csv': mdToCSV(); break;
  case 'skill-map': skillMap(); break;
  default:
    console.log('Commands: md-to-csv, skill-map');
    console.log('Use --help with each command for details');
}
