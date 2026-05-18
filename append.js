const fs = require('fs');
const lines = [
'6105,qst_legend_baphomet,悪魔バフォメット,25,6,8,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[封印指定] 古代の封印が解け、大悪魔バフォメットが地上に現れた。討伐せよ。',
'6106,qst_legend_angel,降臨せし天使,25,6,8,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[神罰] 天空から降臨した天使が聖都を焼き払おうとしている。止めるのは貴方だ。',
'6107,qst_legend_dragon,デザートドラゴン,27,6,10,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[竜殺し] マルカンドの大砂漠に古代の砂竜が覚醒した。命知らずの猛者を求む。',
'6108,qst_legend_kirin,神域の幻獣,27,6,10,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[封印指定] 華龍国の霊峰に神獣・麒麟が降臨し、結界を張って人の立ち入りを拒んでいる。',
'6109,qst_legend_golem,オメガ・ゴーレム,25,6,8,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[封印指定] 古代魔導帝国の遺跡から起動した巨大ゴーレムが都市に向かっている。迎撃せよ。',
'6110,qst_legend_kraken,大海の悪夢 クラーケン,28,6,12,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[封印指定] 交易海域に巨大な海魔クラーケンが出現し、船舶を沈めている。海上決戦に挑め。',
'6111,qst_legend_minotaur,迷宮の覇者 牛頭王,26,6,9,"{""completed_quest"":""main_ep15""}",false,,,冒険者ギルド,[封印指定] 夜刀神国の地下に古代の迷宮が出現し、牛頭の化け物が支配している。'
];
fs.appendFileSync('d:/dev/code-wirth-dawn/src/data/csv/quests_special.csv', '\n' + lines.join('\n') + '\n', 'utf8');
console.log('Appended successfully');
