import * as fs from 'fs';
import * as path from 'path';

// Generate new unique items
const itemsCsvPath = path.join(__dirname, '../src/data/csv/items.csv');
const itemsCsv = fs.readFileSync(itemsCsvPath, 'utf8');
const newItems = `3101,item_relic_bone,聖遺物の欠片,material,500,,any,,0,骸骨狂王の討伐証明
3102,item_desert_worm_meat,大砂蟲の極上肉,material,800,,any,,0,マザー웜から採れる希少部位
3103,item_red_ogre_horn,剛腕赤鬼の金棒碎片,material,600,,any,,0,赤鬼討伐の証
3104,item_thunder_fur,雷獣の帯電毛皮,material,1000,,any,,0,雷獣のレア素材
3105,item_griffon_feather,暴風グリフォンの王羽,material,900,,any,,0,グリフォンロードの巨大羽
3106,item_treant_core,エントの輝く心材,material,700,,any,,0,長年の魔力を蓄えた芯
3111,item_white_robe,極白の法衣,item(def:10),5000,,any,,0,異端へと堕ちた元大司教の法衣
3112,item_thief_blade,義賊の刀,item(atk:15),4000,,any,,0,民を救えなかった狂剣の遺品
3113,item_pirate_hat,大海賊の帽子,item(hp:20),3500,,any,,0,血塗られた艦隊の長の帽子
3121,item_demon_heart,悪魔の心臓,material,3000,,any,,0,バフォメットの脈打つ心臓
3122,item_angel_record,天使の手記,material,3000,,any,,0,天界の真実が記された冒涜的な書
3123,item_dragon_blood,竜血,consumable(vit:3),8000,,any,,0,デザートドラゴンから採れる貴重な血。Vitを3回復する
3124,item_kirin_horn,麒麟の雷角,material,5000,,any,,0,神域の幻獣の力を持つ角
3125,item_omega_part,謎の金属部品,material,4000,,any,,0,オメガ・ゴーレムの未知の機関
3126,item_kraken_proof,海王の証,material,5000,,any,,0,クラーケン討伐の揺るぎない証明
3127,item_mino_axe,大斧,item(atk:20),4000,,any,,0,ミノタウロス・キングの巨大な斧
3128,item_maze_seal,迷宮の宝印,material,2000,,any,,0,迷宮走破の印
`;
if(!itemsCsv.includes('3101,item_relic_bone')) {
    fs.appendFileSync(itemsCsvPath, '\n' + newItems.trim());
}

// Generate new enemies
const enemiesCsvPath = path.join(__dirname, '../src/data/csv/enemies.csv');
const enemiesCsv = fs.readFileSync(enemiesCsvPath, 'utf8');
const newEnemies = `
6001,boss_skeleton_king,骸骨狂王,500,10,10,500,2000,,quest_only
6002,boss_queen_worm,マザー웜,700,12,8,600,2500,,quest_only
6003,boss_red_ogre,剛腕赤鬼,600,15,5,550,2000,,quest_only
6004,boss_thunder_beast,霊山の雷獣,450,18,5,650,3000,,quest_only
6005,boss_griffon_lord,グリフォン・ロード,600,14,10,600,2200,,quest_only
6006,boss_treant_elder,エント長,800,8,15,500,2000,,quest_only
6011,boss_fallen_bishop,元大司教,400,12,12,800,5000,,quest_only
6012,boss_corrupt_cardinal,腐敗枢機卿,500,10,15,850,6000,,quest_only
6013,boss_mad_ronin,義剣の剣豪,350,25,5,700,4000,,quest_only
6014,boss_assassin_master,暗殺ギルド長,300,28,3,800,4500,,quest_only
6015,boss_pirate_king,海賊船長,450,18,10,650,3500,,quest_only
6016,boss_rebel_leader,反乱軍指導者,500,16,12,700,4000,,quest_only
6017,boss_gold_merchant,錬金強化人間,700,20,15,900,5000,,quest_only
6021,boss_demon_baphomet,バフォメット,900,22,18,1000,5000,,quest_only
6022,boss_fallen_angel,降臨せし天使,800,25,20,1000,5000,,quest_only
6023,boss_desert_dragon,デザートドラゴン,1500,30,25,1500,8000,,quest_only
6024,boss_holy_kirin,霊獣・麒麟,1000,28,20,1200,5000,,quest_only
6025,boss_omega_golem,オメガ・ゴーレム,1200,25,30,1100,5000,,quest_only
6026,boss_kraken_prime,クラーケン本体,1000,20,15,1000,5000,,quest_only
6027,boss_mino_king,牛頭王,1100,26,18,1100,4500,,quest_only
`;
if(!enemiesCsv.includes('6001,boss_skeleton_king')) {
    fs.appendFileSync(enemiesCsvPath, newEnemies);
}

