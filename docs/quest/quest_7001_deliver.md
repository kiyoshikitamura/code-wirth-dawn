# クエスト仕様書：7001 — 隣街への封書配達

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7001 |
| **Slug** | `qst_gen_deliver` |
| **クエスト種別** | 配達（Delivery） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 配達組合 |
| **出現条件** | 制限なし / 出現拠点: 全拠点 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 8（成功: 8日 / 失敗: 8日） |
| **ノード数** | 24ノード（うち選択肢1件） |
| **サムネイル画像** | `/images/quests/bg_guild.png` |

---

## 1. クエスト概要

### 短文説明
```
[配達] 隣街の旅籠へ封書を届けて戻る。道中の追い剥ぎに注意。
```

### 長文説明
```
「二重封印の書状をお預かりした。宛先は隣街の旅籠……往復で八日は見ておけ。道中はお前の腕で切り抜けろ」
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:250|Rep:2
```

---

## 2.5. 失敗ペナルティ（共通仕様）

| 条件 | ペナルティ |
|------|-----------| 
| クエスト失敗 | 名声 -3〜-10（ランダム） |
| バトル敗北 | VIT -1 |
| 経過日数 | days_failure: 8 |

---

## 3. シナリオノードフロー

```text
start → text_01 → text_02 → text_03 → text_04 → text_05
  → receive → depart → road_01 → encounter_01 → encounter_02
    → encounter_03 → encounter_04 → battle
      ├─ win → after_01 → after_02 → arrive_01 → arrive_02
      │    → deliver [選択肢: 封書を渡す]
      │        → delivery_01 → delivery_02 → delivery_03 → end_success
      └─ lose → end_failure
```

### ノード詳細（24ノード）

| node_id | type | bg | speaker | テキスト（30-35文字） |
|---------|------|-----|---------|---------------------|
| start | text | bg_guild | — | 配達組合の窓口に来た。小太りの受付がうんざりした顔で座っている。 |
| text_01 | text | bg_guild | 配達組合の受付 | 「ああ、来たか。封書を一通、隣街の旅籠に届けてくれ」 |
| text_02 | text | bg_guild | 配達組合の受付 | 「内容は知らん。組合は中身に関知しない決まりだ」 |
| text_03 | text | bg_guild | — | 書類にサインを走らせると、受付は奥から蝋封された手紙を持ってきた。 |
| text_04 | text | bg_guild | 配達組合の受付 | 「往復で八日は見ておけ。最近は追い剥ぎも出る」 |
| text_05 | text | bg_guild | 配達組合の受付 | 「まあ、報酬は上乗せしてある。死んだら払えんがな」 |
| receive | text | bg_guild | — | 二重封印の封書を受け取った。思ったより重い。蝋に見覚えのない紋章。 |
| depart | text | bg_road_day | — | 街を出て、隣街へ続く街道を歩く。乾いた風が土埃を巻き上げている。 |
| road_01 | text | bg_road_day | — | 轍の跡が途中で途切れていた。荷馬車が引き返した痕だろう。 |
| encounter_01 | text | bg_road_day | — | 街道の曲がり角で、大柄な男が道を塞いでいた。 |
| encounter_02 | text | bg_road_day | — | 背後の茂みからもう二人、やせぎすの男たちが現れる。 |
| encounter_03 | text | bg_road_day | 追い剥ぎの頭 | 「おう、配達屋さんよ。その手紙、金目のもんだろ？」 |
| encounter_04 | text | bg_road_day | 追い剥ぎの頭 | 「置いていきな。命までは取らねえよ——たぶんな」 |
| battle | battle | bg_road_day | — | 追い剥ぎが襲いかかってきた！（enemy_group_id: 400） |
| after_01 | text | bg_road_day | — | 追い剥ぎを退けた。倒れた男の懐から安っぽい銅貨がこぼれた。 |
| after_02 | text | bg_road_day | — | 封書を確認する。無事だ。先を急ごう。 |
| arrive_01 | text | bg_tavern_day | — | 旅籠「黄昏亭」に到着した。看板の文字は半ば消えかけている。 |
| arrive_02 | text | bg_tavern_day | 黄昏亭の主人 | カウンターの初老の男がこちらを見た。「……配達か。組合から？」 |
| deliver | choice | bg_tavern_day | — | 封書を渡すか。 |
| delivery_01 | text | bg_tavern_day | — | 手紙を差し出すと、主人はゆっくりと封を確かめ、懐に収めた。 |
| delivery_02 | text | bg_tavern_day | 黄昏亭の主人 | 「ご苦労だった。帰りも気をつけろ。物騒だからな」 |
| delivery_03 | text | bg_tavern_day | — | 何かありそうな雰囲気だが、こちらの仕事は終わった。 |
| end_success | end | bg_guild | — | 往復八日の旅を終え、組合に帰還した。「次もあるぞ。生きて戻れたなら、また頼む」 |
| end_failure | end | bg_guild | — | 追い剥ぎに叩きのめされ、封書を奪われた。「……補償は出せんぞ」 |

---

## 4. 敵定義参照

| 項目 | 値 |
|-----|-----|
| enemy_group_id | 400 |
| グループ名 | 追い剥ぎ一味 |
| 構成 | enemy_bandit_thug + enemy_bandit_archer + enemy_bandit_guard |

---

## 5. CSVエントリ（quests_normal.csv）

```csv
7001,qst_gen_deliver,隣街への封書配達,2,2,8,all,,,,,Gold:250|Rep:2,配達組合,[配達] 隣街の旅籠へ封書を届けて戻る。道中の追い剥ぎに注意。
```
