# クエスト仕様書：5113 — 妖刀の辻斬り

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 5113 |
| **Slug** | `qst_rep_cursed_blade` |
| **クエスト種別** | 特殊クエスト（Special） |
| **推奨レベル** | 12（Hard） |
| **難度** | 3 |
| **依頼主** | 夜刀神国の町奉行 |
| **出現条件** | 第3話「オアシスの陰謀」（6003）クリア / 滞在拠点: 夜刀神国拠点 / 名声 40 以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **経過日数 (time_cost)** | 4 |
| **ノード数** | 33ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard（rec_level: 12） |
| **サムネイル画像** | `/images/quests/bg_yato_street.png` |
---

## 1. クエスト概要

### 短文説明
```
[討伐依頼] 夜な夜な町を徘徊する辻斬り事件の解決。妖刀に憑かれた剣士を討て。
```

### 長文説明
```
夜刀神国の城下町で、毎晩のように辻斬り事件が発生している。
生き残りの証言によれば、犯人は紫色の妖気を纏う古刀を持った剣客だという。
町奉行は腕利きの冒険者に事件の解決と犯人の討伐を依頼した。
妖刀の魔力に飲まれた哀れな剣士を止めなければならない。
```

---

## 2. 報酬定義

**CSV記載形式:** `Gold:1500|Exp:200|Rep:10`

**ルート別報酬差異:**
| ルート | Gold | Exp | Rep | アライメント |
|--------|------|-----|:---:|-------------|
| 浄化奉納（秩序ルート） | 1500 | 200 | +15 | Order:5 |
| 持ち帰る（混沌ルート） | 1500 | 200 | +10 | Chaos:5 |

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
             └─ town_01
                 └─ town_02
                     └─ choice_search (第1の選択：辻斬りの捜索)
                          ├─ 情報屋に頼る → info_buy_01
                          │               └─ info_buy_02
                          │                    └─ merge_shrine
                          └─ 囮になる → bait_01
                                       └─ bait_random (random_branch 50%)
                                            ├─ 成功（迎撃） → bait_success_01
                                            │                └─ merge_shrine
                                            └─ 失敗（奇襲） → bait_fail_01
                                                               └─ bait_trap (hp_damage 15%)
                                                                    └─ merge_shrine
                                                                         └─ shrine_path_01
                                                                              └─ shrine_path_02
                                                                                   └─ choice_barrier (第2の選択：神社の結界)
                                                                                        ├─ 強行突破 → barrier_break_01
                                                                                        │             └─ barrier_trap (hp_damage 10%)
                                                                                        │                  └─ merge_boss
                                                                                        └─ お札を探す → barrier_search_01
                                                                                                        └─ barrier_random (random_branch 60%)
                                                                                                             ├─ 成功（発見） → search_success_01
                                                                                                             │                  └─ merge_boss
                                                                                                             └─ 失敗（戦闘） → search_fail_01
                                                                                                                                └─ battle_yokai
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
                                                                                                                                                                   │                  ├─ 浄化奉納 → fate_order_01
                                                                                                                                                                   │                  │              └─ fate_order_02
                                                                                                                                                                   │                  │                   └─ end_success_order
                                                                                                                                                                   │                  └─ 持ち帰る → fate_chaos_01
                                                                                                                                                                   │                               └─ fate_chaos_02
                                                                                                                                                                   │                                    └─ end_success_chaos
                                                                                                                                                                   └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 町奉行の使い
```text
「夜刀神国を騒がせている辻斬りの件、ギルドを通じて貴殿に依頼したい」
```

#### `start_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 町奉行の使い
```text
「犯人は紫の妖気を放つ刀を持っているそうだ。恐らく、古の妖刀に精神を乗っ取られている」
```

#### `start_03`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm, speaker: 町奉行の使い
```text
「被害者はすでに十数人。これ以上犠牲が出る前に、妖刀ごと奴を斬ってくれ」
```

