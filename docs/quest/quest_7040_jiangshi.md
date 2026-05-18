# クエスト仕様書：7040 — 死者の還る山の浄化

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7040 |
| **Slug** | `qst_har_jiangshi` |
| **クエスト種別** | 華龍クエスト（Karyu） |
| **推奨レベル** | 7（Normal） |
| **難度** | 2 |
| **依頼主** | 道士 |
| **出現条件** | 制限なし / 出現拠点: loc_haryu |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 7） |
| **経過日数 (time_cost)** | 5（成功: 5日 / 失敗: 3日） |
| **ノード数** | 35ノード |
| **サムネイル画像** | `/images/quests/bg_karyu_mountain.png` |

---

## 1. クエスト概要

### 短文説明
```
[討伐] 霊山をうろつくキョンシーたちを護符の力で鎮める。
```

### 長文説明
```
華龍国の西方にそびえる霊山で、死者がキョンシーと化して徘徊している。
道士の依頼は護符を携えて亡者を鎮めること。
だが道士の真の目的は死気の抽出だという噂がある。
```

---

## 2. 報酬定義

**CSV記載形式（デフォルトルート）:**
```
Gold:350|Exp:100|Chaos:5
```

**ルート別報酬差異:**
| ルート | Gold | Exp | アライメント |
|--------|------|-----|-------------|
| 道士に死気を渡す（デフォルト） | 350 | 100 | Chaos:5 |
| 死気を割る（選択肢） | 250 | 100 | Justice:5 |

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
             └─ start_05
                 └─ talisman_01
                     └─ talisman_02
                         └─ path_01
                             └─ path_02
                                 └─ path_03
                                     └─ path_04
                                         └─ graveyard_01
                                             └─ graveyard_02
                                                 └─ battle_01
                                                      ├─ win → deeper_01
                                                      │        └─ deeper_02
                                                      │             └─ deeper_03
                                                      │                  └─ tomb_01
                                                      │                       └─ tomb_02
                                                      │                            └─ tomb_03
                                                      │                                 └─ battle_02
                                                      │                                      ├─ win → purify_01
                                                      │                                      │        └─ purify_02
                                                      │                                      │             └─ purify_03
                                                      │                                      │                  └─ choice_qi
                                                      │                                      │                       ├─ 渡す → report_01
                                                      │                                      │                       │          └─ report_02
                                                      │                                      │                       │               └─ end_success
                                                      │                                      │                       └─ 割る → refuse_01
                                                      │                                      │                                  └─ refuse_02
                                                      │                                      │                                       └─ end_success_justice
                                                      │                                      └─ lose → end_failure
                                                      └─ lose → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 道士
```text
「ほう、お主が今回引き受けてくれるのか。では、これを」
老道士から、墨の匂いがきつい黄色い護符の束を受け取った。
```

#### `start_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 道士
```text
「霊山をうろつくキョンシーどもは、額にこの護符を貼れば止まる」
```

#### `start_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 道士
```text
「爪を剥き出しにして迫る亡者の額に、直接札を貼る度胸があればの話だがな。クックッ」
```

#### `start_04`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 道士
```text
「それから、鎮めた死者から漂う『死気』を、この壺に集めてきてほしい」
```

#### `start_05`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
渡された壺は禍々しい朱色の紋様で覆われており、触れると氷のように冷たかった。
道士の不気味な笑みに一抹の不安を覚えつつ、霊山へと向かう。
```

#### `talisman_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
護符と壺を懐に収め、霊山の登り口に到着した。空を覆う雲が太陽の光を遮っている。
```

#### `talisman_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
山全体から、生き物を寄せ付けない淀んだ空気が流れ出しているのが肌で感じられた。
```

#### `path_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
苔むした長い石段を登る。道の両脇には、風化して文字も読めなくなった墓標が並んでいる。
```

#### `path_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
ふと、不自然な気配を感じて足を止めた。前方にある大樹の影に、人の形をしたものが立っている。
```

#### `path_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
青白い肌。生気のない瞳。朽ちた官服を着た屍が、両腕を真っ直ぐ前へ突き出している。
```

#### `path_04`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
——動いた。屍は膝を曲げることなく、不気味な跳躍で一直線にこちらへと迫ってくる！
```

#### `graveyard_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
さらに墓地の奥へ進むと、土が不自然に盛り上がり、次々と新たな屍が這い出してきた。
```

#### `graveyard_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
その中には、ひときわ古い衣装を纏った、長年の死気を溜め込んだ強力な個体も混じっている。
```

#### `battle_01`（battle）
**演出:** bg: bg_karyu_mountain, bgm: bgm_battle
```text
キョンシーの群れが飛びかかってきた！
```
**パラメータ:** type: battle, enemy_group_id: 440, next: deeper_01, fail: end_failure

#### `deeper_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
亡者たちの額に護符を叩きつけ、動きを封じた。崩れ落ちた死体から黒いモヤが立ち昇る。
```

#### `deeper_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
懐の壺を取り出すと、モヤは吸い込まれるように壺の中へ消えていった。壺が微かに振動している。
```

#### `deeper_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_field
```text
「死気」の収集は順調だ。さらに霧が濃くなる中、山の奥、頂上付近の霊廟へと足を進める。
```

