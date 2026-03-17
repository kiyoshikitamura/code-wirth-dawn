import * as fs from 'fs';
import * as path from 'path';

// Define the quests based on docs/normal_quest_specification.md
const questsData = [
  // 共通 (8)
  { id: 7001, slug: 'qst_gen_deliver', title: '隣街への親書配達', type: 'travel', rewards: 'Gold:150', tags: 'all', short: '[配達] 隣街の親族へ仕送り入りの手紙を無事に届ける。', full: '出張中の主人に宛てたものです。どうか封は開けないでください。あの中には……いえ、あなたには関係のないことです。' },
  { id: 7002, slug: 'qst_gen_escort', title: '放浪商人の護衛', type: 'join(Merchant)->battle->travel', rewards: 'Gold:300', tags: 'all', short: '[護衛] 旅の商人を目的地まで護衛し、夜盗の襲撃から商品を守る。', full: 'この道は最近、"野犬より質の悪い連中"が出るらしい。護衛料は払う、私の命とこの荷を次の街まで頼む。' },
  { id: 7003, slug: 'qst_gen_scavenge', title: '廃墟からの物資回収', type: 'battle->check_delivery', rewards: 'Gold:200|Item:3002', tags: 'all', short: '[探索] 崩壊した街区の金庫から、貴重な物資を回収する。', full: '先日の暴動で焼け落ちた区画に、まだ金庫が残っているはずだ。火事場泥棒どもより先に見つけ出してくれ。' },
  { id: 7004, slug: 'qst_gen_riot', title: '食料暴動の事前鎮圧', type: 'battle', rewards: 'Gold:400|Evil:5', tags: 'all', short: '[討伐] 暴動を企てる飢えた市民のデモ隊を、力でねじ伏せる。', full: '腹を空かせた豚どもが、我々の倉庫を狙って集会を開いている。武器を持った暴れん坊を数人間引けば、あとは散るだろう。' },
  { id: 7005, slug: 'qst_gen_bear', title: '冬ごもりの凶熊狩り', type: 'battle', rewards: 'Gold:250|Item:3001', tags: 'all', short: '[討伐] 開拓村の脅威となっている大型の熊を狩る。', full: '冬ごもりに失敗した飢えた熊が降りてきた。村の若者が二人やられたよ。あんたたち傭兵でなんとかしてくれ。' },
  { id: 7006, slug: 'qst_gen_smuggle', title: '禁制品の闇ルート輸送', type: 'travel->battle', rewards: 'Gold:800|Chaos:5', tags: 'all', short: '[密輸] 危険な禁制品を運搬する。検問や敵の襲撃に備えよ。', full: 'この木箱を運ぶだけだ。中身？ 聞かない方が長生きできるぞ。関所の連中には賄賂が通っているはずだが、用心しろ。', maxRep: 'Rogue' },
  { id: 7007, slug: 'qst_gen_rat', title: '地下水路の害獣駆除', type: 'battle', rewards: 'Gold:150', tags: 'all', short: '[討伐] はびこる巨大ネズミを退治し、衛生環境を取り戻せ。', full: '下水溝のネズミが犬ほどに育っている。疫病が広がる前に、あの不快な牙をへし折ってきてくれ。' },
  { id: 7008, slug: 'qst_gen_mercy', title: '野営地への薬草納品', type: 'check_delivery', rewards: 'Gold:100|Justice:5', tags: 'all', short: '[納品] 傷ついた難民のため、癒やし草を規定数集める。', full: '祈りは痛みを忘れさせますが、傷は塞ぎません。せめて、神の代わりとなる薬草を運んできてくださいませんか。' },

  // Roland (6)
  { id: 7010, slug: 'qst_rol_heretic', title: '異端者の粛清', type: 'battle', rewards: 'Gold:400|Order:5', tags: 'loc_holy_empire', minRep: 'Hero', short: '[討伐] 教会に背く異端の信徒たちを、騎士団に代わって処理する。', full: '地下で禁忌の儀式を行う愚か者どもがいます。手荒な真似は問いません。あの廃村を文字通り"浄化"してください。' },
  { id: 7011, slug: 'qst_rol_holywater', title: '最前線への聖水輸送', type: 'check_delivery->travel', rewards: 'Gold:350', tags: 'loc_holy_empire', short: '[輸送] アンデッド対策として、前線の拠点に祝福された聖水を運ぶ。', full: '最前線の砦では腐臭が充満し、戦死者が歩き出している。この聖水瓶を届け、安らかな眠りを与えてやらねば。' },
  { id: 7012, slug: 'qst_rol_pilgrim', title: '聖地巡礼者の護衛', type: 'join(Pilgrim)->battle', rewards: 'Gold:500', tags: 'loc_holy_empire', short: '[護衛] 狂信的な巡礼者を護送する。彼が死ねば報酬はない。', full: '主神の声が聞こえるのです。あの危険な谷の奥底へ行かねばなりません。あなたが盾となるのは、神の思し召しです。' },
  { id: 7013, slug: 'qst_rol_undead', title: '遺体安置所の亡者討伐', type: 'battle', rewards: 'Gold:300', tags: 'loc_holy_empire', short: '[討伐] 瘴気によって動き出した腐乱死体たちを土へと還す。', full: '教区の共同墓地を閉鎖した。罪深き霊が肉体を求めて彷徨っている。彼らの手足を切り落とし、物理的に昇天させたまえ。' },
  { id: 7014, slug: 'qst_rol_tithe', title: '強圧的な十分の一税徴収', type: 'battle', rewards: 'Gold:600|Evil:10', tags: 'loc_holy_empire', maxRep: 'Rogue', short: '[徴収] 貧民層から無理やり税を取り立てる任務。抵抗者は斬れ。', full: '税を払わぬゴミ共は、聖帝国の恩恵を受ける資格がない。金がなければ、臓腑を引きずり出してでも回収してこい。' },
  { id: 7015, slug: 'qst_rol_relic', title: '盗まれた聖遺物の奪還', type: 'battle->check_delivery', rewards: 'Gold:450', tags: 'loc_holy_empire', short: '[奪還] 盗賊団のアジトを襲撃し、教会から盗まれた聖杯を奪い返す。', full: '教会の宝物庫から最古の聖杯が消えた。身の程知らずのネズミの巣を強襲し、血まみれにしてでも主の器を取り戻せ。' },

  // Markand (6)
  { id: 7020, slug: 'qst_mar_caravan', title: '大砂漠の長距離交易護衛', type: 'join(Guard)->battle->travel', rewards: 'Gold:800', tags: 'loc_marcund', short: '[護衛] 広大な砂漠を越える商隊の用心棒。盗賊と魔獣の連戦を耐え抜け。', full: '砂海を越えるのは命がけだ、傭兵。砂漠の盗賊団と化け物に教え込んでやれ。我々の積荷には手を出せないとな。' },
  { id: 7021, slug: 'qst_mar_scorpion', title: '幻覚サソリの毒針調達', type: 'check_delivery', rewards: 'Gold:300|Item:3005', tags: 'loc_marcund', short: '[納品] 暗殺の薬や違法薬物の原料となる、希少なサソリの毒針を納品。', full: '薬にするのかって？ ははっ、お前は少し詮索しすぎだ。赤いサソリの尾っぽだけあればいい。新鮮なやつをな。' },
  { id: 7022, slug: 'qst_mar_debt', title: '逃亡奴隷の連れ戻し', type: 'battle', rewards: 'Gold:450|Evil:5', tags: 'loc_marcund', maxRep: 'Rogue', short: '[捕縛] 借金を踏み倒して逃げた元奴隷を、生死問わず連れ戻す。', full: 'あいつは私の財産だ、勝手な真似は許さん。足の二、三本へし折っても構わん。私の金を引きずって連れてこい。' },
  { id: 7023, slug: 'qst_mar_sandworm', title: '交易路を脅かす大砂虫討伐', type: 'battle', rewards: 'Gold:600', tags: 'loc_marcund', short: '[討伐] 流砂の底に潜む巨大な魔獣を誘い出し、オアシスの安全を確保せよ。', full: '地鳴りがする。巨大な砂蟲が商会ルートの真下に巣食っているらしい。爆薬をやる、口の中にぶち込んでこい！' },
  { id: 7024, slug: 'qst_mar_auction', title: '闇市オークションの用心棒', type: 'battle', rewards: 'Gold:500|Chaos:5', tags: 'loc_marcund', short: '[防衛] 違法国宝が取引される闇の競売場で、乱入者を排除する。', full: '今夜の客は品が良いが、鼻が利くハイエナも引き寄せる。騒ぎを起こす輩がいれば、目立たぬように始末しろ。' },
  { id: 7025, slug: 'qst_mar_bribe', title: '敵対軍閥への賄賂裏工作', type: 'travel->check_delivery', rewards: 'Gold:350|Chaos:5', tags: 'loc_marcund', short: '[裏工作] 工作資金と宝石を、密かに敵対軍閥の将校へ手渡してこい。', full: 'この革袋を、北端のオアシスにいる『隻眼』に渡せ。合言葉は"流砂の果て"。くれぐれも誰にも見られるな。' },

  // Yato (5)
  { id: 7030, slug: 'qst_yat_yokai', title: '古道にはびこる妖討伐', type: 'battle', rewards: 'Gold:300', tags: 'loc_yatoshin', short: '[討伐] 夜の街道筋に現れる怪異（からかさ小僧や赤鬼）を退治する。', full: '夜道に気をつけろ。無念の死を遂げた者たちの怨念が、形を成して旅人を襲う。斬り伏せ、その恨みを祓ってくれ。' },
  { id: 7031, slug: 'qst_yat_ninja', title: '隠密の密書傍受', type: 'battle->travel', rewards: 'Gold:550', tags: 'loc_yatoshin', short: '[襲撃] 他国の間者を辻斬りのごとく排除し、密書を奪取して届けよ。', full: '我が国を嗅ぎ回るネズミがいる。風より速く背後を取り、その首を刎ねよ。奪った書状は私が『処理』する。' },
  { id: 7032, slug: 'qst_yat_shrine', title: '結界石の修復と奉納', type: 'check_delivery->travel', rewards: 'Gold:250', tags: 'loc_yatoshin', short: '[修復] 神隠しを防ぐため、破られた結界石の破片を集めて祠に納める。', full: '祠の縄が切れ、魑魅魍魎が這い出してきている。急ぎ霊石の欠片を拾い集め、綻びを縫い合わせねば、村が喰われる。' },
  { id: 7033, slug: 'qst_yat_ronin', title: '食い詰めた浪人狩り', type: 'battle', rewards: 'Gold:350|Order:5', tags: 'loc_yatoshin', short: '[討伐] 賭場の手入れ。悪事に手を染めた浪人集団を一網打尽にする。', full: '主君を失い、武士の誇りすら捨てた野良犬どもが、町で乱暴を働いている。あ奴らに死という名の教訓を与えてやれ。' },
  { id: 7034, slug: 'qst_yat_shogun', title: '御前試合の果たし状配達', type: 'travel', rewards: 'Gold:200', tags: 'loc_yatoshin', short: '[配達] 不吉な血判状を、隣地の剣客道場まで無傷で送り届ける。', full: 'これは真剣勝負の『果たし状』だ。もし道中の敵対派閥に奪われれば、我が流派の恥となる。命がけで死守せよ。' },

  // Haryu (5)
  { id: 7040, slug: 'qst_har_jiangshi', title: '死者の還る山の浄化', type: 'battle', rewards: 'Gold:350', tags: 'loc_haryu', short: '[討伐] 霊山をうろつくキョンシー（跳屍）たちを、護符の力で鎮める。', full: '墓荒らしのせいで死者が蘇った。呪符を額に貼り付け、永遠の眠りにつかせよ。嚙まれるなよ、お前も骨になるぞ。' },
  { id: 7041, slug: 'qst_har_herb', title: '仙丹の材料となる霊草採集', type: 'check_delivery', rewards: 'Gold:300|Vitality:1', tags: 'loc_haryu', short: '[納品] 寿命を幾ばくか延ばす仙丹の材料。稀少な霊草を宦官へ納品。', full: '帝の命により、悠久の時を生きるための丹を作る。岩肌に咲く『星見草』を探し出せば、貴様にも恩恵を分けてやろう。' },
  { id: 7042, slug: 'qst_har_rebel', title: '辺境農民の反乱鎮圧', type: 'battle', rewards: 'Gold:450|Evil:10', tags: 'loc_haryu', maxRep: 'Rogue', short: '[鎮圧] 重税に苦しみ竹槍を持った農民の反乱軍を、容赦なく根絶やしにする。', full: '天子の威光に逆らう愚かな塵芥どもめ。一揆を企てた村ごと焼き払い、見せしめとして全員の首を刎ねろ。' },
  { id: 7043, slug: 'qst_har_official', title: '巡検使の護衛と汚職隠蔽', type: 'join(Official)->travel', rewards: 'Gold:500|Chaos:10', tags: 'loc_haryu', short: '[護衛] 賄賂で肥え太った悪徳官僚を守り抜き、暗殺者の刃から匿う。', full: '私は国のために尽くしてきたのだ！ たかが少しの便宜で命を狙われる筋合いはない。金を払う、私をここまで護衛しろ！' },
  { id: 7044, slug: 'qst_har_pirate', title: '沿岸を荒らす海賊の討伐', type: 'battle', rewards: 'Gold:400', tags: 'loc_haryu', short: '[討伐] 沿岸の交易船を襲う水賊の拠点へ奇襲をかけ、利益を奪い返す。', full: '海賊どもが我が国の絹と茶を強奪しおった。ヤツらの小島に夜襲をかけ、根こそぎ奪い返せ。海に沈めても構わん。' }
];

