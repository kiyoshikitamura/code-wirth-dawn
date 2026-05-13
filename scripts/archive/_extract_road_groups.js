// extract_road_groups.js — CSVからenemy_group_id参照を抽出し、MD仕様書と照合
const fs = require('fs');
const path = require('path');

const SCENARIO_DIR = path.join(__dirname, '..', 'src', 'data', 'csv', 'scenarios');
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'quest');

// All missing group IDs from audit
const missingIds = [
  120, 130,
  420,421,422,423,424,425,426,427,428,429,
  430,431,432,433,434,435,
  440,441,442,443,444,445,446,447,448,
  450,451,452,453,
  460,
  9061,9062,9063,9064,9065,9066,9067,
  9111,9112,9113,9114,
];

// Find which CSV files reference each missing group
const csvFiles = fs.readdirSync(SCENARIO_DIR).filter(f => f.endsWith('.csv'));
const groupRefs = {};

for (const f of csvFiles) {
  const csv = fs.readFileSync(path.join(SCENARIO_DIR, f), 'utf8')
    .replace(/\r\n/g, '\n').replace(/""/g, '"');
  
  for (const gid of missingIds) {
    if (csv.includes(`"enemy_group_id":${gid}`) || csv.includes(`"enemy_group_id": ${gid}`)) {
      if (!groupRefs[gid]) groupRefs[gid] = [];
      groupRefs[gid].push(f);
    }
  }
}

// Also look at CSV battle context (the text_label near the battle node)
for (const [gid, files] of Object.entries(groupRefs)) {
  console.log(`\nGROUP ${gid}:`);
  for (const f of files) {
    const csv = fs.readFileSync(path.join(SCENARIO_DIR, f), 'utf8')
      .replace(/\r\n/g, '\n').replace(/""/g, '"');
    const lines = csv.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`"enemy_group_id":${gid}`) || lines[i].includes(`"enemy_group_id": ${gid}`)) {
        // Get the text_label from this line (field 2)
        const parts = lines[i].split(',');
        const nodeId = parts[1] || '';
        const textLabel = parts[2] || '';
        console.log(`  ${f} -> node:${nodeId} text:${textLabel.substring(0,80)}`);
      }
    }
  }
}
