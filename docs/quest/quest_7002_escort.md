# クエスト仕様書：7002 — 放浪商人の護衛

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7002 |
| **Slug** | `qst_gen_escort` |
| **クエスト種別** | 護衛（Escort） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 旅商人組合 |
| **出現条件** | 制限なし / 出現拠点: 全拠点 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 8（成功: 8日 / 失敗: 8日） |
| **ノード数** | 25ノード |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |

---

## 1. クエスト概要

### 短文説明
```
[護衛] 旅の商人を隣街まで護衛する。商人が倒れれば失敗。
```

---

## 2. 報酬定義

```
Gold:350|Rep:3
```

---

## 2.5. 失敗ペナルティ

| 条件 | ペナルティ |
|------|-----------|
| クエスト失敗 | 名声 -3〜-10 |
| バトル敗北 | VIT -1 |
| 経過日数 | days_failure: 8 |

---

## 3. シナリオノードフロー

```text
start → text_01 → text_02 → text_03 → meet_01 → meet_02 → meet_03
  → join(guest_join: npc_gen_merchant)
    → travel_01 → travel_02 → travel_03 → travel_04 → travel_05
      → midway → encounter_01 → encounter_02 → battle
        ├─ win → after_01 → after_02 → arrive_01 → arrive_02
        │    → arrive_03 → leave → end_success
        └─ lose → end_failure
```

### ノード詳細（25ノード）

| node_id | type | bg | speaker | テキスト |
|---------|------|-----|---------|---------|
| start | text | bg_guild | — | 旅商人組合の窓口で依頼書を受け取った。 |
| text_01 | text | bg_guild | 旅商人組合の受付 | 「護衛対象は行商人のマルコ。隣街まで往復八日の旅だ」 |
| text_02 | text | bg_guild | 旅商人組合の受付 | 「積み荷は雑貨と薬品。狙われやすい品ばかりだな」 |
| text_03 | text | bg_guild | 旅商人組合の受付 | 「先月、同じ路線で護衛二名が殺された。気を抜くなよ」 |
| meet_01 | text | bg_tavern_day | — | 酒場の片隅で、小柄な中年男が荷物に囲まれて待っていた。 |
| meet_02 | text | bg_tavern_day | マルコ | 「あんたが護衛かい？ ありがてえ！ マルコだ」 |
| meet_03 | text | bg_tavern_day | — | 人懐こいが、どこか落ち着きがない。 |
| join | guest_join | bg_tavern_day | — | マルコがパーティに加わった。（guest_id: npc_gen_merchant） |
| travel_01 | text | bg_road_day | — | 街を出て街道を歩く。マルコの歩調は遅い。 |
| travel_02 | text | bg_road_day | — | 日が傾き始めた頃、マルコが話しかけてきた。 |
| travel_03 | text | bg_road_day | マルコ | 「荷の中に少しだけ"特別な品"がある」 |
| travel_04 | text | bg_road_day | マルコ | 「追い剥ぎに荷を見られたら面倒なことになるかも」 |
| travel_05 | text | bg_road_day | — | 何を運んでいるかは深く聞かないことにした。 |
| midway | text | bg_road_day | — | 街道の曲がり角。林の向こうに煙が見える。 |
| encounter_01 | text | bg_road_day | — | 「止まれ！ 荷を置いていけ！」男たちが飛び出してきた。 |
| encounter_02 | text | bg_road_day | マルコ | 「旦那ッ！ 荷だけは守ってくれ！」 |
| battle | battle | bg_road_day | — | 夜盗が襲いかかってきた！（enemy_group_id: 400） |
| after_01 | text | bg_road_day | — | 夜盗を蹴散らした。マルコが顔を出す。 |
| after_02 | text | bg_road_day | マルコ | 「……全部ある。あんた、本物だ」 |
| arrive_01 | text | bg_tavern_day | — | 隣街に到着。マルコは荷を降ろし始めた。 |
| arrive_02 | text | bg_tavern_day | — | 取引を終えたマルコが報酬の革袋を差し出す。 |
| arrive_03 | text | bg_tavern_day | マルコ | 「"特別な品"のこと、口外しないでくれよ？」 |
| leave | leave | bg_tavern_day | — | マルコがパーティから離れた。（guest_id: npc_gen_merchant） |
| end_success | end | bg_guild | — | 護衛任務完了。"特別な品"の正体は考えない。 |
| end_failure | end | bg_guild | — | マルコが倒れた。荷物は夜盗に奪われた。 |

---

## 4. 敵定義参照

| 項目 | 値 |
|-----|-----|
| enemy_group_id | 400 |
| グループ名 | 追い剥ぎ一味 |

---

## 5. ゲストNPC参照

| 項目 | 値 |
|-----|-----|
| guest_id | npc_gen_merchant |
| 名前 | 旅の商人（マルコ） |
| HP | 30 |
| ATK | 1 |
| 備考 | 戦闘外。護衛対象ではない（is_escort_target: false） |
