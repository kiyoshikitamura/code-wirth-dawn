# クエスト仕様書：5205 — 異端の大賢者

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5205 |
| **Slug** | `qst_rep_heretic_sage` |
| **クエスト種別** | 特殊クエスト（Special） |
| **推奨レベル** | 21（Hard） |
| **難度** | 5 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | 第10話「世界の底が抜ける日」（6010）クリア / 滞在拠点: ローランド聖王国拠点 / 名声 80 以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **経過日数 (time_cost)** | 6 |
| **ノード数** | 55ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 21） |
| **サムネイル画像** | `/images/quests/bg_crypt.png` |
---

## 1. クエスト概要

### 短文説明
```
[最重要] 禁忌の魔法を研究する大賢者が地下墓地で実験を続けている。
```

### 長文説明
```
ローランド聖王国の地下墓地で、禁忌の死霊魔法を研究する大賢者が活動している。
その実験によってアンデッドが大量発生し、周辺の村に被害が出始めた。
教会は手を出せず、ギルドが名声ある冒険者に討伐を依頼する。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:4000|Exp:450|Rep:20|Order:8`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 研究所破壊（デフォルト） | 4000 | 450 | +20 | Order:8 |
| 研究成果を没収して見逃す（選択肢） | 5500 | 350 | -20 | Chaos:10 |

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
         └─ start_04
             └─ travel_01
                 └─ crypt_01
                     └─ crypt_02
                         └─ choice_approach (地下探索方法)
                              ├─ 罠解除 → trap_route_01
                              │            └─ trap_route_02
                              │                 └─ trap_route_03 (スキルチェック: 安全通過)
                              │                      └─ merge_deep
                              └─ 強行突破 → force_01
                                             └─ force_02
                                                  └─ force_trap (hp_damage 20%)
                                                       └─ force_03
                                                            └─ merge_deep
                                                                 └─ deep_01
                                                                      └─ deep_02
                                                                           └─ battle_undead (アンデッド戦)
                                                                                ├─ win → lab_01
                                                                                │        └─ lab_02
                                                                                │             └─ lab_03
                                                                                │                  └─ lab_04
                                                                                │                       └─ battle_golem (ゴーレム中ボス戦)
                                                                                │                            ├─ win → sage_01
                                                                                │                            │        └─ sage_02
                                                                                │                            │             └─ sage_03
                                                                                │                            │                  └─ sage_04
                                                                                │                            │                       └─ battle_boss
                                                                                │                            │                            ├─ win → victory_01
                                                                                │                            │                            │        └─ victory_02
                                                                                │                            │                            │             └─ victory_03
                                                                                │                            │                            │                  └─ choice_fate
                                                                                │                            │                            │                       ├─ 破壊 → destroy_01
                                                                                │                            │                            │                       │          └─ destroy_02
                                                                                │                            │                            │                       │               └─ end_success
                                                                                │                            │                            │                       └─ 見逃す → deal_01
                                                                                │                            │                            │                                    └─ deal_02
                                                                                │                            │                            │                                         └─ deal_03
                                                                                │                            │                            │                                              └─ end_success_deal
                                                                                │                            │                            └─ lose → end_failure
                                                                                │                            └─ lose → end_failure
                                                                                └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「地下墓地で異常なアンデッドの発生が報告されている。原因は一人の大賢者だ」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「死霊術の禁忌に手を出した男——元宮廷魔術師のメルヴィンだ」
```

#### `start_02_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
（メルヴィン……。十年前、禁忌の研究が露見して追放されたはずだが）
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルドマスター
```text
「教会は面子があって動けない。元宮廷の人間だからな。だからギルドに話が来た」
```

#### `start_03_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
ギルドマスターは声を潜め、周囲に会話が漏れないよう注意深く周囲を見渡した。
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
禁忌の魔法使い相手だ。地下墓地は罠だらけだろう。慎重に進む必要がある。
```

#### `travel_01`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
聖王国の南、古い墓地の入口に着いた。地面が微かに震えている——死霊術の余波だ。
```

#### `travel_01_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_field
```text
（枯れ果てた樹木が立ち並ぶ墓地には、人影はなく、ただ重苦しい静寂が支配している）
```

#### `crypt_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
地下への階段を降りる。壁面に刻まれた魔法陣が青白く光っている。
```

#### `crypt_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
（魔力の波が空気を通じて伝わり、皮膚を刺すような微かな痛みを覚える）
```

#### `crypt_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
通路の先に魔法の罠が仕掛けられている。解除する技術があれば安全に通れるが——
```

#### `choice_approach`（choice）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「魔法陣を分析して罠を解除する」 | `trap_route_01` |
| 「時間をかけず強行突破する」 | `force_01` |

#### `trap_route_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
魔法陣の構造を分析する。メルヴィンの仕掛けは精巧だが、理論的な弱点がある。
```

#### `trap_route_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
（複雑に絡み合う魔力回路を一つずつ丁寧に解きほぐしていく）
```

#### `trap_route_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
弱点を突いて魔法陣を無力化した。静かに通路を進む。
```

#### `trap_route_03`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
**次ノード:** `merge_deep`
```text
罠を全て解除し、安全に通過できた。体力を温存したまま奥へ進める。
```

#### `force_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
罠を無視して突っ走る。魔法陣が反応し、電撃が走る——！
```

#### `force_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
（激しい魔力の放電が通路を照らし、青白い火花が飛び散る！）
```

#### `force_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
壁からゴーレムの腕が飛び出し、通路が崩れる。足元の床が陥没した——！
```

#### `force_trap`（hp_damage）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
**パラメータ:** percent: 20
```text
連続する罠を食らった！ 全身に電撃と打撃のダメージを受ける。
```

#### `force_03`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
**次ノード:** `merge_deep`
```text
ボロボロだが通り抜けた。罠を解除する知恵があればと悔やむが、先に進むしかない。
```

#### `merge_deep`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
地下墓地の深部に入った。壁の棺から、アンデッドが這い出してくる。
```

