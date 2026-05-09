# クエスト仕様書：7015 — 盗まれた聖遺物の奪還

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7015 |
| **Slug** | `qst_rol_relic` |
| **クエスト種別** | 聖王国クエスト（Roland） |
| **推奨レベル** | 4（Normal） |
| **難度** | 4 |
| **依頼主** | 教会 |
| **出現条件** | 制限なし / 出現拠点: loc_holy_empire |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 4） |
| **経過日数 (time_cost)** | 3（成功: 3日 / 失敗: 2日） |
| **ノード数** | 24ノード |
| **サムネイル画像** | `/images/quests/bg_ruined_church.png` |

## 1. クエスト概要

### 短文説明
```
[奪還] 盗賊団のアジトを襲撃し、教会から盗まれた聖杯を奪い返す。
```

### 長文説明
```
王都の教会宝物庫から、国宝級の最古の聖杯が盗み出された。情報提供者によれば、実行犯は王都近郊の森に潜む大規模な盗賊団だという。闇市に流れる前に強襲をかけ、一味を壊滅させて聖杯を取り戻すのが目的だ。敵は手練れの盗賊たちであり、頭目はかなりの腕利きらしい。血まみれになってでも主の器を取り戻せ——だが、取り戻した聖杯をどうするかは、あなた次第だ。
```

## 2. 報酬定義

**正規ルート（教会に返還）:**
```
Gold:500|Order:10|Exp:200|Rep:10
```

**闇ルート（闇市で売却）:**
```
Gold:1000|Evil:20|Rep:-30
```

## 2.5. 失敗ペナルティ（共通仕様）

| 条件 | ペナルティ |
|------|-----------|
| クエスト失敗（敗北/撤退/ギブアップ） | 名声 -3〜-10（ランダム、現在拠点） |
| バトル敗北（全般） | VIT -1（クエスト/ランダムエンカウント/賞金稼ぎ共通） |
| 経過日数 | クエスト定義の days_failure 値を適用 |

## 3. シナリオノード構成

### 全体フロー

```text
start → intro_1 → intro_2 → forest_approach → stealth_or_assault
  → spotted → assault
    → battle_wave1 (野盗の射手 x2 / 野盗の用心棒 x2)
       ├─ [勝利] → after_wave1 → boss_appear → boss_talk
       │    → battle_wave2 (盗賊団の頭領 x1 / 野盗の用心棒 x2)
       │       ├─ [勝利] → after_wave2 → find_relic → check_relic
       │       │    → choice_relic（分岐）
       │       │       ├─ [教会に届ける] → report → bishop_thanks → end_success
       │       │       └─ [闇市で売却する] → sell_market → sell_deal → end_dark
       │       └─ [敗北] → end_failure
       └─ [敗北] → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
教会の司教から直々の依頼を受けた。
宝物庫から最古の聖杯が盗み出されたという。
```

#### `intro_1`（text）
**演出:** bg: bg_guild, speaker: 司教
```text
「身の程知らずのネズミどもが、主の器を汚しました。
　奴らの隠れ家は、東の森の奥にある廃城跡だと判明しています」
```

#### `intro_2`（text）
**演出:** bg: bg_guild, speaker: 司教
```text
「闇市に流される前に、必ず取り戻してください。
　血まみれにしてでも構いません。神罰を下すのです」
```

#### `forest_approach`（text）
**演出:** bg: bg_forest_day, bgm: bgm_field
```text
東の森を抜け、廃城跡に近づく。
苔むした石壁の隙間に、見張りの男たちが立っているのが見えた。
```

#### `stealth_or_assault`（text）
**演出:** bg: bg_forest_day
```text
隠れて潜入するには見張りの数が多すぎる。
正面突破が手っ取り早いだろう。武器を構え、歩み出る。
```

#### `spotted`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
```text
「誰だ！？ 騎士団の犬か！」
見張りの一人が声を上げ、クロスボウを構えた。
```

#### `assault`（text）
**演出:** bg: bg_forest_day
```text
矢を弾き落とし、見張りの懐へ飛び込む。
一気にアジト内が騒がしくなり、無数の足音がこちらへ向かってきた。
```

#### `battle_wave1`（battle）【第1戦】
**演出:** bg: bg_forest_day, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `418`（新規作成） |
| 敵グループSlug | `grp_bandit_relic_1` |
| 構成 | 野盗の射手(1102) x2 / 野盗の用心棒(1103) x2 |
| 敵表示名 | 盗賊団の構成員 |

```text
盗賊団の構成員たちが立ちはだかる！
```

#### `after_wave1`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
```text
前衛の盗賊たちを斬り伏せた。
悲鳴と怒号を聞きつけ、廃城の奥から大柄な男が姿を現す。
```

#### `boss_appear`（text）
**演出:** bg: bg_forest_day, speaker: 盗賊団の頭目
```text
「てめえ、たった一人で乗り込んできやがったのか。
　いい度胸だが、死に場所を間違えたな」
```

#### `boss_talk`（text）
**演出:** bg: bg_forest_day, speaker: 盗賊団の頭目
```text
「あの金ピカの杯は俺たちのモンだ。
　あれを売れば、一生遊んで暮らせるんだよ！」
```

#### `battle_wave2`（battle）【第2戦】
**演出:** bg: bg_forest_day, bgm: bgm_battle_boss

