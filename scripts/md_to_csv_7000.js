const fs = require('fs');
const path = require('path');

const QUESTS = [
    { md: 'quest_7010_heretic.md', csv: '7010_qst_rol_heretic.csv' },
    { md: 'quest_7011_holywater.md', csv: '7011_qst_rol_holywater.csv' },
    { md: 'quest_7012_pilgrim.md', csv: '7012_qst_rol_pilgrim.csv' },
    { md: 'quest_7013_undead.md', csv: '7013_qst_rol_undead.csv' },
    { md: 'quest_7014_tithe.md', csv: '7014_qst_rol_tithe.csv' },
    { md: 'quest_7015_relic.md', csv: '7015_qst_rol_relic.csv' }
];

function processQuest(mdFile, csvFile) {
    const mdPath = path.join(__dirname, '../docs/quest', mdFile);
    const csvPath = path.join(__dirname, '../src/data/csv/scenarios', csvFile);

    if (!fs.existsSync(mdPath)) {
        console.error(`MD file not found: ${mdPath}`);
        return;
    }

    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const content = mdContent.charCodeAt(0) === 0xFEFF ? mdContent.slice(1) : mdContent;

    const lines = content.split('\n');
    const nodes = [];
    let currentNode = null;

    // ============================================================
    // Phase 1: MDファイルからノードをパース
    // ============================================================
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // ノードヘッダの検出: #### `node_id`（type）
        const nodeMatch = line.match(/^#### `([^`]+)`（([^）]+)）/);
        if (nodeMatch) {
            currentNode = {
                id: nodeMatch[1],
                type: nodeMatch[2],
                text: '',
                parsedParams: null,
                choices: []   // choice ノード用の選択肢リスト
            };
            nodes.push(currentNode);
            continue;
        }

        if (!currentNode) continue;

        // テキストブロック (```text ... ```)
        if (line.startsWith('```text')) {
            let textLines = [];
            let j = i + 1;
            while (j < lines.length && !lines[j].startsWith('```')) {
                textLines.push(lines[j].replace('\r', ''));
                j++;
            }
            currentNode.text = textLines.join('\\n').trim();
            i = j;
            continue;
        }

        // 演出パラメータ行
        if (line.startsWith('**演出:**')) {
            const rawParams = line.replace('**演出:**', '').trim();
            const paramParts = rawParams.split(',').map(p => p.trim());
            const paramObj = {};
            
            for (const part of paramParts) {
                const [k, ...v] = part.split(':');
                if (k && v.length) {
                    paramObj[k.trim()] = v.join(':').trim();
                }
            }
            // speaker -> speaker_name 変換
            if (paramObj.speaker) {
                paramObj.speaker_name = paramObj.speaker;
                delete paramObj.speaker;
            }
            currentNode.parsedParams = paramObj;
        }

        // バトルパラメータ: 敵グループID
        if (currentNode.type === 'battle' && line.startsWith('| 敵グループID |')) {
            if (!currentNode.parsedParams) currentNode.parsedParams = {};
            const parts = line.split('|').map(p => p.trim());
            const idMatch = parts[2].match(/\d+/);
            if (idMatch) currentNode.parsedParams.enemy_group_id = parseInt(idMatch[0], 10);
        }
        // バトルパラメータ: 敵表示名
        if (currentNode.type === 'battle' && line.startsWith('| 敵表示名 |')) {
            if (!currentNode.parsedParams) currentNode.parsedParams = {};
            const parts = line.split('|').map(p => p.trim());
            currentNode.parsedParams.enemy_name = parts[2];
        }
        
        // ゲストパラメータ: guest_id
        if (line.startsWith('| guest_id |')) {
            if (!currentNode.parsedParams) currentNode.parsedParams = {};
            const parts = line.split('|').map(p => p.trim());
            currentNode.parsedParams.guest_id = parts[2].replace(/`/g, '');
        }
        // ゲストパラメータ: is_escort_target
        if (line.startsWith('| is_escort_target |')) {
            if (!currentNode.parsedParams) currentNode.parsedParams = {};
            const parts = line.split('|').map(p => p.trim());
            currentNode.parsedParams.is_escort_target = parts[2] === 'true';
        }

        // choice ノードの選択肢テーブル: | 選択肢テキスト | `next_node_id` |
        // ヘッダ行 (| 選択肢 | 次ノード |) はスキップし、区切り行 (|---|---| ) もスキップ
        // データ行のみ取得: | テキスト | `node_id` |
        if (currentNode.type === 'choice' && line.match(/^\|[^|]+\|[^|]+\|$/)) {
            // ヘッダ行と区切り行をスキップ
            if (line.includes('選択肢') || line.includes('---')) continue;
            const parts = line.split('|').map(p => p.trim()).filter(p => p);
            if (parts.length >= 2) {
                const choiceText = parts[0];
                const choiceNext = parts[1].replace(/`/g, '');
                currentNode.choices.push({ text: choiceText, next: choiceNext });
            }
        }

        // **rewards:** 行のパース（endノード等にrewardsパラメータを埋め込む）
        const rewardsMatch = line.match(/^\*\*rewards:\*\*\s*(.+)$/i);
        if (rewardsMatch && currentNode) {
            if (!currentNode.parsedParams) currentNode.parsedParams = {};
            const rewardsStr = rewardsMatch[1];
            const rewards = {};
            for (const token of rewardsStr.split(/[,|]/)) {
                const [key, val] = token.trim().split(':');
                if (!key || !val) continue;
                const k = key.trim().toLowerCase();
                const v = parseInt(val.trim(), 10);
                if (isNaN(v)) continue;
                if (k === 'gold') rewards.gold = v;
                else if (k === 'exp') rewards.exp = v;
                else if (k === 'rep') rewards.reputation = v;
                else if (k === 'order') {
                    if (!rewards.alignment_shift) rewards.alignment_shift = {};
                    rewards.alignment_shift.order = v;
                }
                else if (k === 'evil') {
                    if (!rewards.alignment_shift) rewards.alignment_shift = {};
                    rewards.alignment_shift.evil = v;
                }
                else if (k === 'chaos') {
                    if (!rewards.alignment_shift) rewards.alignment_shift = {};
                    rewards.alignment_shift.chaos = v;
                }
            }
            currentNode.parsedParams.rewards = rewards;
        }
    }

    // ============================================================
    // Phase 2: パース後のパラメータ補完
    // ============================================================
    for (const node of nodes) {
        if (!node.parsedParams) node.parsedParams = {};

        // type の設定: ノードヘッダの type をパラメータに反映
        const headerType = node.type;
        if (headerType === 'end_success') {
            node.parsedParams.type = 'end';
            node.parsedParams.result = 'success';
        } else if (headerType === 'end_failure') {
            node.parsedParams.type = 'end';
            node.parsedParams.result = 'failure';
        } else if (headerType === 'guest_join') {
            node.parsedParams.type = 'guest_join';
        } else if (headerType === 'leave') {
            node.parsedParams.type = 'leave';
        } else if (headerType === 'battle') {
            node.parsedParams.type = 'battle';
        } else if (headerType === 'choice') {
            node.parsedParams.type = 'choice';
        } else {
            // text やその他 → 明示的に type が未設定なら 'text'
            if (!node.parsedParams.type) {
                node.parsedParams.type = 'text';
            }
        }

        // バトルノードのbg/bgm 継承: 演出行がなかった場合、直前ノードから引き継ぐ
        if (node.parsedParams.type === 'battle' && !node.parsedParams.bg) {
            const idx = nodes.indexOf(node);
            for (let j = idx - 1; j >= 0; j--) {
                if (nodes[j].parsedParams?.bg) {
                    node.parsedParams.bg = nodes[j].parsedParams.bg;
                    break;
                }
            }
        }
        if (node.parsedParams.type === 'battle' && !node.parsedParams.bgm) {
            node.parsedParams.bgm = 'bgm_battle'; // バトルのデフォルトBGM
        }
        // 非バトルノードのbg/bgm 継承: 演出行がなかった場合、直前ノードから引き継ぐ
        if (!node.parsedParams.bg) {
            const idx = nodes.indexOf(node);
            for (let j = idx - 1; j >= 0; j--) {
                if (nodes[j].parsedParams?.bg) {
                    node.parsedParams.bg = nodes[j].parsedParams.bg;
                    break;
                }
            }
        }
    }

    // ============================================================
    // Phase 2.5: choice 分岐の合流点を解決
    // ============================================================
    // choice ノードの分岐先から順方向にノードを辿り、合流点を特定する。
    // 例: choice_1 → [見逃す]mercy_1 / [取り立てる]battle_1→extort_1
    //   → 合流点 = house_2_intro
    // mercy_1 の next を house_2_intro に設定する必要がある。
    
    const nodeIndex = {};
    nodes.forEach((n, idx) => { nodeIndex[n.id] = idx; });
    
    // choiceの分岐先ノードセットを構築（分岐内ノードのIDを収集）
    const overrideNextNode = {}; // nodeId → overridden next_node
    
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.type !== 'choice' || node.choices.length < 2) continue;
        
        // 分岐先のノードインデックスを取得し、MD記述順でソート
        const branchStartIndices = node.choices
            .map(c => ({ text: c.text, next: c.next, idx: nodeIndex[c.next] }))
            .filter(c => c.idx !== undefined)
            .sort((a, b) => a.idx - b.idx);
        
        if (branchStartIndices.length < 2) continue;
        
        // 各ブランチの範囲を特定:
        // ブランチN: branchStartIndices[N].idx から branchStartIndices[N+1].idx - 1 まで
        // 最後のブランチ: branchStartIndices[last].idx から次のchoice/end_successまで
        const branches = [];
        for (let b = 0; b < branchStartIndices.length; b++) {
            const startIdx = branchStartIndices[b].idx;
            let endIdx;
            if (b + 1 < branchStartIndices.length) {
                endIdx = branchStartIndices[b + 1].idx - 1;
            } else {
                // 最後のブランチ: バトルがあればそのwin先（sequential next）までを含む
                endIdx = startIdx;
                for (let j = startIdx; j < nodes.length; j++) {
                    const n = nodes[j];
                    if (n.type === 'end_success' || n.type === 'end_failure' || n.type === 'end') break;
                    endIdx = j;
                    // バトルノードの場合、win先（次ノード）もブランチに含める
                    if (n.type === 'battle' && j + 1 < nodes.length) {
                        endIdx = j + 1;
                        break;
                    }
                }
            }
            branches.push({
                startId: branchStartIndices[b].next,
                startIdx,
                endIdx,
                nodeIds: nodes.slice(startIdx, endIdx + 1).map(n => n.id)
            });
        }
        
        // 合流点 = 最後のブランチの末端ノードの次のノード
        const lastBranch = branches[branches.length - 1];
        const mergeIdx = lastBranch.endIdx + 1;
        if (mergeIdx >= nodes.length) continue;
        const mergePoint = nodes[mergeIdx].id;
        
        // 全ブランチのノードID集合
        const allBranchNodes = new Set();
        for (const br of branches) {
            for (const id of br.nodeIds) allBranchNodes.add(id);
        }
        
        // 短いブランチの末端ノードの next を合流点に上書き
        for (const br of branches) {
            const lastNodeId = br.nodeIds[br.nodeIds.length - 1];
            const lastNode = nodes[nodeIndex[lastNodeId]];
            
            // バトルノードやendノードの場合は上書き不要
            if (lastNode.type === 'battle' || lastNode.type === 'end_success' || 
                lastNode.type === 'end_failure' || lastNode.type === 'end') continue;
            
            // sequential next が同じ分岐内のノードなら、合流点に上書き
            const seqNextIdx = nodeIndex[lastNodeId] + 1;
            if (seqNextIdx < nodes.length && allBranchNodes.has(nodes[seqNextIdx].id)) {
                overrideNextNode[lastNodeId] = mergePoint;
            }
        }
    }

    // ============================================================
    // Phase 3: CSV出力（汎用遷移解決）
    // ============================================================
    let csv = 'row_type,node_id,text_label,params,next_node\n';
    
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        let nextNode = '';
        let choices = [];

        // 順番上の次のノード
        const sequentialNext = (i + 1 < nodes.length) ? nodes[i + 1].id : '';
        
        if (node.type === 'battle') {
            // バトルノード: 勝利→順番上の次ノード, 敗北→end_failure
            nextNode = ''; // バトルノード自体は next_node 空
            choices = [
                { text: 'win', next: sequentialNext || 'end_success' },
                { text: 'lose', next: 'end_failure' }
            ];
        } else if (node.type === 'choice') {
            // 選択肢ノード: MD内の選択肢テーブルから分岐先を取得
            nextNode = ''; // 選択肢ノード自体は next_node 空
            if (node.choices.length > 0) {
                choices = node.choices.map(c => ({ text: c.text, next: c.next }));
            } else {
                console.warn(`  [WARN] Choice node "${node.id}" has no choices, falling back to sequential next`);
                nextNode = sequentialNext;
            }
        } else if (node.type === 'end_success' || node.type === 'end_failure' || node.type === 'end') {
            // 終了ノード: 遷移先なし
            nextNode = '';
        } else {
            // テキスト / guest_join / leave / その他: 順番上の次のノードへ遷移
            // ただし、choice分岐の合流点上書きがあればそちらを優先
            nextNode = overrideNextNode[node.id] || sequentialNext;
        }

        // パラメータJSON
        const p = node.parsedParams || {};
        const pStr = JSON.stringify(p);
        const escapedParams = `"${pStr.replace(/"/g, '""')}"`;
        const escapedText = `"${node.text.replace(/"/g, '""')}"`;
        
        csv += `NODE,${node.id},${escapedText},${escapedParams},${nextNode}\n`;
        for (const c of choices) {
            csv += `CHOICE,,${c.text},,${c.next}\n`;
        }
    }

    fs.writeFileSync(csvPath, csv, 'utf8');
    console.log(`Generated ${csvPath} (${nodes.length} nodes)`);
}

for (const q of QUESTS) {
    processQuest(q.md, q.csv);
}
