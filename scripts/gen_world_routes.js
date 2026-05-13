const fs = require('fs');
const path = require('path');
const csvLib = require('./lib/csv-parser');

// Load locations
const locationsCSV = path.join(csvLib.DATA_DIR, 'locations.csv');
const rawLocations = csvLib.parseCSV(locationsCSV);

// Map slugs to names
const locMap = {};
rawLocations.forEach(loc => {
    locMap[loc.slug] = loc.name;
});

// Translation for nations
const nationMap = {
    'Roland': 'ローランド聖王国',
    'Markand': '砂塵の王国マルカンド',
    'Yato': '夜刀神国',
    'Karyu': '華龍神朝',
    'Neutral': '中立'
};

const locations = rawLocations.filter(loc => loc.slug !== 'loc_hub'); // Exclude loc_hub if it has no connections or is special, though let's keep it if we want. Wait, loc_hub has neighbors: "{}". So it's fine.

// Group by nation for better readability
const byNation = {};

locations.forEach(loc => {
    const nation = nationMap[loc.ruling_nation_id] || nationMap[loc.nation_id] || 'その他';
    if (!byNation[nation]) byNation[nation] = [];
    
    let neighbors = {};
    if (loc.neighbors && loc.neighbors !== '{}') {
        try {
            // Replace double double quotes from CSV if needed
            let jsonStr = loc.neighbors.replace(/""/g, '"');
            if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
                jsonStr = jsonStr.substring(1, jsonStr.length - 1);
            }
            neighbors = JSON.parse(jsonStr);
        } catch (e) {
            console.error(`Failed to parse neighbors for ${loc.slug}:`, loc.neighbors);
        }
    }
    
    byNation[nation].push({
        name: loc.name,
        slug: loc.slug,
        type: loc.type,
        neighbors: neighbors
    });
});

let md = '# ワールドマップ 移動ルート・コスト一覧\n\n';
md += '> 自動生成: ' + new Date().toISOString().split('T')[0] + '\n\n';
md += '各拠点間の移動にかかる「日数」と「消費ゴールド」の一覧です。\n\n';

for (const [nation, locs] of Object.entries(byNation)) {
    md += `## ${nation}\n\n`;
    md += '| 出発地 | 到着地 | 移動日数 | 消費ゴールド |\n';
    md += '|:---|:---|:---:|:---:|\n';
    
    for (const loc of locs) {
        const neighborEntries = Object.entries(loc.neighbors);
        if (neighborEntries.length === 0) {
            md += `| **${loc.name}** | (移動不可) | - | - |\n`;
            continue;
        }
        
        neighborEntries.forEach(([targetSlug, data], index) => {
            const targetName = locMap[targetSlug] || targetSlug;
            // Only show the departure name on the first row for cleanliness, or repeat it
            const depName = index === 0 ? `**${loc.name}**` : '';
            md += `| ${depName} | ${targetName} | ${data.days}日 | ${data.gold_cost} G |\n`;
        });
    }
    md += '\n';
}

// Add a consolidated alphabetical table as well
md += '## 全ルート一覧（五十音順・アルファベット順）\n\n';
md += '| 出発地 | 到着地 | 移動日数 | 消費ゴールド |\n';
md += '|:---|:---|:---:|:---:|\n';

const allRoutes = [];
locations.forEach(loc => {
    let neighbors = {};
    if (loc.neighbors && loc.neighbors !== '{}') {
        try {
            let jsonStr = loc.neighbors.replace(/""/g, '"');
            if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
                jsonStr = jsonStr.substring(1, jsonStr.length - 1);
            }
            neighbors = JSON.parse(jsonStr);
        } catch (e) {}
    }
    Object.entries(neighbors).forEach(([targetSlug, data]) => {
        allRoutes.push({
            dep: loc.name,
            arr: locMap[targetSlug] || targetSlug,
            days: data.days,
            gold: data.gold_cost
        });
    });
});

allRoutes.sort((a, b) => a.dep.localeCompare(b.dep, 'ja'));

allRoutes.forEach(route => {
    md += `| ${route.dep} | ${route.arr} | ${route.days}日 | ${route.gold} G |\n`;
});

const outPath = path.join(__dirname, '..', 'docs', 'world_map_routes.md');
fs.writeFileSync(outPath, md, 'utf8');
console.log('Generated:', outPath);