#### `start_04`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
妖刀の辻斬りか。生半可な剣客では逆に斬られるだけだ。夜の町へ向かう。
```

#### `town_01`（text）
**演出:** bg: bg_yato_street_night, bgm: bgm_quest_mystery
```text
夜の城下町。人々は辻斬りを恐れて固く戸を閉ざし、通りには誰もいない。
```

#### `town_02`（text）
**演出:** bg: bg_yato_street_night, bgm: bgm_quest_mystery
```text
足音だけが響く。奴を見つけるにはどうすればいいか。
```

#### `choice_search`（choice）
**演出:** bg: bg_yato_street_night, bgm: bgm_quest_mystery
| 選択肢 | next_node |
|---------|-----------|
| 「情報屋に金を払い、目撃情報を買う」 | info_buy_01 |
| 「大通りに立ち、自ら囮になって待つ」 | bait_01 |

#### `info_buy_01`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_mystery
```text
裏路地の情報屋に銀貨を握らせた。「……奴なら、町外れの廃神社に向かったぜ」
```

#### `info_buy_02`（text）
**演出:** bg: bg_yato_den, bgm: bgm_quest_mystery
**次ノード:** merge_shrine
```text
確実な情報を得た。背後を気にすることなく、目的地へ直行する。
```

#### `bait_01`（text）
**演出:** bg: bg_yato_street_night, bgm: bgm_quest_tense
```text
月明かりの下、大通りのど真ん中で目を閉じて気配を探る。
……来た！
```

#### `bait_random`（random_branch）
**パラメータ:** prob: 50, next: `bait_success_01`, fallback: `bait_fail_01`

#### `bait_success_01`（text）
**演出:** bg: bg_yato_street_night, bgm: bgm_quest_tense
**次ノード:** merge_shrine
```text
背後からの殺気を完璧に読み取り、初撃を弾き返した！
辻斬りは驚いたように後退し、町外れの廃神社へ逃げていった。
```

#### `bait_fail_01`（text）
**演出:** bg: bg_yato_street_night, bgm: bgm_quest_tense
```text
殺気に気付くのが遅れた！ 凄まじい踏み込みからの斬撃が迫る！
```

#### `bait_trap`（hp_damage）
**演出:** bg: bg_yato_street_night, bgm: bgm_quest_tense
**パラメータ:** percent: 15
**次ノード:** merge_shrine
```text
間一髪で致命傷は避けたが、肩を斬られた。
辻斬りは血の匂いに満足したのか、廃神社の方角へ去っていった。追うぞ。
```

#### `merge_shrine`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_mystery
```text
町外れの廃神社に到着した。鳥居の向こうから、むせ返るような妖気が漂ってくる。
```

#### `shrine_path_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_mystery
```text
参道を進むと、目に見えない障壁にぶつかった。妖力で編まれた結界だ。
```

#### `shrine_path_02`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_mystery
```text
周囲には古いお札が散らばっている。これを使えば安全に解けそうだが……。
```

#### `choice_barrier`（choice）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_tense
| 選択肢 | next_node |
|---------|-----------|
| 「面倒だ。気合で強引に結界を突破する」 | barrier_break_01 |
| 「周囲を探索し、使えるお札を探す」 | barrier_search_01 |

#### `barrier_break_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_tense
```text
武器に闘気を込め、結界を力任せに打ち破る！
```

#### `barrier_trap`（hp_damage）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_tense
**パラメータ:** percent: 10
**次ノード:** merge_boss
```text
結界が弾ける際の呪詛をまともに浴びた。体力を少し削られたが、道は開いた。
```

#### `barrier_search_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_mystery
```text
草むらを掻き分け、まだ魔力の残っているお札を探す。
```

#### `barrier_random`（random_branch）
**パラメータ:** prob: 60, next: `search_success_01`, fallback: `search_fail_01`

#### `search_success_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_mystery
**次ノード:** merge_boss
```text
使えるお札を見つけた。結界に貼り付けると、音もなく障壁が霧散した。
```

#### `search_fail_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_tense
```text
お札を探している最中、結界に引き寄せられた妖怪たちに見つかってしまった！
```

#### `battle_yokai`（battle）
**演出:** bg: bg_yato_shrine, bgm: bgm_battle
**パラメータ:** enemy_group_id: 106
```text
夜刀妖怪の群れとの戦闘！
```
*(注: 106はyato_yokai_group)*

#### `merge_boss`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_tense
```text
神社の本殿前に辿り着いた。月明かりの中、一人の剣士が立っている。
```

#### `boss_intro_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_battle_boss, speaker: 妖刀の剣士
```text
「キル……斬ル……血ガ、タリナイ……」
```