// Generate new skills and actions for the bosses
const enemySkillsPath = path.join(__dirname, '../src/data/csv/enemy_skills.csv');
if(!fs.readFileSync(enemySkillsPath, 'utf8').includes('skill_boss_heal')) {
    fs.appendFileSync(enemySkillsPath, `
501,skill_boss_heal,暗黒の癒し,heal,200,,5ターンに一度、自身を大きく回復させる
502,skill_boss_nuke,終焉の息吹,damage,50,,防御を貫通しうる強烈な全体ダメージ
503,skill_boss_stun,咆哮,status_effect,1,,1ターンの間スタンさせる
`);
}

const enemyActionsPath = path.join(__dirname, '../src/data/csv/enemy_actions.csv');
const newActions = `
1001,boss_skeleton_king,skill_boss_nuke,20,turn_mod,4
1002,boss_skeleton_king,skill_heavy_attack,50,,
1003,boss_skeleton_king,skill_attack,100,,

1004,boss_desert_dragon,skill_boss_heal,100,hp_under,500
1005,boss_desert_dragon,skill_boss_nuke,30,turn_mod,3
1006,boss_desert_dragon,skill_boss_stun,40,turn_mod,5
1007,boss_desert_dragon,skill_heavy_attack,100,,

1008,boss_fallen_angel,skill_boss_heal,100,turn_mod,5
1009,boss_fallen_angel,skill_boss_nuke,50,hp_under,400
1010,boss_fallen_angel,skill_heavy_attack,100,,

1011,boss_demon_baphomet,skill_boss_nuke,100,turn_mod,4
1012,boss_demon_baphomet,skill_boss_heal,80,hp_under,450
1013,boss_demon_baphomet,skill_attack,100,,
`;
if(!fs.readFileSync(enemyActionsPath, 'utf8').includes('1001,boss_skeleton_king')) {
    fs.appendFileSync(enemyActionsPath, newActions);
}

const enemyGroupsPath = path.join(__dirname, '../src/data/csv/enemy_groups.csv');
const newGroups = `
9001,enemy_grp_boss_skel_king,boss_skeleton_king
9002,enemy_grp_boss_worm,boss_queen_worm
9003,enemy_grp_boss_ogre,boss_red_ogre
9004,enemy_grp_boss_thunder,boss_thunder_beast
9005,enemy_grp_boss_griffon,boss_griffon_lord
9006,enemy_grp_boss_treant,boss_treant_elder
9011,enemy_grp_boss_bishop,boss_fallen_bishop
9012,enemy_grp_boss_cardinal,boss_corrupt_cardinal
9013,enemy_grp_boss_ronin,boss_mad_ronin
9014,enemy_grp_boss_assassin,boss_assassin_master
9015,enemy_grp_boss_pirate,boss_pirate_king
9016,enemy_grp_boss_rebel,boss_rebel_leader
9017,enemy_grp_boss_merchant,boss_gold_merchant
9021,enemy_grp_boss_baphomet,boss_demon_baphomet
9022,enemy_grp_boss_angel,boss_fallen_angel
9023,enemy_grp_boss_dragon,boss_desert_dragon
9024,enemy_grp_boss_kirin,boss_holy_kirin
9025,enemy_grp_boss_golem,boss_omega_golem
9026,enemy_grp_boss_kraken,boss_kraken_prime
9027,enemy_grp_boss_mino,boss_mino_king
`;
if(!fs.readFileSync(enemyGroupsPath, 'utf8').includes('9001,enemy_grp_boss_skel_king')) {
    fs.appendFileSync(enemyGroupsPath, newGroups);
}