#### `deep_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
死霊術で蘇らせられた死者たち。意思はなく、ただ動くだだけの人形だ。
```

#### `deep_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
（カタカタと骨を鳴らし、虚ろな眼窩に怪しい光を宿した骸骨たちが迫る）
```

#### `deep_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
アンデッドの群れが道を塞がいんでいる。突破するしかない！
```

#### `battle_undead`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle
**パラメータ:** enemy_group_id: 416, next: `lab_01`, fail: `end_failure_01`

#### `lab_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
アンデッドを退けると、研究室らしき部屋に辿り着いた。実験器具が整然と並んでいる。
```

#### `lab_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
（薬品のすっぱい臭いが部屋に充満し、謎の液体がフラスコで沸騰している）
```

#### `lab_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
机の上に研究ノートがある。死霊術の理論が事細かに記されている。恐ろしい内容だ。
```

#### `lab_03`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
研究室の奥に鉄の扉がある。その前に、石のゴーレムが番人のように立っている。
```

#### `lab_03_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
（ゴーレムの全身には、メルヴィンの魔力供給ラインと思われる青い光の筋が走る）
```

#### `lab_04`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
ゴーレムの目が赤く光った。メルヴィンが作った護衛だ。
```

#### `battle_golem`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle
**パラメータ:** enemy_group_id: 413, next: `sage_01`, fail: `end_failure_01`

#### `sage_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
ゴーレムを破壊し、鉄の扉を開けた。奥にはさらに広大な空間が広がっている。
```

#### `sage_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
（大空間の床には巨大な魔法陣が描かれ、死者の魂と思しき光が吸い込まれている）
```

#### `sage_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss
```text
部屋の中央に、白髪の老人が佇んでいる。周囲を死霊の光が渦巻いている。
```

#### `sage_02_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss
```text
（メルヴィンはゆっくりと振り向き、深い皺の刻まれた顔に狂気の笑みを浮かべた）
```

#### `sage_03`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss, speaker: メルヴィン
```text
「……客か。自分の研究を邪魔しに来たのだな」
```

#### `sage_04`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss, speaker: メルヴィン
```text
「死は克服できる。自分はそれを証明する。邪魔をするなら——自分の実験台になってもらう」
```

#### `battle_boss`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9065, next: `victory_01`, fail: `end_failure_01`

#### `victory_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
メルヴィンの杖が折れ、死霊の光が消えた。老賢者は座り込んで肩を震わせている。
```

#### `victory_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
（膝をついた老人の周囲から、渦巻いていた冷たい魔力が静かに霧散していく）
```

#### `victory_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm, speaker: メルヴィン
```text
「……負けたか。好きにしろ。だが自分の研究成果は本物だ。死を克服する鍵がここにある」
```

#### `victory_03`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
メルヴィンの研究ノートが目の前にある。破壊すべきか——それとも。
```

#### `choice_fate`（choice）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「研究所ごと破壊する。禁忌の知識は封じるべきだ」 | `destroy_01` |
| 「研究成果だけ没収する。メルヴィンは……見逃してやる」 | `deal_01` |

#### `destroy_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
研究ノートを燃やし、実験器具を破壊した。メルヴィンを教会に引き渡す。
```

#### `destroy_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
（炎に包まれる魔術書を見つめ、メルヴィンは絶望の叫びを上げた）
```

#### `destroy_02`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
教会は即座にメルヴィンを裁いた。禁忌の知識は完全に封じられた。
```

#### `end_success`（end_success）
**演出:** bg: bg_church
```text
「大賢者の拘束と研究所の破壊を確認。秩序を守った功績、高く評価する」
禁忌の知識が世に出ることはなくなった。正しい選択だと信じる。
```
**rewards:** Gold:4000, Exp:450, Rep:20, Order:8

#### `deal_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery, speaker: メルヴィン
```text
「……見逃す、だと？ 何を企んでいる」
```

#### `deal_01_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
（こちらの条件を聞くと、老賢者は驚きと疑心の入り混じった目でこちらを見つめた）
```

#### `deal_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
研究ノートだけ回収し、メルヴィンを解放した。このノートは闇市場で高値がつくだろう。
```

#### `deal_03`（text）
**演出:** bg: bg_road_day, bgm: bgm_quest_calm
```text
ギルドには「研究所を破壊し、賢者は逃走した」と報告。真実を知る者はいない。
```

#### `end_success_deal`（end_success）
**演出:** bg: bg_slums
```text
研究ノートを闇市で売りさばき、莫大な金を手にした。
だがギルドからの信頼は失墜した。「異端者を逃がした」という噂が広まっている。
```
**rewards:** Gold:5500, Exp:350, Rep:-20, Chaos:10

#### `end_failure_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
**次ノード:** `end_failure`
```text
メルヴィンの放った漆黒の魔力弾が胸元に直撃する。激痛に耐えかね、崩れ落ちた。
```

#### `end_failure`（end_failure）
**演出:** bg: bg_crypt
```text
メルヴィンの死霊魔法が全身を蝕んだ。意識が遠のく中、老賢者の呟きが聞こえた。
「やはり、死は克服できない——まだ」
```
**rewards:** Gold:0