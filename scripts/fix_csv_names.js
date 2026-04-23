const fs = require('fs');
const path = require('path');

const fp = path.join(__dirname, '..', 'src', 'data', 'csv', 'quests_special.csv');
let lines = fs.readFileSync(fp, 'utf-8').split('\n');

let changed = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Match main_epXX lines
  const m = line.match(/^(6\d{3}),main_ep(\d+),/);
  if (!m) continue;
  const ep = parseInt(m[2]);
  
  // 1. Replace 公式メインシナリオ -> メインシナリオ第N話 (end of line only)
  if (line.includes('公式メインシナリオ')) {
    lines[i] = line.replace('公式メインシナリオ', 'メインシナリオ第' + ep + '話');
    changed++;
  }
  
  // 2. Replace 帝国軍 -> 王国軍 in client_name column
  if (line.includes(',帝国軍,')) {
    lines[i] = lines[i].replace(',帝国軍,', ',王国軍,');
    changed++;
  }
}

// Also fix _comment column refs: 聖帝国 -> 聖王国
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('聖帝国')) {
    lines[i] = lines[i].replace(/聖帝国/g, '聖王国');
    changed++;
  }
}

fs.writeFileSync(fp, lines.join('\n'), 'utf-8');
console.log('Changes: ' + changed);
console.log('Verification:');
lines.filter(l => l.match(/^6\d{3},main_ep/)).forEach(l => {
  const parts = l.split(',');
  console.log(`  ${parts[0]}: client=${parts[10]}, comment=${parts[11]}`);
});
