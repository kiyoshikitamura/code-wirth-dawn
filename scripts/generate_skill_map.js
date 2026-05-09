const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'src', 'data', 'csv', 'enemy_skills.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(l => l.trim() && !l.startsWith('id,'));

let mapCode = `export const ENEMY_SKILL_MAP: Record<string, EnemySkillMaster> = {\n`;

for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 5) continue;
    
    const id = parseInt(parts[0], 10);
    const slug = parts[1];
    const name = parts[2];
    const effect_type = parts[3];
    const value = parseFloat(parts[4]);
    const description = parts.slice(5).join(',').replace(/'/g, "\\'");
    
    mapCode += `  ${slug}: { id: ${id}, slug: '${slug}', name: '${name}', effect_type: '${effect_type}', value: ${value}, description: '${description}' },\n`;
}

mapCode += `  // ─── enemy_actions.csv にあるがスキル定義CSVにない（フォールバック用） ─\n`;
mapCode += `  skill_attack: { id: 9001, slug: 'skill_attack', name: '通常攻撃', effect_type: 'damage', value: 1, description: '基本的な物理攻撃' },\n`;
mapCode += `  skill_heavy_attack: { id: 9002, slug: 'skill_heavy_attack', name: '強攻撃', effect_type: 'damage', value: 1.5, description: '力を込めた攻撃' },\n`;
mapCode += `  skill_poision_attack: { id: 2006, slug: 'skill_poison_attack', name: '毒針', effect_type: 'damage_poison', value: 1, description: '毒を帯びた攻撃' },\n`;
mapCode += `};\n`;

fs.writeFileSync(path.join(__dirname, 'generated_map.txt'), mapCode);
console.log("Map generated!");
