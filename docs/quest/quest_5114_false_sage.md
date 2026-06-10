# クエスト仕様書：5114 — 偽りの邪仙

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5114 |
| **Slug** | `qst_rep_false_sage` |
| **クエスト種別** | 特殊クエスト（Special） |
| **推奨レベル** | 13（Hard） |
| **難度** | 3 |
| **依頼主** | 華龍国・地方役人 |
| **出現条件** | 第3話「オアシスの陰謀」（6003）クリア / 滞在拠点: 華龍国拠点 / 名声 40 以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **経過日数 (time_cost)** | 4 |
| **ノード数** | 34ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 13） |
| **サムネイル画像** | `/images/quests/bg_karyu_mountain.png` |
---

## 1. クエスト概要

### 短文説明
```
[討伐依頼] 不死の薬と偽って毒を売り捌き、村人を洗脳する「邪仙」を討伐せよ。
```

### 長文説明
```
華龍国の辺境の山にある道観（寺院）で、自らを仙人と名乗る男が「不死の薬」を配っている。
しかしその薬の実態は、人の意志を奪い操り人形にする毒薬だった。
すでに近隣の村人たちが何人も洗脳され、道観に取り込まれている。
地方役人からの依頼を受け、道観へ乗り込み邪仙を討伐する。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:1800|Exp:220|Rep:10`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 真実を告げる（正義ルート） | 1800 | 220 | +10 | Justice:5 |
| 夢を見させたまま去る（混沌ルート） | 1800 | 220 | +10 | Chaos:5 |

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
                     └─ mountain_01
                         └─ mountain_02
                             └─ choice_mist (第1の選択：幻術の霧)
                                  ├─ 霧をそのまま進む → mist_walk_01
                                  │                     └─ mist_random (random_branch 50%)
                                  │                          ├─ 成功（突破） → mist_success_01
                                  │                          │                  └─ merge_temple
                                  │                          └─ 失敗（迷う） → mist_fail_01
                                  │                                             └─ mist_trap (hp_damage 15%)
                                  │                                                  └─ mist_fail_02
                                  │                                                       └─ merge_temple
                                  └─ お札で霧を払う → mist_clear_01
                                                       └─ battle_guard
                                                            ├─ win → merge_temple
                                                            └─ lose → end_failure
                                                                 └─ merge_temple (図示用)
                                                                      └─ temple_01
                                                                           └─ temple_02
                                                                                └─ choice_villagers (第2の選択：操られた村人)
                                                                                     ├─ 強行突破（気絶させる） → villager_force_01
                                                                                     │                           └─ villager_trap (hp_damage 10%)
                                                                                     │                                └─ villager_force_02
                                                                                     │                                     └─ merge_boss
                                                                                     └─ 説得して正気に戻す → villager_talk_01
                                                                                                            └─ villager_random (random_branch 60%)
                                                                                                                 ├─ 成功（説得） → talk_success_01
                                                                                                                 │                  └─ merge_boss
                                                                                                                 └─ 失敗（戦闘） → talk_fail_01
                                                                                                                                    └─ battle_villager
                                                                                                                                         ├─ win → merge_boss
                                                                                                                                         └─ lose → end_failure
                                                                                                                                              └─ merge_boss (図示用)
                                                                                                                                                   └─ boss_intro_01
                                                                                                                                                        └─ boss_intro_02
                                                                                                                                                             └─ boss_intro_03
                                                                                                                                                                  └─ battle_boss
                                                                                                                                                                       ├─ win → victory_01
                                                                                                                                                                       │        └─ victory_02
                                                                                                                                                                       │             └─ choice_fate
                                                                                                                                                                       │                  ├─ 真実を告げる → fate_justice_01
                                                                                                                                                                       │                  │                └─ fate_justice_02
                                                                                                                                                                       │                  │                     └─ end_success_justice
                                                                                                                                                                       │                  └─ 夢を見させる → fate_chaos_01
                                                                                                                                                                       │                                   └─ fate_chaos_02
                                                                                                                                                                       │                                        └─ end_success_chaos
                                                                                                                                                                       └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 地方役人
