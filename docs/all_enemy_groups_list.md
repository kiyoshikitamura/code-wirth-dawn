# エネミーグループ（敵編成）マスタデータ一覧

本ドキュメントは、ゲーム内でエンカウントまたはボス戦・クエスト戦などで登場するすべてのエネミーグループ（敵の組み合わせ編成）のID、構成メンバー、合計HP、獲得可能な合計経験値・ゴールド、ドロップアイテム、および主な出現場所・用途を網羅した一覧カタログです。

---

## 1. エネミーグループデータの概要

エネミーグループデータ（`enemy_groups.csv`）は、戦闘が発生した際に「どの敵がどのような組み合わせで出現するか」を定義しています。
* **合計HP / EXP / ゴールド**: グループに所属する全エネミーのパラメータを加算した合計値です（プレイヤー側の戦闘難易度の目安、および報酬期待値として機能します）。
* **ドロップアイテム**: 構成エネミーのいずれかがドロップする可能性のあるアイテムを網羅しています。

---

## 2. 全エネミーグループカタログ（167編成）

| ID | グループ名 / スラグ | 出現メンバー (構成) | 合計HP | 合計EXP | 合計Gold | ドロップアイテム | 用途 / 主な出現場所 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **9001** | `enemy_grp_boss_skel_king` | ・**骸骨狂王** (ボス) × 1 | 500 | 150 EXP | 500 G | - | メインクエストボス戦 (骸骨狂王) |
| **9002** | `enemy_grp_boss_worm` | ・**マザーワーム** (ボス) × 1 | 700 | 200 EXP | 600 G | - | メインクエストボス戦 (マザーワーム) |
| **9003** | `enemy_grp_boss_ogre` | ・**剛腕赤鬼** (ボス) × 1 | 600 | 180 EXP | 500 G | - | メインクエストボス戦 (剛腕赤鬼) |
| **9004** | `enemy_grp_boss_thunder` | ・**霊山の雷獣** (ボス) × 1 | 450 | 250 EXP | 700 G | - | メインクエストボス戦 (霊山の雷獣) |
| **9005** | `enemy_grp_boss_griffon` | ・**グリフォン・ロード** (ボス) × 1 | 600 | 200 EXP | 600 G | - | メインクエストボス戦 (グリフォン・ロード) |
| **9006** | `enemy_grp_boss_treant` | ・**エント長** (ボス) × 1 | 800 | 150 EXP | 500 G | - | メインクエストボス戦 (エント長) |
| **9011** | `enemy_grp_boss_bishop` | ・**元大司教** (ボス) × 1 | 400 | 300 EXP | 1000 G | - | メインクエストボス戦 (元大司教) |
| **9012** | `enemy_grp_boss_cardinal` | ・**腐敗枢機卿** (ボス) × 1 | 500 | 350 EXP | 1200 G | - | メインクエストボス戦 (腐敗枢機卿) |
| **9013** | `enemy_grp_boss_ronin` | ・**義剣の剣豪** (ボス) × 1 | 350 | 250 EXP | 800 G | - | メインクエストボス戦 (義剣の剣豪) |
| **9014** | `enemy_grp_boss_assassin` | ・**暗殺ギルド長** (ボス) × 1 | 300 | 300 EXP | 900 G | - | メインクエストボス戦 (暗殺ギルド長) |
| **9015** | `enemy_grp_boss_pirate` | ・**海賊船長** (ボス) × 1 | 450 | 200 EXP | 700 G | - | メインクエストボス戦 (海賊船長) |
| **9016** | `enemy_grp_boss_rebel` | ・**反乱軍指導者** (ボス) × 1 | 500 | 250 EXP | 800 G | - | メインクエストボス戦 (反乱軍指導者) |
| **9017** | `enemy_grp_boss_merchant` | ・**錬金強化人間** (ボス) × 1 | 700 | 400 EXP | 1200 G | - | メインクエストボス戦 (錬金強化人間) |
| **9021** | `enemy_grp_boss_baphomet` | ・**バフォメット** (ボス) × 1 | 900 | 500 EXP | 1500 G | - | 伝説クエストボス戦 (バフォメット) |
| **9022** | `enemy_grp_boss_angel` | ・**降臨せし天使** (ボス) × 1 | 800 | 450 EXP | 1500 G | - | 伝説クエストボス戦 (降臨せし天使) |
| **9023** | `enemy_grp_boss_dragon` | ・**デザートドラゴン** (ボス) × 1 | 1500 | 600 EXP | 2000 G | - | 伝説クエストボス戦 (デザートドラゴン) |
| **9024** | `enemy_grp_boss_kirin` | ・**霊獣・麒麟** (ボス) × 1 | 1000 | 500 EXP | 1500 G | - | 伝説クエストボス戦 (霊獣・麒麟) |
| **9025** | `enemy_grp_boss_golem` | ・**オメガ・ゴーレム** (ボス) × 1 | 1200 | 450 EXP | 1500 G | - | 伝説クエストボス戦 (オメガ・ゴーレム) |
| **9026** | `enemy_grp_boss_kraken` | ・**クラーケン本体** (ボス) × 1 | 1000 | 400 EXP | 1200 G | - | 伝説クエストボス戦 (クラーケン本体) |
| **9027** | `enemy_grp_boss_mino` | ・**牛頭王** (ボス) × 1 | 1100 | 450 EXP | 1200 G | - | 伝説クエストボス戦 (牛頭王) |
| **9030** | `main_apostle_wave1` | ・**白磁の使徒** × 2 | 600 | 0 EXP | 0 G | - | 第11話〜第15話メイン進行戦 |
| **9031** | `main_apostle_wave2` | ・**熾天使** × 1<br>・**白磁の使徒** × 1 | 900 | 0 EXP | 0 G | - | 第11話〜第15話メイン進行戦 |
| **9032** | `main_volgr_duel` | ・**白磁 of 使徒** × 1 | 300 | 0 EXP | 0 G | - | 第11話 ヴォルグ決戦前哨戦 |
| **9040** | `main_archangel_uriel` | ・**大天使ウリエル** (ボス) × 1 | 800 | 0 EXP | 0 G | - | 第12話ボス戦 (ウリエル) |
| **9041** | `main_archangel_raphael` | ・**大天使ラファエル** (ボス) × 1 | 900 | 0 EXP | 0 G | - | 第13話ボス戦 (ラファエル) |
| **9042** | `main_archangel_gabriel` | ・**大天使ガブリエル** (ボス) × 1 | 1000 | 0 EXP | 0 G | - | 第14話ボス戦 (ガブリエル) |
| **9043** | `main_archangel_michael` | ・**大天使ミカエル** (ボス) × 1 | 1200 | 0 EXP | 0 G | - | 第15話ボス戦 (ミカエル) |
| **9050** | `main_god_hades` | ・**冥王ハデス** (ボス) × 1 | 2000 | 0 EXP | 0 G | - | 第17話ボス戦 (ハデス) |
| **9051** | `main_god_ares` | ・**軍神アレス** (ボス) × 1 | 1800 | 0 EXP | 0 G | - | 第18話ボス戦 (アレス) |
| **9052** | `main_god_artemis` | ・**女神アルテミス** (ボス) × 1 | 1600 | 0 EXP | 0 G | - | 第19話ボス戦 (アルテミス) |
| **9053** | `main_god_zeus_weak` | ・**全能神ゼウス** (弱) (ボス) × 1 | 3000 | 0 EXP | 0 G | - | 第20話ゼウス前哨戦 |
| **9054** | `main_god_zeus_strong` | ・**全能神ゼウス(強)** (ボス) × 1 | 4500 | 0 EXP | 0 G | - | 第20話最終ボス戦 (ゼウス) |
| **100** | `bandit_group` | ・**チンピラ** × 1 | 40 | 6 EXP | 30 G | - | 通常エンカウント (ザコ) |
| **101** | `roland_undead_group` | ・**スケルトン** × 1<br>・**ゾンビ** × 1 | 125 | 20 EXP | 35 G | - | ローランド地方 通常エンカウント |
| **102** | `roland_bandit_group` | ・**野盗の用心棒** × 1<br>・**チンピラ** × 1 | 120 | 21 EXP | 110 G | - | ローランド地方 通常エンカウント |
| **103** | `roland_monster_group` | ・**聖騎士の亡霊** × 1<br>・**スケルトン** × 1 | 165 | 48 EXP | 95 G | - | ローランド地方 通常エンカウント |
| **104** | `markand_desert_group` | ・**デザートスコーピオン** × 1<br>・**チンピラ** × 1 | 130 | 36 EXP | 80 G | - | マルカンド地方 通常エンカウント |
| **105** | `markand_worm_group` | ・**サンドワーム** × 1<br>・**デザートスコーピオン** × 1 | 270 | 100 EXP | 170 G | - | マルカンド地方 通常エンカウント |
| **106** | `yato_yokai_group` | ・**鬼火** × 1<br>・**からかさ小僧** × 1 | 130 | 60 EXP | 90 G | - | 夜刀神国 通常エンカウント |
| **107** | `yato_tengu_group` | ・**からす天狗** × 1<br>・**鬼火** × 1 | 210 | 110 EXP | 180 G | [天狗の羽団扇](file:///d:/dev/code-wirth-dawn/src/data/csv/items.csv#L41) | 夜刀神国 通常エンカウント |
| **108** | `karyu_spirit_group` | ・**キョンシー** × 1<br>・**妖狐** × 1 | 230 | 110 EXP | 190 G | - | 華龍神朝 通常エンカウント |
| **109** | `karyu_terracotta_group` | ・**兵馬俑** × 1<br>・**キョンシー** × 1 | 290 | 145 EXP | 240 G | 結界石の破片 | 華龍神朝 通常エンカウント |
| **110** | `neutral_goblin_group` | ・**ゴブリン** × 1<br>・**ゴブリンアーチャー** × 1 | 55 | 9 EXP | 35 G | - | 共通エリア 通常エンカウント |
| **111** | `neutral_wolf_group` | ・**ワイルドドッグ** × 1<br>・**キラーウルフ** × 1 | 95 | 17 EXP | 35 G | - | 共通エリア 通常エンカウント |
| **200** | `main_bandit_squad` | ・**チンピラ** × 2 | 80 | 12 EXP | 60 G | - | 第1話 メイン戦闘 |
| **201** | `main_markand_spy` | ・**野盗の用心棒** × 1<br>・**デザートスコーピオン** × 1 | 170 | 45 EXP | 130 G | - | メインシナリオ戦闘 |
| **202** | `main_empire_clash` | ・**野盗の用心棒** × 2 | 160 | 30 EXP | 160 G | - | メインシナリオ戦闘 |
| **203** | `main_empire_elite` | ・**帝国精鋭部隊** (ボス) × 1 | 500 | 0 EXP | 0 G | - | 第5話メインシナリオボス戦 |
| **204** | `main_yato_pursuit` | ・**鬼火** × 1<br>・**からかさ小僧** × 1 | 130 | 60 EXP | 90 G | - | メインシナリオ進行戦 |
| **205** | `main_samurai_trial` | ・**からす天狗** × 2 | 320 | 180 EXP | 300 G | [天狗の羽団扇](file:///d:/dev/code-wirth-dawn/src/data/csv/items.csv#L41) | 第7話メインシナリオ進行戦 |
| **206** | `main_assassin_night` | ・**見習い暗殺者** × 2 | 140 | 40 EXP | 100 G | - | 第8話メインシナリオ進行戦 |
| **207** | `main_assassin_boss` | ・**凄腕の刺客** × 1 | 150 | 50 EXP | 150 G | - | 第8話ボス前哨戦 |
| **208** | `main_escort_ambush` | ・**からす天狗** × 1<br>・**鬼火** × 1 | 210 | 110 EXP | 180 G | [天狗の羽団扇](file:///d:/dev/code-wirth-dawn/src/data/csv/items.csv#L41) | 第9話メインシナリオ進行戦 |
| **209** | `main_guardian_dragon` | ・**神代の守護竜** (ボス) × 1 | 1800 | 0 EXP | 0 G | - | 第10話メインボス決戦 |
| **210** | `main_apostle_wave` | ・**白磁の使徒** × 2 | 600 | 0 EXP | 0 G | - | 第11話メインシナリオ進行戦 |
| **211** | `main_river_defense` | ・**キョンシー** × 1<br>・**兵馬俑** × 1 | 290 | 145 EXP | 240 G | 結界石の破片 | 第12話メインシナリオ進行戦 |
| **212** | `main_river_boss` | ・**妖狐** × 2 | 280 | 150 EXP | 260 G | - | 第12話メインシナリオボス戦 |
| **213** | `main_mercenary_king` | ・**不死の傭兵王** (ボス) × 1 | 2000 | 0 EXP | 0 G | - | 第13話メインボス決戦 |
| **214** | `main_castle_siege` | ・**兵馬俑** × 2<br>・**キョンシー** × 1 | 490 | 255 EXP | 420 G | 結界石の破片 | 第14話メインシナリオ進行戦 |
| **215** | `main_ruin_guardian` | ・**遺跡の守護者** (ボス) × 1 | 3000 | 0 EXP | 0 G | - | 第14話メインボス決戦 |
| **216** | `main_fallen_angels` | ・**白磁の使徒** × 4 | 1200 | 0 EXP | 0 G | - | 第15話メイン進行前衛戦 |
| **217** | `main_gate_keeper` | ・**天門の番人** (ボス) × 1 | 4000 | 0 EXP | 0 G | - | 第15話メインボス決戦 |
| **218** | `main_angel_army_a` | ・**天使兵** × 2 | 1600 | 0 EXP | 0 G | - | 第15話王都レガリア戦 |
| **219** | `main_angel_army_b` | ・**天使兵** × 1<br>・**大天使** (ボス) × 1 | 4300 | 0 EXP | 0 G | - | 第15話王都大天使戦 |
| **220** | `main_system_guard` | ・**システムの守護者** (ボス) × 1 | 6000 | 0 EXP | 0 G | - | 第19話メインボス決戦 |
| **221** | `main_god_dragon` | ・**神竜** (ボス) × 1 | 8000 | 0 EXP | 0 G | - | 第20話メインボス決戦 (神竜) |
| **222** | `main_god_core` | ・**主神** (ボス) × 1 | 9999 | 0 EXP | 0 G | - | 第20話最終形態 |
| **230** | `main_bounty_hunters` | ・**新米ハンター** × 1<br>・**賞金稼ぎの狩人** × 1 | 190 | 110 EXP | 0 G | - | メインクエスト追跡戦 |
| **300** | `spot_roland_protos` | ・**墓所の守護者** (ボス) × 1 | 420 | 0 EXP | 0 G | - | スポット [6101](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6101_spot_roland.md) (プロトス戦) |
| **301** | `spot_roland_eluka` | ・**聖女エルーカ** (ボス) × 1 | 480 | 0 EXP | 0 G | - | スポット [6101](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6101_spot_roland.md) (エルーカ戦) |
| **302** | `spot_roland_baram` | ・**賢者バラム** (ボス) × 1 | 450 | 0 EXP | 0 G | - | スポット [6101](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6101_spot_roland.md) (バラム戦) |
| **303** | `spot_roland_shirasu` | ・**盾のシラス** (ボス) × 1 | 530 | 0 EXP | 0 G | - | スポット [6101](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6101_spot_roland.md) (シラス戦) |
| **304** | `spot_roland_lyra` | ・**射手リラ** (ボス) × 1 | 390 | 0 EXP | 0 G | - | スポット [6101](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6101_spot_roland.md) (リラ戦) |
| **305** | `spot_roland_alvin` | ・**不滅の王** (ボス) × 1 | 3050 | 0 EXP | 0 G | - | スポット [6101](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6101_spot_roland.md) (アルヴィン戦) |
| **310** | `spot_yato_spider_1` | ・**鬼火** × 1<br>・**からかさ小僧** × 1 | 130 | 60 EXP | 90 G | - | スポット [6102](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6102_spot_yato.md) 進行戦 |
| **311** | `spot_yato_spider_2` | ・**鬼火** × 2 | 100 | 40 EXP | 60 G | - | スポット [6102](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6102_spot_yato.md) 進行戦 |
| **312** | `spot_yato_spider_3` | ・**からかさ小僧** × 2 | 160 | 80 EXP | 120 G | - | スポット [6102](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6102_spot_yato.md) 進行戦 |
| **313** | `spot_yato_spider_4` | ・**からす天狗** × 1<br>・**鬼火** × 1 | 210 | 110 EXP | 180 G | [天狗の羽団扇](file:///d:/dev/code-wirth-dawn/src/data/csv/items.csv#L41) | スポット [6102](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6102_spot_yato.md) 進行戦 |
| **314** | `spot_yato_wani` | ・**大鰐** (ボス) × 1 | 570 | 0 EXP | 0 G | - | スポット [6102](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6102_spot_yato.md) 中ボス |
| **315** | `spot_yato_tori` | ・**以津真天** (ボス) × 1 | 450 | 0 EXP | 0 G | - | スポット [6102](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6102_spot_yato.md) 中ボス |
| **316** | `spot_yato_kuruma` | ・**朧車** (ボス) × 1 | 510 | 0 EXP | 0 G | - | スポット [6102](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6102_spot_yato.md) 中ボス |
| **317** | `spot_yato_shuten` | ・**酒呑童子** (ボス) × 1 | 1100 | 0 EXP | 0 G | - | スポット [6102](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6102_spot_yato.md) 大ボス |
| **320** | `spot_karyu_seiryu` | ・**青龍** (ボス) × 1 | 540 | 0 EXP | 0 G | - | スポット [6103](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6103_spot_karyu.md) 四神戦 (青龍) |
| **321** | `spot_karyu_byakko` | ・**白虎** (ボス) × 1 | 510 | 0 EXP | 0 G | - | スポット [6103](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6103_spot_karyu.md) 四神戦 (白虎) |
| **322** | `spot_karyu_suzaku` | ・**朱雀** (ボス) × 1 | 480 | 0 EXP | 0 G | - | スポット [6103](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6103_spot_karyu.md) 四神戦 (朱雀) |
| **323** | `spot_karyu_genbu` | ・**玄武** (ボス) × 1 | 600 | 0 EXP | 0 G | - | スポット [6103](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6103_spot_karyu.md) 四神戦 (玄武) |
| **324** | `spot_karyu_kami` | ・**神** (ボス) × 1 | 1300 | 0 EXP | 0 G | - | スポット [6103](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6103_spot_karyu.md) 頂上ボス (神) |
| **330** | `spot_markand_guard_1` | ・**光の衛兵** × 2 | 600 | 0 EXP | 0 G | - | スポット [6104](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6104_spot_markand.md) 進行戦 |
| **331** | `spot_markand_guard_2` | ・**砂のゴーレム** × 1 | 530 | 0 EXP | 0 G | - | スポット [6104](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6104_spot_markand.md) 進行戦 |
| **332** | `spot_markand_guard_3` | ・**砂のゴーレム** × 1<br>・**光の衛兵** × 1 | 830 | 0 EXP | 0 G | - | スポット [6104](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6104_spot_markand.md) 進行戦 |
| **333** | `spot_markand_king` | ・**無名王の影** (ボス) × 1 | 1050 | 0 EXP | 0 G | - | スポット [6104](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6104_spot_markand.md) 大ボス |
| **400** | `grp_bandit_trio` | ・**チンピラ** × 3 | 120 | 18 EXP | 90 G | - | 討伐クエスト進行戦 |
| **401** | `grp_bandit_pair` | ・**チンピラ** × 2 | 80 | 12 EXP | 60 G | - | 通常・クエスト進行戦 |
| **402** | `grp_goblin_pair` | ・**ゴブリン** × 2 | 60 | 8 EXP | 30 G | - | 通常進行戦 |
| **403** | `grp_goblin_leader` | ・**ホブゴブリン** × 1<br>・**ゴブリン** × 2 | 180 | 43 EXP | 110 G | ポーションM | ゴブリン関連クエスト |
| **404** | `grp_mob_riot` | ・**飢えた市民** × 5 | 75 | 10 EXP | 25 G | - | [7004 食料暴動](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7004_riot.md) 進行戦 |
| **405** | `grp_bear_solo` | ・**ジャイアントベア** × 1 | 150 | 30 EXP | 50 G | - | [7005 凶熊狩り](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7005_bear.md) 進行戦 |
| **406** | `grp_bounty_pair` | ・**野盗の用心棒** × 2 | 160 | 30 EXP | 160 G | - | クエスト戦闘 |
| **407** | `grp_rat_swarm` | ・**巨大ネズミ** × 3 | 60 | 9 EXP | 30 G | - | [7007 地下水路の害獣駆除](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7007_rat.md) |
| **408** | `grp_rat_nest` | ・**ネズミの女王** × 1<br>・**巨大ネズミ** × 2 | 220 | 21 EXP | 50 G | - | [7007 地下水路の害獣駆除](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7007_rat.md) ボス戦 |
| **410** | `grp_cult_heretic` | ・**狂信者** × 3<br>・**邪教の司祭** × 2 | 380 | 80 EXP | 250 G | - | [7010 異端者の粛清](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7010_heretic.md) 進行戦 |
| **411** | `grp_skeleton_quad` | ・**スケルトン** × 4 | 180 | 32 EXP | 60 G | - | 通常・クエストアンデッド戦 |
| **412** | `grp_zombie_trio` | ・**ゾンビ** × 3 | 240 | 36 EXP | 60 G | - | 通常・クエストアンデッド戦 |
| **413** | `grp_undead_mixed` | ・**スケルトン** × 1<br>・**ゾンビ** × 1<br>・**レイス** × 1 | 225 | 45 EXP | 75 G | - | [7013 遺体安置所の亡者討伐](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7013_undead.md) |
| **414** | `grp_bandit_ambush_1` | ・**チンピラ** × 2<br>・**野盗の射手** × 2 | 150 | 26 EXP | 140 G | - | クエスト戦闘 |
| **415** | `grp_bandit_ambush_2` | ・**野盗の射手** × 2<br>・**野盗の用心棒** × 2 | 230 | 44 EXP | 240 G | - | クエスト戦闘 |
| **416** | `grp_wraith_trio` | ・**レイス** × 3 | 300 | 75 EXP | 120 G | - | クエスト難関戦闘 |
| **417** | `grp_wraith_five` | ・**レイス** × 5 | 500 | 125 EXP | 200 G | - | 高難度クエスト戦闘 |
| **418** | `grp_bandit_relic_1` | ・**野盗の射手** × 2<br>・**野盗の用心棒** × 2 | 230 | 44 EXP | 240 G | - | [7015 聖遺物の奪還](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7015_relic.md) 進行戦 |
| **419** | `grp_bandit_relic_boss` | ・**盗賊団の頭領** × 1<br>・**野盗の用心棒** × 2 | 360 | 110 EXP | 360 G | 盗賊の秘宝 | [7015 聖遺物の奪還](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7015_relic.md) ボス戦 |
| **502** | `main_ep12_vanguard` | ・**サンドワーム** × 1<br>・**デザートスコーピオン** × 2 | 360 | 130 EXP | 220 G | - | 第12話メインシナリオ進行戦 |
| **503** | `main_ep13_vanguard` | ・**妖狐** × 1<br>・**兵馬俑** × 2 | 540 | 295 EXP | 490 G | 結界石の破片 | 第13話メインシナリオ進行戦 |
| **504** | `main_ep14_vanguard` | ・**からす天狗** × 2<br>・**赤鬼** × 1 | 820 | 530 EXP | 1100 G | 天狗の羽団扇 / 鬼の毒薬 | 第14話メインシナリオ進行戦 |
| **505** | `main_ep15_vanguard` | ・**白磁の使徒** × 4 | 1200 | 0 EXP | 0 G | - | 第15話メイン進行前衛戦 |
| **9101** | `grp_boss_graverobber` | ・**盗掘団の頭目** (ボス) × 1 | 180 | 60 EXP | 200 G | - | 指名依頼 [5101 墓荒らし](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5101_graverobber.md) ボス戦 |
| **9102** | `grp_boss_scorpion` | ・**巨大毒蠍** (ボス) × 1 | 200 | 70 EXP | 250 G | - | 討伐依頼 [5102 巨大蠍討伐](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5102_scorpion_hunt.md) ボス戦 |
| **9103** | `grp_boss_toll_bandit` | ・**山賊の頭** (ボス) × 1 | 190 | 60 EXP | 200 G | - | 討伐依頼 [5103 山賊の関所](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5103_toll_bandit.md) ボス戦 |
| **9104** | `grp_boss_river_god` | ・**河伯** (ボス) × 1 | 210 | 70 EXP | 250 G | - | 鎮撫依頼 [5104 河伯の怒り](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5104_river_god.md) ボス戦 |
| **120** | `grp_jade_snake_guard` | ・**翡翠蛇の幼体** × 2 | 600 | 300 EXP | 500 G | - | 討伐令 [5204 翡翠蛇](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5204_jade_serpent.md) 進行戦 |
| **130** | `grp_yokai_mountain` | ・**からす天狗** × 1<br>・**赤鬼** × 1<br>・**鬼火** × 1 | 710 | 460 EXP | 980 G | 天狗の羽団扇 / 鬼の毒薬 | 指令クエスト進行戦 |
| **420** | `grp_mar_bandit_raid` | ・**チンピラ** × 2<br>・**野盗の射手** × 2 | 150 | 26 EXP | 140 G | - | [7020 大砂漠の長距離交易](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7020_caravan.md) |
| **421** | `grp_mar_desert_beast` | ・**サンドワーム** × 1<br>・**デザートスコーピオン** × 2 | 360 | 130 EXP | 220 G | - | [7020 大砂漠の長距離交易](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7020_caravan.md) |
| **422** | `grp_mar_scorpion_swarm` | ・**デザートスコーピオン** × 3 | 270 | 90 EXP | 150 G | - | [7021 ハサミサソリ毒調達](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7021_scorpion.md) |
| **423** | `grp_mar_fugitive_guard` | ・**チンピラ** × 2<br>・**野盗の用心棒** × 1 | 160 | 27 EXP | 140 G | - | [7022 逃亡奴隷の連れ戻し](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7022_debt.md) |
| **424** | `grp_mar_fugitive_elite` | ・**野盗の用心棒** × 2<br>・**野盗の射手** × 1 | 195 | 37 EXP | 200 G | - | [7022 逃亡奴隷の連れ戻し](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7022_debt.md) ボス前衛 |
| **425** | `grp_mar_worm_swarm` | ・**サンドワーム** × 1<br>・**デザートスコーピオン** × 2 | 360 | 130 EXP | 220 G | - | [7023 大砂虫討伐](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7023_sandworm.md) |
| **426** | `grp_mar_great_worm` | ・**サンドワーム** × 2 | 360 | 140 EXP | 240 G | - | [7023 大砂虫討伐](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7023_sandworm.md) 中ボス |
| **427** | `grp_mar_auction_thief` | ・**チンピラ** × 3 | 120 | 18 EXP | 90 G | - | [7024 闇市オークション用心棒](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7024_auction.md) |
| **428** | `grp_mar_auction_assassin` | ・**見習い暗殺者** × 2<br>・**野盗の用心棒** × 1 | 220 | 55 EXP | 180 G | - | [7024 闇市オークション用心棒](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7024_auction.md) ボス戦 |
| **429** | `grp_mar_militia` | ・**野盗の用心棒** × 2<br>・**野盗の射手** × 1 | 195 | 37 EXP | 200 G | - | [7025 敵対軍閥への賄賂](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7025_bribe.md) |
| **430** | `grp_yat_yokai_pack` | ・**からかさ小僧** × 2<br>・**鬼火** × 2 | 260 | 120 EXP | 180 G | - | [7030 古道にはびこる妖討伐](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7030_yokai.md) |
| **431** | `grp_yat_akaoni_boss` | ・**赤鬼** × 1<br>・**鬼火** × 1 | 550 | 370 EXP | 830 G | 鬼の毒薬 | [7030 古道にはびこる妖討伐](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7030_yokai.md) ボス戦 |
| **432** | `grp_yat_ninja_spy` | ・**抜け忍** × 2<br>・**間者** × 1 | 320 | 180 EXP | 310 G | - | [7031 隠密の密書傍受](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7031_ninja.md) |
| **433** | `grp_yat_ronin_wave` | ・**浪人** × 3 | 240 | 90 EXP | 150 G | - | [7033 食い詰めた浪人狩り](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7033_ronin.md) |
| **434** | `grp_yat_ronin_leader` | ・**浪人の頭目** × 1<br>・**浪人** × 1 | 330 | 150 EXP | 250 G | - | [7033 食い詰めた浪人狩り](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7033_ronin.md) ボス戦 |
| **435** | `grp_yat_onryo` | ・**怨霊** × 2 | 300 | 160 EXP | 200 G | - | [7032 結界石の修復](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7032_shrine.md) |
| **440** | `grp_har_jiangshi_pack` | ・**キョンシー** × 3 | 270 | 105 EXP | 180 G | - | [7040 死者の還る山の浄化](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7040_jiangshi.md) |
| **441** | `grp_har_jiangshi_elite` | ・**古キョンシー** × 1<br>・**キョンシー** × 2 | 310 | 120 EXP | 200 G | - | [7040 死者の還る山の浄化](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7040_jiangshi.md) ボス戦 |
| **442** | `grp_har_guardian_beast` | ・**霊草の守護獣** × 1 | 140 | 60 EXP | 80 G | - | [7041 仙丹の材料採取](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7041_herb.md) ボス戦 |
| **443** | `grp_har_rebel_farmer` | ・**反乱農民** × 3 | 120 | 24 EXP | 30 G | - | [7042 辺境農民の反乱鎮圧](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7042_rebel.md) |
| **444** | `grp_har_rebel_leader` | ・**農民の首謀者** × 1<br>・**反乱農民** × 2 | 200 | 56 EXP | 70 G | - | [7042 辺境農民の反乱鎮圧](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7042_rebel.md) ボス戦 |
| **445** | `grp_har_assassin_wave1` | ・**刺客** × 2 | 160 | 70 EXP | 120 G | - | [7043 巡検使の護衛と汚職隠蔽](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7043_official.md) |
| **446** | `grp_har_assassin_elite` | ・**精鋭刺客** × 1<br>・**刺客** × 2 | 290 | 130 EXP | 220 G | - | [7043 巡検使の護衛と汚職隠蔽](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7043_official.md) ボス戦 |
| **447** | `grp_har_pirate_deck` | ・**水賊** × 3 | 270 | 105 EXP | 180 G | - | [7044 沿岸を荒らす海賊討伐](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7044_pirate.md) |
| **448** | `grp_har_pirate_captain` | ・**水賊の頭目** × 1<br>・**水賊** × 1 | 290 | 135 EXP | 260 G | - | [7044 沿岸を荒らす海賊討伐](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7044_pirate.md) ボス戦 |
| **450** | `grp_yat_mansion_ghost` | ・**怨霊** × 1<br>· **影守の怨霊** × 1<br>・**鬼火** × 1 | 420 | 220 EXP | 280 G | - | [7035 呪われた武家屋敷](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7035_mansion.md) |
| **451** | `grp_yat_mansion_boss` | ・**怨霊** × 2<br>・**影守の怨霊** × 1 | 520 | 280 EXP | 350 G | - | [7035 呪われた武家屋敷](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7035_mansion.md) ボス戦 |
| **452** | `grp_har_foxwed_guard` | ・**妖狐** × 2<br>・**キョンシー** × 1 | 370 | 185 EXP | 320 G | - | [7045 妖狐の嫁入り](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7045_foxwed.md) |
| **453** | `grp_har_foxwed_bride` | ・**妖狐の姫** × 1<br>・**妖狐** × 1 | 420 | 195 EXP | 330 G | - | [7045 妖狐の嫁入り](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7045_foxwed.md) ボス戦 |
| **460** | `grp_rep_mutant_guard` | ・**失敗作キメラ** × 2 | 500 | 160 EXP | 300 G | - | 指名手配 [5111 狂気の錬金術師](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5111_mutant.md) |
| **9061** | `grp_boss_crusader` | ・**堕落聖騎士** (ボス) × 1 | 800 | 300 EXP | 800 G | - | 討伐令 [5201 聖騎士反乱](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5201_crusader.md) ボス戦 |
| **9062** | `grp_boss_sand_king` | ・**砂の僭王** (ボス) × 1 | 900 | 350 EXP | 1000 G | - | 緊急依頼 [5202 砂漠の僭王](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5202_sand_king.md) ボス戦 |
| **9063** | `grp_boss_oni_general` | ・**鬼将・蛮骨** (ボス) × 1 | 1000 | 350 EXP | 1000 G | - | 退魔依頼 [5203 鬼将軍再臨](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5203_oni_general.md) ボス戦 |
| **9064** | `grp_boss_jade_serpent` | ・**翡翠大蛇** (ボス) × 1 | 1100 | 400 EXP | 1200 G | - | 討伐令 [5204 翡翠蛇](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5204_jade_serpent.md) ボス戦 |
| **9065** | `grp_boss_heretic_sage` | ・**異端の大賢者** (ボス) × 1 | 900 | 400 EXP | 1200 G | - | 最重要依頼 [5205 異端の大賢者](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5205_heretic_sage.md) ボス戦 |
| **9066** | `grp_boss_war_djinn` | ・**戦魔ジン** (ボス) × 1 | 1200 | 450 EXP | 1500 G | - | 封印解除 [5206 戦の魔神](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5206_war_djinn.md) ボス戦 |
| **9067** | `grp_boss_nine_tails` | ・**九尾の大妖狐** (ボス) × 1 | 1500 | 500 EXP | 1800 G | - | 最高討伐令 [5207 九尾の大狐](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5207_nine_tails.md) ボス戦 |
| **9111** | `grp_boss_mutant` | ・**完成体キメラ** (ボス) × 1 | 350 | 120 EXP | 300 G | - | 指名手配 [5111 狂気の錬金術師](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5111_mutant.md) ボス戦 |
| **9112** | `grp_boss_bandit_king` | ・**盗賊王バシム** (ボス) × 1 | 380 | 150 EXP | 400 G | - | 討伐依頼 [5112 砂漠の盗賊王](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5112_bandit_king.md) ボス戦 |
| **9113** | `grp_boss_cursed_ronin` | ・**妖刀の剣客** (ボス) × 1 | 420 | 180 EXP | 500 G | - | 討伐依頼 [5113 妖刀の辻斬り](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5113_cursed_blade.md) ボス戦 |
| **9114** | `grp_boss_false_sage` | ・**邪仙・道士** (ボス) × 1 | 450 | 200 EXP | 600 G | - | 討伐依頼 [5114 偽りの邪仙](file:///d:/dev/code-wirth-dawn/docs/quest/quest_5114_false_sage.md) ボス戦 |
| **510** | `bounty_low` | ・**新米ハンター** × 1<br>・**賞金稼ぎの狩人** × 1 | 190 | 110 EXP | 0 G | - | 低級手配（賞金稼ぎエンカウント） |
| **511** | `bounty_mid` | ・**賞金稼ぎの剣士** × 2 | 240 | 120 EXP | 0 G | - | 中級手配（賞金稼ぎエンカウント） |
| **512** | `bounty_high` | ・**ベテランハンター** × 1<br>・**魔術狩り** × 1 | 450 | 300 EXP | 0 G | - | 高級手配（賞金稼ぎエンカウント） |
| **513** | `bounty_elite` | ・**重装の処刑人** × 1<br>・**ベテランハンター** × 1 | 650 | 350 EXP | 0 G | - | 精鋭手配（賞金稼ぎエンカウント） |
| **514** | `bounty_legend` | ・**王国公認の凶刃** × 1<br>・**伝説の傭兵** × 1<br>・**静寂の死神** × 1 | 2250 | 1600 EXP | 0 G | - | 伝説手配（賞金稼ぎエンカウント） |
