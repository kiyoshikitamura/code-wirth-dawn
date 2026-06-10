# クエスト仕様書：5203 — 鬼将軍の再臨

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5203 |
| **Slug** | `qst_rep_oni_general` |
| **クエスト種別** | 特殊クエスト（Special） |
| **推奨レベル** | 16（Hard） |
| **難度** | 4 |
| **依頼主** | 代官所 |
| **出現条件** | 第5話「大義という名の虚妄」（6005）クリア / 滞在拠点: 夜刀神国拠点 / 名声 60 以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **経過日数 (time_cost)** | 6 |
| **ノード数** | 50ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 16） |
| **サムネイル画像** | `/images/quests/bg_forest_night.png` |
---

## 1. クエスト概要

### 短文説明
```
[退魔依頼] 古戦場に百年前の鬼将の亡霊が復活。周辺の村が脅かされている。
```

### 長文説明
```
夜刀神国の北方、百年前の大合戦で討たれた鬼将・蛮骨の怨念が復活した。
古戦場一帯に亡霊の軍勢が徘徊し、近隣の村を脅かしている。
代官所は名声ある冒険者に退魔を依頼する。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:3000|Exp:400|Rep:15|Justice:5`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 武力で討伐（デフォルト） | 3000 | 400 | +15 | Justice:5 |
| 鎮魂の儀で成仏させる（選択肢） | 2000 | 350 | +25 | Order:8 |

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 3日 |

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ travel_01
             └─ travel_02
                 └─ field_01
                     └─ field_02
                         └─ random_fog (random_branch 60%/40%)
                              ├─ 成功 → safe_path
                              │          └─ safe_path_02
                              │               └─ merge_battle
                              └─ 失敗 → lost_01
                                         └─ lost_trap (hp_damage 10%)
                                              └─ lost_02
                                                   └─ merge_battle
                                                        └─ battle_ghost (亡霊戦)
                                                             ├─ win → deeper_01
                                                             │        └─ deeper_02
                                                             │             └─ deeper_03
                                                             │                  └─ altar_01
                                                             │                       └─ altar_02
                                                             │                            └─ altar_03
                                                             │                                 └─ battle_boss
                                                             │                                      ├─ win → victory_01
                                                             │                                      │        └─ victory_02
                                                             │                                      │             └─ victory_03
                                                             │                                      │                  └─ choice_fate
                                                             │                                      │                       ├─ 討伐 → destroy_01
                                                             │                                      │                       │          └─ destroy_02
                                                             │                                      │                       │               └─ end_success
                                                             │                                      │                       └─ 鎮魂 → requiem_01
                                                             │                                      │                                  └─ requiem_02
                                                             │                                      │                                       └─ requiem_03
                                                             │                                      │                                            └─ end_success_peace
                                                             │                                      └─ lose → end_failure
                                                             └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 代官
```text
「北の古戦場から、異様な報告が届いている。百年前の亡霊が蘇ったと」
```

#### `start_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm, speaker: 代官
```text
「鬼将・蛮骨。百年前の大合戦で討たれたはずの鬼の大将だ」
```

#### `start_02_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
（蛮骨……。夜刀神国の歴史書に必ず名が出る、伝説的な大悪鬼だな）
```

#### `start_03`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
代官の顔は蒼い。蛮骨の名は今なお夜刀の民を震え上がらせる。名声ある者でなければ引き受ける者はいまい。
```

#### `start_03_02`（text）
**演出:** bg: bg_yato_city, bgm: bgm_quest_calm
```text
（代官は小刻みに手を震わせながら、厳重に封をされた依頼書を手渡した）
```

#### `travel_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
古戦場へ向かう。道中、逃げてきた村人たちとすれ違った。目に恐怖が浮かんでいる。
```

#### `travel_01_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
（彼らは着の身着のままで、背後の荒野を恐れるように何度も振り返っていた）
```

#### `travel_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
古戦場が近づくと、空気が変わった。冷たく、重い——瘴気だ。
```

#### `field_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
古戦場に入った。地面には錆びた武具が散乱し、霧が立ち込めている。
```

#### `field_01_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
（百年前の血を吸った土壌から、青白い怨念の霧が絶え間なく湧き出ている）
```

#### `field_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
濃い霧の中では方向感覚が狂う。正しい道を見極められるか——
```

#### `random_fog`（random_branch）
**パラメータ:** prob: 60, next: `safe_path`, fallback: `lost_01`

#### `safe_path`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
風向きを読み、霧の薄い方向へ進んだ。古戦場の中心部が見えてきた。
```

#### `safe_path_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
**次ノード:** `merge_battle`
```text
体力を温存したまま、古戦場の核心部に到達できた。
```

#### `lost_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
霧に惑わされ、足元の朽ちた武具に足を取られた——
```

#### `lost_01_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
（底なしの泥濘と、刃のように鋭い瓦礫が足元を襲う！）
```

#### `lost_trap`（hp_damage）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
地面に埋まっていた古い槍が足を貫いた！ 百年前の罠がまだ生きているのか。
```