```text
「辺境の山にある道観で、邪悪な術師が『不死の薬』と称して村人たちを洗脳しておる」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 地方役人
```text
「薬を飲んだ者は廃人となり、ただ彼奴の命令に従うだけの人形と化すのだ」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 地方役人
```text
「どうか、あの偽りの仙人を討伐し、村人たちを解放してやってくれ」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
不死の薬などあるはずがない。人々の弱みにつけ込む外道を討つため、山へ向かう。
```

#### `travel_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
華龍国の辺境。険しい山道を登っていくと、周囲に濃い霧が立ち込めてきた。
```

#### `travel_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
ただの霧ではない。霊力を帯びた幻術の霧だ。方向感覚が狂わされる。
```

#### `mountain_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
この霧を抜けた先に、目当ての道観があるはずだ。
```

#### `mountain_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
どうやって進む？ ギルドで買った霊符を使えば霧を払えるが、術者に気付かれる。
```

#### `choice_mist`（choice）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「気付かれないよう、霧の中を勘で進む」 | mist_walk_01 |
| 「霊符を使って強引に霧を払い、道を開く」 | mist_clear_01 |

#### `mist_walk_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
幻術に惑わされないよう、精神を集中させて霧の中を歩く……。
```

#### `mist_random`（random_branch）
**パラメータ:** prob: 50, next: `mist_success_01`, fallback: `mist_fail_01`

#### `mist_success_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_mystery
**次ノード:** merge_temple
```text
見事、幻術を打ち破り、道観への正しいルートを見つけ出した。
```

#### `mist_fail_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
しまった、同じ場所をぐるぐると回っている！ 幻術が精神を蝕む……！
```

#### `mist_trap`（hp_damage）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
**パラメータ:** percent: 15
```text
精神的な疲労により、体力を大きく消耗した。
```

#### `mist_fail_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
**次ノード:** merge_temple
```text
数時間の彷徨の末、なんとか霧を抜け、道観の入り口に辿り着いた。
```

#### `mist_clear_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
霊符を掲げると、霧が晴れ道が開けた！
だが同時に、侵入者に気付いたキョンシーたちが襲いかかってきた！
```

#### `battle_guard`（battle）
**演出:** bg: bg_karyu_mountain, bgm: bgm_battle
**パラメータ:** enemy_group_id: 110
```text
道観の門番（キョンシー）との戦闘！
```
*(注: 110はkaryu_jiangshi_group等)*

#### `merge_temple`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_mystery
```text
道観の内部に潜入した。強いお香の匂いが漂っている。
```

#### `temple_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_mystery
```text
中庭には、虚ろな目をした村人たちがうろついていた。皆、洗脳されている。
```

#### `temple_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_mystery
```text
彼らは侵入者であるこちらに気づき、武器（農具）を構えて立ちはだかった！
```

#### `choice_villagers`（choice）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「峰打ちで気絶させ、強行突破する」 | villager_force_01 |
| 「大声で呼びかけ、正気に戻そうとする」 | villager_talk_01 |

#### `villager_force_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
```text
彼らを殺すわけにはいかない。武器の峰で一人ずつ気絶させていく。
```

#### `villager_trap`（hp_damage）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
**パラメータ:** percent: 10
```text
手加減をした隙を突かれ、鍬で殴られた！ 痛手を負ったが全員無力化した。
```

#### `villager_force_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
**次ノード:** merge_boss
```text
息を整え、邪仙のいる本堂へと急ぐ。
```

#### `villager_talk_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
```text
「目を覚ませ！ お前たちは騙されているんだ！」
大声で呼びかけ、隙を突こうとする。
```

#### `villager_random`（random_branch）
**パラメータ:** prob: 60, next: `talk_success_01`, fallback: `talk_fail_01`

#### `talk_success_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_mystery
**次ノード:** merge_boss
```text
村人の一人がハッと我に返った。連鎖的に他の者も動きを止め、その隙に奥へ進む。
```

#### `talk_fail_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
```text
言葉は届かない！ 洗脳は思いのほか深く、彼らは狂乱状態で襲いかかってきた！
```

