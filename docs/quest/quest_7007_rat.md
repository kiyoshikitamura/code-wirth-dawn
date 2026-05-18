# クエスト仕様書：7007 — 地下水路の害獣駆除

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7007 |
| **Slug** | `qst_gen_rat` |
| **クエスト種別** | 駆除（Extermination） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 自治会 |
| **出現条件** | 制限なし / 出現拠点: 全拠点 |
| **経過日数 (time_cost)** | 2（成功: 2日 / 失敗: 2日） |
| **ノード数** | 20ノード（2連戦） |

---

## 1. クエスト概要

```
[駆除] 地下水路の巨大ネズミの群れを殲滅し、ネズミの女王を討て。
```

---

## 2. 報酬定義

```
Gold:400|Rep:2
```

---

## 3. シナリオノードフロー

```text
start → text_01 → text_02 → text_03 → text_04
  → sewer_01 → sewer_02 → sewer_03
    → rat_01 → rat_02
      → battle_01
        ├─ win → after_01 → nest_01 → nest_02 → nest_03
        │    → battle_02
        │      ├─ win → after_queen_01 → after_queen_02 → end_success
        │      └─ lose → end_failure
        └─ lose → end_failure
```

### ノード詳細（20ノード）

| node_id | type | bg | speaker | テキスト |
|---------|------|-----|---------|---------|
| start | text | bg_office | — | 自治会の事務所。衛生担当が鼻を押さえていた。 |
| text_01 | text | bg_office | 衛生担当の役人 | 「地下水路に巨大ネズミが大量発生した」 |
| text_02 | text | bg_office | 衛生担当の役人 | 「修繕工が噛まれて熱を出した。犬ほどの大きさ」 |
| text_03 | text | bg_office | 衛生担当の役人 | 「奥から気味の悪い鳴き声が聞こえるという」 |
| text_04 | text | bg_office | 衛生担当の役人 | 地図を広げた。「根絶しないと意味がない」 |
| sewer_01 | text | bg_catacombs | — | 地下水路に降りた。足元を汚水が流れている。 |
| sewer_02 | text | bg_catacombs | — | 壁に苔。松明の灯りに無数の赤い目が光った。 |
| sewer_03 | text | bg_catacombs | — | すぐに消えたが、奥からカリカリと爪の音。 |
| rat_01 | text | bg_catacombs | — | 通路を進むと巨大ネズミが3匹。腐肉を漁っていた。 |
| rat_02 | text | bg_catacombs | — | こちらに気づくと歯を剥き出した。犬ほどの大きさ。 |
| battle_01 | battle | bg_catacombs | — | 巨大ネズミの群れが襲いかかってきた！（group: 407） |
| after_01 | text | bg_catacombs | — | 群れを退けた。だが奥から地響きのような足音。 |
| nest_01 | text | bg_catacombs | — | 最深部に巨大な巣。骨と布切れで作られている。 |
| nest_02 | text | bg_catacombs | — | 巣の中央に一回り大きなネズミ。頭に骨の突起。 |
| nest_03 | text | bg_catacombs | — | 禍々しい紫の目。ネズミの女王だ。 |
| battle_02 | battle | bg_catacombs | — | ネズミの女王と取り巻きが襲いかかってきた！（group: 408） |
| after_queen_01 | text | bg_catacombs | — | 女王が倒れた。巣が崩れ子ネズミたちが散り散りに。 |
| after_queen_02 | text | bg_catacombs | — | 悪臭が薄れていく。これで水路は清掃できる。 |
| end_success | end | bg_office | — | 害獣駆除完了。しばらくネズミの夢を見そうだ。 |
| end_failure | end | bg_catacombs | — | ネズミの群れに圧倒された。這い出すのがやっと。 |

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 407 | 巨大ネズミ x3 |
| 408 | ネズミの女王と取り巻き |
