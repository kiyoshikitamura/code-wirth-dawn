# クエスト仕様書：7003 — 廃墟の金庫回収

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7003 |
| **Slug** | `qst_gen_scavenge` |
| **クエスト種別** | 探索（Scavenge） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | 制限なし / 出現拠点: 全拠点 |
| **経過日数 (time_cost)** | 3（成功: 3日 / 失敗: 3日） |
| **ノード数** | 26ノード（うち選択肢1件: ギルド/闇市） |

---

## 1. クエスト概要

```
[探索] 廃墟の金庫から物資を回収する。届けるか売りさばくか。
```

---

## 2. 報酬定義

| ルート | Gold | Exp | Rep |
|--------|------|-----|-----|
| ギルドに届ける | 250 | 35 | 2 |
| 闇市に売る | 500 | 35 | -5 |

---

## 3. シナリオノードフロー

```text
start → text_01 → text_02 → text_03 → text_04
  → enter_01 → enter_02 → enter_03 → goblin_01 → goblin_02
    → battle_01
      ├─ win → after_01 → after_02 → hob_01 → hob_02
      │    → battle_02
      │      ├─ win → recover → moral_01 → moral_02 [選択肢]
      │      │    ├─ ギルドに届ける → guild_01 → guild_02 → end_success
      │      │    └─ 闇市に売る → dark_01 → dark_02 → end_dark
      │      └─ lose → end_failure
      └─ lose → end_failure
```

### ノード詳細（26ノード）

| node_id | type | bg | speaker | テキスト |
|---------|------|-----|---------|---------|
| start | text | bg_guild | — | 冒険者ギルドの掲示板に、急ぎの依頼が貼られていた。 |
| text_01 | text | bg_guild | — | 「崩壊街区の廃墟金庫から物資を回収。中身は開封不可」 |
| text_02 | text | bg_guild | ギルド担当 | 「場所は知ってるな？ 先週の地震で通路が崩れてる」 |
| text_03 | text | bg_guild | ギルド担当 | 「ゴブリンが住み着いてるって話もある」 |
| text_04 | text | bg_guild | — | 依頼書にサインを入れ、廃墟の地図を受け取った。 |
| enter_01 | text | bg_ruins_field | — | 廃墟に足を踏み入れた。天井の半ばが崩れ瓦礫が散乱。 |
| enter_02 | text | bg_ruins_field | — | 壁の古い紋章。かつて商家の倉庫だったようだ。 |
| enter_03 | text | bg_ruins_field | — | 奥に進むと薄暗い通路の先に錆びた鉄扉が見えた。 |
| goblin_01 | text | bg_ruins_field | — | 鉄扉の前にゴブリンが2匹。木箱を漁っている。 |
| goblin_02 | text | bg_ruins_field | — | こちらに気づくと甲高い声で威嚇してきた。 |
| battle_01 | battle | bg_ruins_field | — | ゴブリンが襲いかかってきた！（group: 402） |
| after_01 | text | bg_ruins_field | — | ゴブリンを倒した。鉄扉の錠前をこじ開ける。 |
| after_02 | text | bg_ruins_field | — | 中に頑丈な金庫が一つ。ギルドの封印が施されている。 |
| hob_01 | text | bg_ruins_field | — | 金庫の横にもう一つの通路。奥から重い足音。 |
| hob_02 | text | bg_ruins_field | — | ホブゴブリンが現れた。取り巻き2匹控えている。 |
| battle_02 | battle | bg_ruins_field | — | ホブゴブリンと取り巻きが襲いかかってきた！（group: 403） |
| recover | text | bg_ruins_field | — | ホブゴブリンを退けた。金庫を担ぎ上げ廃墟を後にする。 |
| moral_01 | text | bg_road_day | — | 闇市に持ち込めば高く売れるだろうが。 |
| moral_02 | choice | bg_road_day | — | 金庫を手にしたまま岐路に立つ。 |
| guild_01 | text | bg_guild | — | 金庫をギルドに持ち帰った。担当が封印を確認。 |
| guild_02 | text | bg_guild | ギルド担当 | 「無事だな。よくやった。報酬だ」 |
| dark_01 | text | bg_slum | — | 闇市の裏路地に金庫を持ち込んだ。 |
| dark_02 | text | bg_slum | 闇商人 | 「いい品だ。倍額で買おう」 |
| end_success | end | bg_guild | — | 物資回収完了。正当な報酬を受け取った。 |
| end_dark | end(success) | bg_slum | — | 闇市で売りさばいた。報酬は倍。良心が痛む。 |
| end_failure | end | bg_ruins_field | — | ゴブリンに叩きのめされた。回収は失敗。 |

---

## 4. 敵定義参照

| enemy_group_id | グループ名 | 構成 |
|----------------|-----------|------|
| 402 | ゴブリン x2 | enemy_goblin x2 |
| 403 | ホブゴブリンの群れ | enemy_hobgoblin + enemy_goblin x2 |