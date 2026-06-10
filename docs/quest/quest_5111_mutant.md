# クエスト仕様書：5111 — 狂気の錬金術師

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5111 |
| **Slug** | `qst_rep_mutant` |
| **クエスト種別** | 特殊クエスト（Special） |
| **推奨レベル** | 10（Hard） |
| **難度** | 3 |
| **依頼主** | 聖騎士団・特務隊 |
| **出現条件** | 第2話「砂礫の国境線」（6002）クリア / 滞在拠点: loc_roland / 名声 30 以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **経過日数 (time_cost)** | 4 |
| **ノード数** | 33ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 10） |
| **サムネイル画像** | `/images/quests/bg_crypt.png` |
---

## 1. クエスト概要

### 短文説明
```
[指名手配] 地下水道で違法な生体実験を繰り返す狂気の錬金術師を捕縛せよ。
```

### 長文説明
```
ローランド聖王国の地下水道で、最近人が消える事件が多発している。
異端審問会の調査により、破門された狂気の錬金術師が地下にアジトを構え、
禁忌の生体実験を行っていることが判明した。
聖騎士団から、中堅以上の実力を持つ冒険者にアジトの強襲と錬金術師の捕縛依頼が下った。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:1000|Exp:150|Rep:5`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 資料を提出（デフォルト） | 1000 | 150 | +5 | Order:5 |
| 資料を横流し（闇市ルート） | 1800 | 120 | ±0 | Evil:5 |

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
                     └─ sewer_01
                         └─ sewer_02
                             └─ choice_gate (第1の選択：鉄格子の突破)
                                  ├─ 強行突破 → gate_break_01
                                  │             └─ gate_break_trap (hp_damage 15%)
                                  │                  └─ gate_break_02
                                  │                       └─ merge_lab
                                  └─ 鍵探し → gate_search_01
                                               └─ gate_search_random (random_branch 60%)
                                                    ├─ 成功（発見） → search_success
                                                    │                  └─ merge_lab
                                                    └─ 失敗（罠発動） → search_fail
                                                                       └─ search_fail_trap (hp_damage 10%)
                                                                            └─ merge_lab
                                                                                 └─ lab_01
                                                                                      └─ lab_02
                                                                                           └─ lab_03
                                                                                                └─ choice_guard (第2の選択：見張りの突破)
                                                                                                     ├─ 正面から倒す → guard_fight_01
                                                                                                     │                  └─ battle_guard
                                                                                                     │                       ├─ win → merge_boss
                                                                                                     │                       └─ lose → end_failure
                                                                                                     └─ 抜け道を探す → guard_sneak_01
                                                                                                                        └─ guard_sneak_02
                                                                                                                             └─ merge_boss
                                                                                                                                  └─ boss_intro_01
                                                                                                                                       └─ boss_intro_02
                                                                                                                                            └─ boss_intro_03
                                                                                                                                                 └─ battle_boss
                                                                                                                                                      ├─ win → victory_01
                                                                                                                                                      │        └─ victory_02
                                                                                                                                                      │             └─ choice_fate
                                                                                                                                                      │                  ├─ 騎士団へ提出 → report_order_01
                                                                                                                                                      │                  │                  └─ report_order_02
                                                                                                                                                      │                  │                       └─ end_success_order
                                                                                                                                                      │                  └─ 闇市へ横流し → report_evil_01
                                                                                                                                                      │                                     └─ report_evil_02
                                                                                                                                                      │                                          └─ end_success_evil
                                                                                                                                                      └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルド受付嬢
```text
「今回は聖騎士団からの直接指名依頼です。地下水道に潜む狂人の捕縛ですね」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルド受付嬢
```text
「相手は破門された錬金術師。人間と魔物を掛け合わせる禁忌の実験を行っているとか……」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: ギルド受付嬢
```text
「危険な生体兵器がいるかもしれません。十分な準備をして挑んでください」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
中堅冒険者としての実力が試される任務だ。気を引き締めて地下水道へ向かう。
```

#### `travel_01`（text）
**演出:** bg: bg_slums, bgm: bgm_field
```text
聖都の地下へと続く隠し通路は、貧民街の奥にあった。ひどい悪臭が漂っている。
```

#### `travel_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
地下水道に降り立った。空気は淀み、壁には不気味な粘液が付着している。
```

#### `sewer_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
騎士団の情報によれば、この奥に錬金術師の実験区画があるはずだ。
```

#### `sewer_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
奥へ進むと、頑丈な鉄格子で道が塞がれていた。錠前には見慣れない魔法陣が刻まれている。
```

#### `choice_gate`（choice）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「武器で錠前を力任せに破壊する」 | gate_break_01 |
| 「周囲を探索して解除キー（鍵）を探す」 | gate_search_01 |

#### `gate_break_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
魔法陣ごと力任せに破壊する！ けたたましい音と共に鉄格子が開いたが——
```

#### `gate_break_trap`（hp_damage）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
**パラメータ:** percent: 15
```text
破壊に反応して、仕掛けられていた爆薬が作動！ 爆発に巻き込まれた。
```

#### `gate_break_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
**次ノード:** merge_lab
```text
煙を払いながら立ち上がる。傷を負ったが、先へ進むことはできそうだ。
```

#### `gate_search_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
周囲の汚水の中を探る。錬金術師の弟子が落とした鍵がないだろうか……。
```

#### `gate_search_random`（random_branch）
**パラメータ:** prob: 60, next: `search_success`, fallback: `search_fail`

#### `search_success`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
**次ノード:** merge_lab
```text
汚泥の中から魔法陣の解除キーを発見した。無傷で鉄格子を開けることに成功した。
```

#### `search_fail`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
汚泥の中を探った瞬間、潜んでいた毒スライムに腕を噛みつかれた！
```

