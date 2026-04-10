const fs = require('fs');
const path = require('path');

const dir = 'd:/dev/code-wirth-dawn/docs/quest';
const files = fs.readdirSync(dir).filter(f => f.startsWith('quest_70') && f.endsWith('.md') && f !== 'quest_7001_deliver.md');

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // 1. Metadata -> Add image if not exists
    if (!content.includes('**画像**') && !content.includes('**サムネイル画像**')) {
        content = content.replace(/(\|\s*\*\*出現拠点\*\*.*?\n)/g, match => {
            return match + `| **サムネイル画像** | \`[要定義: クエストボード用のサムネイル (例: /img/quests/${file.replace('.md', '.webp')})]\` |\n\n※BGM、SE、進行中の背景画像などはノードごとに指定します。\n`;
        });
    }

    // 2. Add presentation parameters before Text
    // Negative lookbehind ensures we don't accidentally add it twice if run twice
    const textRegex = /(?<!\*\*演出パラメータ:\*\*\n(?:.*?\n){0,5})\*\*テキスト:\*\*/g;
    content = content.replace(textRegex, `**演出パラメータ:**\n- **BGM**: \`[要定義: 例 bgm_quest_calm]\`\n- **背景画像**: \`[要定義: ノードの背景画像]\`\n- **SE**: \`[要定義 (必要時のみ)]\`\n\n**テキスト:**`);

    // For specific battle nodes that might not have text but just "設定"
    const battleRegex = /(?<!\*\*演出パラメータ:\*\*\n(?:.*?\n){0,5})\| 設定 \| 値 \|/g;
    content = content.replace(battleRegex, `**演出パラメータ:**\n- **BGM**: \`[要定義: 例 bgm_battle_normal]\`\n\n| 設定 | 値 |`);

    // 3. Fix enemy: single to group
    content = content.replace(/enemy:([a-zA-Z0-9_]+)/g, `enemy_group_id:[要定義: $1 が含まれるグループ]`);
    
    // 4. Update the markdown table for battles
    content = content.replace(/\|\s*敵スラッグ\s*\|/g, '| 敵グループ |');

    // 5. Cleanup leftover bgm/se in 拡張メモ
    content = content.replace(/- BGM:.*?\n/g, '');

    fs.writeFileSync(filePath, content, 'utf-8');
}
console.log('Processed ' + files.length + ' files');
