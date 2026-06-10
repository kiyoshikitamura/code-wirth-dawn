# クエスト仕様書：5112 — 砂漠の盗賊王

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5112 |
| **Slug** | `qst_rep_bandit_king` |
| **クエスト種別** | 特殊クエスト（Special） |
| **推奨レベル** | 11（Hard） |
| **難度** | 3 |
| **依頼主** | マルカンド商人ギルド |
| **出現条件** | 第2話「砂礫の国境線」（6002）クリア / 滞在拠点: マルカンド拠点 / 名声 30 以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **経過日数 (time_cost)** | 4 |
| **ノード数** | 35ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 11） |
| **サムネイル画像** | `/images/quests/bg_desert.png` |
---

## 1. クエスト概要

### 短文説明
```
[討伐依頼] マルカンド近郊のキャラバンを襲う「砂漠の盗賊王」のアジトを強襲せよ。
```

### 長文説明
```
マルカンド大砂漠を横断するキャラバンが、巨大な盗賊団に次々と襲撃されている。
商人の護衛だけでは手が回らなくなり、商人ギルドは中堅冒険者に盗賊団のアジトそのものを
壊滅させるよう依頼を出した。
標的は、砂漠の地形を知り尽くした狡猾な「砂漠の盗賊王」バシムだ。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:1200|Exp:180|Rep:8`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 斬り捨てる（正義ルート） | 1200 | 180 | +8 | Justice:5 |
| 見逃して財宝奪取（強奪ルート） | 2500 | 150 | -5 | Chaos:5 |

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 2日 |

---

## 3. シナリオノードフロー

```text
start
 └─ start_02
     └─ start_03
         └─ start_04
             └─ travel_01
                 └─ travel_02
                     └─ desert_01
                         └─ desert_02
                             └─ choice_sandstorm (第1の選択：砂嵐への対応)
                                  ├─ 砂嵐を突っ切る → storm_push_01
                                  │                  └─ storm_push_trap (hp_damage 15%)
                                  │                       └─ storm_push_02
                                  │                            └─ merge_hideout
                                  └─ オアシスで待機 → oasis_wait_01
                                                      └─ oasis_random (random_branch 50%)
                                                           ├─ 成功（安全） → oasis_safe_01
                                                           │                  └─ merge_hideout
                                                           └─ 失敗（襲撃） → oasis_ambush_01
                                                                              └─ battle_ambush
                                                                                   ├─ win → merge_hideout
                                                                                   └─ lose → end_failure
                                                                                        └─ merge_hideout (実際にはloseから遷移しないが図示用)
                                                                                             └─ hideout_01
                                                                                                  └─ hideout_02
                                                                                                       └─ hideout_03
                                                                                                            └─ choice_infiltrate (第2の選択：潜入方法)
                                                                                                                 ├─ 正面突破 → assault_01
                                                                                                                 │            └─ battle_guard
                                                                                                                 │                 ├─ win → merge_boss
                                                                                                                 │                 └─ lose → end_failure
                                                                                                                 └─ 変装して潜入 → disguise_01
                                                                                                                                   └─ disguise_random (random_branch 60%)
                                                                                                                                        ├─ 成功（騙す） → disguise_success_01
                                                                                                                                        │                  └─ merge_boss
                                                                                                                                        └─ 失敗（バレる） → disguise_fail_01
                                                                                                                                                             └─ disguise_trap (hp_damage 10%)
                                                                                                                                                                  └─ merge_boss
                                                                                                                                                                       └─ boss_intro_01
                                                                                                                                                                            └─ boss_intro_02
                                                                                                                                                                                 └─ boss_intro_03
                                                                                                                                                                                      └─ battle_boss
                                                                                                                                                                                           ├─ win → victory_01
                                                                                                                                                                                           │        └─ victory_02
                                                                                                                                                                                           │             └─ choice_fate
                                                                                                                                                                                           │                  ├─ 斬り捨てる → fate_justice_01
                                                                                                                                                                                           │                  │                └─ fate_justice_02
                                                                                                                                                                                           │                  │                     └─ end_success_justice
                                                                                                                                                                                           │                  └─ 財宝を奪う → fate_chaos_01
                                                                                                                                                                                           │                                   └─ fate_chaos_02
                                                                                                                                                                                           │                                        └─ end_success_chaos
                                                                                                                                                                                           └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルド受付
```text
「商人ギルドからの依頼だ。キャラバンを襲う盗賊団のアジトを特定したらしい」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルド受付
```text
「相手は『砂漠の盗賊王バシム』。砂嵐を利用して神出鬼没に略奪を繰り返す男だ」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルド受付
```text
「兵士の目につかない岩陰に要塞を築いているという。腕利きの冒険者の出番だ」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
盗賊の親玉か。報酬は悪くない。準備を整え、砂漠へと足を踏み入れた。
```

#### `travel_01`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
強烈な日差しが降り注ぐマルカンド大砂漠。水筒の水を大事に飲みながら進む。
```

