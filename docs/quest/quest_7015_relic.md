# クエスト仕様書：7015 — 盗まれた聖遺物の奪還

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7015 |
| **Slug** | `qst_rol_relic` |
| **クエスト種別** | 一般クエスト（Normal） |
| **推奨レベル** | 4（Normal） |
| **難度** | 4 |
| **依頼主** | 教会 |
| **出現条件** | 出現国: ローランド聖王国 |
| **リピート** | リピート可能 |
| **経過日数 (time_cost)** | 3 |
| **ノード数** | 30ノード |
| **ゲストNPC** | なし |
| **難易度Tier** | Normal（rec_level: 4） |
| **サムネイル画像** | `/images/quests/bg_ruined_church.png` |
## 1. クエスト概要

### 短文説明
```
[奪還] 盗賊団のアジトを襲撃し、教会から盗まれた聖杯を奪い返す。
```

### 長文説明
```
王都の教会宝物庫から、国宝級の最古の聖杯が盗み出された。
情報提供者によれば、実行犯は王都近郊の森に潜む大規模な盗賊団だという。
闇市に流れる前に強襲をかけ、一味を壊滅させて聖杯を取り戻すのが目的だ。
敵は手練れの盗賊たちであり、頭目はかなりの腕利きらしい。
血まみれになってでも主の器を取り戻せ——だが、取り戻した聖杯をどうするかは、あなた次第だ。
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
start → start_desc → intro_1 → intro_1_detail → intro_2 → intro_2_detail
  → forest_approach → forest_scenery → stealth_or_assault → spotted → spotted_desc → assault
    → battle_wave1
       ├─ win → after_wave1 → boss_appear → boss_talk → battle_wave2
       │    ├─ win → after_wave2 → find_relic → check_relic → choice_relic
       │    │    ├─ 教会に届ける → report → bishop_thanks → bishop_thanks_02 → end_success
       │    │    └─ 闇市で売却する → sell_market → sell_market_desc → sell_deal → end_dark
       │    └─ lose → end_failure
       └─ lose → end_failure
```

### ノード詳細（30ノード）

#### `start`（text）
**演出:** bg: bg_church, bgm: bgm_quest_calm
```text
大聖堂の宝物庫。重々しい扉がこじ開けられ、司教たちが怒りと困惑に顔を歪めていた。
```

#### `start_desc`（text）
**演出:** bg: bg_church
```text
台座の上に安置されていたはずの最古の聖杯は消え去り、塵だけが残されている。
```

#### `intro_1`（text）
**演出:** bg: bg_church, speaker: 司教
```text
「身の程知らずの盗賊どもが、教会宝物庫より主の尊き聖遺物を盗み出しました」
```

#### `intro_1_detail`（text）
**演出:** bg: bg_church, speaker: 司教
```text
「奴らのアジトは、東の森の奥にある廃城跡だと突き止めています」
```

#### `intro_2`（text）
**演出:** bg: bg_church, speaker: 司教
```text
「闇市へと売却される前に取り戻すのです。悪党どもは全員、ただちに『浄化』しなさい」
```

#### `intro_2_detail`（text）
**演出:** bg: bg_church, speaker: 司教
```text
「聖なる品のためです、血が流れることを恐れてはなりません。神の正義を示しなさい」
```

#### `forest_approach`（text）
**演出:** bg: bg_forest_day, bgm: bgm_field
```text
手がかりを頼りに東の森へ進む。木々の隙間から、廃城の荒れた石壁が見えた。
```

#### `forest_scenery`（text）
**演出:** bg: bg_forest_day
```text
城壁の崩れた隙間では、数人の野盗たちが武器を手に周囲を警戒していた。
```

#### `stealth_or_assault`（text）
**演出:** bg: bg_forest_day
```text
だが、身を隠して進むには地形が開けすぎている。不意打ちは諦め、正面から力ずくで突破を図る。
```

#### `spotted`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
```text
「曲者だ！ 騎士団の回し者か！」
```

#### `spotted_desc`（text）
**演出:** bg: bg_forest_day
```text
見張りが声を上げ、即座に矢を放ってきた。私はそれを剣で弾き落とす。
```