// Generate the 20 Quest Specs in quests_special.csv and scenarios
const questsSpecialPath = path.join(__dirname, '../src/data/csv/quests_special.csv');
let questsSpecialCsv = fs.readFileSync(questsSpecialPath, 'utf8');

const bossQuests = [
  // Tier 1: Progression
  { id: 8001, slug: 'qst_boss_skeleton', title: '旧市街の暴君討伐', reqs: { completed_quest: 7013 }, rwds: 'Gold:2000|Item:3101', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_skel_king', short: '[強敵] 旧市街の奥に潜む骸骨王を讨伐せよ。', full: '安置所の亡者どもを束ねる王が現れました。奴を野放しにはできません。' },
  { id: 8002, slug: 'qst_boss_worm', title: 'マザー大砂蟲討伐', reqs: { completed_quest: 7023 }, rwds: 'Gold:2500|Item:3102', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_worm', short: '[強敵] 砂漠の脅威、マザー웜を撃破せよ。', full: '奴は無限に砂蟲を生み出す。爆薬だけでは足りない、直接息の根を止めてくれ。' },
  { id: 8003, slug: 'qst_boss_ogre', title: '剛腕赤鬼の退治', reqs: { completed_quest: 7030 }, rwds: 'Gold:2000|Rep:15|Item:3103', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_ogre', short: '[強敵] 山道で旅人を食らう巨大赤鬼を退治せよ。', full: 'その鬼は金棒一振りで馬車を木端微塵にするらしい。並の兵では勝てぬ、頼んだぞ。' },
  { id: 8004, slug: 'qst_boss_thunder', title: '霊山の雷獣討伐', reqs: { completed_quest: 7040 }, rwds: 'Gold:3000|Item:3104', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_thunder', short: '[強敵] 霊山に住まう恐るべき雷の獣を狩れ。', full: 'あの山の雷は自然のものではない。強大な魔獣によるものだ。' },
  { id: 8005, slug: 'qst_boss_griffon', title: 'グリフォン・ロード討伐', reqs: { completed_quest: 5056 }, rwds: 'Gold:2200|Item:3105', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_griffon', short: '[強敵] 嵐を呼ぶグリフォンの王を討伐せよ。', full: '普通の熊や獣とは訳が違う。空を支配する王を地に叩きつけろ。' },
  { id: 8006, slug: 'qst_boss_treant', title: '厄災の古樹討伐', reqs: { completed_quest: 5002 }, rwds: 'Gold:2000|Item:3106', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_treant', short: '[強敵] 森の怒りを具現化したエント長を静めよ。', full: '森が我々を排除しようとしている。根源であるあの巨木を燃やし尽くせ。' },

  // Tier 2: Reputation
  { id: 8011, slug: 'qst_boss_bishop', title: '異端の元大司教', reqs: { min_reputation: 'Hero' }, rwds: 'Gold:5000|Item:3111', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_bishop', short: '[極秘] 堕落した元大司教の命を絶て。', full: '神の奇跡と称して禁忌に手を染めている。表沙汰になる前に処理してくれ。' },
  { id: 8012, slug: 'qst_boss_cardinal', title: '腐敗枢機卿の暗殺', reqs: { max_reputation: 'Rogue' }, rwds: 'Gold:6000', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_cardinal', short: '[暗殺] 表の顔は聖職者、裏は人身売買の元締め。枢機卿の首を獲れ。', full: '光の届かぬ場所で手を汚してきたお前たちにしか頼めない仕事だ。枢機卿の首を獲れ。' },
  { id: 8013, slug: 'qst_boss_ronin', title: '義剣の剣豪討伐', reqs: { max_reputation: 'Rogue' }, rwds: 'Gold:4000|Item:3112', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_ronin', short: '[裏稼業] 民を扇動する邪魔な義剣士を始末しろ。', full: 'あいつのおかげで我々の「仕事」がしづらくてかなわん。腕の立つ奴はいるか？' },
  { id: 8014, slug: 'qst_boss_assassin', title: '暗殺ギルドの壊滅', reqs: { min_reputation: 'Famous' }, rwds: 'Gold:4500', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_assassin', short: '[討伐] 街の裏社会を牛耳る暗殺ギルドの長を討て。', full: '正義を成す時が来た。悪の温床を文字通り根絶やしにするのだ。' },
  { id: 8015, slug: 'qst_boss_pirate', title: '海賊大艦隊の長', reqs: { completed_quest: 7044 }, rwds: 'Gold:3500|Item:3113', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_pirate', short: '[強敵] 沿岸を牛耳る大海賊を討伐せよ。', full: '艦隊の長がついに姿を現した。海軍は動けん、お前たちで始末しろ。' },
  { id: 8016, slug: 'qst_boss_rebel', title: '反乱軍の若き指導者', reqs: { max_reputation: 'Rogue' }, rwds: 'Gold:4000', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_rebel', short: '[暗殺] 反乱軍のカリスマを消し去れ。', full: '若者の理想など、現実の前に叩き潰してやれ。報酬は弾むぞ。' },
  { id: 8017, slug: 'qst_boss_merchant', title: '悪徳商会トップの始末', reqs: { max_reputation: 'Rogue' }, rwds: 'Gold:5000', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_merchant', short: '[暗殺] 錬金術で自身を強化した商会長を殺せ。', full: '金で命を買えると本気で信じている哀れな老いぼれに、死を教えてこい。' },

  // Tier 3: Items
  { id: 8021, slug: 'qst_boss_baphomet', title: '悪魔バフォメット', reqs: { require_item_id: 3001 }, rwds: 'Item:3121', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_baphomet', short: '[封印指定] 祭壇に呼び出された大悪魔を討伐せよ。', full: 'そのグリモワールを持つ者よ、地獄の門が開く前に元凶を打ち倒せ。', share: '血塗られた祭壇の奥深くに降臨した大悪魔バフォメットを、この手で討ち果たした。 #Code_Wirth_Dawn #悪魔討伐' },
  { id: 8022, slug: 'qst_boss_angel', title: '降臨せし天使', reqs: { require_item_id: 3001 }, rwds: 'Item:3122', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_angel', short: '[極秘討伐] 狂信をばら撒く厄災の天使を撃墜せよ。', full: '美しき光で人々の理性を奪い、生きたまま天界の苗床に変えようとしているのだ。', share: '天より降りし破壊の御使いを、この刃で地に墜としてやった。我々には神の救済など必要ない。 #Code_Wirth_Dawn #神殺しの傭兵' },
  { id: 8023, slug: 'qst_boss_dragon', title: 'デザートドラゴン', reqs: { require_item_id: 3001 }, rwds: 'Gold:8000|Item:3123', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_dragon', short: '[討伐特務] 砂漠の覇者、デザートドラゴンが覚醒した。死を恐れぬ者のみ挑め。', full: '熱砂の深淵より「古き竜」が眼を覚ましたのだ。あのような巨大な絶望を前に、軍隊など何の意味もない。', share: '砂海の絶対君主、デザートドラゴンを討ち取った。この熱砂に私の名が深く刻まれるだろう。「次は、どの神を殺そうか？」 #Code_Wirth_Dawn #竜殺し' },
  { id: 8024, slug: 'qst_boss_kirin', title: '神域の幻獣', reqs: { require_item_id: 3001 }, rwds: 'Item:3124', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_kirin', short: '[幻獣特務] 伝説の霊獣・麒麟が現れた。', full: '仙人の香炉の煙に惹かれ、雷を纏う神獣が降り立った。力量を試してみるか？', share: '雷を纏う神域の幻獣・麒麟との死闘を制した。もはやこの世に斬れぬものはない。 #Code_Wirth_Dawn' },
  { id: 8025, slug: 'qst_boss_golem', title: 'オメガ・ゴーレム', reqs: { require_item_id: 3001 }, rwds: 'Item:3125', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_golem', short: '[探索特務] 忘れられた古代の機械兵器を破壊せよ。', full: '歯車が噛み合い、数千年の眠りから目覚める。人類の手に負えない遺物だ。' },
  { id: 8026, slug: 'qst_boss_kraken', title: '大海の悪夢 クラーケン', reqs: { require_item_id: 3001 }, rwds: 'Gold:5000|Item:3126', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_kraken', short: '[討伐特務] 全ての船乗りが恐れる海獣を討伐せよ。', full: '銀貨の呪いがやつを呼び寄せた。海に引きずり込まれる前に、本体を潰せ。' },
  { id: 8027, slug: 'qst_boss_mino', title: '迷宮の覇者 牛頭王', reqs: { require_item_id: 3001 }, rwds: 'Item:3127|Item:3128', mob: 'enemy_slime_blue', bossGrp: 'enemy_grp_boss_mino', short: '[討伐] 決して抜け出せない迷宮の最奥、牛頭王を狩れ。', full: '地図を持つ者のみが王の間に辿り着ける。最強の斧を己の力で奪い取れ。' },

];

const SCENARIO_DIR = path.join(__dirname, '../src/data/csv/scenarios');
let updatedSpecial = false;

bossQuests.forEach(q => {
    const reqStr = JSON.stringify(q.reqs).replace(/"/g, '""');
    const line = `${q.id},${q.slug},${q.title},5,5,1,"{""nation_id"":null}",false,,${q.rwds},${q.short}\n`;
    
    // Add to quests_special if not exists
    if(!questsSpecialCsv.includes(`${q.id},${q.slug}`)) {
        // Special quests schema: id,slug,title,rec_level,time_cost,difficulty,requirements,is_repeatable,impact,rewards_summary,_comment
        const specialLine = `${q.id},${q.slug},${q.title},5,5,5,"${reqStr}",false,,"${q.rwds}","${q.short}"\n`;
        questsSpecialCsv += specialLine;
        updatedSpecial = true;
    }

    // Build scenario CSV content
    // Node 1: Flavor Text
    // Node 2,3,4: Normal Battles (attrition)
    // Node 5: Boss Battle!
    // Node 6: End/Share text
    
    // We pass short_description via JSON parsing logic in seed_master: scriptData.short_description! No, we put it in the node? 
    // Actually the seed_master extracts `short` from quests_normal/special _comment. We did that! 
    // Special quest _comment is the 11th col. Currently our specialLine has 11 cols.
    
    let scenarioData = 'row_type,node_id,text_label,params,next_node\n';
    scenarioData += `NODE,1,"${q.full}","{""type"":""text"",""speaker_name"":""依頼書""}",2\n`;
    scenarioData += `NODE,2,"雑魚の群れが立ちはだかる。","{""type"":""battle"",""enemy_group_id"":""${q.mob}""}",choice1\n`;
    scenarioData += `CHOICE,,戦う,,3\n`;
    scenarioData += `NODE,3,"さらに敵が押し寄せてくる。","{""type"":""battle"",""enemy_group_id"":""${q.mob}""}",choice2\n`;
    scenarioData += `CHOICE,,戦う,,4\n`;
    scenarioData += `NODE,4,"ボスの部屋はもうすぐだ。護衛を倒せ。","{""type"":""battle"",""enemy_group_id"":""${q.mob}""}",choice3\n`;
    scenarioData += `CHOICE,,戦う,,5\n`;
    scenarioData += `NODE,5,"強力なプレッシャーを感じる。ボス戦だ！","{""type"":""battle"",""enemy_group_id"":""${q.bossGrp}""}",choice4\n`;
    scenarioData += `CHOICE,,戦う,,6\n`;
    const shareText = q.share ? `,""share_text"":""${q.share}""` : '';
    scenarioData += `NODE,6,"討伐完了！クエストボードに報告しよう。","{""type"":""end_success""${shareText}}",\n`;

    const filepath = path.join(SCENARIO_DIR, `${q.id}_${q.slug}.csv`);
    fs.writeFileSync(filepath, scenarioData);
});

if(updatedSpecial) {
    fs.writeFileSync(questsSpecialPath, questsSpecialCsv);
}
console.log('Successfully generated complete boss quests with 20 items and full progression.');
