import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const rumors = [
    { category: 'lore', content: 'この街のパン屋の娘は、隣国の騎士に恋をしているらしい。手紙を届ける仕事があれば、喜んで引き受けるだろうに。', rarity: 1, nation_tag: null },
    { category: 'lore', content: '旅の吟遊詩人が言うには、世界の果てには「何もない壁」があるそうだ。誰も確かめた者はいないが。', rarity: 1, nation_tag: null },
    { category: 'lore', content: '最近、夜中に町外れの廃墟から光が見えるという噂が絶えない。野次馬が増えて、衛兵が頭を抱えているとか。', rarity: 1, nation_tag: null },
    { category: 'lore', content: 'ある老商人は言う。「金貨は嘘をつかない。嘘をつくのはいつも人間だ」と。', rarity: 1, nation_tag: null },
    { category: 'lore', content: '宿屋の主人の息子が失踪したらしい。隣街に恋人がいると噂されているが、親には内緒にしているようだ。', rarity: 1, nation_tag: null },
    { category: 'lore', content: '街の子供たちの間で「本当のことを言うと舌が抜ける魔女」の話が流行っている。大人たちも少し気になっているようだ。', rarity: 1, nation_tag: null },
    { category: 'lore', content: 'どこかの大商人が、道中で魔物の卵を拾ったとか。孵化したら一体何になるのか、専門家でも意見が割れているそうだ。', rarity: 2, nation_tag: null },
    { category: 'lore', content: '古来、冒険者の間では「最後の宝は、旅そのものだ」という言い伝えがある。信じるかどうかは、あなた次第だ。', rarity: 2, nation_tag: null },
    { category: 'lore', content: '裏通りの薬師が「不老不死の薬」を研究していると噂があるが、本人はただの滋養強壮薬だと言い張っている。', rarity: 2, nation_tag: null },
    { category: 'lore', content: '夜になると、街の広場の噴水が赤く染まると言う者がいる。都市伝説の類いだろうが……確かめた者は口をつぐむ。', rarity: 3, nation_tag: null },
    { category: 'lore', content: 'ローランドの宮廷では、密かに「皇帝の影武者」の採用試験が行われているという。本当かどうかは、誰も知らない。', rarity: 1, nation_tag: 'Roland' },
    { category: 'lore', content: '聖帝国の神殿では、毎年「英雄の夢を見る者」を募集しているそうだ。選ばれた者には特別な神託が下るらしい。', rarity: 1, nation_tag: 'Roland' },
    { category: 'lore', content: '【{loc_name}】の教会の地下には、外から見えない礼拝堂があるという。古い記録には「封印の間」と書かれている。', rarity: 2, nation_tag: 'Roland' },
    { category: 'lore', content: '帝国軍の新兵訓練では、最初の一週間は木の棒で戦うそうだ。「剣より先に覚悟を持て」という伝統らしい。', rarity: 1, nation_tag: 'Roland' },
    { category: 'lore', content: '砂漠の隊商の間では、行方不明の仲間への合図として、砂に三角形を描く習慣があるらしい。', rarity: 1, nation_tag: 'Markand' },
    { category: 'lore', content: '【{loc_name}】の市場では、夜明け前に特別な取引が行われるという。見てはいけないものを見た者は、翌朝には街を去っているとか。', rarity: 2, nation_tag: 'Markand' },
    { category: 'lore', content: 'マルカンドの商人は言う。「契約書にないことは存在しない。契約書にあることだけが現実だ」と。', rarity: 1, nation_tag: 'Markand' },
    { category: 'lore', content: '砂漠の奥に「幻の都市」があると言われている。地図には載っていないが、信じる隊商人は少なくない。', rarity: 2, nation_tag: 'Markand' },
    { category: 'lore', content: '【{loc_name}】では、夜に口笛を吹くと妖怪を呼ぶと言われている。信心深い者ほど守っている。', rarity: 1, nation_tag: 'Yato' },
    { category: 'lore', content: '夜刀の里では、生まれた子に名前を与える前に「星読み師」に占いを頼む習慣があるそうだ。', rarity: 1, nation_tag: 'Yato' },
    { category: 'lore', content: '忍びの集落には「存在しない武器」がある、という話が絶えない。それが何かを知る者は既に何者かに消されたと言う。', rarity: 2, nation_tag: 'Yato' },
    { category: 'lore', content: '【{loc_name}】に伝わる百年前の記録には「誰も侵せない剣客」の名が刻まれているが、その後の記述は切り取られている。', rarity: 2, nation_tag: 'Yato' },
    { category: 'lore', content: '華龍では、食事の前に必ず東の方角に一礼をする習慣がある。旅人が知らずに無礼を働くことも多いが、笑って許してくれるのが慣習だ。', rarity: 1, nation_tag: 'Karyu' },
    { category: 'lore', content: '【{loc_name}】の古書によれば、建国の英雄は実は女性だったと書かれているが、公式の歴史書からは削除されているとか。', rarity: 2, nation_tag: 'Karyu' },
    { category: 'lore', content: '華龍の占い師は言う。「竜年に生まれた者は、必ず竜と出会う」と。その竜が本物かどうかは、別の話だが。', rarity: 1, nation_tag: 'Karyu' },
    { category: 'lore', content: 'あの山の頂上には仙人が住んでいると聞いて登った者が何人もいるが、全員「何もなかった」と帰ってくる。仙人の仕業だという説がある。', rarity: 2, nation_tag: 'Karyu' },
    { category: 'secret', content: '【{loc_name}】の酒場の常連によれば、最近「組合には出ていない」依頼があるらしい。腕に自信のある者だけに声がかかるとか。', rarity: 2, nation_tag: null },
    { category: 'secret', content: '崩壊寸前の街には、公開されていない「闇の取引」が増えるという。危険を承知の上で踏み込む者だけが知る世界がある。', rarity: 3, nation_tag: null },
    { category: 'secret', content: '旅人の噂では、某所で「英雄だけが受けられる任務」があるという。名声を積み重ねた者にしか声はかからないらしいが。', rarity: 2, nation_tag: null }
];

async function seed() {
    console.log('Seeding rumors...');
    
    // First clear existing
    const { error: delError } = await supabase.from('rumors').delete().neq('id', 0);
    if (delError) {
        console.error('Delete error', delError);
        return;
    }
    
    // Insert new
    const { error: insError } = await supabase.from('rumors').insert(rumors);
    if (insError) {
        console.error('Insert error', insError);
        return;
    }
    
    console.log('Successfully seeded rumors!');
}
seed();