#### `assault`（text）
**演出:** bg: bg_forest_day
```text
アジトの奥から、騒ぎを聞きつけた盗賊たちが怒号と共に一斉に押し寄せてきた！
```

#### `battle_wave1`（battle）
**演出:** bg: bg_forest_day, bgm: bgm_battle
| 設定 | 値 |
|-----|-----|
| 敵グループID | `418` |
| 敵表示名 | 盗賊団の構成員 |

```text
包囲される前に敵の前衛を叩き潰す！ 容赦なく武器を振るえ！
```

#### `after_wave1`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_tense
```text
前衛を斬り伏せ、廃城の内庭に侵入する。奥からずっしりとした足音が響く。
```

#### `boss_appear`（text）
**演出:** bg: bg_forest_day, speaker: 盗賊団の頭目
```text
「てめえ、たった一人で乗り込んできやがったか。いい度胸だな」
```

#### `boss_talk`（text）
**演出:** bg: bg_forest_day, speaker: 盗賊団の頭目
```text
「あの聖杯は俺たちのものだ。売れば一生遊んで暮らせるんだよ！」
```

#### `battle_wave2`（battle）
**演出:** bg: bg_forest_day, bgm: bgm_battle_boss
| 設定 | 値 |
|-----|-----|
| 敵グループID | `419` |
| 敵表示名 | 盗賊団の頭領 |

```text
聖杯に目が眩んだ強欲な頭目を討ち倒し、主の器を奪還せよ！
```

#### `after_wave2`（text）
**演出:** bg: bg_forest_day, bgm: bgm_quest_calm
```text
激闘の末、頭目は血の海に沈んだ。残された手下たちは我先にと逃げ出す。
```

#### `find_relic`（text）
**演出:** bg: bg_forest_day
```text
奥のテントの木箱から、見事な細工が施された金の聖杯を見つけ出した。
```

#### `check_relic`（text）
**演出:** bg: bg_forest_day
```text
美しい。だが、この聖杯を闇市に持ち込めば、莫大な金になるだろう。
```

#### `choice_relic`（choice）
**演出:** bg: bg_road_day
```text
目の前の聖杯をどうする？ 信仰か、あるいは目の前の富か。
```
| 選択肢 | 次ノード |
|--------|---------|
| 教会に届ける | `report` |
| 闇市で売却する | `sell_market` |

#### `report`（text）
**演出:** bg: bg_guild
```text
聖杯を慎重に包んで王都へと戻り、大聖堂の司教へ献上した。彼は一瞬で歓喜の声を上げる。
```

#### `bishop_thanks`（text）
**演出:** bg: bg_guild, speaker: 司教
```text
「おお、主の器が戻った！ 感謝します。これは約束の報酬です」
```

#### `bishop_thanks_02`（text）
**演出:** bg: bg_guild, speaker: 司教
```text
「あなたのような頼もしい冒険者には、また主の導きがあることでしょう」
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
報酬の金貨を手にする。教会の信力を高める手伝いをした満足感を得た。
```
**rewards:** Gold:500, Order:10, Exp:200, Rep:10

#### `sell_market`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
聖杯を布に包み、王都の裏路地に潜む闇市へと足を運んだ。
```

#### `sell_market_desc`（text）
**演出:** bg: bg_slums
```text
怪しげな骨董屋の主人が聖杯の刻印を眺め、いやらしい笑みを浮かべる。
```

#### `sell_deal`（text）
**演出:** bg: bg_slums, speaker: 闇商人
```text
「これは教会の逸品だな。出所は問わん、倍の額で買い取ろう」
```

#### `end_dark`（end_success）
**演出:** bg: bg_slums
```text
重い金袋を懐に収める。司教には『聖杯は既に売却されていた』と報告した。
```
**rewards:** Gold:1000, Evil:20, Rep:-30

#### `end_failure`（end_failure）
**演出:** bg: bg_forest_day
```text
盗賊たちの数の前に力尽き、倒れ伏す。聖杯は彼らの手の内に残された。
```

---

## 4. 敵定義参照

| enemy_group_id | グループ名 |
|----------------|-----------|
| 418 | 盗賊団の構成員 |
| 419 | 盗賊団の頭領 |