#### `boss_intro_02`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_battle_boss, speaker: 妖刀の剣士
```text
剣士の目は虚ろで、手にした紫色の妖刀から伸びる魔力の糸に操られているようだ。
```

#### `boss_intro_03`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_battle_boss, speaker: 妖刀の剣士
```text
「オマエノ血デ……刀ヲ潤ス！！」
```

#### `battle_boss`（battle）
**演出:** bg: bg_yato_shrine, bgm: bgm_battle_boss
**パラメータ:** enemy_group_id: 9113
```text
妖刀の剣客との決戦！
```

#### `victory_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
剣士が膝から崩れ落ちる。同時に、手から離れた妖刀の禍々しい光が消え失せた。
```

#### `victory_02`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
剣士はすでに息絶えていた。残された妖刀からは、未だに微かな魔力を感じる。
```

#### `choice_fate`（choice）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
| 選択肢 | next_node |
|---------|-----------|
| 「神社の祭壇に奉納し、お札で封印・浄化する」 | fate_order_01 |
| 「強力な魔剣だ。町奉行には処分したと嘘をつき、持ち帰る」 | fate_chaos_01 |

#### `fate_order_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_calm
```text
このままにしては新たな被害者が出る。神社の祭壇に妖刀を安置し、周囲のお札で封印した。
```

#### `fate_order_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
町奉行に事件の顛末を報告した。
「見事な差配だ。これで町に平穏が戻るだろう」
```

#### `end_success_order`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。誘惑に負けず正しき行いをしたことで、名声と秩序が高まった。
```
**rewards:** Gold:1500, Exp:200, Rep:15, Order:5

#### `fate_chaos_01`（text）
**演出:** bg: bg_yato_shrine, bgm: bgm_quest_mystery
```text
布で刀身を厳重に包み、背中に背負った。使い方次第で、これは強力な武器になる。
```

#### `fate_chaos_02`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_mystery
```text
町奉行には「妖刀は完全に破壊した」と報告した。
偽りの報告で報酬を受け取る。背中の刀が、微かに喜ぶように震えた気がした。
```

#### `end_success_chaos`（end_success）
**演出:** bg: bg_guild
```text
依頼達成。嘘をつき妖刀を手に入れた。禁忌の力は、いつか我が身を助ける（滅ぼす）かもしれない。
```
**rewards:** Gold:1500, Exp:200, Rep:10, Chaos:5

#### `end_failure`（end_failure）
**演出:** bg: bg_yato_shrine
```text
妖刀が首筋を捉えた。
冷たい刃が肉を断つ感触。最後に見たのは、刀が自分の血を啜る恐ろしい光景だった。
```

---

## 4. 新規エネミー・アイテム定義参照

**使用エネミー（新規）:**
| ID | Slug | name | level | hp | atk | def |
|-----|-----|-----|-----|-----|-----|-----|
| 1313 | `enemy_cursed_ronin` | 妖刀の剣客 | 14 | 420 | 50 | 5 |
| 6113 | `boss_cursed_ronin` | ボス：妖刀の剣客 | 14 | 420 | 50 | 5 |
*(注: どちらを使ってもよいがボス扱いとして6113を使用)*

**使用エネミーグループ:**
| ID | Slug | 構成エネミー | 用途 |
|-----|-----|-----|-----|
| 9113 | `grp_boss_cursed_blade` | `boss_cursed_ronin` | ボス戦 |

---

## 5. CSVエントリ

`quests_special.csv`
```csv
5113,qst_rep_cursed_blade,妖刀の辻斬り,12,3,4,"{""completed_quest"":""main_ep03"",""min_reputation"":40,""nation_id"":""loc_yatoshin""}",false,,,町奉行,[討伐依頼] 夜な夜な町を徘徊する辻斬り事件の解決。妖刀に憑かれた剣士を討て。
```

---

## 6. 実装チェックリスト

- [ ] 新規エネミー・グループをCSVに登録
- [ ] 情報屋 vs 囮の分岐と、囮時のランダム判定（50%）
- [ ] 結界の突破（物理 vs お札探し）の分岐と、戦闘・ダメージの動作
- [ ] 最終選択肢（浄化奉納 vs 持ち帰り）のアライメントおよび報酬差異
- [ ] 全33ノードの遷移が正しいこと