#### `travel_02`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
アジトがあるとされる岩山地帯まではまだ距離がある。砂に足を取られ、体力が削られる。
```

#### `desert_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
空が急に暗くなった。前方から巨大な砂嵐が迫ってきている！
```

#### `desert_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
盗賊たちはこの砂嵐を利用して移動するらしいが、まともに巻き込まれれば危険だ。
```

#### `choice_sandstorm`（choice）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「マントで顔を覆い、強行突破する」 | storm_push_01 |
| 「近くのオアシスに避難し、嵐が過ぎるのを待つ」 | oasis_wait_01 |

#### `storm_push_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
砂嵐の中に飛び込む！ 視界が完全に奪われ、強風で飛んできた岩が体に当たる。
```

#### `storm_push_trap`（hp_damage）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
**パラメータ:** percent: 15
```text
鋭い岩片が直撃した！ 息も絶え絶えになりながら砂嵐を抜ける。
```

#### `storm_push_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
**次ノード:** merge_hideout
```text
砂まみれになったが、アジトのある岩山へは予想より早く到着できた。
```

#### `oasis_wait_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_mystery
```text
オアシスに身を隠す。風が止むのを待つ間、周囲の気配を探る……。
```

#### `oasis_random`（random_branch）
**パラメータ:** prob: 50, next: `oasis_safe_01`, fallback: `oasis_ambush_01`

#### `oasis_safe_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
**次ノード:** merge_hideout
```text
砂嵐が過ぎ去った。体力を温存したまま、アジトへと向かうことができた。
```

#### `oasis_ambush_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
「誰かいるぞ！」
オアシスをねぐらにしていた砂漠の魔物に目をつけられた！
```

#### `battle_ambush`（battle）
**演出:** bg: bg_desert, bgm: bgm_battle
**パラメータ:** enemy_group_id: 111
```text
砂漠の魔物との戦闘！
```
*(注: 111はneutral_wolf_group等の既存の適当なモブ)*

#### `merge_hideout`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
岩山に到着した。見張りの盗賊が立っている。奥がアジトへの入り口だ。
```

#### `hideout_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
入り口には重武装の盗賊が複数いる。真正面から行くか、一工夫するか。
```

#### `hideout_02`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
ちょうど、略奪を終えて帰還してきたらしい商人の服を着た盗賊の一団がいる。
```

#### `hideout_03`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
あの服を奪えば変装できるかもしれない。どうする？
```

#### `choice_infiltrate`（choice）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「小細工は無用。正面から蹴散らす」 | assault_01 |
| 「商人の服を奪い、変装して潜入する」 | disguise_01 |

#### `assault_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
武器を抜き、見張りに斬りかかる！「敵襲だぁ！！」
```

#### `battle_guard`（battle）
**演出:** bg: bg_desert, bgm: bgm_battle
**パラメータ:** enemy_group_id: 112
```text
盗賊の見張り部隊との戦闘！
```
*(注: 112はbandit_guard_group等)*

#### `disguise_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_mystery
```text
商人の服を被り、うつむき加減で見張りの前を通過する……。
「おい、お前。見ない顔だな？」
```

#### `disguise_random`（random_branch）
**パラメータ:** prob: 60, next: `disguise_success_01`, fallback: `disguise_fail_01`

#### `disguise_success_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_mystery
**次ノード:** merge_boss
```text
「ああ、新入りの……」適当に誤魔化すと、見張りは興味を失った。無傷で潜入に成功した。
```

#### `disguise_fail_01`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
「嘘をつけ！ 侵入者だ！」
見張りに背後から蹴りを入れられ、囲まれた！
```

#### `disguise_trap`（hp_damage）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
**パラメータ:** percent: 10
**次ノード:** merge_boss
```text
包囲を力ずくで突破し、アジトの奥へ逃げ込む。無駄な傷を負ってしまった。
```

#### `merge_boss`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
騒ぎの中、アジトの最深部である広間に到達した。
```

