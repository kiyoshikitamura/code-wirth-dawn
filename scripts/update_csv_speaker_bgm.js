/**
 * CSV一括更新スクリプト
 * speaker_image_url があるノードに speaker_name を追加
 * 最初のNODEにBGMを追加
 */
const fs = require('fs');
const path = require('path');

const csvDir = path.join(__dirname, '..', 'src', 'data', 'csv', 'scenarios');

// NPC画像→名前マッピング
const SPEAKER_MAP = {
    'npc_guest_gawain': 'ガウェイン',
    'npc_boss_mercenary_king': '傭兵王ヴォルグ',
    'npc_guest_desert_trader': '砂漠の商人',
    'npc_npc_generic': 'ナレーター',
};

// エピソード→BGMマッピング
const EP_BGM = {
    6001: 'bgm_quest_calm',
    6002: 'bgm_quest_calm',
    6003: 'bgm_quest_mystery',
    6004: 'bgm_quest_tense',
    6005: 'bgm_quest_crisis',
    6006: 'bgm_quest_calm',
    6007: 'bgm_quest_mystery',
    6008: 'bgm_quest_tense',
    6009: 'bgm_quest_tense',
    6010: 'bgm_quest_crisis',
    6011: 'bgm_quest_tense',
    6012: 'bgm_quest_crisis',
    6013: 'bgm_quest_tense',
    6014: 'bgm_quest_crisis',
    6015: 'bgm_quest_crisis',
    6016: 'bgm_quest_calm',
    6017: 'bgm_quest_mystery',
    6018: 'bgm_quest_crisis',
    6019: 'bgm_quest_crisis',
    6020: 'bgm_quest_crisis',
};

function getSpeakerName(imageUrl) {
    if (!imageUrl) return null;
    for (const [key, name] of Object.entries(SPEAKER_MAP)) {
        if (imageUrl.includes(key)) return name;
    }
    // 画像ファイル名からフォールバック推定
    const match = imageUrl.match(/npc_(?:guest_)?(\w+)/);
    if (match) {
        const slug = match[1];
        // 基本マッピング
        const extraMap = {
            'gawain': 'ガウェイン',
            'scholar': '学者',
            'merchant': '商人',
            'border_spy': '間者',
            'desert_elder': '砂漠の長老',
            'assassin': '暗殺者',
            'samurai': '侍',
            'escort_target': '護衛対象',
            'guardian': '守護者',
        };
        return extraMap[slug] || null;
    }
    return null;
}

const files = fs.readdirSync(csvDir).filter(f => f.match(/^60\d+.*\.csv$/));

let updated = 0;
for (const file of files) {
    const filePath = path.join(csvDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 既にspeaker_nameがあるならスキップ
    if (content.includes('speaker_name')) {
        console.log(`SKIP: ${file} (already has speaker_name)`);
        continue;
    }
    
    const epNum = parseInt(file.match(/^(\d+)/)[1], 10);
    const bgm = EP_BGM[epNum] || 'bgm_quest_calm';
    
    const lines = content.split('\n');
    const result = [];
    let firstNode = true;
    
    for (const line of lines) {
        if (!line.trim() || line.startsWith('row_type')) {
            result.push(line);
            continue;
        }
        
        let modifiedLine = line;
        
        // speaker_image_url があるノードに speaker_name を追加
        const speakerMatch = line.match(/speaker_image_url[""]*:[""]*([^"""}]+)/);
        if (speakerMatch) {
            const imageUrl = speakerMatch[1];
            const name = getSpeakerName(imageUrl);
            if (name) {
                // JSON params内にspeaker_nameを追加
                modifiedLine = modifiedLine.replace(
                    /""speaker_image_url""/,
                    `""speaker_name"":""${name}"", ""speaker_image_url""`
                );
            }
        }
        
        // 最初のNODEにBGMを追加
        if (firstNode && line.startsWith('NODE,')) {
            if (!modifiedLine.includes('"bgm"') && !modifiedLine.includes('""bgm""')) {
                modifiedLine = modifiedLine.replace(
                    /""type""/,
                    `""bgm"":""${bgm}"", ""type""`
                );
            }
            firstNode = false;
        }
        
        result.push(modifiedLine);
    }
    
    fs.writeFileSync(filePath, result.join('\n'), 'utf-8');
    console.log(`UPDATED: ${file} (bgm=${bgm})`);
    updated++;
}

console.log(`\nDone. Updated ${updated} files.`);
