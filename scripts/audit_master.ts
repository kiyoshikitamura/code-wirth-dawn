import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const CSV_DIR = path.join(__dirname, '../src/data/csv');

function loadCsv(filename: string): any[] {
    let file = fs.readFileSync(path.join(CSV_DIR, filename), 'utf8').trim();
    const lines = file.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
        // very simplified split just taking the first N cols matching headers
        let parts: string[] = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') inQuote = !inQuote;
            else if (line[i] === ',' && !inQuote) {
                parts.push(cur);
                cur = '';
            } else {
                cur += line[i];
            }
        }
        parts.push(cur);

        const obj: any = {};
        headers.forEach((h, i) => {
            obj[h] = parts[i] ? parts[i].trim().replace(/^"|"$/g, '').replace(/""/g, '"') : '';
        });
        return obj;
    });
}

function loadScenarioFiles(): Record<string, any[]> {
    const scenesDir = path.join(CSV_DIR, 'scenarios');
    const files = fs.readdirSync(scenesDir).filter(f => f.endsWith('.csv'));
    const scMap: Record<string, any[]> = {};
    for (const f of files) {
        const text = fs.readFileSync(path.join(scenesDir, f), 'utf8');
        try {
            scMap[f] = loadCsv('scenarios/' + f);
        } catch(e) {
            console.error('Error parsing', f, e);
        }
    }
    return scMap;
}

const items = loadCsv('items.csv');
const enemies = loadCsv('enemies.csv');
const enemyGroups = loadCsv('enemy_groups.csv');
const enemySkills = loadCsv('enemy_skills.csv');
const enemyActions = loadCsv('enemy_actions.csv');
const questsNormal = loadCsv('quests_normal.csv');
const questsSpecial = loadCsv('quests_special.csv');
const npcs = loadCsv('npcs.csv');
const cards = loadCsv('cards.csv');
const scenarios = loadScenarioFiles();

const report = {
    logic: [] as string[],
    security: [] as string[],
    uiux: [] as string[]
};

// 1. Logic Audit: Foreign Keys and Stat Bounds
const itemIds = new Set(items.map(i => i.id));
const enemySlugs = new Set(enemies.map(e => e.slug));
const groupSlugs = new Set(enemyGroups.map(eg => eg.slug));
const skillSlugs = new Set(enemySkills.map(s => s.slug));

// Validate Enemy Actions
enemyActions.forEach(a => {
    if (!enemySlugs.has(a.enemy_slug)) report.logic.push(`Enemy action references unknown enemy: ${a.enemy_slug}`);
    if (!skillSlugs.has(a.skill_slug) && a.skill_slug !== 'skill_attack' && a.skill_slug !== 'skill_heavy_attack') {
        report.logic.push(`Enemy action references unknown skill: ${a.skill_slug}`);
    }
});

// Validate Enemy Groups
enemyGroups.forEach(g => {
    const mems = [g.enemy1_slug, g.enemy2_slug, g.enemy3_slug].filter(s => s);
    mems.forEach(m => {
        if (!enemySlugs.has(m)) report.logic.push(`Group ${g.slug} references unknown enemy: ${m}`);
    });
});

// Validate Scenarios
Object.entries(scenarios).forEach(([file, nodes]) => {
    const hasBattle = nodes.some(n => n.params?.includes('"type":"battle"'));
    nodes.forEach(n => {
        if (!n.text_label) report.uiux.push(`Scenario ${file} node ${n.node_id} has empty text.`);
        
        // Parse params json to check battle enemies
        if (n.params && n.params.includes('{')) {
            try {
               const p = JSON.parse(n.params.replace(/""/g, '"'));
               if (p.type === 'battle' && p.enemy_group_id && !groupSlugs.has(p.enemy_group_id) && !enemySlugs.has(p.enemy_group_id)) {
                   report.logic.push(`Scenario ${file} references unknown enemy/group id: ${p.enemy_group_id}`);
               }
            } catch(e) {}
        }
    });
});

// 2. Security Audit: Economy, Infinity Loops, HP/DEF Bounds
enemies.forEach(e => {
    if (Number(e.hp) > 2000) report.security.push(`Enemy ${e.name} has extremely high HP (${e.hp}), risking 30-turn timeout.`);
    if (Number(e.def) > 30) report.security.push(`Enemy ${e.name} has extremely high DEF (${e.def}), risking zero-damage softlock.`);
});

enemySkills.forEach(s => {
    if (s.type === 'heal' && !s.description.includes('ターン')) {
        report.security.push(`Enemy skill ${s.name} is Heal but might lack cooldown/limits in description.`);
    }
});

[...questsNormal, ...questsSpecial].forEach(q => {
    if (q.rewards_summary && q.rewards_summary.includes('Gold:')) {
        // match Gold:X
        const match = q.rewards_summary.match(/Gold:(\d+)/);
        if (match && Number(match[1]) > 10000) {
            report.security.push(`Quest ${q.slug} has massive gold reward (${match[1]}), exploit risk.`);
        }
    }
    
    // Check missing requirements on high reward quests
    if (q.rewards_summary && q.rewards_summary.includes('Gold:5000') && (!q.requirements || q.requirements.length < 5)) {
        report.security.push(`Quest ${q.slug} gives 5000+ gold but has no strict requirements.`);
    }
});

// 3. UI/UX Audit: Short Descriptions, Texts, Images
[...questsNormal, ...questsSpecial].forEach(q => {
    if (!q._comment) report.uiux.push(`Quest ${q.slug} is missing a short_description (_comment).`);
});

cards.forEach(c => {
    if (!c.name || !c.description) report.uiux.push(`Card ${c.id} missing name or desc.`);
});

console.log("=== MASTER DATA AUDIT REPORT ===");
console.log(JSON.stringify(report, null, 2));
