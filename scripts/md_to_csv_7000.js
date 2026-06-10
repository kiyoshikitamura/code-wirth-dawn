const fs = require('fs');
const path = require('path');

const QUESTS = [
    { md: 'quest_7001_deliver.md', csv: '7001_qst_gen_deliver.csv' },
    { md: 'quest_7002_escort.md', csv: '7002_qst_gen_escort.csv' },
    { md: 'quest_7003_scavenge.md', csv: '7003_qst_gen_scavenge.csv' },
    { md: 'quest_7004_riot.md', csv: '7004_qst_gen_riot.csv' },
    { md: 'quest_7005_bear.md', csv: '7005_qst_gen_bear.csv' },
    { md: 'quest_7006_smuggle.md', csv: '7006_qst_gen_smuggle.csv' },
    { md: 'quest_7007_rat.md', csv: '7007_qst_gen_rat.csv' },
    { md: 'quest_7008_mercy.md', csv: '7008_qst_gen_mercy.csv' },
    { md: 'quest_7010_heretic.md', csv: '7010_qst_rol_heretic.csv' },
    { md: 'quest_7011_holywater.md', csv: '7011_qst_rol_holywater.csv' },
    { md: 'quest_7012_pilgrim.md', csv: '7012_qst_rol_pilgrim.csv' },
    { md: 'quest_7013_undead.md', csv: '7013_qst_rol_undead.csv' },
    { md: 'quest_7014_tithe.md', csv: '7014_qst_rol_tithe.csv' },
    { md: 'quest_7015_relic.md', csv: '7015_qst_rol_relic.csv' },
    // マルカンドクエスト
    { md: 'quest_7020_caravan.md', csv: '7020_qst_mar_caravan.csv' },
    { md: 'quest_7021_scorpion.md', csv: '7021_qst_mar_scorpion.csv' },
    { md: 'quest_7022_debt.md', csv: '7022_qst_mar_debt.csv' },
    { md: 'quest_7023_sandworm.md', csv: '7023_qst_mar_sandworm.csv' },
    { md: 'quest_7024_auction.md', csv: '7024_qst_mar_auction.csv' },
    { md: 'quest_7025_bribe.md', csv: '7025_qst_mar_bribe.csv' },
    // 夜刀クエスト
    { md: 'quest_7030_yokai.md', csv: '7030_qst_yat_yokai.csv' },
    { md: 'quest_7031_ninja.md', csv: '7031_qst_yat_ninja.csv' },
    { md: 'quest_7032_shrine.md', csv: '7032_qst_yat_shrine.csv' },
    { md: 'quest_7033_ronin.md', csv: '7033_qst_yat_ronin.csv' },
    { md: 'quest_7034_shogun.md', csv: '7034_qst_yat_shogun.csv' },
    { md: 'quest_7035_mansion.md', csv: '7035_qst_yat_mansion.csv' },
    // 華龍クエスト
    { md: 'quest_7040_jiangshi.md', csv: '7040_qst_har_jiangshi.csv' },
    { md: 'quest_7041_herb.md', csv: '7041_qst_har_herb.csv' },
    { md: 'quest_7042_rebel.md', csv: '7042_qst_har_rebel.csv' },
    { md: 'quest_7043_official.md', csv: '7043_qst_har_official.csv' },
    { md: 'quest_7044_pirate.md', csv: '7044_qst_har_pirate.csv' },
    { md: 'quest_7045_foxwed.md', csv: '7045_qst_har_foxwed.csv' },
    // 伝説級ボス
    { md: 'quest_6105_baphomet.md', csv: '6105_qst_legend_baphomet.csv' },
    { md: 'quest_6106_angel.md', csv: '6106_qst_legend_angel.csv' },
    { md: 'quest_6107_dragon.md', csv: '6107_qst_legend_dragon.csv' },
    { md: 'quest_6108_kirin.md', csv: '6108_qst_legend_kirin.csv' },
    { md: 'quest_6109_golem.md', csv: '6109_qst_legend_golem.csv' },
    { md: 'quest_6110_kraken.md', csv: '6110_qst_legend_kraken.csv' },
    { md: 'quest_6111_minotaur.md', csv: '6111_qst_legend_minotaur.csv' },
    // 名声連動 Tier 1
    { md: 'quest_5101_graverobber.md', csv: '5101_qst_rep_graverobber.csv' },
    { md: 'quest_5102_scorpion_hunt.md', csv: '5102_qst_rep_scorpion_hunt.csv' },
    { md: 'quest_5103_toll_bandit.md', csv: '5103_qst_rep_toll_bandit.csv' },
    { md: 'quest_5104_river_god.md', csv: '5104_qst_rep_river_god.csv' },
    // 名声連動ボス
    { md: 'quest_5201_crusader.md', csv: '5201_qst_rep_crusader.csv' },
    { md: 'quest_5202_sand_king.md', csv: '5202_qst_rep_sand_king.csv' },
    { md: 'quest_5203_oni_general.md', csv: '5203_qst_rep_oni_general.csv' },
    { md: 'quest_5204_jade_serpent.md', csv: '5204_qst_rep_jade_serpent.csv' },
    { md: 'quest_5205_heretic_sage.md', csv: '5205_qst_rep_heretic_sage.csv' },
    { md: 'quest_5206_war_djinn.md', csv: '5206_qst_rep_war_djinn.csv' },
    { md: 'quest_5207_nine_tails.md', csv: '5207_qst_rep_nine_tails.csv' },
    // メインエピソード (Phase 7)
    { md: 'quest_6101_spot_roland.md', csv: '6101_qst_spot_roland.csv' },
    { md: 'quest_6102_spot_yato.md', csv: '6102_qst_spot_yato.csv' },
    { md: 'quest_6103_spot_karyu.md', csv: '6103_qst_spot_karyu.csv' },
    { md: 'quest_6104_spot_markand.md', csv: '6104_qst_spot_markand.csv' },
    { md: 'quest_6001_main_ep01.md', csv: '6001_qst_main_ep01.csv' },
    { md: 'quest_6002_main_ep02.md', csv: '6002_qst_main_ep02.csv' },
    { md: 'quest_6003_main_ep03.md', csv: '6003_qst_main_ep03.csv' },
    { md: 'quest_6004_main_ep04.md', csv: '6004_qst_main_ep04.csv' },
    { md: 'quest_6005_main_ep05.md', csv: '6005_qst_main_ep05.csv' },
    { md: 'quest_6006_main_ep06.md', csv: '6006_qst_main_ep06.csv' },
    { md: 'quest_6007_main_ep07.md', csv: '6007_qst_main_ep07.csv' },
    // メインエピソード (Phase 8)
    { md: 'quest_6008_main_ep08.md', csv: '6008_qst_main_ep08.csv' },
    { md: 'quest_6009_main_ep09.md', csv: '6009_qst_main_ep09.csv' },
    { md: 'quest_6010_main_ep10.md', csv: '6010_qst_main_ep10.csv' },
    { md: 'quest_6011_main_ep11.md', csv: '6011_qst_main_ep11.csv' },
    { md: 'quest_6012_main_ep12.md', csv: '6012_qst_main_ep12.csv' },
    { md: 'quest_6013_main_ep13.md', csv: '6013_qst_main_ep13.csv' },
    { md: 'quest_6014_main_ep14.md', csv: '6014_qst_main_ep14.csv' },
    { md: 'quest_6015_main_ep15.md', csv: '6015_qst_main_ep15.csv' },
    { md: 'quest_6016_main_ep16.md', csv: '6016_qst_main_ep16.csv' },
    { md: 'quest_6017_main_ep17.md', csv: '6017_qst_main_ep17.csv' },
    { md: 'quest_6018_main_ep18.md', csv: '6018_qst_main_ep18.csv' },
    { md: 'quest_6019_main_ep19.md', csv: '6019_qst_main_ep19.csv' },
    { md: 'quest_6020_main_ep20.md', csv: '6020_qst_main_ep20.csv' },
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
        const line = lines[i].replace('\r', '');

        // ノードヘッダの検出: #### `node_id`（type）
        const nodeMatch = line.match(/^#### `([^`]+)`（([^）]+)）/);
        if (nodeMatch) {
            currentNode = {
                id: nodeMatch[1],
                type: nodeMatch[2],
                text: '',
                parsedParams: null,
                choices: [],   // choice ノード用の選択肢リスト
                explicitNext: null,     // **パラメータ:** で指定された明示的な next
                explicitFallback: null,  // **パラメータ:** で指定された明示的な fallback
                explicitFail: null,      // **パラメータ:** で指定された明示的な fail (バトル敗北先)
                explicitItemId: null,    // reward/check_delivery 用 item_id
                explicitQuantity: null,  // check_delivery 用 quantity
                explicitProb: null,      // random_branch 用 prob
                explicitPercent: null,   // hp_damage 用 percent
                overrideNextNode: null,  // **次ノード:** で指定されたループ等の遷移先
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

        // **パラメータ:** 行のパース（新ノードタイプ対応）
        const paramLineMatch = line.match(/^\*\*パラメータ:\*\*\s*(.+)$/);
        if (paramLineMatch && currentNode) {
            const rawStr = paramLineMatch[1];
            // key: value のペアをパース（カンマ区切り）
            const pairs = rawStr.split(',').map(p => p.trim());
            for (const pair of pairs) {
                const colonIdx = pair.indexOf(':');
                if (colonIdx < 0) continue;
                const k = pair.substring(0, colonIdx).trim().toLowerCase();
                const v = pair.substring(colonIdx + 1).trim().replace(/`/g, '');
                if (k === 'next') currentNode.explicitNext = v;
                else if (k === 'fallback') currentNode.explicitFallback = v;
                else if (k === 'fail') currentNode.explicitFail = v;
                else if (k === 'item_id') currentNode.explicitItemId = v;
                else if (k === 'quantity') currentNode.explicitQuantity = parseInt(v, 10);
                else if (k === 'prob') currentNode.explicitProb = parseInt(v, 10);
                else if (k === 'percent') currentNode.explicitPercent = parseInt(v, 10);
                else if (k === 'enemy_group_id') {
                    if (!currentNode.parsedParams) currentNode.parsedParams = {};
                    currentNode.parsedParams.enemy_group_id = parseInt(v, 10);
                }
                else if (k === 'guest_id' || k === 'npc_slug') {
                    if (!currentNode.parsedParams) currentNode.parsedParams = {};
                    currentNode.parsedParams.guest_id = v;
                }
                else if (k === 'is_escort_target') {
                    if (!currentNode.parsedParams) currentNode.parsedParams = {};
                    currentNode.parsedParams.is_escort_target = v === 'true';
                }
                else if (k === 'amount') {
                    if (!currentNode.parsedParams) currentNode.parsedParams = {};
                    currentNode.parsedParams.amount = parseInt(v, 10);
                }
            }
        }

        // **次ノード:** 行のパース（ループ等の明示的な遷移指定）
        const nextNodeMatch = line.match(/^\*\*次ノード:\*\*\s*(.+)$/);
        if (nextNodeMatch && currentNode) {
            // "battle_scorpion（ループ）" のような形式から node_id を抽出
            const raw = nextNodeMatch[1].trim();
            const idMatch = raw.match(/^([a-z0-9_]+)/);
            if (idMatch) currentNode.overrideNextNode = idMatch[1];
        }

        // バトルパラメータ: 敵グループID（テーブル形式）
        if (currentNode.type === 'battle' && line.startsWith('| 敵グループID |')) {
            if (!currentNode.parsedParams) currentNode.parsedParams = {};
            const parts = line.split('|').map(p => p.trim());
            const idMatch = parts[2].match(/\d+/);
            if (idMatch) currentNode.parsedParams.enemy_group_id = parseInt(idMatch[0], 10);
        }
        // バトルパラメータ: 敵表示名（テーブル形式）
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

        // choice ノードの選択肢テーブル
        if ((currentNode.type === 'choice' || currentNode.type === 'check_flags') && line.match(/^\|[^|]+\|[^|]+\|$/)) {
            if (line.includes('選択肢') || line.includes('---')) continue;
            const parts = line.split('|').map(p => p.trim()).filter(p => p);
            if (parts.length >= 2) {
                const choiceText = parts[0];
                const choiceNext = parts[1].replace(/`/g, '');
                currentNode.choices.push({ text: choiceText, next: choiceNext });
            }
        }

        // choice ノードの選択肢リスト形式: - 選択肢: 「テキスト」→ `next_node`
        if (currentNode.type === 'choice' || currentNode.type === 'check_flags') {
            const listChoiceMatch = line.match(/^-\s*選択肢:\s*[「『]([^」』]+)[」』]\s*→\s*`([^`]+)`/);
            if (listChoiceMatch) {
                currentNode.choices.push({ text: listChoiceMatch[1], next: listChoiceMatch[2] });
            }
        }

        // **rewards:** 行のパース
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
                else if (k === 'justice') {
                    if (!rewards.alignment_shift) rewards.alignment_shift = {};
                    rewards.alignment_shift.justice = v;
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
        } else if (headerType === 'random_branch') {
            node.parsedParams.type = 'random_branch';
            if (node.explicitProb != null) node.parsedParams.prob = node.explicitProb;
        } else if (headerType === 'check_delivery') {
            node.parsedParams.type = 'check_delivery';
            if (node.explicitItemId) node.parsedParams.item_id = node.explicitItemId;
            if (node.explicitQuantity != null) node.parsedParams.quantity = node.explicitQuantity;
        } else if (headerType === 'reward') {
            node.parsedParams.type = 'reward';
            if (node.explicitItemId) node.parsedParams.item_id = node.explicitItemId;
        } else if (headerType === 'hp_damage') {
            node.parsedParams.type = 'hp_damage';
            if (node.explicitPercent != null) {
                node.parsedParams.percent = node.explicitPercent;
                // エンジン互換: hp_percent も同時に設定
                node.parsedParams.hp_percent = node.explicitPercent;
            }
        } else if (headerType === 'modify_flag') {
            node.parsedParams.type = 'modify_flag';
        } else if (headerType === 'modify_reputation') {
            node.parsedParams.type = 'modify_reputation';
        } else if (headerType === 'check_flags') {
            node.parsedParams.type = 'check_flags';
        } else {
            if (!node.parsedParams.type) {
                node.parsedParams.type = 'text';
            }
        }

        // bg/bgm 継承
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
            node.parsedParams.bgm = 'bgm_battle';
        }
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
    const nodeIndex = {};
    nodes.forEach((n, idx) => { nodeIndex[n.id] = idx; });
    
    const overrideNextNode = {};
    
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.type !== 'choice' || node.choices.length < 2) continue;
        
        const seenIdx = new Set();
        const branchStartIndices = [];
        for (const c of node.choices) {
            const idx = nodeIndex[c.next];
            if (idx !== undefined && !seenIdx.has(idx)) {
                seenIdx.add(idx);
                branchStartIndices.push({ text: c.text, next: c.next, idx });
            }
        }
        branchStartIndices.sort((a, b) => a.idx - b.idx);
        
        if (branchStartIndices.length < 2) continue;
        
        const branches = [];
        for (let b = 0; b < branchStartIndices.length; b++) {
            const startIdx = branchStartIndices[b].idx;
            let endIdx;
            if (b + 1 < branchStartIndices.length) {
                endIdx = branchStartIndices[b + 1].idx - 1;
            } else {
                endIdx = startIdx;
                for (let j = startIdx; j < nodes.length; j++) {
                    const n = nodes[j];
                    if (n.type === 'end_success' || n.type === 'end_failure' || n.type === 'end') break;
                    endIdx = j;
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
        
        const lastBranch = branches[branches.length - 1];
        const mergeIdx = lastBranch.endIdx + 1;
        if (mergeIdx >= nodes.length) continue;
        const mergePoint = nodes[mergeIdx].id;
        
        const allBranchNodes = new Set();
        for (const br of branches) {
            for (const id of br.nodeIds) allBranchNodes.add(id);
        }
        
        for (const br of branches) {
            const lastNodeId = br.nodeIds[br.nodeIds.length - 1];
            const lastNode = nodes[nodeIndex[lastNodeId]];
            
            if (lastNode.type === 'battle' || lastNode.type === 'end_success' || 
                lastNode.type === 'end_failure' || lastNode.type === 'end') continue;
            
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

        const sequentialNext = (i + 1 < nodes.length) ? nodes[i + 1].id : '';
        
        if (node.type === 'battle') {
            // バトルノード: 明示的な next/fail があればそれを使用、なければ順序解決
            nextNode = '';
            const winNext = node.explicitNext || sequentialNext || 'end_success';
            const loseNext = node.explicitFail || 'end_failure';
            choices = [
                { text: 'win', next: winNext },
                { text: 'lose', next: loseNext }
            ];
        } else if (node.type === 'choice') {
            nextNode = '';
            if (node.choices.length > 0) {
                choices = node.choices.map(c => ({ text: c.text, next: c.next }));
            } else {
                nextNode = sequentialNext;
            }
        } else if (node.type === 'random_branch') {
            // random_branch: next と fallback を CHOICE 行で出力
            nextNode = '';
            const nextTarget = node.explicitNext || sequentialNext;
            const fallbackTarget = node.explicitFallback || sequentialNext;
            choices = [
                { text: 'success', next: nextTarget },
                { text: 'failure', next: fallbackTarget }
            ];
        } else if (node.type === 'check_delivery') {
            // check_delivery: next と fallback を CHOICE 行で出力
            nextNode = '';
            const nextTarget = node.explicitNext || sequentialNext;
            const fallbackTarget = node.explicitFallback || sequentialNext;
            choices = [
                { text: 'success', next: nextTarget },
                { text: 'failure', next: fallbackTarget }
            ];
        } else if (node.type === 'check_flags') {
            // check_flags: 既存のCHOICEを使う（7014等）
            nextNode = '';
            if (node.choices.length > 0) {
                choices = node.choices.map(c => ({ text: c.text, next: c.next }));
            }
        } else if (node.type === 'end_success' || node.type === 'end_failure' || node.type === 'end') {
            nextNode = '';
        } else if (node.type === 'reward' || node.type === 'hp_damage') {
            // reward / hp_damage: 明示的な next があればそれを使用、なければ順序解決
            nextNode = node.explicitNext || overrideNextNode[node.id] || sequentialNext;
        } else {
            // text / guest_join / leave / modify_flag / その他
            // overrideNextNode（合流点上書き）またはループ指定を優先
            nextNode = node.overrideNextNode || overrideNextNode[node.id] || sequentialNext;
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
