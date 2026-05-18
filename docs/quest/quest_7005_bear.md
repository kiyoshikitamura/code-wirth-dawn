# クエスト仕様書：7005 — 凶熊狩り

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7005 |
| **Slug** | `qst_gen_bear` |
| **クエスト種別** | 討伐（Hunt） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 開拓村の長 |
| **出現条件** | 制限なし / 出現拠点: 全拠点 |
| **経過日数 (time_cost)** | 4（成功: 4日 / 失敗: 4日） |
| **ノード数** | 21ノード |

---

## 1. クエスト概要

```
[討伐] 開拓村を襲う凶暴な大熊を狩る。前任の猟師は行方不明。
```

---

## 2. 報酬定義

```
Gold:200|Rep:5|Item:item_bear_pelt
```

---

## 3. シナリオノードフロー

```text
start → text_01 → text_02 → text_03 → text_04
  → forest_01 → forest_02 → trail_01 → trail_02 → trail_03
    → encounter_01 → encounter_02 → encounter_03
      → battle
        ├─ win → after_01 → after_02 → return_01 → return_02 → return_03
        │    → end_success
        └─ lose → end_failure
```

### ノード詳細（21ノード）

| node_id | type | bg | speaker | テキスト |
|---------|------|-----|---------|---------|
| start | text | bg_guild | — | 開拓村の長が待つ集会所に入った。 |
| text_01 | text | bg_guild | 開拓村の長 | 「村の東の森に凶暴な大熊が棲みついた」 |
| text_02 | text | bg_guild | 開拓村の長 | 「畑を荒らし家畜を襲う。猟師のヨルンが行方不明」 |
| text_03 | text | bg_guild | 開拓村の長 | 「三日経っても戻らん。血痕が点々と続いていた」 |
| text_04 | text | bg_guild | 開拓村の長 | 「あの熊は普通じゃない。傷跡だらけで片目が潰れている」 |
| forest_01 | text | bg_forest_day | — | 森に入った。木々は密に茂り日光が届かない。 |
| forest_02 | text | bg_forest_day | — | 地面に大きな獣の足跡。爪の跡が異常に深い。 |
| trail_01 | text | bg_forest_day | — | 足跡の先に引き裂かれた罠。猟師ヨルンのものか。 |
| trail_02 | text | bg_forest_day | — | 近くの木に深い爪痕。さらに奥へ進むと獣の匂い。 |
| trail_03 | text | bg_forest_day | — | 低い唸り声が藪の向こうから聞こえる。 |
| encounter_01 | text | bg_forest_day | — | 茂みを掻き分けると巨大な熊が立ち上がった。 |
| encounter_02 | text | bg_forest_day | — | 体中に古傷。片目は白く濁り口元に赤いもの。 |
| encounter_03 | text | bg_forest_day | — | こちらを認めると大地を揺らす咆哮を上げた。 |
| battle | battle | bg_forest_day | — | ジャイアントベアが襲いかかってきた！（group: 405） |
| after_01 | text | bg_forest_day | — | 大熊が崩れ落ちた。片目に宿っていたのは疲労だった。 |
| after_02 | text | bg_forest_day | — | 毛皮を剥いだ。近くに猟師の外套の切れ端。 |
| return_01 | text | bg_guild | — | 村に戻り毛皮を見せると村長が頷いた。 |
| return_02 | text | bg_guild | 開拓村の長 | 「ヨルンの遺品は見つかったか？」→外套を渡す。 |
| return_03 | text | bg_guild | 開拓村の長 | 「ありがとう。これで村の連中も安心できる」 |
| end_success | end | bg_guild | — | 凶熊狩り完了。報酬と獣の毛皮を受け取った。 |
| end_failure | end | bg_forest_day | — | 大熊の猛攻に倒れた。獣の咆哮が遠ざかる。 |

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 405 | ジャイアントベア |
