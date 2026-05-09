import fs from 'fs';

// Helper to parse CSV properly handling quotes
function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const csvLines = fs.readFileSync('src/data/csv/npcs.csv', 'utf8').trim().split('\n');
const csvData: any = {};
for(let i=1; i<csvLines.length; i++) {
  const row = parseCSVRow(csvLines[i]);
  if(row.length > 0 && row[0]) {
    csvData[row[0]] = row;
  }
}

const md = fs.readFileSync('docs/detail/mercenary_master_specification.md', 'utf8');
const mdLines = md.split('\n');
let out = [];
let inTable = false;

for(let line of mdLines) {
  if(line.startsWith('| ID | Slug')) {
    inTable = true;
    out.push('| ID | Slug | 通り名 | 名前 | Job | Lv | HP | ATK | DEF | 雇用費 | スキル | 台詞 | 背景設定 | ビジュアル(外見) | 特徴・メモ |');
    continue;
  }
  if(line.startsWith('|---|---|')) {
    out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    continue;
  }
  if(inTable && line.startsWith('|')) {
    const cells = line.split('|').map(s => s.trim());
    const id = cells[1];
    if(id && csvData[id]) {
      const csv = csvData[id];
      // csv format: id,slug,epithet,name,job,level,max_hp,atk,def,cover_rate,hire_cost,inject_card_ids,flavor_text,_comment
      const level = csv[5] || '1';
      const hp = csv[6] || '0';
      const atk = csv[7] || '0';
      const def = csv[8] || '0';
      const hire = csv[10] || '0';
      const skills = csv[11] || '-';
      
      const epithet = cells[3];
      const name = cells[4];
      const job = cells[5];
      
      // We must map the rest carefully. Since my previous run corrupted the MD file, 
      // I am assuming the MD file is currently CORRUPTED. I need to run `git checkout` first!
      // I will assume this script will be run ON A CLEAN MD FILE!
      const serif = cells[6];
      const bg = cells[7];
      const visual = cells[8];
      const memo = cells[9];

      const newRow = `| ${id} | ${cells[2]} | ${epithet} | ${name} | ${job} | ${level} | ${hp} | ${atk} | ${def} | ${hire} | ${skills} | ${serif} | ${bg} | ${visual} | ${memo} |`;
      out.push(newRow);
    } else {
      out.push(line);
    }
  } else {
    if(inTable && !line.trim() && !line.startsWith('|')) inTable = false;
    out.push(line);
  }
}

fs.writeFileSync('docs/detail/mercenary_master_specification.md', out.join('\n'));
console.log('Done!');
