/**
 * Phase 3 Text Length Audit — Wirth-Dawn Scenario CSVs
 * 
 * Usage:
 *   node scripts/audit_text_length.js [--threshold N] [--exclude-prefix 8]
 * 
 * Options:
 *   --threshold N       Character limit (default: 45)
 *   --exclude-prefix P  Exclude files starting with prefix P (can be repeated)
 *   --json              Output machine-readable JSON
 *   --verbose           Show all violations (not just top 30)
 */
const fs = require('fs');
const path = require('path');

// Parse CLI args
const args = process.argv.slice(2);
let threshold = 45;
const excludePrefixes = [];
let jsonOutput = false;
let verbose = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--threshold' && args[i+1]) { threshold = parseInt(args[i+1]); i++; }
  else if (args[i] === '--exclude-prefix' && args[i+1]) { excludePrefixes.push(args[i+1]); i++; }
  else if (args[i] === '--json') { jsonOutput = true; }
  else if (args[i] === '--verbose') { verbose = true; }
}

const dir = path.join(__dirname, '..', 'src', 'data', 'csv', 'scenarios');
const allFiles = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));
const files = allFiles.filter(f => !excludePrefixes.some(p => f.startsWith(p)));

function parseCSVLine(line) {
  const cols = [];
  let cur = '', inQuote = false;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (c === '"') {
      if (inQuote && j + 1 < line.length && line[j + 1] === '"') {
        cur += '"'; j++;
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

let totalText = 0;
const violations = [];
const skipTypes = new Set(['battle','choice','guest_join','leave','check_delivery',
  'random_branch','reward','hp_damage']);

for (const f of files) {
  const csv = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n');
  const lines = csv.split('\n');

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    if (cols[0] !== 'NODE') continue;

    const nodeId = cols[1] || '';
    const textLabel = cols[2] || '';
    const params = cols[3] || '';

    if (!textLabel) continue;

    let nodeType = 'text';
    try { const p = JSON.parse(params); nodeType = p.type || 'text'; } catch(e) {}
    if (skipTypes.has(nodeType)) continue;

    totalText++;
    const len = [...textLabel].length;
    if (len > threshold) {
      violations.push({ file: f, node: nodeId, type: nodeType, len, text: textLabel.substring(0, 80) });
    }
  }
}

const over50 = violations.filter(v => v.len > 50).length;
const over60 = violations.filter(v => v.len > 60).length;
const over80 = violations.filter(v => v.len > 80).length;

if (jsonOutput) {
  console.log(JSON.stringify({
    config: { threshold, excludePrefixes, totalFiles: files.length, excludedFiles: allFiles.length - files.length },
    summary: { totalText, overThreshold: violations.length, over50, over60, over80 },
    violations
  }, null, 2));
} else {
  console.log('=== Text Length Audit ===');
  console.log('Threshold:', threshold, 'chars');
  console.log('Files scanned:', files.length, '(excluded:', allFiles.length - files.length, ')');
  console.log('Total text nodes:', totalText);
  console.log('Over', threshold, 'chars:', violations.length, '(' + (violations.length/totalText*100).toFixed(1) + '%)');
  console.log('Over 50 chars:', over50);
  console.log('Over 60 chars:', over60);
  console.log('Over 80 chars:', over80);

  // Length distribution
  console.log('\n=== Distribution ===');
  const ranges = [[threshold+1,50],[51,60],[61,80],[81,999]];
  for (const r of ranges) {
    const count = violations.filter(v => v.len >= r[0] && v.len <= r[1]).length;
    if (count > 0) console.log('  ' + r[0] + '-' + (r[1]===999?'...':r[1]) + ' chars: ' + count);
  }

  // Top violations
  violations.sort((a, b) => b.len - a.len);
  const show = verbose ? violations : violations.slice(0, 30);
  console.log('\n=== Top violations ===');
  show.forEach(v =>
    console.log('  ' + v.len + 'c | ' + v.file.replace('.csv', '') + ' | ' + v.node + ' | ' + v.text)
  );

  // Per-file
  console.log('\n=== Per-file ===');
  const byFile = {};
  violations.forEach(v => { byFile[v.file] = (byFile[v.file] || 0) + 1; });
  Object.entries(byFile)
    .sort((a, b) => b[1] - a[1])
    .forEach(function(e) { console.log('  ' + e[1] + ': ' + e[0]); });
}