#### `battle_villager`（battle）
**演出:** bg: bg_karyu_palace, bgm: bgm_battle
**パラメータ:** enemy_group_id: 109
```text
洗脳された村人たちとの戦闘！（※命を奪わないよう手加減して戦う）
```
*(注: 109はkaryu_rebel_farmer_group等)*

#### `merge_boss`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_tense
```text
本堂に突入した。祭壇の前に、胡散臭い道着を着た男が立っている。
```

#### `boss_intro_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_battle_boss, speaker: 邪仙・道士
```text
「愚かな冒険者よ。我が不死の霊薬を邪魔しに来たか」
```

#### `boss_intro_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_battle_boss, speaker: 邪仙・道士
```text
男が懐から札を取り出すと、周囲の空気が禍々しい妖気で満たされた。
```

#### `boss_intro_03`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_battle_boss, speaker: 邪仙・道士
```text
「貴様も我が薬の材料にしてくれるわ！」
```

#### `battle_boss`（battle）
**演出:** bg: bg_karyu_palace, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9114
```text
邪仙・道士との決戦！
```

#### `victory_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
邪仙が倒れ伏す。彼の使っていた怪しい薬壺をすべて叩き割った。
```

#### `victory_02`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
外に出ると、正気に戻りつつある村人たちが集まってきた。
「我々を導いてくださった仙人様は……？」
```

#### `choice_fate`（choice）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「あれは偽者だ。お前たちは毒で操られていたんだ」 | fate_justice_01 |
| 「彼は天に帰った。これからは自分たちの足で生きろ」 | fate_chaos_01 |

#### `fate_justice_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_calm
```text
厳しい真実を告げる。村人たちは絶望し泣き崩れたが、やがて現実を受け入れた。
```

#### `fate_justice_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
役人に報告を終えた。
「真実を知らねば、人はまた同じ過ちを繰り返す。正しい選択だ」
```

#### `end_success_justice`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。苦い真実を与え、正しき道を示した。
```
**rewards:** Gold:1800, Exp:220, Rep:10, Justice:5

#### `fate_chaos_01`（text）
**演出:** bg: bg_karyu_palace, bgm: bgm_quest_mystery
```text
真実を隠し、美しい嘘をついた。
村人たちは祈りを捧げ、穏やかな顔で山を下りていった。
```

#### `fate_chaos_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_mystery
```text
役人には討伐の事実だけを報告した。
「平和になったのなら、真実などどうでもよいことだ」
```

#### `end_success_chaos`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。嘘で安寧を与えた。時には混沌とした対応が人々を救うこともある。
```
**rewards:** Gold:1800, Exp:220, Rep:10, Chaos:5

#### `end_failure`（end_failure）
**演出:** bg: bg_karyu_palace
```text
邪仙の放つ毒薬を吸い込み、意識が混濁する。
「さあ、お前も我が人形となるのだ……」
```

---

## 4. 新規エネミー・アイテム定義参照

**使用エネミー（新規）:**
| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 1314 | `enemy_false_sage` | 邪仙・道士 | 15 | 450 | 45 | 12 |
| 6114 | `boss_false_sage` | ボス：邪仙・道士 | 15 | 450 | 45 | 12 |
*(注: どちらを使ってもよいがボス扱いとして6114を使用)*

**使用エネミーグループ:**
| ID | Slug | 構成エネミー | 用途 |
|-----|-----|-----|-----|
| 9114 | `grp_boss_false_sage` | `boss_false_sage` | ボス戦 |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
5114,qst_rep_false_sage,偽りの邪仙,13,3,4,"{""completed_quest"":""main_ep03"",""min_reputation"":40,""nation_id"":""loc_karyu""}",false,,,地方役人,[討伐依頼] 不死の薬と偽って毒を売り捌き、村人を洗脳する「邪仙」を討伐せよ。
```

---

## 6. 実装チェックリスト

- [ ] 新規エネミー・グループをCSVに登録
- [ ] 幻術の霧の分岐（勘で進む vs お札）の動作
- [ ] 勘で進む場合のランダム判定（50%）
- [ ] 村人対処の分岐（物理 vs 説得）と、説得時のランダム判定（60%）
- [ ] 最終選択肢（真実を告げる vs 夢を見させる）のアライメント差異
- [ ] 全34ノードの遷移が正しいこと