#### `search_fail_trap`（hp_damage）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
**パラメータ:** percent: 10
**次ノード:** merge_lab
```text
スライムを振り払うが、軽度の毒を受けた。結局、力任せに鉄格子を壊して進む。
```

#### `merge_lab`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
鉄格子を抜け、実験区画の入り口に到達した。鼻を突く薬品の臭いが強くなる。
```

#### `lab_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
廊下の奥には、不気味な培養槽が並ぶ部屋が見える。あそこが最深部だ。
```

#### `lab_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
しかし、扉の前には巨大な肉塊のような化け物が鎮座している。失敗作のキメラだ。
```

#### `lab_03`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
見張りのようだが、知性は低そうだ。どうやって突破するか？
```

#### `choice_guard`（choice）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「見つかる前に先制攻撃で仕留める」 | guard_fight_01 |
| 「肉片を遠くに投げて気を逸らし、背後を通り抜ける」 | guard_sneak_01 |

#### `guard_fight_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
正面から武器を構え、見張りのキメラに突撃する！
```

#### `battle_guard`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle
**パラメータ:** enemy_group_id: 1311
```text
失敗作キメラが襲いかかってきた！
```

#### `guard_sneak_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
```text
道中で拾った魔物の肉片を、部屋の隅へ向けて思い切り投げた。
```

#### `guard_sneak_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_mystery
**次ノード:** merge_boss
```text
キメラは肉片の音に釣られ、のそりと移動した。その隙に背後をすり抜ける。
```

#### `merge_boss`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_tense
```text
ついに最深部の実験室に踏み込んだ。
```

#### `boss_intro_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss, speaker: 狂気の錬金術師
```text
「なんだね君は！ 私の美しい実験を邪魔するつもりか！」
```

#### `boss_intro_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss, speaker: 狂気の錬金術師
```text
白衣を血と薬品で汚した男が、狂気に満ちた笑みを浮かべて振り返る。
その後ろにある巨大な培養槽から、恐ろしい姿のキメラが姿を現した。
```

#### `boss_intro_03`（text）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss, speaker: 狂気の錬金術師
```text
「さあ、私の最高傑作の餌食になりたまえ！」
```

#### `battle_boss`（battle）
**演出:** bg: bg_crypt, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9111
```text
錬金術師と完成体キメラとの戦い！
```

#### `victory_01`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
キメラが崩れ落ち、錬金術師は怯えて尻餅をついた。
```

#### `victory_02`（text）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
```text
錬金術師を縄で縛り上げた。机の上には、禁忌の生体実験の詳細が記された分厚い研究資料が置かれている。
```

#### `choice_fate`（choice）
**演出:** bg: bg_crypt, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「すべて聖騎士団に提出する。これが法と秩序だ」 | report_order_01 |
| 「錬金術師だけを引き渡し、資料は闇市に高く売る」 | report_evil_01 |

#### `report_order_01`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm
```text
錬金術師とすべての資料を聖騎士団に引き渡した。
「見事な働きだ。この資料は異端審問会で厳重に処分しよう」
```

#### `report_order_02`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm
```text
騎士団長から労いの言葉と共に、規定通りの報酬を受け取った。
ローランドの秩序は、今日も一つ保たれた。
```

#### `end_success_order`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。法と秩序を守り抜いた名誉は、中堅冒険者としての評価を確かなものにした。
```
**rewards:** Gold:1000, Exp:150, Rep:5, Order:5

#### `report_evil_01`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_mystery
```text
錬金術師だけを騎士団に引き渡し、資料はこっそり持ち出して闇市のブローカーに売り払った。
```

#### `report_evil_02`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_mystery
```text
「こいつは上物だ。いくらでも買い手がつくぜ」
ブローカーから渡された金袋は、騎士団の報酬よりもずっと重かった。
```

#### `end_success_evil`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。裏の手段で莫大な利益を得た。正義だけでは食っていけない——それもまた真理だ。
```
**rewards:** Gold:1800, Exp:120, Rep:0, Evil:5

#### `end_failure`（end_failure）
**演出:** bg: bg_crypt
```text
キメラの凶爪が深々と肉を裂いた。
薄れゆく意識の中で、狂気の笑い声が聞こえる。「新しい実験体だ！」
```

---

## 4. 新規エネミー・アイテム定義参照

**使用エネミー（新規）:**
| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 1311 | `enemy_mutant_chimera` | 失敗作キメラ | 10 | 250 | 30 | 8 |
| 6111 | `boss_mutant_chimera` | 完成体キメラ | 12 | 350 | 35 | 8 |

**使用エネミーグループ:**
| ID | Slug | 構成エネミー | 用途 |
|-----|-----|-----|-----|
| 1311 | `grp_mutant_chimera` | `enemy_mutant_chimera` | 道中見張り |
| 9111 | `grp_boss_mutant` | `boss_mutant_chimera` | ボス戦 |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
5111,qst_rep_mutant,狂気の錬金術師,10,3,4,"{""completed_quest"":""main_ep02"",""min_reputation"":30,""nation_id"":""loc_roland""}",false,,,聖騎士団,[指名手配] 地下水道で違法な生体実験を繰り返す狂気の錬金術師を捕縛せよ。
```

---

## 6. 実装チェックリスト

- [ ] 新規エネミー・グループをCSVに登録
- [ ] 鉄格子の突破（物理 vs 鍵探し）の分岐動作
- [ ] 鍵探しのランダム判定（60%）
- [ ] ボス戦前のキメラ回避/戦闘分岐の動作
- [ ] 事後選択（騎士団提出 vs 闇市横流し）のアライメントおよび報酬差異
- [ ] 33ノードが正しく繋がっていることの確認