#### `lost_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
傷を手当てし、なんとか古戦場の中心部に辿り着いた。体力は削られたが、進むしかない。
```

#### `lost_02_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
**次ノード:** `merge_battle`
```text
（痛む足を引きずりながら、怨念の渦巻く中心地へと足を進める）
```

#### `merge_battle`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
霧の中から、青白い炎をまとった兵士たちが現れた。百年前の亡霊兵だ。
```

#### `battle_ghost`（battle）
**演出:** bg: bg_forest_night, bgm: bgm_battle
**パラメータ:** enemy_group_id: 416, next: `deeper_01`, fail: `end_failure_01`

#### `deeper_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
亡霊兵を退けると、霧が少し晴れた。古戦場の最奥に、朽ちた陣屋が見える。
```

#### `deeper_01_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
（かつての大将軍が腰掛けたであろう、戦塵に塗れた幕舎が厳かに佇んでいる）
```

#### `deeper_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
陣屋の周囲には、百年前の武将旗が風に揺れている。蛮骨の本陣だ。
```

#### `deeper_02_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
（破れた旗には、蛮骨の家紋が黒々とした怨念のオーラを帯びて浮かんでいる）
```

#### `deeper_03`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_mystery
```text
陣屋の扉を開ける。中は異様な冷気に満ちている。
```

#### `altar_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
陣屋の奥に、巨大な骨が組み上げられた祭壇がある。その上に——鬼の影が立っていた。
```

#### `altar_01_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
（その影はゆっくりと振り向き、深紅の光を帯びた眼光でこちらを睨み据えた）
```

#### `altar_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_battle_boss, speaker: 蛮骨
```text
「……百年ぶりに、自分と戦える者が来たか」
```

#### `altar_03`（text）
**演出:** bg: bg_forest_night, bgm: bgm_battle_boss, speaker: 蛮骨
```text
「自分の怨念は深い。この戦場で死んだ兵たちの無念と共に——お前を葬る！」
```

#### `battle_boss`（battle）
**演出:** bg: bg_forest_night, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9063, next: `victory_01`, fail: `end_failure_01`

#### `victory_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
蛮骨の巨体が揺らいだ。怨念の炎が弱まっている。
```

#### `victory_01_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
（大気を震わせていた強大な瘴気が霧散し、彼の巨躯から力が抜けていく）
```

#### `victory_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm, speaker: 蛮骨
```text
「……強い。百年前のどの武者よりも。自分の怨念を断つか、鎮めるか——お前が決めろ」
```

#### `victory_03`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
蛮骨が片膝をつき、静かに目を閉じた。その表情には怒りではなく、疲れがある。
```

#### `choice_fate`（choice）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「怨念ごと討ち滅ぼす。二度と蘇るな」 | `destroy_01` |
| 「鎮魂の儀を行う。安らかに眠れ」 | `requiem_01` |

#### `destroy_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
蛮骨の核を砕いた。怨念が爆発し、古戦場の霧が一気に晴れた。
```

#### `destroy_01_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
```text
（天を覆っていた黒雲が裂け、差し込む月光が荒涼とした古戦場を照らし出す）
```

#### `destroy_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
古戦場は静寂に包まれた。百年の呪いは完全に消えた。
```

#### `end_success`（end_success）
**演出:** bg: bg_yato_city
```text
「鬼将の怨念を完全に消滅させたか。力ずくだが、確実な方法だ」
村人たちは安堵した。恐怖は去り、日常が戻る。
```
**rewards:** Gold:3000, Exp:400, Rep:15, Justice:5

#### `requiem_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
古の鎮魂の祈りを捧げる。蛮骨の体が光に包まれていく。
```

#### `requiem_01_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
（懐から取り出した香を焚き、静かに鎮魂の祝詞を唱え始める）
```

#### `requiem_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm, speaker: 蛮骨
```text
「……感謝する。百年、ずっと戦い続けていた。……もう、疲れた」
```

#### `requiem_02_02`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_calm
```text
（蛮骨の巨躯は穏やかな光の粒子となり、夜空へとゆっくり昇っていった）
```

#### `requiem_03`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
蛮骨と共に、亡霊兵たちも光の中に消えていった。古戦場に、百年ぶりの静寂が訪れた。
```

#### `end_success_peace`（end_success）
**演出:** bg: bg_yato_city
```text
「鎮魂の儀で成仏させたか。報酬は控えめだが、村の長老たちが深く感謝している」
秩序を乱さず、怨霊を鎮めた。古の武士道に通じる選択だった。
```
**rewards:** Gold:2000, Exp:350, Rep:25, Order:8

#### `end_failure_01`（text）
**演出:** bg: bg_forest_night, bgm: bgm_quest_tense
**次ノード:** `end_failure`
```text
蛮骨の放った大太刀の一撃が防具を粉砕する。激痛と衝撃に視界が暗転した。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_forest_night
```text
蛮骨の拳が全てを薙ぎ払った。百年の怨念の前に、自分の力はまだ足りなかった。
```
**rewards:** Gold:0