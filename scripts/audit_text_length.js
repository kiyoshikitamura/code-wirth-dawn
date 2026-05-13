const fs = require('fs');
const path = require('path');
const dir = 'src/data/csv/scenarios';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));

let totalText = 0, over35 = 0, over50 = 0, over80 = 0;
const violations = [];

function parseCSVLine(line) {
  const cols = [];
  let cur = '', inQuote = false;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (c === '"') {
      if (inQuote && j + 1 < line.length && line[j + 1] === '"') {
        cur += '"'; j++; // escaped quote
      } else {
        inQuote = !inQuote;
      }
      continue;
    }
    if (c === ',' && !inQuote) { cols.push(cur); cur = ''; continue; }
    cur += c;
  }
  cols.push(cur);
  return cols;
}

for (const f of files) {
  const csv = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n');
  const lines = csv.split('\n');
  if (!lines[0]) continue;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCSVLine(line);
    const rowType = cols[0] || '';    // NODE, CHOICE, META, etc.
    const nodeId = cols[1] || '';
    const textLabel = cols[2] || '';  // the display text
    const params = cols[3] || '';     // JSON with type, bg, bgm, etc.

    if (rowType !== 'NODE') continue;
    if (!textLabel) continue;

    // Parse type from params JSON
    let nodeType = 'text';
    try {
      const p = JSON.parse(params);
      nodeType = p.type || 'text';
    } catch(e) { /* default to text */ }

    // Skip non-text node types
    if (['battle','choice','guest_join','leave','check_delivery',
         'random_branch','reward','hp_damage'].includes(nodeType)) continue;

    totalText++;
    const len = [...textLabel].length;
    if (len > 35) {
      over35++;
      if (len > 50) over50++;
      if (len > 80) over80++;
      violations.push({
        file: f,
        node: nodeId,
        type: nodeType,
        len,
        text: textLabel.substring(0, 80)
      });
    }
  }
}

console.log('=== Phase 3: Text Length Audit ===');
console.log('Total text nodes:', totalText);
console.log('Over 35 chars:', over35, '(' + (over35/totalText*100).toFixed(1) + '%)');
console.log('Over 50 chars:', over50);
console.log('Over 80 chars:', over80);

console.log('\n=== Top 30 violations (descending by length) ===');
violations.sort((a, b) => b.len - a.len);
violations.slice(0, 30).forEach(v =>
  console.log('  ' + v.len + 'c | ' + v.file.replace('.csv', '') + ' | ' + v.node + ' | ' + v.text)
);

console.log('\n=== Per-file violation count (>35 chars) ===');
const byFile = {};
violations.forEach(v => { byFile[v.file] = (byFile[v.file] || 0) + 1; });
Object.entries(byFile)
  .sort((a, b) => b[1] - a[1])
  .forEach(function(entry) { console.log('  ' + entry[1] + ' violations: ' + entry[0]); });

// Length distribution
console.log('\n=== Length distribution ===');
const ranges = [[36,40],[41,50],[51,60],[61,80],[81,999]];
for (const r of ranges) {
  const count = violations.filter(v => v.len >= r[0] && v.len <= r[1]).length;
  if (count > 0) console.log('  ' + r[0] + '-' + r[1] + ' chars: ' + count);
}

// Write report
fs.writeFileSync('scripts/phase3_text_audit.json', JSON.stringify({
  summary: { totalText, over35, over50, over80 },
  violations
}, null, 2));
console.log('\nReport: scripts/phase3_text_audit.json');