#### `tomb_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
鬱蒼とした森を抜けると、巨大で豪奢な石造りの古墓が現れた。入口の石碑にはこう刻まれている。
「華龍六代太守　薛氏一門之墓」
```

#### `tomb_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
墓室の暗がりから、ひどい腐臭と共に三つの青白い眼光が浮かび上がった。
```

#### `tomb_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
太守とその近衛兵だろうか。並のキョンシーとは比べ物にならない、濃厚な死気と殺意を纏っている。
```

#### `battle_02`（battle）
**演出:** bg: bg_karyu_mountain, bgm: bgm_battle_boss
```text
古の太守とその近衛、強力なキョンシーたちが襲いかかる！
```
**パラメータ:** type: battle, enemy_group_id: 441, next: purify_01, fail: end_failure

#### `purify_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
激戦の末、太守の額に最後の一枚を貼り付けた。巨体が硬直して後方に倒れ、地面が大きく揺れる。
```

#### `purify_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
太守の体からあふれ出た膨大な死気を壺が吸い尽くすと、周囲の瘴気が嘘のように薄れていった。
```

#### `purify_03`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
壺は満杯になり、不吉な紫色の光を放ちながら熱を帯びている。
……この禍々しい力を、あの怪しげな道士に渡してしまって本当に良いのだろうか？
```

#### `choice_qi`（choice）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm
```text
壺の中の膨大な死気をどうする？
```
- 選択肢: 「依頼通り、道士に渡す」→ `report_01`
- 選択肢: 「壺を割り、死気を解放して浄化する」→ `refuse_01`

#### `report_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 道士
```text
山を下り、待ち構えていた道士に約束通り壺を手渡した。
「ヒッヒッヒ……これほどの純粋な死気……なんと素晴らしい」
```

#### `report_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_calm, speaker: 道士
```text
道士は恍惚とした表情で壺を愛でている。その顔は、先程討伐した亡者よりも恐ろしいものに見えた。
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
任務は完了した。約束の報酬を受け取り、不気味な道士のもとを去る。
あの壺の中身が禁術に使われるのかどうか、自分には関係のない話だ。
```
**rewards:** Gold:350, Exp:100, Chaos:5

#### `refuse_01`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense
```text
こんな悪しき力を利用させてはならない。道士の目の前で、壺を地面の岩に力強く叩きつけた！
```

#### `refuse_02`（text）
**演出:** bg: bg_karyu_mountain, bgm: bgm_quest_tense, speaker: 道士
```text
パリンという音と共に壺が砕け、死気は陽光に触れて浄化されていく。
「な、何をする！ 貴様、どれほどの価値があるか分かって……愚かな！ 報酬は減額だ！！」
```

#### `end_success_justice`（end_success）
**演出:** bg: bg_guild
```text
怒り狂う道士から半ば強引に最低限の報酬を奪い取り、山を後にした。
報酬は減ったが、あの世の秩序を守ったという事実は、確かな誇りとして胸に残った。
```
**rewards:** Gold:250, Exp:100, Justice:5

#### `end_failure`（end_failure）
**演出:** bg: bg_karyu_mountain
```text
キョンシーたちの異常な跳躍力と怪力に圧倒され、冷たい掌に突き飛ばされた。
地面に倒れ伏す中、最後の一枚の護符が手からこぼれ落ち、絶望の闇が視界を覆った……。
```

---

## 4. 新規エネミー・アイテム定義参照

**新規追加エネミー（`enemies.csv`）:**
| ID | Slug | name | level | hp | atk | def | exp | gold |
|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| （既存） | `enemy_karyu_jiangshi` | キョンシー | 9 | 90 | 35 | 8 | 35 | 60 |
| 1251 | `enemy_karyu_jiangshi_old` | 古キョンシー | 12 | 130 | 42 | 12 | 50 | 80 |

**新規追加グループ（`enemy_groups.csv`）:**
| ID | Slug | 構成エネミー |
|-----|-----|-----|
| 440 | `grp_karyu_jiangshi_01` | `enemy_karyu_jiangshi`\|`enemy_karyu_jiangshi`\|`enemy_karyu_jiangshi_old` |
| 441 | `grp_karyu_jiangshi_02` | `enemy_karyu_jiangshi_old`\|`enemy_karyu_jiangshi_old`\|`enemy_karyu_jiangshi` |

---

## 5. CSVエントリ

`quests_normal.csv`
```csv
7040,qst_har_jiangshi,死者の還る山の浄化,7,2,5,loc_haryu,,,,,Gold:350|Exp:100|Chaos:5,道士,[討伐] 霊山をうろつくキョンシーたちを護符の力で鎮める。
```

---

## 6. 実装チェックリスト

- [x] 新規エネミー `enemy_karyu_jiangshi_old`（ID: 1251）がDBに登録済み
- [x] エネミーグループ 440, 441 がDBに登録済み
- [x] 選択肢「渡す」→ Chaos:5 / 「壺を割る」→ Justice:5 が正しく分岐
- [x] time_cost: 5（成功5日 / 失敗3日）
- [x] 報酬が正しく付与される

---

## 7. 拡張メモ

- 護符カードによる弱点攻撃システム（将来実装）
- 道士の禁術研究に関わる後続クエスト
