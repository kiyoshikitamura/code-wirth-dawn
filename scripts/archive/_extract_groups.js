// extract_battle_groups.js — MD仕様書からバトルグループ構成を抽出
const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs', 'quest');
const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));

// Target quest IDs that have missing groups
const targetIds = [
  // Marcund 7020-7025
  7020,7021,7022,7023,7024,7025,
  // Yato 7030-7035
  7030,7031,7032,7033,7034,7035,
  // Haryu 7040-7045
  7040,7041,7042,7043,7044,7045,
  // T1 rep
  5102,5103,
  // T2 rep
  5111,5112,5113,5114,
  // T3 rep
  5201,5202,5203,5204,5205,5206,5207,
  // Legend
  6107,
];

for (const id of targetIds) {
  const mdFile = files.find(f => f.startsWith(`quest_${id}`));
  if (!mdFile) { console.log(`${id}: MD NOT FOUND`); continue; }
  
  const md = fs.readFileSync(path.join(DOCS_DIR, mdFile), 'utf8');
  
  // Look for battle/enemy group references in tables
  // Pattern: | group_id | slug | members |
  const groupPattern = /(\d{3,4})\s*\|\s*([\w_]+)\s*\|\s*(enemy_[\w|]+|boss_[\w|]+)/g;
  let match;
  const groups = [];
  while ((match = groupPattern.exec(md)) !== null) {
    groups.push({ id: match[1], slug: match[2], members: match[3] });
  }
  
  // Also look for: enemy_group_id: NNN patterns
  const idPattern = /enemy_group_id.*?(\d{3,4})/g;
  const refIds = [];
  while ((match = idPattern.exec(md)) !== null) {
    refIds.push(match[1]);
  }
  
  // Look for battle table rows with format like:
  // | battle_xxx | ... | NNN | enemy_xxx|enemy_xxx |
  const tablePattern = /\|\s*\d{3,4}\s*\|\s*[\w_]+\s*\|\s*[\w_|]+\s*/g;
  const tableRows = [];
  while ((match = tablePattern.exec(md)) !== null) {
    tableRows.push(match[0].trim());
  }
  
  if (groups.length > 0 || refIds.length > 0) {
    console.log(`\n=== ${id} (${mdFile}) ===`);
    groups.forEach(g => console.log(`  GROUP: ${g.id} | ${g.slug} | ${g.members}`));
    if (refIds.length > 0) console.log(`  REF_IDS: ${refIds.join(', ')}`);
  }
}
