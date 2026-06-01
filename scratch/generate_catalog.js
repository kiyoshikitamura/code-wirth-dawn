const fs = require('fs');
const path = require('path');

// Parser function that handles quotes and double quotes inside values
function parseCsvRows(csvText) {
    const rows = [];
    const lines = csvText.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].replace(/\r$/, '');
        if (!line.trim()) continue;
        const fields = [];
        let current = '';
        let inQuotes = false;
        for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (inQuotes) {
                if (ch === '"') {
                    if (j + 1 < line.length && line[j + 1] === '"') {
                        current += '"';
                        j++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    fields.push(current);
                    current = '';
                } else {
                    current += ch;
                }
            }
        }
        fields.push(current);
        rows.push(fields);
    }
    return rows;
}

function getNationName(tagStr) {
    if (!tagStr || tagStr === 'any') return '全国';
    const tags = tagStr.split('|').map(t => t.trim()).filter(Boolean);
    const map = {
        'loc_holy_empire': '聖帝国ローラン',
        'loc_marcund': 'マルカンド',
        'loc_yatoshin': '夜刀神国',
        'loc_haryu': '華龍',
        'any': '全国'
    };
    return tags.map(t => map[t] || t).join(', ');
}

function run() {
    const workspace = 'd:/dev/code-wirth-dawn';
    const itemsPath = path.join(workspace, 'src/data/csv/items.csv');
    const skillsPath = path.join(workspace, 'src/data/csv/skills.csv');
    const cardsPath = path.join(workspace, 'src/data/csv/cards.csv');

    const itemsRows = parseCsvRows(fs.readFileSync(itemsPath, 'utf-8'));
    const skillsRows = parseCsvRows(fs.readFileSync(skillsPath, 'utf-8'));
    const cardsRows = parseCsvRows(fs.readFileSync(cardsPath, 'utf-8'));

    // Parse Cards
    const cards = {};
    const cardHeaders = cardsRows[0].map(h => h.trim());
    const cardCol = {
        id: cardHeaders.indexOf('id'),
        slug: cardHeaders.indexOf('slug'),
        name: cardHeaders.indexOf('name'),
        type: cardHeaders.indexOf('type'),
        ap_cost: cardHeaders.indexOf('ap_cost'),
        cost_type: cardHeaders.indexOf('cost_type'),
        cost_val: cardHeaders.indexOf('cost_val'),
        effect_val: cardHeaders.indexOf('effect_val'),
        target_type: cardHeaders.indexOf('target_type'),
        effect_id: cardHeaders.indexOf('effect_id'),
        description: cardHeaders.indexOf('description')
    };

    for (let i = 1; i < cardsRows.length; i++) {
        const row = cardsRows[i];
        if (row.length < cardHeaders.length) continue;
        const id = parseInt(row[cardCol.id], 10);
        if (isNaN(id)) continue;
        cards[id] = {
            id,
            slug: row[cardCol.slug],
            name: row[cardCol.name],
            type: row[cardCol.type],
            ap_cost: parseInt(row[cardCol.ap_cost], 10) || 0,
            cost_type: row[cardCol.cost_type],
            cost_val: parseInt(row[cardCol.cost_val], 10) || 0,
            effect_val: parseInt(row[cardCol.effect_val], 10) || 0,
            target_type: row[cardCol.target_type],
            effect_id: row[cardCol.effect_id],
            description: row[cardCol.description]
        };
    }

    // Output generation starts
    let md = '# 全アイテム・スキル マスターデータ一覧\n\n';
    md += '検証用に全アイテムとスキルの価格、効果、カテゴリ、出現条件をまとめたカタログです。\n\n';

    // SECTION 1: ITEMS
    md += '## 1. アイテム一覧 (items.csv)\n\n';
    md += 'アイテムは消耗品、装備品（武器・防具・アクセサリー）、交易品、素材、貴重品に分類されます。\n\n';
    md += '| ID | 名前 | カテゴリ | 価格 | 出現国家 | 繁栄度 | 闇市 | 効果・説明 |\n';
    md += '| --- | --- | --- | --- | --- | --- | --- | --- |\n';

    const itemHeaders = itemsRows[0].map(h => h.trim());
    const itemCol = {
        id: itemHeaders.indexOf('id'),
        slug: itemHeaders.indexOf('slug'),
        name: itemHeaders.indexOf('name'),
        type: itemHeaders.indexOf('type'),
        sub_type: itemHeaders.indexOf('sub_type'),
        base_price: itemHeaders.indexOf('base_price'),
        nation_tags: itemHeaders.indexOf('nation_tags'),
        min_prosperity: itemHeaders.indexOf('min_prosperity'),
        is_black_market: itemHeaders.indexOf('is_black_market'),
        effect_data: itemHeaders.indexOf('effect_data')
    };

    for (let i = 1; i < itemsRows.length; i++) {
        const row = itemsRows[i];
        if (row.length < itemHeaders.length) continue;
        const id = row[itemCol.id];
        const name = row[itemCol.name];
        const type = row[itemCol.type];
        const sub_type = row[itemCol.sub_type];
        const base_price = row[itemCol.base_price];
        const nation_tags = row[itemCol.nation_tags];
        const min_prosperity = row[itemCol.min_prosperity];
        const is_black_market = row[itemCol.is_black_market];
        const effect_data_str = row[itemCol.effect_data];

        let displayType = type;
        if (sub_type) {
            displayType += ` (${sub_type})`;
        }

        let effectDesc = '';
        if (effect_data_str) {
            try {
                const eff = JSON.parse(effect_data_str);
                effectDesc = eff.description || eff.desc || '';
                
                // Add structured effects if description is light
                const details = [];
                if (eff.heal) details.push(`HP回復: ${eff.heal}`);
                if (eff.heal_pct) details.push(`HP回復: ${eff.heal_pct * 100}%`);
                if (eff.damage) details.push(`敵ダメージ: ${eff.damage}`);
                if (eff.aoe_damage) details.push(`全体ダメージ: ${eff.aoe_damage}`);
                if (eff.atk_bonus) details.push(`ATK+${eff.atk_bonus}`);
                if (eff.def_bonus) details.push(`DEF+${eff.def_bonus}`);
                if (eff.hp_bonus) details.push(`最大HP+${eff.hp_bonus}`);
                if (eff.remove_effect) details.push(`状態異常解除 (${eff.remove_effect})`);
                if (eff.effect_id) details.push(`付与効果: ${eff.effect_id} (${eff.effect_duration || eff.duration || '?'}T)`);
                if (eff.escape) details.push('戦闘から確実逃走');
                if (eff.escape_chance) details.push(`戦闘逃走率: ${eff.escape_chance * 100}%`);
                if (eff.vit_restore) details.push(`Vitality回復: ${eff.vit_restore}`);

                if (details.length > 0) {
                    effectDesc = `${effectDesc} [効果: ${details.join(', ')}]`.trim();
                }
            } catch (e) {
                effectDesc = effect_data_str;
            }
        }

        const nation = getNationName(nation_tags);
        const blackMarket = is_black_market === 'true' ? '★' : ' ';
        
        md += `| ${id} | ${name} | ${displayType} | ${base_price}G | ${nation} | ${min_prosperity} | ${blackMarket} | ${effectDesc} |\n`;
    }

    md += '\n';

    // SECTION 2: SKILLS
    md += '## 2. スキル一覧 (skills.csv)\n\n';
    md += 'スキルは「スキル教本/巻物」等のアイテムとして購入でき、戦闘中に使用するカードと紐付いています。\n\n';
    md += '| ID | 名前 | デッキコスト | 価格 | 出現国家 | 繁栄度 | 闇市 | AP/コスト | 対象 | 効果・説明 |\n';
    md += '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n';

    const skillHeaders = skillsRows[0].map(h => h.trim());
    const skillCol = {
        id: skillHeaders.indexOf('id'),
        slug: skillHeaders.indexOf('slug'),
        name: skillHeaders.indexOf('name'),
        card_id: skillHeaders.indexOf('card_id'),
        base_price: skillHeaders.indexOf('base_price'),
        deck_cost: skillHeaders.indexOf('deck_cost'),
        nation_tags: skillHeaders.indexOf('nation_tags'),
        min_prosperity: skillHeaders.indexOf('min_prosperity'),
        is_black_market: skillHeaders.indexOf('is_black_market'),
        _comment: skillHeaders.indexOf('_comment')
    };

    for (let i = 1; i < skillsRows.length; i++) {
        const row = skillsRows[i];
        if (row.length < skillHeaders.length) continue;
        const id = row[skillCol.id];
        const name = row[skillCol.name];
        const card_id = parseInt(row[skillCol.card_id], 10);
        const base_price = row[skillCol.base_price];
        const deck_cost = row[skillCol.deck_cost];
        const nation_tags = row[skillCol.nation_tags];
        const min_prosperity = row[skillCol.min_prosperity];
        const is_black_market = row[skillCol.is_black_market];
        const comment = row[skillCol._comment];

        const card = cards[card_id];
        let apCostStr = '-';
        let targetStr = '-';
        let effectDesc = comment || '';

        if (card) {
            apCostStr = `${card.ap_cost} AP`;
            if (card.cost_val > 0) {
                apCostStr += ` / ${card.cost_val} ${card.cost_type === 'vitality' ? 'VIT' : 'MP'}`;
            }
            
            const targetMap = {
                'single_enemy': '敵単体',
                'all_enemies': '敵全体',
                'single_ally': '味方単体',
                'all_allies': '味方全体',
                'self': '自身',
                'random_enemy': '敵ランダム'
            };
            targetStr = targetMap[card.target_type] || card.target_type || '-';
            effectDesc = card.description || comment || '';
        }

        const nation = getNationName(nation_tags);
        const blackMarket = is_black_market === 'true' ? '★' : ' ';

        md += `| ${id} | ${name} | ${deck_cost} | ${base_price}G | ${nation} | ${min_prosperity} | ${blackMarket} | ${apCostStr} | ${targetStr} | ${effectDesc} |\n`;
    }

    // Write to artifact
    const artifactDir = 'C:/Users/scope/.gemini/antigravity/brain/e88b02f4-9035-40d3-9fb3-19e5fb466304';
    const outputPath = path.join(artifactDir, 'all_items_skills_list.md');
    fs.writeFileSync(outputPath, md, 'utf-8');
    console.log(`Generated catalog at: ${outputPath}`);
}

run();