#### `boss_intro_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss, speaker: 盗賊王バシム
```text
「俺の要塞にネズミが入り込んだと聞いてな。随分と威勢がいいじゃねえか」
```

#### `boss_intro_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss, speaker: 盗賊王バシム
```text
豪華な絨毯の上に座る、巨体の男。彼こそが砂漠の盗賊王バシムだ。
巨大な曲刀を手に、ゆっくりと立ち上がる。
```

#### `boss_intro_03`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss, speaker: 盗賊王バシム
```text
「砂漠の掟を教えてやる。弱い奴は、死ぬんだよ！」
```

#### `battle_boss`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9112
```text
盗賊王バシムとの決戦！
```

#### `victory_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
「ま、待て！ 降参だ、俺の負けだ！」
巨体を揺らし、盗賊王は武器を捨てて土下座した。
```

#### `victory_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm, speaker: 盗賊王バシム
```text
「命だけは助けてくれ！ あんたには俺が隠し持ってる財宝を全部くれてやる！ 金なら一生遊んで暮らせるだけあるんだ！」
```

#### `choice_fate`（choice）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「悪党の命乞いなど聞く耳を持たん。斬る」 | fate_justice_01 |
| 「……その話、乗ろう。財宝の場所を吐け」 | fate_chaos_01 |

#### `fate_justice_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
「ひっ、やめっ——！」
命乞いをする悪党に容赦なく刃を振り下ろし、その息の根を止めた。
```

#### `fate_justice_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
盗賊王の首を持ち帰り、ギルドに報告した。
「見事だ。これでキャラバンの安全も保たれる」
```

#### `end_success_justice`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。悪を許さぬ正義の刃は、街の商人たちから大いに称賛された。
```
**rewards:** Gold:1200, Exp:180, Rep:8, Justice:5

#### `fate_chaos_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
隠し財宝の場所を案内させ、金銀財宝をすべて自分の袋に詰め込んだ。
「これでいいだろ？ 見逃してくれよな」
```

#### `fate_chaos_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_mystery
```text
ギルドには「取り逃がした。だがアジトは壊滅させた」と報告した。
報酬は少なかったが、そんなものはどうでもいいほどの金を既に手に入れている。
```

#### `end_success_chaos`（end_success）
**演出:** bg: bg_guild
```text
依頼達成……？ ギルドの信用は落ちたが、懐は桁違いに温かくなった。
悪党を利用するのも冒険者の生存戦略だ。
```
**rewards:** Gold:2500, Exp:150, Rep:-5, Chaos:5

#### `end_failure`（end_failure）
**演出:** bg: bg_crypt
```text
盗賊王の曲刀が胴体を薙ぎ払った。
「砂漠の砂の養分になりな！」下品な笑い声が遠ざかっていく……。
```

---

## 4. 新規エネミー・アイテム定義参照

**使用エネミー（新規）:**
| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 1312 | `enemy_bandit_elite` | 盗賊団の精鋭 | 10 | 220 | 35 | 10 |
| 6112 | `boss_bandit_king` | 盗賊王バシム | 13 | 380 | 40 | 10 |

**使用エネミーグループ:**
| ID | Slug | 構成エネミー | 用途 |
|-----|-----|-----|-----|
| 112 | `grp_bandit_elite` | `enemy_bandit_elite` | 盗賊アジト見張り |
| 9112 | `grp_boss_bandit` | `boss_bandit_king` | ボス戦 |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
5112,qst_rep_bandit_king,砂漠の盗賊王,11,3,4,"{""completed_quest"":""main_ep02"",""min_reputation"":30,""nation_id"":""loc_markand""}",false,,,商人ギルド,[討伐依頼] マルカンド近郊のキャラバンを襲う「砂漠の盗賊王」のアジトを強襲せよ。
```

---

## 6. 実装チェックリスト

- [ ] 新規エネミー・グループをCSVに登録
- [ ] 砂嵐の分岐（強行 vs オアシス）の動作
- [ ] アジト潜入の分岐（正面 vs 変装）の動作
- [ ] トラップ（hp_damage）およびランダムエンカウントが正常に動作
- [ ] 最終選択肢（正義ルート vs 強奪ルート）のアライメントおよび報酬差異
- [ ] 全35ノードの遷移が正しいこと
