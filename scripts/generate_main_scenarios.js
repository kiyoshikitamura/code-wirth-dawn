const fs = require('fs');
const path = require('path');

const QUESTS_FILE = path.join(process.cwd(), 'src', 'data', 'csv', 'quests_special.csv');
const SCENARIOS_DIR = path.join(process.cwd(), 'src', 'data', 'csv', 'scenarios');

if (!fs.existsSync(SCENARIOS_DIR)) {
    fs.mkdirSync(SCENARIOS_DIR, { recursive: true });
}

const mainQuests = [
    { id: 6001, slug: 'main_ep01', title: '第1話「始まりの轍」', lv: 1, loc: 'loc_holy_empire', req: '{}' },
    { id: 6002, slug: 'main_ep02', title: '第2話「砂礫の国境線」', lv: 2, loc: 'loc_holy_empire', req: '{"completed_quest": "main_ep01"}' },
    { id: 6003, slug: 'main_ep03', title: '第3話「オアシスの陰謀」', lv: 3, loc: 'loc_marcund', req: '{"completed_quest": "main_ep02"}' },
    { id: 6004, slug: 'main_ep04', title: '第4話「砂塵の激突」', lv: 4, loc: 'loc_marcund', req: '{"completed_quest": "main_ep03"}' },
    { id: 6005, slug: 'main_ep05', title: '第5話「大義という名の虚妄」', lv: 5, loc: 'loc_marcund', req: '{"completed_quest": "main_ep04"}' },
    
    { id: 6006, slug: 'main_ep06', title: '第6話「逃亡者の道」', lv: 6, loc: 'loc_yatoshin', req: '{"completed_quest": "main_ep05"}' },
    { id: 6007, slug: 'main_ep07', title: '第7話「刃の掟」', lv: 7, loc: 'loc_yatoshin', req: '{"completed_quest": "main_ep06"}' },
    { id: 6008, slug: 'main_ep08', title: '第8話「夜霧の凶刃」', lv: 8, loc: 'loc_yatoshin', req: '{"completed_quest": "main_ep07"}' },
    { id: 6009, slug: 'main_ep09', title: '第9話「大名行列の護衛」', lv: 9, loc: 'loc_yatoshin', req: '{"completed_quest": "main_ep08"}' },
    { id: 6010, slug: 'main_ep10', title: '第10話「世界の底が抜ける日」', lv: 10, loc: 'loc_yatoshin', req: '{"completed_quest": "main_ep09"}' },

    { id: 6011, slug: 'main_ep11', title: '第11話「天の壁」', lv: 15, loc: 'loc_haryu', req: '{"completed_quest": "main_ep10"}' },
    { id: 6012, slug: 'main_ep12', title: '第12話「黄河の防衛戦」', lv: 20, loc: 'loc_haryu', req: '{"completed_quest": "main_ep11"}' },
    { id: 6013, slug: 'main_ep13', title: '第13話「不死の傭兵王」', lv: 25, loc: 'loc_haryu', req: '{"completed_quest": "main_ep12"}' },
    { id: 6014, slug: 'main_ep14', title: '第14話「落城の陽光」', lv: 30, loc: 'loc_haryu', req: '{"completed_quest": "main_ep13"}' },
    { id: 6015, slug: 'main_ep15', title: '第15話「未来への楔」', lv: 35, loc: 'loc_haryu', req: '{"completed_quest": "main_ep14"}' },

    { id: 6016, slug: 'main_ep16', title: '第16話「受け継がれし剣」', lv: 40, loc: 'loc_holy_empire', req: '{"completed_quest": "main_ep15", "required_generations": 2}' },
    { id: 6017, slug: 'main_ep17', title: '第17話「鉄の門、黄金の鍵」', lv: 45, loc: 'loc_holy_empire', req: '{"completed_quest": "main_ep16"}' },
    { id: 6018, slug: 'main_ep18', title: '第18話「四国会戦」', lv: 50, loc: 'loc_holy_empire', req: '{"completed_quest": "main_ep17"}' },
    { id: 6019, slug: 'main_ep19', title: '第19話「システム・オーバーライド」', lv: 55, loc: 'loc_holy_empire', req: '{"completed_quest": "main_ep18"}' },
    { id: 6020, slug: 'main_ep20', title: '第20話「蒼き暁」', lv: 60, loc: 'loc_holy_empire', req: '{"completed_quest": "main_ep19"}' },
];

let questsCsv = fs.readFileSync(QUESTS_FILE, 'utf-8');
const linesToAdd = [];
for (const q of mainQuests) {
    // Check if already in file
    if (!questsCsv.includes(q.slug)) {
        // id,slug,title,rec_level,difficulty,time_cost,requirements,is_urgent,chain_id,rewards_summary,_comment
        // Inject nation_id into req to force it cleanly if needed, but since it's "special", it's usually handled by requirement JSON
        const r = JSON.parse(q.req);
        r.nation_id = q.loc;
        if (q.id === 6001) { r.min_level = 1; }
        const reqStr = JSON.stringify(r).replace(/"/g, '""');
        linesToAdd.push(`${q.id},${q.slug},${q.title},${q.lv},${Math.ceil(q.lv/10)},2,"${reqStr}",true,,"Gold:${q.lv*100}|Rep:10",公式メインシナリオ`);
    }
}

if (linesToAdd.length > 0) {
    fs.appendFileSync(QUESTS_FILE, '\n' + linesToAdd.join('\n'));
    console.log(`Added ${linesToAdd.length} main quests to quests_special.csv`);
}

// Generate base scenario node files
const genericNodes = `row_type,node_id,text_label,params,next_node
NODE,start,クエストを開始します。,{type:text, bg:bg_default},
CHOICE,,進む,,battle
NODE,battle,敵が現れた！,{type:battle, enemy_group_id:3},
CHOICE,,戦闘開始,,end_node
NODE,end_node,無事に依頼を達成した。,{type:end_success},
`;

for (const q of mainQuests) {
    const filename = path.join(SCENARIOS_DIR, `${q.id}_${q.slug}.csv`);
    if (!fs.existsSync(filename)) {
        // Create a specialized starting script with speaker image placeholder
        const customScript = `row_type,node_id,text_label,params,next_node
NODE,start,${q.title},"{type:""text"", bg:""bg_default"", ""speaker_image_url"":""https://picsum.photos/120""}",
CHOICE,,戦地へ,,battle
NODE,battle,強力な敵が立ちふさがる！,"{type:""battle"", enemy_group_id:3}",
CHOICE,,交戦,,end_node
NODE,end_node,戦いを生き延びた。,"{type:""end_success""}",
`;
        fs.writeFileSync(filename, customScript);
        console.log(`Created ${filename}`);
    }
}
