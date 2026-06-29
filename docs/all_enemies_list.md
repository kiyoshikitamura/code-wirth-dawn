# エネミー（敵）マスタデータ一覧

本ドキュメントは、ゲーム内に登場するすべてのアクティブエネミー（ザコ、ボス、賞金稼ぎ、シナリオボス、および大天使・神々などの特殊エネミー）のパラメータ、獲得経験値・ゴールド、ドロップアイテム、および行動ルーチン（AI）を網羅した一覧カタログです。

---

## 1. エネミー行動AI（ルーチン）の解説

各エネミーには `enemy_actions.csv` にて定義された固有のスキル発動確率と発動条件が存在します。
* **確率（prob）**: 条件を満たしている場合に発動する基礎確率（合計が100%になるように設計されています）。条件が満たされていない場合は、他の条件なし行動からランダムに選択されます。
* **発動条件（condition_type / value）**:
  - `turn_mod`: `N` ターン毎に必ず発動する強力なスキル（例: `turn_mod = 4` は4ターン毎に最優先で発動）。
  - `hp_under`: 残りHPが `N` %以下になった際に最優先で発動（基本は戦闘中1回のみ、または毎ターン判定）。

---

## 2. 全エネミーカタログ（164体）

| ID | エネミー名 (スラグ) | LV / HP | ATK / DEF | EXP / Gold | ドロップ | 区分 | 行動ルーチン（使用スキルと発動条件） |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1001** | **ブルースライム**<br>(`enemy_slime_blue`) | Lv.1<br>HP: 20 | ATK: 10<br>DEF: 1 | 3 EXP<br>10 G | - | random | ・**体当たり** (100%) |
| **1002** | **レッドスライム**<br>(`enemy_slime_red`) | Lv.3<br>HP: 40 | ATK: 16<br>DEF: 2 | 6 EXP<br>20 G | [傷薬](file:///d:/dev/code-wirth-dawn/src/data/csv/items.csv#L2) | random | ・**体当たり** (80%)<br>・**強打** (20%) |
| **1003** | **キングスライム**<br>(`enemy_slime_king`) | Lv.8<br>HP: 150 | ATK: 38<br>DEF: 5 | 40 EXP<br>100 G | クイックポーション<br>(ID:202) | random | ・**強打** (60%)<br>・**咆哮** (40%)<br>・**雄叫び** (4ターン毎に100%) |
| **1011** | **ゴブリン**<br>(`enemy_goblin`) | Lv.2<br>HP: 30 | ATK: 14<br>DEF: 2 | 4 EXP<br>15 G | - | random | ・**体当たり** (80%)<br>・**裂傷の爪** (20%) |
| **1012** | **ゴブリンアーチャー**<br>(`enemy_goblin_archer`) | Lv.3<br>HP: 25 | ATK: 20<br>DEF: 1 | 5 EXP<br>20 G | - | random | ・**矢を射る** (80%)<br>・**砂塵** (20%) |
| **1013** | **ゴブリンシャーマン**<br>(`enemy_goblin_shaman`) | Lv.5<br>HP: 50 | ATK: 24<br>DEF: 2 | 8 EXP<br>30 G | - | random | ・**火の玉** (60%)<br>・**小回復** (3ターン毎に30%)<br>・**呪詛** (4ターン毎に100%) |
| **1014** | **ホブゴブリン**<br>(`enemy_hobgoblin`) | Lv.10<br>HP: 120 | ATK: 42<br>DEF: 8 | 35 EXP<br>80 G | ポーションM<br>(ID:205) | random | ・**強打** (60%)<br>・**咆哮** (30%)<br>・**雄叫び** (3ターン毎に100%) |
| **1021** | **ワイルドドッグ**<br>(`enemy_wild_dog`) | Lv.3<br>HP: 35 | ATK: 16<br>DEF: 1 | 5 EXP<br>10 G | - | random | ・**体当たり** (70%)<br>・**裂傷の爪** (30%) |
| **1022** | **キラーウルフ**<br>(`enemy_killer_wolf`) | Lv.5<br>HP: 60 | ATK: 28<br>DEF: 3 | 12 EXP<br>25 G | - | random | ・**体当たり** (50%)<br>・**裂傷の爪** (30%)<br>・**強打** (20%) |
| **1023** | **ジャイアントベア**<br>(`enemy_giant_bear`) | Lv.8<br>HP: 150 | ATK: 48<br>DEF: 5 | 30 EXP<br>50 G | - | random | ・**強打** (70%)<br>・**裂傷の爪** (20%)<br>・**雄叫び** (4ターン毎に100%) |
| **1024** | **キマイラ**<br>(`enemy_chimera`) | Lv.15<br>HP: 400 | ATK: 75<br>DEF: 15 | 150 EXP<br>300 G | [砥石](file:///d:/dev/code-wirth-dawn/src/data/csv/items.csv#L9) | random | ・**強打** (40%)<br>・**火の玉** (25%)<br>・**裂傷 of 爪** (15%)<br>・**咆哮** (20%) |
| **1031** | **スケルトン**<br>(`enemy_skeleton`) | Lv.4<br>HP: 45 | ATK: 22<br>DEF: 3 | 8 EXP<br>15 G | - | random | ・**体当たり** (70%)<br>・**強打** (30%) |
| **1032** | **ゾンビ**<br>(`enemy_zombie`) | Lv.6<br>HP: 80 | ATK: 30<br>DEF: 2 | 12 EXP<br>20 G | - | random | ・**体当たり** (60%)<br>・**毒の息** (20%)<br>・**小回復** (3ターン毎に20%) |
| **1033** | **レイス**<br>(`enemy_wraith`) | Lv.10<br>HP: 100 | ATK: 42<br>DEF: 15 | 25 EXP<br>40 G | - | random | ・**ダークフレア** (60%)<br>・**生命吸収** (3ターン毎に20%)<br>・**呪詛** (4ターン毎に100%) |
| **1034** | **リッチ**<br>(`enemy_lich`) | Lv.20<br>HP: 300 | ATK: 78<br>DEF: 10 | 200 EXP<br>500 G | [聖水](file:///d:/dev/code-wirth-dawn/src/data/csv/items.csv#L7) | random | ・**ダークフレア** (50%)<br>・**魂抜き** (3ターン毎に10%)<br>・**自己再生** (4ターン毎に30%)<br>・**呪詛** (5ターン毎に100%) |
| **1101** | **チンピラ**<br>(`enemy_bandit_thug`) | Lv.2<br>HP: 40 | ATK: 20<br>DEF: 2 | 6 EXP<br>30 G | - | random | ・**体当たり** (80%)<br>・**裂傷の爪** (20%) |
| **1102** | **野盗の射手**<br>(`enemy_bandit_archer`) | Lv.4<br>HP: 35 | ATK: 24<br>DEF: 1 | 7 EXP<br>40 G | - | random | ・**矢を射る** (80%)<br>・**砂塵** (20%) |
| **1103** | **野盗の用心棒**<br>(`enemy_bandit_guard`) | Lv.6<br>HP: 80 | ATK: 36<br>DEF: 5 | 15 EXP<br>80 G | - | random | ・**強打** (70%)<br>・**鎧砕き** (30%) |
| **1104** | **盗賊団の頭領**<br>(`enemy_bandit_boss`) | Lv.12<br>HP: 200 | ATK: 60<br>DEF: 8 | 80 EXP<br>200 G | 盗賊の秘宝<br>(ID:5001等) | quest_only | ・**強打** (50%)<br>・**咆哮** (20%)<br>・**雄叫び** (3ターン毎に100%)<br>・**鎧砕き** (30%) |
| **1111** | **狂信者**<br>(`enemy_cultist`) | Lv.5<br>HP: 60 | ATK: 30<br>DEF: 2 | 10 EXP<br>30 G | - | random | ・**体当たり** (50%)<br>・**火の玉** (40%)<br>・**呪詛** (4ターン毎に100%) |
| **1112** | **邪教の司祭**<br>(`enemy_cult_priest`) | Lv.9<br>HP: 100 | ATK: 48<br>DEF: 3 | 25 EXP<br>80 G | - | random | ・**ダークフレア** (60%)<br>・**呪詛** (20%)<br>・**小回復** (3ターン毎に20%) |
| **1113** | **教団の執行者**<br>(`enemy_cult_exec`) | Lv.14<br>HP: 180 | ATK: 65<br>DEF: 10 | 60 EXP<br>150 G | - | random | ・**強打** (60%)<br>・**ダークフレア** (20%)<br>・**鎧砕き** (4ターン毎に100%) |
| **1114** | **サキュバス**<br>(`enemy_succubus`) | Lv.12<br>HP: 110 | ATK: 45<br>DEF: 5 | 60 EXP<br>100 G | - | random | ・**魅惑の歌** (30%)<br>・**火の玉** (30%)<br>・**ダークフレア** (40%) |
| **1121** | **見習い暗殺者**<br>(`enemy_assassin_trainee`) | Lv.8<br>HP: 70 | ATK: 42<br>DEF: 2 | 20 EXP<br>50 G | - | random | ・**体当たり** (50%)<br>・**毒針** (30%)<br>・**裂傷の爪** (20%) |
| **1122** | **凄腕の刺客**<br>(`enemy_assassin_master`) | Lv.15<br>HP: 150 | ATK: 75<br>DEF: 5 | 50 EXP<br>150 G | - | random | ・**強打** (40%)<br>・**毒針** (40%)<br>・**鎧砕き** (4ターン毎に100%) |
| **1123** | **影の頭目**<br>(`enemy_assassin_boss`) | Lv.22<br>HP: 400 | ATK: 90<br>DEF: 12 | 200 EXP<br>500 G | 忍びの極意書<br>(ID:224) | quest_only | ・**暗殺術** (30%)<br>・**毒針** (40%)<br>・**鎧砕き** (3ターン毎に100%)<br>・**雄叫び** (5ターン毎に100%) |
| **1131** | **飢えた市民**<br>(`enemy_mob`) | Lv.2<br>HP: 15 | ATK: 5<br>DEF: 1 | 2 EXP<br>5 G | - | quest_only | ・**体当たり** (100%) |
| **1132** | **巨大ネズミ**<br>(`enemy_giant_rat`) | Lv.2<br>HP: 20 | ATK: 8<br>DEF: 1 | 3 EXP<br>10 G | - | random | ・**体当たり** (60%)<br>・**毒針** (40%) |
| **1133** | **ネズミの女王**<br>(`enemy_giant_rat_alpha`) | Lv.5<br>HP: 180 | ATK: 14<br>DEF: 3 | 15 EXP<br>30 G | - | quest_only | ・**毒針** (60%)<br>・**連続噛みつき** (40%) |
| **1201** | **聖騎士の亡霊**<br>(`enemy_roland_ghost_knight`) | Lv.10<br>HP: 120 | ATK: 40<br>DEF: 10 | 40 EXP<br>80 G | - | random | ・**強打** (60%)<br>・**ホーリーレイ** (20%)<br>・**呪詛** (4ターン毎に100%) |
| **1202** | **ガーゴイル**<br>(`enemy_roland_gargoyle`) | Lv.12<br>HP: 150 | ATK: 45<br>DEF: 25 | 60 EXP<br>100 G | 結界石の破片<br>(ID:214) | random | ・**強打** (60%)<br>・**石化の視線** (3ターン毎に20%)<br>・**鎧砕き** (20%) |
| **1203** | **異端の魔女**<br>(`enemy_roland_witch`) | Lv.15<br>HP: 100 | ATK: 60<br>DEF: 5 | 80 EXP<br>120 G | - | random | ・**ダークフレア** (60%)<br>・**生命吸収** (3ターン毎に20%)<br>・**呪詛** (4ターン毎に100%) |
| **1204** | **堕天使**<br>(`enemy_roland_fallen_angel`) | Lv.25<br>HP: 600 | ATK: 100<br>DEF: 20 | 400 EXP<br>1000 G | 天使の羽衣<br>(ID:219) | random | ・**ホーリーレイ** (40%)<br>・**ダークフレア** (40%)<br>・**自己再生** (5ターン毎に100%)<br>・**雄叫び** (HP50%以下で100%発動) |
| **1211** | **デザートスコーピオン**<br>(`enemy_markand_scorpion`) | Lv.8<br>HP: 90 | ATK: 30<br>DEF: 15 | 30 EXP<br>50 G | - | random | ・**体当たり** (40%)<br>・**毒針** (40%)<br>・**砂塵** (20%) |
| **1212** | **サンドワーム**<br>(`enemy_markand_sand_worm`) | Lv.14<br>HP: 180 | ATK: 45<br>DEF: 5 | 70 EXP<br>120 G | - | random | ・**強打** (50%)<br>・**砂のブレス** (20%)<br>・**毒の息** (30%) |
| **1213** | **砂漠の魔人**<br>(`enemy_markand_djinn`) | Lv.18<br>HP: 240 | ATK: 70<br>DEF: 10 | 120 EXP<br>200 G | 魔人の宝珠<br>(mat_djinn_orb) | random | ・**火の玉** (50%)<br>・**砂塵** (30%)<br>・**呪詛** (4ターン毎に100%) |
| **1214** | **デザートドラゴン**<br>(`enemy_markand_desert_dragon`) | Lv.30<br>HP: 800 | ATK: 120<br>DEF: 30 | 600 EXP<br>1500 G | 竜の砂スパイス<br>(item_desert_spice) | random | ・**竜の息吹** (10%)<br>・**強打** (50%)<br>・**砂塵** (20%)<br>・**雄叫び** (4ターン毎に100%)<br>・**自己再生** (HP30%以下で100%発動) |
| **1221** | **鬼火**<br>(`enemy_yato_onibi`) | Lv.6<br>HP: 50 | ATK: 25<br>DEF: 1 | 20 EXP<br>30 G | - | random | ・**火の玉** (70%)<br>・**砂塵** (30%) |
| **1222** | **からかさ小僧**<br>(`enemy_yato_karakasa`) | Lv.10<br>HP: 80 | ATK: 35<br>DEF: 3 | 40 EXP<br>60 G | - | random | ・**体当たり** (60%)<br>・**砂塵** (30%)<br>・**呪詛** (4ターン毎に100%) |
| **1223** | **からす天狗**<br>(`enemy_yato_tengu`) | Lv.16<br>HP: 160 | ATK: 55<br>DEF: 8 | 90 EXP<br>150 G | 天狗の羽団扇<br>(item_tengu_fan) | random | ・**矢を射る** (40%)<br>・**居合斬り** (40%)<br>・**裂傷の爪** (20%) |
| **1224** | **赤鬼**<br>(`enemy_yato_akaoni`) | Lv.24<br>HP: 500 | ATK: 110<br>DEF: 15 | 350 EXP<br>800 G | 鬼の毒薬<br>(item_yato_poison) | random | ・**強打** (60%)<br>・**咆哮** (20%)<br>・**雄叫び** (3ターン毎に100%)<br>・**鎧砕き** (5ターン毎に100%) |
| **1231** | **キョンシー**<br>(`enemy_karyu_jiangshi`) | Lv.9<br>HP: 90 | ATK: 35<br>DEF: 8 | 35 EXP<br>60 G | - | random | ・**体当たり** (60%)<br>・**魂抜き** (3ターン毎に20%)<br>・**毒針** (20%) |
| **1232** | **妖狐**<br>(`enemy_karyu_fox`) | Lv.15<br>HP: 140 | ATK: 50<br>DEF: 5 | 75 EXP<br>130 G | - | random | ・**火の玉** (40%)<br>・**ダークフレア** (30%)<br>・**魅惑の歌** (30%) |
| **1233** | **兵馬俑**<br>(`enemy_karyu_terracotta`) | Lv.18<br>HP: 200 | ATK: 60<br>DEF: 20 | 110 EXP<br>180 G | 結界石の破片<br>(ID:214) | random | ・**強打** (70%)<br>・**鎧砕き** (30%) |
| **1234** | **麒麟**<br>(`enemy_karyu_kirin`) | Lv.28<br>HP: 700 | ATK: 130<br>DEF: 25 | 500 EXP<br>1200 G | 麒麟のたてがみ<br>(mat_kirin_mane) | random | ・**雷撃** (40%)<br>・**ホーリーレイ** (40%)<br>・**自己再生** (5ターン毎に20%) |
| **1301** | **新米ハンター**<br>(`enemy_bounty_hunter_new`) | Lv.10<br>HP: 100 | ATK: 40<br>DEF: 5 | 50 EXP<br>0 G | - | bounty | ・**体当たり** (70%)<br>・**裂傷の爪** (30%) |
| **1302** | **賞金稼ぎの剣士**<br>(`enemy_bounty_hunter_sword`) | Lv.12<br>HP: 120 | ATK: 50<br>DEF: 8 | 60 EXP<br>0 G | - | bounty | ・**強打** (60%)<br>・**追跡の刃** (20%)<br>・**鎧砕き** (20%) |
| **1303** | **賞金稼ぎの狩人**<br>(`enemy_bounty_hunter_archer`) | Lv.9<br>HP: 90 | ATK: 60<br>DEF: 3 | 60 EXP<br>0 G | - | bounty | ・**矢を射る** (70%)<br>・**砂塵** (30%) |
| **1311** | **ベテランハンター**<br>(`enemy_bounty_hunter_vet`) | Lv.25<br>HP: 250 | ATK: 80<br>DEF: 15 | 150 EXP<br>0 G | - | bounty | ・**滅多斬り** (40%)<br>・**強打** (40%)<br>・**雄叫び** (3ターン毎に100%) |
| **1312** | **魔術狩り**<br>(`enemy_bounty_mage_hunter`) | Lv.20<br>HP: 200 | ATK: 90<br>DEF: 10 | 150 EXP<br>0 G | - | bounty | ・**ダークフレア** (60%)<br>・**生命吸収** (3ターン毎に20%)<br>・**呪詛** (4ターン毎に100%) |
| **1313** | **重装の処刑人**<br>(`enemy_bounty_executioner`) | Lv.40<br>HP: 400 | ATK: 100<br>DEF: 25 | 200 EXP<br>0 G | - | bounty | ・**処刑の一撃** (40%)<br>・**強打** (30%)<br>・**鎧砕き** (30%) |
| **1321** | **王国公認の凶刃**<br>(`enemy_bounty_royal_blade`) | Lv.60<br>HP: 600 | ATK: 140<br>DEF: 20 | 400 EXP<br>0 G | - | bounty | ・**滅多斬り** (50%)<br>・**処刑の一撃** (30%)<br>・**雄叫び** (3ターン毎に100%) |
| **1322** | **伝説の傭兵**<br>(`enemy_bounty_legend`) | Lv.90<br>HP: 900 | ATK: 160<br>DEF: 30 | 600 EXP<br>0 G | - | bounty | ・**滅多斬り** (40%)<br>・**処刑の一撃** (40%)<br>・**雄叫び** (3ターン毎に100%)<br>・**鎧砕き** (5ターン毎に100%) |
| **1323** | **静寂の死神**<br>(`enemy_bounty_reaper`) | Lv.75<br>HP: 750 | ATK: 180<br>DEF: 15 | 600 EXP<br>0 G | - | bounty | ・**暗殺術** (30%)<br>・**処刑の一撃** (40%)<br>・**毒針** (30%) |
| **2101** | **帝国精鋭部隊**<br>(`enemy_boss_ep5_squad`) | Lv.12<br>HP: 500 | ATK: 45<br>DEF: 10 | 0 EXP<br>0 G | - | quest_only | ・**強打** (70%)<br>・**防御貫通強打** (3ターン毎に100%)<br>・**雄叫び** (4ターン毎に100%) |
| **2102** | **神代の守護竜**<br>(`enemy_boss_ep10_dragon`) | Lv.25<br>HP: 1200 | ATK: 55<br>DEF: 18 | 0 EXP<br>0 G | - | quest_only | ・**竜の息吹** (50%)<br>・**雷撃** (20%)<br>・**ホーリーレイ** (HP50%以下で80%発動)<br>・**自己再生** (HP30%以下で100%発発動) |
| **2103** | **主神**<br>(`enemy_boss_ep20_god`) | Lv.50<br>HP: 9999 | ATK: 150<br>DEF: 25 | 0 EXP<br>0 G | - | quest_only | ・**ホーリーレイ** (40%)<br>・**神の粛清** (5ターン毎に100%)<br>・**神の怒り** (HP20%以下で100%発動)<br>・**鎧砕き** (4ターン毎に100%) |
| **2104** | **不死の傭兵王**<br>(`enemy_boss_mercenary_king`) | Lv.25<br>HP: 2000 | ATK: 75<br>DEF: 15 | 0 EXP<br>0 G | - | quest_only | ・**強打** (40%)<br>・**連続攻撃** (30%)<br>・**鎧砕き** (3ターン毎に100%)<br>・**激昂** (HP40%以下で100%発動)<br>・**狂暴化** (HP20%以下で100%発動) |
| **2105** | **遺跡の守護者**<br>(`enemy_boss_ruin_guardian`) | Lv.35<br>HP: 3000 | ATK: 90<br>DEF: 20 | 0 EXP<br>0 G | - | quest_only | ・**強打** (40%)<br>・**全体攻撃** (30%)<br>・**シールドバッシュ** (3ターン毎に100%)<br>・**暗黒の癒し** (HP40%以下で100%)<br>・**終焉の息吹** (HP20%以下で100%) |
| **2106** | **天門 of 番人**<br>(`enemy_boss_gate_keeper`) | Lv.45<br>HP: 4000 | ATK: 110<br>DEF: 22 | 0 EXP<br>0 G | - | quest_only | ・**ホーリーレイ** (40%)<br>· **雷撃** (30%)<br>・**死の宣告** (4ターン毎に100%)<br>・**暗黒の癒し** (HP35%以下で100%)<br>・**終焉の息吹** (HP20%以下で100%) |
| **2107** | **天使兵**<br>(`enemy_angel_soldier`) | Lv.40<br>HP: 800 | ATK: 80<br>DEF: 18 | 0 EXP<br>0 G | - | quest_only | ・**ホーリーレイ** (60%)<br>・**体当たり** (40%) |
| **2108** | **大天使**<br>(`enemy_boss_archangel`) | Lv.48<br>HP: 3500 | ATK: 100<br>DEF: 20 | 0 EXP<br>0 G | - | quest_only | ・**ホーリーレイ** (40%)<br>・**全体攻撃** (30%)<br>・**死の宣告** (4ターン毎に100%)<br>・**暗黒の癒し** (HP30%以下で100%)<br>・**終焉 of 息吹** (HP20%以下で100%) |
| **2109** | **システムの守護者**<br>(`enemy_boss_system_guard`) | Lv.55<br>HP: 6000 | ATK: 130<br>DEF: 25 | 0 EXP<br>0 G | - | quest_only | ・**防御貫通強打** (40%)<br>・**全体攻撃** (30%)<br>・**鎧砕き** (3ターン毎に100%)<br>・**暗黒の癒し** (HP30%以下で100%)<br>・**終焉の息吹** (5ターン毎に100%) |
| **2110** | **神竜**<br>(`enemy_boss_god_dragon`) | Lv.58<br>HP: 8000 | ATK: 145<br>DEF: 28 | 0 EXP<br>0 G | - | quest_only | ・**竜の息吹** (40%)<br>・**全体攻撃** (30%)<br>・**終焉の息吹** (4ターン毎に100%)<br>・**暗黒の癒し** (HP30%以下で100%)<br>・**激昂** (HP20%以下で100%) |
| **2111** | **白磁の使徒**<br>(`enemy_apostle_soldier`) | Lv.15<br>HP: 300 | ATK: 55<br>DEF: 10 | 0 EXP<br>0 G | - | quest_only | ・**ホーリーレイ** (50%)<br>・**体当たり** (50%) |
| **2112** | **熾天使**<br>(`enemy_seraphim`) | Lv.17<br>HP: 600 | ATK: 70<br>DEF: 12 | 0 EXP<br>0 G | - | quest_only | ・**ホーリーレイ** (40%)<br>・**全体攻撃** (30%)<br>・**小回復** (3ターン毎に100%) |
| **2120** | **大天使ウリエル**<br>(`enemy_archangel_uriel`) | Lv.14<br>HP: 800 | ATK: 65<br>DEF: 12 | 0 EXP<br>0 G | - | quest_only | ・**強打** (40%)<br>・**炎獄の裁き** (40% / 3ターン毎に100%)<br>・**激昂** (HP30%以下で100%発動) |
| **2121** | **大天使ラファエル**<br>(`enemy_archangel_raphael`) | Lv.15<br>HP: 900 | ATK: 60<br>DEF: 14 | 0 EXP<br>0 G | - | quest_only | ・**強打** (40%)<br>・**慈悲の鎖** (40% / HP50%以下で100%)<br>・**自己再生** (4ターン毎に100%) |
| **2122** | **大天使ガブリエル**<br>(`enemy_archangel_gabriel`) | Lv.16<br>HP: 1000 | ATK: 70<br>DEF: 13 | 0 EXP<br>0 G | - | quest_only | ・**ホーリーレイ** (40%)<br>・**啓示の角笛** (3ターン毎に100%)<br>・**ダークフレア** (40%)<br>・**呪詛** (5ターン毎に100%) |
| **2123** | **大天使ミカエル**<br>(`enemy_archangel_michael`) | Lv.17<br>HP: 1200 | ATK: 80<br>DEF: 16 | 0 EXP<br>0 G | - | quest_only | ・**天軍の剣** (40% / 3ターン毎に100%)<br>・**強打** (40%)<br>・**雄叫び** (4ターン毎に100%)<br>・**狂暴化** (HP25%以下で100%) |
| **2130** | **冥王ハデス**<br>(`enemy_god_hades`) | Lv.20<br>HP: 2000 | ATK: 85<br>DEF: 18 | 0 EXP<br>0 G | - | quest_only | ・**ダークフレア** (30%)<br>・**冥府の門** (30% / 3ターン毎に100%)<br>・**魂抜き** (20%)<br>・**鎧砕き** (4ターン毎に100%)<br>・**強力再生** (HP40%以下で100%発動) |
| **2131** | **軍神アレス**<br>(`enemy_god_ares`) | Lv.20<br>HP: 1800 | ATK: 95<br>DEF: 15 | 0 EXP<br>0 G | - | quest_only | ・**強打** (30%)<br>・**戦神の剛撃** (40% / 4ターン毎に100%)<br>・**雄叫び** (3ターン毎に100%)<br>・**狂暴化** (HP30%以下で100%) |
| **2132** | **女神アルテミス**<br>(`enemy_god_artemis`) | Lv.20<br>HP: 1600 | ATK: 90<br>DEF: 20 | 0 EXP<br>0 G | - | quest_only | ・**月光の狩り** (50% / 3ターン毎に100%)<br>・**矢を射る** (30%)<br>・**鎧砕き** (4ターン毎に100%)<br>・**狂暴化** (HP30%以下で100%) |
| **2133** | **全能神ゼウス**<br>(`enemy_god_zeus_weak`) | Lv.25<br>HP: 3000 | ATK: 110<br>DEF: 22 | 0 EXP<br>0 G | - | quest_only | ・**雷霆** (50% / 3ターン毎に100%)<br>・**強打** (30%)<br>・**鎧砕き** (4ターン毎に100%)<br>・**狂暴化** (HP25%以下で100%) |
| **2134** | **全能神ゼウス(強)**<br>(`enemy_god_zeus_strong`) | Lv.25<br>HP: 4500 | ATK: 165<br>DEF: 33 | 0 EXP<br>0 G | - | quest_only | ・**雷霆** (40% / 4ターン毎に100%)<br>・**強打** (20%)<br>・**神罰の嵐** (3ターン毎に100%)<br>・**イージスの盾** (5ターン毎に100%)<br>・**狂暴化** (HP25%以下で100%)<br>・**神の怒り** (HP15%以下で100%) |
| **6001** | **骸骨狂王**<br>(`boss_skeleton_king`) | Lv.15<br>HP: 500 | ATK: 55<br>DEF: 10 | 150 EXP<br>500 G | - | quest_only | ・**強打** (50%)<br>・**鎧砕き** (3ターン毎に100%)<br>・**激昂** (HP50%以下で100%)<br>・**終焉の息吹** (5ターン毎に100%)<br>・**雄叫び** (4ターン毎に100%) |
| **6002** | **マザーワーム**<br>(`boss_queen_worm`) | Lv.18<br>HP: 700 | ATK: 60<br>DEF: 8 | 200 EXP<br>600 G | - | quest_only | ・**毒の息** (40%)<br>・**強打** (60%)<br>・**終焉の息吹** (4ターン毎に100%)<br>・**激昂** (HP50%以下で100%)<br>・**暗黒の癒し** (HP30%以下で100%) |
| **6003** | **剛腕赤鬼**<br>(`boss_red_ogre`) | Lv.16<br>HP: 600 | ATK: 65<br>DEF: 5 | 180 EXP<br>500 G | - | quest_only | ・**強打** (50%)<br>・**全体攻撃** (30%)<br>・**雄叫び** (3ターン毎に100%)<br>・**終焉の息吹** (5ターン毎に100%)<br>・**狂暴化** (HP25%以下で100%) |
| **6004** | **霊山の雷獣**<br>(`boss_thunder_beast`) | Lv.20<br>HP: 450 | ATK: 70<br>DEF: 5 | 250 EXP<br>700 G | - | quest_only | ・**雷撃** (40%)<br>・**強打** (60%)<br>・**終焉の息吹** (5ターン毎に100%)<br>・**激昂** (HP50%以下で100%)<br>・**咆哮(スタン)** (4ターン毎に100%) |
| **6005** | **グリフォン・ロード**<br>(`boss_griffon_lord`) | Lv.18<br>HP: 600 | ATK: 60<br>DEF: 10 | 200 EXP<br>600 G | - | quest_only | ・**強打** (40%)<br>・**裂傷の爪** (30%)<br>・**連続攻撃** (30%)<br>・**終焉の息吹** (4ターン毎に100%)<br>・**激昂** (HP50%以下で100%) |
| **6006** | **エント長**<br>(`boss_treant_elder`) | Lv.15<br>HP: 800 | ATK: 45<br>DEF: 15 | 150 EXP<br>500 G | - | quest_only | ・**強打** (50%)<br>・**全体攻撃** (30%)<br>・**強力再生** (3ターン毎に100%)<br>・**毒の息** (20%)<br>・**激昂** (HP50%以下で100%) |
| **6011** | **元大司教**<br>(`boss_fallen_bishop`) | Lv.22<br>HP: 400 | ATK: 65<br>DEF: 12 | 300 EXP<br>1000 G | - | quest_only | ・**ダークフレア** (50%)<br>・**呪詛** (3ターン毎に100%)<br>・**死の宣告** (4ターン毎に100%)<br>・**暗黒の癒し** (5ターン毎に100%)<br>・**狂暴化** (HP25%以下で100%) |
| **6012** | **腐敗枢機卿**<br>(`boss_corrupt_cardinal`) | Lv.24<br>HP: 500 | ATK: 60<br>DEF: 15 | 350 EXP<br>1200 G | - | quest_only | ・**ダークフレア** (40%)<br>・**命の収奪** (20%)<br>・**呪詛** (3ターン毎に100%)<br>・**鎧砕き** (4ターン毎に100%)<br>・**激昂** (HP50%以下で100%) |
| **6013** | **義剣の剣豪**<br>(`boss_mad_ronin`) | Lv.20<br>HP: 350 | ATK: 75<br>DEF: 5 | 250 EXP<br>800 G | - | quest_only | ・**居合斬り** (40%)<br>・**連続攻撃** (30%)<br>・**反撃の構え** (3ターン毎に100%)<br>・**終焉の息吹** (HP30%以下で100%)<br>・**狂暴化** (HP25%以下で100%) |
| **6014** | **暗殺ギルド長**<br>(`boss_assassin_master`) | Lv.22<br>HP: 300 | ATK: 80<br>DEF: 3 | 300 EXP<br>900 G | - | quest_only | ・**暗殺術** (30%)<br>・**毒針** (30%)<br>・**連続攻撃** (40%)<br>・**鎧砕き** (3ターン毎に100%)<br>・**狂暴化** (HP25%以下で100%) |
| **6015** | **海賊船長**<br>(`boss_pirate_king`) | Lv.18<br>HP: 450 | ATK: 65<br>DEF: 10 | 200 EXP<br>700 G | - | quest_only | ・**強打** (40%)<br>・**シールドバッシュ** (30%)<br>・**裂傷の爪** (30%)<br>・**鎧砕き** (4ターン毎に100%)<br>・**激昂** (HP50%以下で100%) |
| **6016** | **反乱軍指導者**<br>(`boss_rebel_leader`) | Lv.20<br>HP: 500 | ATK: 60<br>DEF: 12 | 250 EXP<br>800 G | - | quest_only | ・**強打** (40%)<br>・**全体攻撃** (30%)<br>・**雄叫び** (3ターン毎に100%)<br>・**死の宣告** (5ターン毎に100%)<br>・**狂暴化** (HP25%以下で100%) |
| **6017** | **錬金強化人間**<br>(`boss_gold_merchant`) | Lv.25<br>HP: 700 | ATK: 70<br>DEF: 15 | 400 EXP<br>1200 G | - | quest_only | ・**強打** (30%)<br>・**シールドバッシュ** (30%)<br>・**鎧砕き** (30%)<br>・**暗黒の癒し** (4ターン毎に100%)<br>・**狂暴化** (HP25%以下で100%) |
| **6021** | **バフォメット**<br>(`boss_demon_baphomet`) | Lv.30<br>HP: 900 | ATK: 85<br>DEF: 18 | 500 EXP<br>1500 G | - | quest_only | ・**地獄の業火** (40%)<br>・**ダークフレア** (30%)<br>・**精神汚染** (3ターン毎に100%)<br>・**終焉の息吹** (5ターン毎に100%)<br>・**暗黒再生** (HP40%以下で100%)<br>・**激昂** (HP25%以下で100%) |
| **6022** | **降臨せし天使**<br>(`boss_fallen_angel`) | Lv.28<br>HP: 800 | ATK: 80<br>DEF: 20 | 450 EXP<br>1500 G | - | quest_only | ・**裁きの光剣** (40%)<br>・**浄化の光** (30%)<br>・**天光の護り** (5ターン毎に100%)<br>・**ホーリーレイ** (30%)<br>・**終焉の息吹** (4ターン毎に100%)<br>・**激昂** (HP25%以下で100%) |
| **6023** | **デザートドラゴン**<br>(`boss_desert_dragon`) | Lv.32<br>HP: 1500 | ATK: 100<br>DEF: 25 | 600 EXP<br>2000 G | - | quest_only | ・**砂漠灼熱砲** (40%)<br>・**翼撃** (30%)<br>・**威圧の咆哮** (3ターン毎に100%)<br>・**竜の息吹** (30%)<br>・**激昂** (HP50%以下で100%)<br>・**終焉の息吹** (5ターン毎に100%) |
| **6024** | **霊獣・麒麟**<br>(`boss_holy_kirin`) | Lv.30<br>HP: 1000 | ATK: 90<br>DEF: 20 | 500 EXP<br>1500 G | - | quest_only | ・**聖角一閃** (40%)<br>・**浄化の波動** (30%)<br>・**ホーリーレイ** (30%)<br>・**霊気充填** (5ターン毎に100%)<br>・**終焉の息吹** (4ターン毎に100%)<br>・**激昂** (HP25%以下で100%) |
| **6025** | **オメガ・ゴーレム**<br>(`boss_omega_golem`) | Lv.28<br>HP: 1200 | ATK: 85<br>DEF: 30 | 450 EXP<br>1500 G | - | quest_only | ・**鋼鉄の拳** (40%)<br>・**大地震動** (30%)<br>・**防御貫通強打** (30%)<br>・**装甲硬化** (4ターン毎に100%)<br>・**終焉の息吹** (5ターン毎に100%)<br>・**激昂** (HP25%以下で100%) |
| **6026** | **クラーケン本体**<br>(`boss_kraken_prime`) | Lv.26<br>HP: 1000 | ATK: 75<br>DEF: 15 | 400 EXP<br>1200 G | - | quest_only | ・**触腕絞殺** (35%)<br>・**墨雲** (30%)<br>・**大渦** (35%)<br>・**終焉の息吹** (4ターン毎に100%)<br>・**激昂** (HP50%以下で100%) |
| **6027** | **牛頭王**<br>(`boss_mino_king`) | Lv.27<br>HP: 1100 | ATK: 85<br>DEF: 18 | 450 EXP<br>1200 G | - | quest_only | ・**覇王の大斧** (40%)<br>・**突進** (30%)<br>・**迷宮の呪い** (3ターン毎に100%)<br>・**激昂** (HP50%以下で100%)<br>・**終焉の息吹** (5ターン毎に100%) |
| **6031** | **堕落聖騎士**<br>(`boss_fallen_crusader`) | Lv.22<br>HP: 800 | ATK: 65<br>DEF: 18 | 300 EXP<br>800 G | - | quest_only | ・**強打** (40%)<br>・**ホーリーレイ** (30%)<br>・**鎧砕き** (3ターン毎に100%)<br>・**自己再生** (HP40%以下で100%)<br>・**狂暴化** (HP20%以下で100%) |
| **6032** | **砂の僭王**<br>(`boss_sand_king`) | Lv.24<br>HP: 900 | ATK: 70<br>DEF: 15 | 350 EXP<br>1000 G | - | quest_only | ・**砂のブレス** (40%)<br>・**砂塵** (30%)<br>・**雄叫び** (3ターン毎に100%)<br>・**全体攻撃** (5ターン毎に100%)<br>・**激昂** (HP30%以下で100%) |
| **6033** | **鬼将・蛮骨**<br>(`boss_oni_general`) | Lv.24<br>HP: 1000 | ATK: 75<br>DEF: 12 | 350 EXP<br>1000 G | - | quest_only | ・**強打** (40%)<br>・**咆哮** (30%)<br>・**鎧砕き** (3ターン毎に100%)<br>・**反撃の構え** (4ターン毎に100%)<br>・**狂暴化** (HP25%以下で100%) |
| **6034** | **翡翠大蛇**<br>(`boss_jade_serpent`) | Lv.26<br>HP: 1100 | ATK: 70<br>DEF: 20 | 400 EXP<br>1200 G | - | quest_only | ・**毒針** (40%)<br>・**裂傷の爪** (30%)<br>・**毒の息** (3ターン毎に100%)<br>・**自己再生** (HP40%以下で100%)<br>・**激昂** (HP20%以下で100%) |
| **6035** | **異端の大賢者**<br>(`boss_heretic_sage`) | Lv.28<br>HP: 900 | ATK: 80<br>DEF: 15 | 400 EXP<br>1200 G | - | quest_only | ・**ダークフレア** (40%)<br>・**火の玉** (30%)<br>・**呪詛** (3ターン毎に100%)<br>・**暗黒の癒し** (HP35%以下で100%)<br>・**終焉の息吹** (HP20%以下で100%) |
| **6036** | **戦魔ジン**<br>(`boss_war_djinn`) | Lv.28<br>HP: 1200 | ATK: 85<br>DEF: 18 | 450 EXP<br>1500 G | - | quest_only | ・**全体攻撃** (40%)<br>・**強打** (30%)<br>・**雄叫び** (3ターン毎に100%)<br>・**反撃の構え** (4ターン毎に100%)<br>・**狂暴化** (HP25%以下で100%) |
| **6037** | **九尾の大妖狐**<br>(`boss_nine_tails`) | Lv.30<br>HP: 1500 | ATK: 90<br>DEF: 20 | 500 EXP<br>1800 G | - | quest_only | ・**火の玉** (30%)<br>・**魅惑の歌** (30%)<br>・**呪詛** (3ターン毎に100%)<br>・**暗黒の癒し** (HP40%以下で100%)<br>・**終焉の息吹** (5ターン毎に100%)<br>・**狂暴化** (HP20%以下で100%) |
| **2201** | **墓所の守護者**<br>(`enemy_spot_protos`) | Lv.18<br>HP: 420 | ATK: 55<br>DEF: 15 | 0 EXP<br>0 G | - | quest_only | ・**強打** (40%)<br>・**シールドバッシュ** (30%) |
| **2202** | **聖女エルーカ**<br>(`enemy_spot_eluka`) | Lv.20<br>HP: 480 | ATK: 60<br>DEF: 12 | 0 EXP<br>0 G | - | quest_only | ・**ホーリーレイ** (40%)<br>・**自己再生** (4ターン毎に100%) |
| **2203** | **賢者バラム**<br>(`enemy_spot_baram`) | Lv.20<br>HP: 450 | ATK: 70<br>DEF: 8 | 0 EXP<br>0 G | - | quest_only | ・**ダークフレア** (40%)<br>・**呪詛** (3ターン毎に100%) |
| **2204** | **盾のシラス**<br>(`enemy_spot_shirasu`) | Lv.20<br>HP: 530 | ATK: 45<br>DEF: 22 | 0 EXP<br>0 G | - | quest_only | ・**反撃の構え** (4ターン毎に100%)<br>・**鎧砕き** (3ターン毎に100%)<br>・**強打** (40%) |
| **2205** | **射手リラ**<br>(`enemy_spot_lyra`) | Lv.20<br>HP: 390 | ATK: 75<br>DEF: 6 | 0 EXP<br>0 G | - | quest_only | ・**矢を射る** (50%)<br>・**毒針** (40%) |
| **2206** | **不滅の王**<br>(`enemy_spot_alvin`) | Lv.25<br>HP: 3050 | ATK: 85<br>DEF: 18 | 0 EXP<br>0 G | - | quest_only | ・**防御貫通強打** (30%)<br>・**終焉の息吹** (5ターン毎に100%)<br>・**激昂** (HP50%以下で100%)<br>・**強打** (40%) |
| **2207** | **大鰐**<br>(`enemy_spot_wani`) | Lv.20<br>HP: 570 | ATK: 55<br>DEF: 20 | 0 EXP<br>0 G | - | quest_only | ・**体当たり** (40%)<br>・**裂傷の爪** (40%) |
| **2208** | **以津真天**<br>(`enemy_spot_tori`) | Lv.20<br>HP: 450 | ATK: 65<br>DEF: 10 | 0 EXP<br>0 G | - | quest_only | ・**毒の息** (30%)<br>・**魅惑の歌** (30%)<br>・**暗殺術** (4ターン毎に100%) |
| **2209** | **朧車**<br>(`enemy_spot_kuruma`) | Lv.22<br>HP: 510 | ATK: 70<br>DEF: 14 | 0 EXP<br>0 G | - | quest_only | ・**強打** (40%)<br>・**砂塵** (40%) |
| **2210** | **酒呑童子**<br>(`enemy_spot_shuten`) | Lv.25<br>HP: 1100 | ATK: 90<br>DEF: 16 | 0 EXP<br>0 G | - | quest_only | ・**居合斬り** (40%)<br>・**雄叫び** (4ターン毎に100%)<br>・**狂暴化** (HP25%以下で100%) |
| **2211** | **青龍**<br>(`enemy_spot_seiryu`) | Lv.22<br>HP: 540 | ATK: 72<br>DEF: 14 | 0 EXP<br>0 G | - | quest_only | ・**雷撃** (30%)<br>・**竜の息吹** (30%)<br>・**終焉の息吹** (4ターン毎に100%) |
| **2212** | **白虎**<br>(`enemy_spot_byakko`) | Lv.22<br>HP: 510 | ATK: 68<br>DEF: 16 | 0 EXP<br>0 G | - | quest_only | ・**滅多斬り** (40%)<br>・**裂傷の爪** (30%)<br>・**激昂** (HP50%以下で100%) |
| **2213** | **朱雀**<br>(`enemy_spot_suzaku`) | Lv.22<br>HP: 480 | ATK: 75<br>DEF: 12 | 0 EXP<br>0 G | - | quest_only | ・**火の玉** (50%)<br>・**強力再生** (3ターン毎に100%) |
| **2214** | **玄武**<br>(`enemy_spot_genbu`) | Lv.22<br>HP: 600 | ATK: 50<br>DEF: 24 | 0 EXP<br>0 G | - | quest_only | ・**シールドバッシュ** (40%)<br>・**鎧砕き** (3ターン毎に100%)<br>・**強打** (40%) |
| **2215** | **神**<br>(`enemy_spot_kami`) | Lv.28<br>HP: 1300 | ATK: 95<br>DEF: 20 | 0 EXP<br>0 G | - | quest_only | ・**神の粛清** (4ターン毎に100%)<br>・**ホーリーレイ** (40%)<br>・**神の怒り** (HP25%以下で100%) |
| **2216** | **光の衛兵**<br>(`enemy_spot_light_guard`) | Lv.18<br>HP: 300 | ATK: 50<br>DEF: 10 | 0 EXP<br>0 G | - | quest_only | ・**ホーリーレイ** (40%)<br>・**強打** (40%) |
| **2217** | **砂のゴーレム**<br>(`enemy_spot_sand_golem`) | Lv.20<br>HP: 530 | ATK: 55<br>DEF: 18 | 0 EXP<br>0 G | - | quest_only | ・**砂のブレス** (40%)<br>・**砂塵** (30%) |
| **2218** | **無名王の影**<br>(`enemy_spot_nameless_king`) | Lv.25<br>HP: 1050 | ATK: 80<br>DEF: 17 | 0 EXP<br>0 G | - | quest_only | ・**暗殺術** (30%)<br>・**死の宣告** (3ターン毎に100%)<br>・**命の収奪** (40%)<br>・**激昂** (HP40%以下で100%) |
| **1241** | **抜け忍**<br>(`enemy_yato_ninja`) | Lv.12<br>HP: 100 | ATK: 45<br>DEF: 5 | 50 EXP<br>80 G | - | quest_only | ・**居合斬り** (60%)<br>・**暗殺術** (20%) |
| **1242** | **間者**<br>(`enemy_yato_spy`) | Lv.10<br>HP: 120 | ATK: 30<br>DEF: 10 | 80 EXP<br>150 G | - | quest_only | ・**体当たり** (60%)<br>・**毒針** (40%) |
| **1243** | **浪人**<br>(`enemy_yato_ronin`) | Lv.10<br>HP: 80 | ATK: 38<br>DEF: 5 | 30 EXP<br>50 G | - | quest_only | ・**居合斬り** (70%)<br>・**強打** (30%) |
| **1244** | **浪人の頭目**<br>(`enemy_yato_ronin_leader`) | Lv.15<br>HP: 250 | ATK: 55<br>DEF: 10 | 120 EXP<br>200 G | - | quest_only | ・**居合斬り** (40%)<br>・**強打** (30%)<br>・**雄叫び** (3ターン毎に100%) |
| **1245** | **怨霊**<br>(`enemy_yato_onryo`) | Lv.12<br>HP: 150 | ATK: 45<br>DEF: 15 | 80 EXP<br>100 G | - | quest_only | ・**魂抜き** (40%)<br>・**呪詛** (30%) |
| **1251** | **古キョンシー**<br>(`enemy_karyu_jiangshi_old`) | Lv.12<br>HP: 130 | ATK: 42<br>DEF: 12 | 50 EXP<br>80 G | - | quest_only | ・**強打** (50%)<br>・**魂抜き** (30%)<br>・**毒針** (20%) |
| **1252** | **霊草の守護獣**<br>(`enemy_karyu_guardian_beast`) | Lv.11<br>HP: 140 | ATK: 40<br>DEF: 10 | 60 EXP<br>80 G | - | quest_only | ・**咆哮** (50%)<br>・**裂傷の爪** (50%) |
| **1253** | **反乱農民**<br>(`enemy_karyu_rebel_farmer`) | Lv.5<br>HP: 40 | ATK: 12<br>DEF: 2 | 8 EXP<br>10 G | - | quest_only | ・**体当たり** (100%) |
| **1254** | **農民の首謀者**<br>(`enemy_karyu_rebel_leader`) | Lv.10<br>HP: 120 | ATK: 35<br>DEF: 5 | 40 EXP<br>50 G | - | quest_only | ・**強打** (60%)<br>・**雄叫び** (3ターン毎に100%) |
| **1255** | **刺客**<br>(`enemy_karyu_assassin`) | Lv.10<br>HP: 80 | ATK: 40<br>DEF: 3 | 35 EXP<br>60 G | - | quest_only | ・**暗殺術** (40%)<br>・**体当たり** (60%) |
| **1256** | **精鋭刺客**<br>(`enemy_karyu_assassin_elite`) | Lv.14<br>HP: 130 | ATK: 55<br>DEF: 5 | 60 EXP<br>100 G | - | quest_only | ・**暗殺術** (40%)<br>・**毒針** (30%)<br>・**反撃の構え** (3ターン毎に100%) |
| **1257** | **水賊**<br>(`enemy_karyu_pirate`) | Lv.10<br>HP: 90 | ATK: 38<br>DEF: 5 | 35 EXP<br>60 G | - | quest_only | ・**体当たり** (60%)<br>・**裂傷の爪** (40%) |
| **1258** | **水賊の頭目**<br>(`enemy_karyu_pirate_captain`) | Lv.15<br>HP: 200 | ATK: 55<br>DEF: 8 | 100 EXP<br>200 G | - | quest_only | ・**強打** (40%)<br>・**連続攻撃** (30%)<br>· **雄叫び** (3ターン毎に100%) |
| **1261** | **影守の怨霊**<br>(`enemy_yato_kagemon`) | Lv.14<br>HP: 220 | ATK: 52<br>DEF: 18 | 120 EXP<br>150 G | - | quest_only | ・**ダークフレア** (40%)<br>・**魂抜き** (30%)<br>・**呪詛** (3ターン毎に100%) |
| **1271** | **妖狐の姫**<br>(`enemy_karyu_fox_bride`) | Lv.16<br>HP: 280 | ATK: 55<br>DEF: 10 | 120 EXP<br>200 G | - | quest_only | ・**魅惑の歌** (40%)<br>・**火の玉** (30%)<br>・**自己再生** (3ターン毎に100%) |
| **1272** | **翡翠蛇の幼体**<br>(`enemy_jade_snake_infant`) | Lv.17<br>HP: 300 | ATK: 55<br>DEF: 10 | 150 EXP<br>250 G | - | random | ・**毒針** (50%)<br>・**裂傷の爪** (30%)<br>・**激昂** (HP40%以下で100%) |
| **6041** | **完成体キメラ**<br>(`boss_mutant_chimera`) | Lv.12<br>HP: 350 | ATK: 35<br>DEF: 8 | 120 EXP<br>300 G | - | quest_only | ・**毒の息** (40%)<br>・**強打** (40%)<br>・**全体攻撃** (3ターン毎に100%)<br>・**激昂** (HP40%以下で100%) |
| **6042** | **盗賊王バシム**<br>(`boss_bandit_king`) | Lv.13<br>HP: 380 | ATK: 40<br>DEF: 10 | 150 EXP<br>400 G | - | quest_only | ・**強打** (40%)<br>・**連続攻撃** (30%)<br>・**雄叫び** (3ターン毎に100%)<br>・**狂暴化** (HP30%以下で100%) |
| **6043** | **妖刀の剣客**<br>(`boss_cursed_ronin`) | Lv.14<br>HP: 420 | ATK: 50<br>DEF: 5 | 180 EXP<br>500 G | - | quest_only | ・**居合斬り** (50%)<br>・**反撃の構え** (3ターン毎に100%)<br>・**激昂** (HP40%以下で100%)<br>・**狂暴化** (HP20%以下で100%) |
| **6044** | **邪仙・道士**<br>(`boss_false_sage`) | Lv.15<br>HP: 450 | ATK: 45<br>DEF: 12 | 200 EXP<br>600 G | - | quest_only | ・**ダークフレア** (40%)<br>・**呪詛** (3ターン毎に100%)<br>・**自己再生** (4ターン毎に100%)<br>・**狂暴化** (HP25%以下で100%) |
| **1281** | **失敗作キメラ**<br>(`enemy_mutant_chimera`) | Lv.10<br>HP: 250 | ATK: 30<br>DEF: 8 | 80 EXP<br>150 G | - | quest_only | ・**毒の息** (50%)<br>・**体当たり** (50%) |
| **6051** | **盗掘団の頭目**<br>(`boss_graverobber_leader`) | Lv.7<br>HP: 180 | ATK: 25<br>DEF: 6 | 60 EXP<br>200 G | - | quest_only | ・**強打** (60%)<br>・**裂傷の爪** (40%)<br>・**激昂** (HP40%以下で100%) |
| **6052** | **巨大毒蠍**<br>(`boss_giant_scorpion`) | Lv.8<br>HP: 200 | ATK: 28<br>DEF: 12 | 70 EXP<br>250 G | - | quest_only | ・**毒針** (50%)<br>・**強打** (50%)<br>・**激昂** (HP40%以下で100%) |
| **6053** | **山賊の頭**<br>(`boss_toll_bandit`) | Lv.7<br>HP: 190 | ATK: 27<br>DEF: 5 | 60 EXP<br>200 G | - | quest_only | ・**強打** (60%)<br>・**雄叫び** (3ターン毎に100%)<br>・**激昂** (HP40%以下で100%) |
| **6054** | **河伯**<br>(`boss_river_god`) | Lv.8<br>HP: 210 | ATK: 26<br>DEF: 8 | 70 EXP<br>250 G | - | quest_only | ・**体当たり** (40%)<br>・**自己再生** (3ターン毎に100%)<br>・**毒の息** (HP50%以下で100%発動) |
| **901** | **インプ**<br>(`enemy_rift_imp`) | Lv.7<br>HP: 180 | ATK: 18<br>DEF: 10 | 25 EXP<br>30 G | - | quest_only | ・**爪撃** (50%)<br>・**体当たり** (50%) |
| **902** | **ヘルハウンド**<br>(`enemy_rift_hellhound`) | Lv.8<br>HP: 220 | ATK: 22<br>DEF: 8 | 30 EXP<br>40 G | - | quest_only | ・**噛みつき** (60%)<br>・**火吹き** (40%) |
| **907** | **ヘルウィング**<br>(`enemy_rift_hellwing`) | Lv.8<br>HP: 200 | ATK: 20<br>DEF: 8 | 30 EXP<br>40 G | - | quest_only | ・**急降下** (60%)<br>・**羽撃** (40%) |
| **903** | **サキュバス**<br>(`enemy_rift_succubus_rift`) | Lv.10<br>HP: 260 | ATK: 22<br>DEF: 12 | 40 EXP<br>60 G | - | quest_only | ・**魅了** (50%)<br>・**吸精** (50%) |
| **908** | **デーモンメイジ**<br>(`enemy_rift_mage`) | Lv.10<br>HP: 230 | ATK: 18<br>DEF: 10 | 40 EXP<br>60 G | - | quest_only | ・**闇矢** (60%)<br>・**魔力集中** (40%) |
| **904** | **プレイグデーモン**<br>(`enemy_rift_plague`) | Lv.12<br>HP: 320 | ATK: 26<br>DEF: 15 | 50 EXP<br>80 G | - | quest_only | ・**毒液** (60%)<br>・**瘴気の霧** (40%) |
| **905** | **デーモンソルジャー**<br>(`enemy_rift_soldier`) | Lv.12<br>HP: 380 | ATK: 30<br>DEF: 20 | 50 EXP<br>80 G | - | quest_only | ・**斬撃** (60%)<br>・**シールドバッシュ** (40%) |
| **906** | **シャドウデーモン**<br>(`enemy_rift_shadow`) | Lv.14<br>HP: 280 | ATK: 36<br>DEF: 10 | 60 EXP<br>100 G | - | quest_only | ・**急所突き** (60%)<br>・**身隠し** (40%) |
| **909** | **アークデーモン**<br>(`enemy_rift_archdemon`) | Lv.14<br>HP: 450 | ATK: 40<br>DEF: 18 | 80 EXP<br>120 G | - | quest_only | ・**地獄の火** (60%)<br>・**呪い** (40%) |
| **910** | **グレーターデーモン**<br>(`enemy_rift_greater_demon`) | Lv.18<br>HP: 520 | ATK: 45<br>DEF: 25 | 120 EXP<br>180 G | - | quest_only | ・**暗黒唐竹割り** (60%)<br>・**恐怖のオーラ** (40%) |
| **961** | **深淵の狂皇 アスタロト**<br>(`boss_rift_astaroth`) | Lv.10<br>HP: 2400 | ATK: 52<br>DEF: 30 | 300 EXP<br>800 G | [青の宝珠](file:///d:/dev/code-wirth-dawn/src/data/csv/items.csv#L327) | quest_only | ・**狂乱爪撃** (60%)<br>・**インプ召喚** (40%) |
| **962** | **生贄の番人 ゲレゲール**<br>(`boss_rift_gereger`) | Lv.14<br>HP: 3000 | ATK: 62<br>DEF: 40 | 500 EXP<br>1200 G | [闇の宝珠](file:///d:/dev/code-wirth-dawn/src/data/csv/items.csv#L329) | quest_only | ・**血の生贄** (60%)<br>・**呪詛** (40%) |
| **963** | **光なき思念 アケロン**<br>(`boss_rift_acheron`) | Lv.14<br>HP: 2600 | ATK: 58<br>DEF: 25 | 500 EXP<br>1200 G | [大魔道士の思念](file:///d:/dev/code-wirth-dawn/src/data/csv/items.csv#L330) | quest_only | ・**記憶貪り** (60%)<br>・**沈滅の霧** (40%) |
| **964** | **魔導士ヴァルグナ**<br>(`boss_rift_vargna`) | Lv.15<br>HP: 4200 | ATK: 70<br>DEF: 50 | 800 EXP<br>2000 G | [光の宝珠](file:///d:/dev/code-wirth-dawn/src/data/csv/items.csv#L328) | quest_only | ・**召喚ゲート** (40%)<br>・**次元斬** (40%)<br>・**歪みの結界** (20%) |
| **965** | **魔導士ヴァルグナ（真）**<br>(`boss_rift_vargna_true`) | Lv.18<br>HP: 5000 | ATK: 80<br>DEF: 60 | 1200 EXP<br>3000 G | - | quest_only | ・**虚無崩壊** (40%)<br>・**魔力自己回復** (40%)<br>・**時空の歪み** (20%) |
| **966** | **破壊神 サタン**<br>(`boss_rift_satan`) | Lv.20<br>HP: 6000 | ATK: 95<br>DEF: 75 | 2000 EXP<br>5000 G | [デーモンスレイヤー](file:///d:/dev/code-wirth-dawn/src/data/csv/items.csv#L351) | quest_only | ・**深淵レーザー** (40%)<br>・**超再生** (40%)<br>・**魔王の怒り** (20%) |
