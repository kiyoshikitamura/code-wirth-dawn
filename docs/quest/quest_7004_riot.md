# クエスト仕様書：7004 — 食料暴動の事前鎮圧

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7004 |
| **Slug** | `qst_gen_riot` |
| **クエスト種別** | 鎮圧（Suppression） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 自治会 |
| **出現条件** | 制限なし / 出現拠点: 全拠点 |
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ノード数** | 18ノード |

---

## 1. クエスト概要

```
[鎮圧] 暴動を企てる飢えた市民を力でねじ伏せる。
```

---

## 2. 報酬定義

```
Gold:200|Rep:5|Order:5|Justice:5
```

---

## 3. シナリオノードフロー

```text
start → text_01 → text_02 → text_03 → text_04
  → square_01 → square_02 → square_03
    → confront_01 → confront_02 → confront_03
      → battle
        ├─ win → after_01 → after_02 → after_03 → after_04 → end_success
        └─ lose → end_failure
```

### ノード詳細（18ノード）

| node_id | type | bg | speaker | テキスト |
|---------|------|-----|---------|---------|
| start | text | bg_office | — | 自治会の事務所に呼ばれた。窓の外から怒声。 |
| text_01 | text | bg_office | 自治会事務官 | 「東区画の広場に飢えた市民が集まっている」 |
| text_02 | text | bg_office | 自治会事務官 | 「このままでは暴動になる。鎮圧してくれ」 |
| text_03 | text | bg_office | 自治会事務官 | 「先月の凶作で食い詰めた農民だ。倉庫を襲う計画」 |
| text_04 | text | bg_office | 自治会事務官 | 「暴動を許せば秩序が崩れる。なるべく殺さずに」 |
| square_01 | text | bg_slum | — | 東区画の広場。ぼろ切れの市民たちが群がっている。 |
| square_02 | text | bg_slum | — | 子供を抱えた女、杖にすがる老人。鎌を握った若い男。 |
| square_03 | text | bg_slum | 暴徒のリーダー | 「俺たちは飢えてるんだ！ 倉庫を開けろ！」 |
| confront_01 | text | bg_slum | — | 群衆の前に立ちはだかった。一瞬の静寂。 |
| confront_02 | text | bg_slum | 暴徒のリーダー | 「自治会の犬か……飢えた子供を守ってるだけだ」 |
| confront_03 | text | bg_slum | — | 群衆がざわめく。棒切れを握る手に力が入った。 |
| battle | battle | bg_slum | — | 暴動開始！ 武装した市民が襲いかかってきた！（group: 404） |
| after_01 | text | bg_slum | — | 暴徒を鎮圧した。地面にうずくまる市民たち。 |
| after_02 | text | bg_slum | — | リーダーの男が血を吐きながらこちらを見上げた。 |
| after_03 | text | bg_slum | 暴徒のリーダー | 「俺たちが悪いんじゃねえ。飢えさせた奴らが悪い」 |
| after_04 | text | bg_slum | — | 衛兵が到着し群衆を解散させた。子供の泣き声が残った。 |
| end_success | end | bg_office | — | 鎮圧任務完了。あの男の言葉が胸に刺さったままだ。 |
| end_failure | end | bg_slum | — | 暴徒に押し返された。鎮圧は失敗。 |

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 404 | 飢えた市民 x5 |
