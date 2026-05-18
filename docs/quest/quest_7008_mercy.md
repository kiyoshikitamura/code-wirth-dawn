# クエスト仕様書：7008 — 難民野営地への薬草救援

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7008 |
| **Slug** | `qst_gen_mercy` |
| **クエスト種別** | 救援（Rescue） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 救護団 |
| **出現条件** | 制限なし / 出現拠点: 全拠点 |
| **経過日数 (time_cost)** | 4（成功: 4日 / 失敗: 4日） |
| **ノード数** | 31ノード（random_branch + check_possession含む） |

---

## 1. クエスト概要

```
[救援] 癒やし草を採取して傷ついた難民の野営地へ届ける。
```

---

## 2. 報酬定義

```
Gold:10|Rep:10|Justice:10|Order:10
```

---

## 3. シナリオノードフロー

```text
start → text_01 → text_02 → meet_01 → meet_02 → meet_03 → meet_04
  → camp_01 → camp_02 → camp_03 → info_01 → info_02
    → gather_01 → gather_02 → gather_03 → gather_04
      → branch (random_branch: prob 70%)
        ├─ hit → gather_ok → deliver
        └─ miss → gather_fail_01 → gather_fail_02
              → check (check_possession: item 702, qty 5)
                ├─ 持っている → gather_backup → deliver
                └─ 持っていない → not_enough → not_enough_02
                      → not_enough_03 → end_failure
      deliver → deliver_02 → deliver_03 → deliver_04 → end_success
```

### ノード詳細（31ノード）

| node_id | type | bg | speaker | テキスト |
|---------|------|-----|---------|---------|
| start | text | bg_guild | — | 掲示板の依頼書。安い紙に震える字。 |
| text_01 | text | bg_guild | — | 「薬草を集めて野営地の修道女に届けてください」 |
| text_02 | text | bg_guild | — | 金にならない仕事だ。誰も手をつけていない。 |
| meet_01 | text | bg_tavern_day | — | 依頼主に会いに行った。酒場の片隅で修道女が待つ。 |
| meet_02 | text | bg_tavern_day | — | 白い法衣は薄汚れ、目の下に深い隈。 |
| meet_03 | text | bg_tavern_day | シスター・エレナ | 「私はシスター・エレナ。難民の手当てをしています」 |
| meet_04 | text | bg_tavern_day | シスター・エレナ | 「薬草が底をついてしまって」指先が震えていた。 |
| camp_01 | text | bg_road_day | — | 野営地を訪れた。粗末なテントが並んでいる。 |
| camp_02 | text | bg_road_day | — | テントの奥で熱にうなされる老人。腕から血が滲む。 |
| camp_03 | text | bg_road_day | シスター・エレナ | 「矢傷が化膿しています。癒やし草があれば……」 |
| info_01 | text | bg_road_day | シスター・エレナ | 「沢の近く苔の岩の周りに。白い花が目印です」 |
| info_02 | text | bg_road_day | シスター・エレナ | 「五束は必要です」涙はもうなかった。 |
| gather_01 | text | bg_forest_day | — | 森に入った。沢沿いに苔むした岩。白い花を発見。 |
| gather_02 | text | bg_forest_day | — | 慎重に摘み取る。一束目。まだ足りない。 |
| gather_03 | text | bg_forest_day | — | 倒木の影にも群生を発見。三束目。急がねば。 |
| gather_04 | text | bg_forest_day | — | 沢の上流まで足を伸ばした。群生があるはず。 |
| branch | random_branch | — | — | 採取の成否（70%成功） |
| gather_ok | text | bg_forest_day | — | 四束目、五束目。規定の数が揃った。布で丁寧に包む。 |
| gather_fail_01 | text | bg_forest_day | — | だめだ。日照りで群生地が枯れている。三束しかない。 |
| gather_fail_02 | text | bg_forest_day | — | 手持ちに癒やし草があれば補えるかもしれない。 |
| check | check_possession | — | — | 所持品確認（item_id: 702, qty: 5） |
| gather_backup | text | bg_forest_day | — | 手持ちを合わせて五束分になる。急いで戻ろう。 |
| not_enough | text | bg_forest_day | — | 三束では薬として不十分。それでも持っていくしかない。 |
| not_enough_02 | text | bg_road_day | — | 三束だけ渡した。エレナは静かに目を伏せた。 |
| not_enough_03 | text | bg_road_day | シスター・エレナ | 「ありがとう。でもこれでは足りないのです」 |
| deliver | text | bg_road_day | — | 野営地に戻ると、エレナが入口で待っていた。 |
| deliver_02 | text | bg_road_day | — | 癒やし草を渡すと深く息をついた。 |
| deliver_03 | text | bg_road_day | シスター・エレナ | 「これで助けられます。ありがとう、本当に」 |
| deliver_04 | text | bg_road_day | シスター・エレナ | 「報酬は……ほとんど出せないのですが」銅貨数枚。 |
| end_success | end | bg_road_day | — | 報酬は銅貨10枚。だが呻き声が小さくなった。 |
| end_failure | end | bg_road_day | — | 薬草不足。エレナの微笑みが辛かった。 |

---

## 4. 特殊ノード仕様

### random_branch（node: branch）
- **成功確率**: 70%
- hit → gather_ok（五束集まる）
- miss → gather_fail_01（三束のみ）

### check_possession（node: check）
- **対象アイテム**: item_id 702（癒やし草）
- **必要数**: 5
- 所持 → gather_backup → deliver（成功ルート合流）
- 未所持 → not_enough → end_failure