| 設定 | 値 |
|-----|-----|
| 敵グループID | `419`（新規作成） |
| 敵グループSlug | `grp_bandit_relic_boss` |
| 構成 | 盗賊団の頭領(1104) x1 / 野盗の用心棒(1103) x2 |
| 敵表示名 | 盗賊団の頭領 |

```text
盗賊団の頭目と精鋭部隊との決戦！
```

#### `after_wave2`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_calm
```text
激闘の末、頭目が崩れ落ちた。
残った手下たちは蜘蛛の子を散らすように逃げていった。
```

#### `find_relic`（text）
**演出:** bg: bg_forest_day
```text
頭目のテントを漁ると、厳重に鍵の掛かった木箱が見つかった。
錠を壊して開けると、見事な金の聖杯が鎮座している。
```

#### `check_relic`（text）
**演出:** bg: bg_forest_day
```text
傷ひとつない。無事だ。
これを布に包んで背負い、血に染まった廃城を後にした。

……だが、ふと考えた。この聖杯を闇市に持ち込めば、
教会に届けるよりはるかに高値で売れるだろう。
```

#### `choice_relic`（choice）
**演出:** bg: bg_road_day
```text
聖杯を手に、岐路に立つ。
```
| 選択肢 | 次ノード |
|--------|---------|
| 教会に届ける | `report` |
| 闇市で売却する | `sell_market` |

---

#### `report`（text）【正規ルート】
**演出:** bg: bg_guild
```text
王都に戻り、司教に聖杯を献上する。
彼は聖杯を受け取ると、震える手でそれを高く掲げた。
```

#### `bishop_thanks`（text）
**演出:** bg: bg_guild, speaker: 司教
```text
「おお……主よ。あなたの器が戻りました。
　冒険者よ、大儀であった。これは教会からの感謝の印だ」
```

#### `end_success`（end_success）【正規ルート】
**演出:** bg: bg_guild
```text
報酬を受け取った。正義を果たし、教会の信頼を得た。
盗賊たちの命の代償としては、十分すぎる額だった。
```
**rewards:** Gold:500, Order:10, Exp:200, Rep:10

---

#### `sell_market`（text）【闇ルート】
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
裏路地の闇市に聖杯を持ち込んだ。
胡散臭い商人が金布を剥がし、聖杯の表面を指で撫でた。
```

#### `sell_deal`（text）
**演出:** bg: bg_slums, speaker: 闇商人
```text
「教会の国宝か……これは高く売れる。
　倍額で買おう。出所は聞かん。ここではそういう決まりだ」
```

#### `end_dark`（end_success）【闇ルート】
**演出:** bg: bg_slums
```text
重い金袋を受け取った。教会への報酬の倍以上。
司教には「盗賊団が既に売り払っていた」と報告しておいた。
嘘がバレなければいいが。
```
**rewards:** Gold:1000, Evil:20, Rep:-30

---

#### `end_failure`（end_failure）
**演出:** bg: bg_forest_day
```text
盗賊団の連携は見事だった。
多勢に無勢。剣を弾かれ、意識が闇に沈んでいく。
```

---

## 4. 敵定義参照（新規エネミーグループ 2件）

### エネミーグループ: `grp_bandit_relic_1` (ID: 418)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_bandit_archer | 野盗の射手 | 4 | 35 | 24 | 1 |
| enemy_bandit_archer | 野盗の射手 | 4 | 35 | 24 | 1 |
| enemy_bandit_guard | 野盗の用心棒 | 6 | 80 | 36 | 5 |
| enemy_bandit_guard | 野盗の用心棒 | 6 | 80 | 36 | 5 |

### エネミーグループ: `grp_bandit_relic_boss` (ID: 419)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_bandit_boss | 盗賊団の頭領 | 12 | 200 | 60 | 8 |
| enemy_bandit_guard | 野盗の用心棒 | 6 | 80 | 36 | 5 |
| enemy_bandit_guard | 野盗の用心棒 | 6 | 80 | 36 | 5 |

---

## 5. CSVエントリ（quests_normal.csv）

```csv
7015,qst_rol_relic,盗まれた聖遺物の奪還,4,4,3,loc_holy_empire,,,,,Gold:500|Order:10|Exp:200|Rep:10,教会,[奪還] 盗賊団のアジトを襲撃し、教会から盗まれた聖杯を奪い返す。
```

> **注意:** 闇ルート報酬(Gold:1000 + Evil:20 + Rep:-30)はシナリオエンジン側で分岐処理。CSV上は正規ルートの報酬のみ記載。

---

## 6. 実装チェックリスト

- [ ] 出現拠点 `loc_holy_empire` のみ
- [ ] エネミーグループ `grp_bandit_relic_1`（418）がenemy_groups.csvに登録済み
- [ ] エネミーグループ `grp_bandit_relic_boss`（419）がenemy_groups.csvに登録済み
- [ ] 2連戦フローが正しく遷移する
- [ ] 聖杯の正規/闇ルート分岐が機能する
- [ ] 正規ルート: Gold:500 + Order:10 + Exp:200 + Rep:10 が付与される
- [ ] 闇ルート: Gold:1000 + Evil:20 + Rep:-30 が付与される
- [ ] time_cost: 3（成功）/ 2（失敗）が正しく経過する