const CSV_HEADER = 'id,slug,title,rec_level,difficulty,time_cost,location_tags,min_prosperity,max_prosperity,rewards_summary,_comment\n';

let questsNormalCsv = CSV_HEADER;

const scenarioDir = path.join(__dirname, '../src/data/csv/scenarios');
if (!fs.existsSync(scenarioDir)) {
  fs.mkdirSync(scenarioDir, { recursive: true });
}

questsData.forEach((q) => {
  // Determine minRep/maxRep conditions for JSON config
  const conditionObj: any = { nation_id: q.tags !== 'all' ? q.tags : null };
  if (q.minRep) conditionObj.min_reputation = q.minRep;
  if (q.maxRep) conditionObj.max_reputation = q.maxRep;
  
  // Clean condition logic (no nulls in the output)
  const cleanCondition = Object.fromEntries(Object.entries(conditionObj).filter(([_, v]) => v != null));
  const condString = Object.keys(cleanCondition).length > 0 ? `"{""${Object.keys(cleanCondition)[0]}"": ""${Object.values(cleanCondition)[0]}""}"` : '""';

  // Build the quests_normal.csv line
  // We use `condString` in _comment or handle rep in code? Wait, `quests_normal.csv` doesn't have a conditions column by default. 
  // Let's just generate it and rely on the quests_normal loader in seed_master if we need it, actually the normal quests loader doesn't seem to parse conditions.
  // We can write it temporarily or just leave as is. Oh, quests.csv has conditions but quests_normal doesn't? Let's check.
  
  const line = `${q.id},${q.slug},${q.title},2,2,1,${q.tags},,,${q.rewards},${q.short}\n`;
  questsNormalCsv += line;

  // Generate the scenario CSV for the quest
  let scenarioData = 'id,type,text,speaker_name,speaker_image_url,next_id,bgm,background_image_url,battle_enemy_slug,item_slug,item_amount\n';

  // We map the type like 'battle', 'travel->battle' into a simple 1-3 node sequence.
  const types = q.type.split('->');
  let currentId = 1;

  // Always start with a brief text node introducing the flavor text.
  scenarioData += `${currentId},text,"${q.full}","依頼書",,${currentId + 1},,,,,\n`;
  currentId++;

  types.forEach((type, index) => {
    let nextId = currentId + 1;
    if (index === types.length - 1) {
      if (type !== 'battle') nextId = -1; // End unless it's a battle which we usually terminate naturally or we can point to a win text
    }

    if (type.startsWith('join')) {
      const npcType = type.match(/\((.*?)\)/)?.[1] || 'Guest';
      scenarioData += `${currentId},text,"同行NPC（${npcType}）が一時的にパーティーに加わった。",,,,${nextId},,,,,\n`;
    } else if (type === 'battle') {
      scenarioData += `${currentId},battle,"交戦！",,,,${nextId},,,enemy_slime_blue,,\n`;
    } else if (type === 'travel') {
      scenarioData += `${currentId},travel,"目的地へ移動する。",,,,${nextId},,,,,\n`;
    } else if (type === 'check_delivery') {
      scenarioData += `${currentId},check_delivery,"依頼の納品物を渡す。",,,,${nextId},,,item_potion,1\n`;
    }
    currentId++;
  });
  
  // Ensure the last node ends with -1 if it's text/travel
  if (!scenarioData.endsWith(',-1,,,,,\n')) {
     scenarioData += `${currentId},text,"依頼は完了した。報酬を受け取ろう。",,,-1,,,,,,\n`;
  }

  // Write scenario file
  const filename = `${q.id}_${q.slug}.csv`;
  fs.writeFileSync(path.join(scenarioDir, filename), scenarioData);
});

fs.writeFileSync(path.join(__dirname, '../src/data/csv/quests_normal.csv'), questsNormalCsv);
console.log('Successfully generated quests_normal.csv and 30 scenario files.');
