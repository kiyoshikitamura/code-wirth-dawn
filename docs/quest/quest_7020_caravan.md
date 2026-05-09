# クエスト仕様書：7020 — 大砂漠の長距離交易護衛

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7020 |
| **Slug** | `qst_mar_caravan` |
| **クエスト種別** | マルカンドクエスト（Markand） |
| **推奨レベル** | 5（Normal） |
| **難度** | 3 |
| **依頼主** | 交易商会 |
| **出現条件** | 制限なし / 出現拠点: loc_marcund |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 5） |
| **経過日数 (time_cost)** | 8（成功: 8日 / 失敗: 4日） |
| **ノード数** | 20ノード |
| **サムネイル画像** | `/images/quests/bg_desert.png` |

## 1. クエスト概要

### 短文説明
```
[護衛] 広大な砂漠を越える商隊の用心棒。盗賊と魔獣の連戦を耐え抜け。
```

### 長文説明
```
マルカンドの交易商会から大口の護衛依頼が入った。砂漠横断の交易ルート——ラクダ20頭分の香辛料と絹織物を、隣国の交易都市まで無事に届ける仕事だ。片道8日の長丁場。道中には砂漠の盗賊団と、砂の中に潜む魔獣が待ち構えている。商品が無事に届けば高額の報酬が約束されるが、砂漠の旅に「安全」という二文字は存在しない。
```

## 2. 報酬定義

```
Gold:500|Chaos:10|Exp:150|Rep:5
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
start → intro_1 → intro_2 → depart
  → desert_day1 → desert_heat → desert_night → campfire
    → ambush_alert → ambush_desc
      → battle_wave1 (チンピラ x2 / 野盗の射手 x2)
         ├─ [勝利] → after_wave1 → travel_resume → sandstorm
         │    → sandstorm_pass → beast_alert → beast_desc
         │      → battle_wave2 (サンドワーム x1 / デザートスコーピオン x2)
         │         ├─ [勝利] → after_wave2 → arrive → reward_scene → end_success
         │         └─ [敗北] → end_failure
         └─ [敗北] → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_guild, bgm: bgm_quest_calm
```text
交易商会の待合室に呼ばれた。
壁一面に地図が貼られ、砂漠のルートに赤い線が引かれている。
```

#### `intro_1`（text）
**演出:** bg: bg_guild, speaker: 交易商会の隊長
```text
「今回の荷は香辛料と絹だ。ラクダ20頭分。
　片道8日の旅になる。途中で荷を一つでも失えば、お前の報酬から差し引く」
```

#### `intro_2`（text）
**演出:** bg: bg_guild, speaker: 交易商会の隊長
```text
「砂漠の盗賊団が最近活発でな。
　おまけに砂の中に化け物が棲みついている。腕に自信がなければ断れ」
```

#### `depart`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
王都の門をくぐり、砂漠へと踏み出す。
ラクダの列が砂丘の向こうまで続いている。長い旅が始まった。
```

#### `desert_day1`（text）
**演出:** bg: bg_desert
```text
出発から二日目。
砂と空の境界線が溶け合い、前も後ろも同じ景色が続く。
```

#### `desert_heat`（text）
**演出:** bg: bg_desert
```text
陽炎が揺れる。水筒の中身は半分を切った。
ラクダの足取りも重くなり始めている。
```

#### `desert_night`（text）
**演出:** bg: bg_desert_night, bgm: bgm_quest_calm
```text
夜になり、砂漠の気温が急激に下がる。
星空の下、商隊は円陣を組んで野営の準備をした。
```

#### `campfire`（text）
**演出:** bg: bg_camp
```text
焚き火を囲む。隊商の男たちが、砂漠の怪談を囁いている。
見張りを交代しながら、短い眠りについた。
```

#### `ambush_alert`（text）
**演出:** bg: bg_camp, bgm: bgm_quest_tense
```text
深夜。見張りの男が声を殺して起こしにきた。
「砂丘の向こうに、松明の光が見える……来やがった」
```

#### `ambush_desc`（text）
**演出:** bg: bg_desert_night
```text
砂丘を越えて近づいてくる影。十人以上いる。
ターバンで顔を隠した砂漠の盗賊団だ。商隊の荷を狙っている。
```

#### `battle_wave1`（battle）【第1戦】
**演出:** bg: bg_desert_night, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `420`（新規作成） |
| 敵グループSlug | `grp_desert_bandit` |
| 構成 | チンピラ(1101) x2 / 野盗の射手(1102) x2 |
| 敵表示名 | 砂漠の盗賊団 |

```text
砂漠の盗賊団が商隊に襲いかかってきた！
```

#### `after_wave1`（text）
**演出:** bg: bg_desert_night, bgm: bgm_quest_calm
```text
盗賊どもを蹴散らした。数人が砂丘の向こうへ逃げていく。
荷を確認する。無事だ。ラクダも全頭健在。
```

#### `travel_resume`（text）
**演出:** bg: bg_desert, bgm: bgm_field
```text
夜明けと共に出発。盗賊に襲われた疲労が残るが、
立ち止まっていれば次はもっと大きな群れが来るかもしれない。
```

#### `sandstorm`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
五日目の昼過ぎ。空が突然褐色に染まった。
砂嵐だ。視界が数メートル先まで塞がれる。
```

#### `sandstorm_pass`（text）
**演出:** bg: bg_desert
```text
ラクダの手綱を握りしめ、嵐が過ぎるのを待った。
砂が収まったとき、足元の砂が不自然に盛り上がっているのに気づいた。
```

#### `beast_alert`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_tense
```text
地面が震えている。ラクダたちが怯えて鳴き始めた。
砂の中から、巨大な何かが這い寄ってくる——！
```

#### `beast_desc`（text）
**演出:** bg: bg_desert
```text
砂が爆発的に噴き上がり、巨大な口が空を仰いだ。
サンドワーム——砂漠の支配者だ。その脇には大型のサソリも這い出てくる。
```

#### `battle_wave2`（battle）【第2戦】
**演出:** bg: bg_desert, bgm: bgm_battle_boss

| 設定 | 値 |
|-----|-----|
| 敵グループID | `421`（新規作成） |
| 敵グループSlug | `grp_desert_beast` |
| 構成 | サンドワーム(1212) x1 / デザートスコーピオン(1211) x2 |
| 敵表示名 | 砂漠の魔獣 |

```text
砂漠の魔獣が商隊を襲う！荷を守り抜け！
```

#### `after_wave2`（text）
**演出:** bg: bg_desert, bgm: bgm_quest_calm
```text
サンドワームが砂の中に沈んでいった。もう動かない。
サソリの死骸を踏み越え、商隊を急かす。もう少しだ。
```

#### `arrive`（text）
**演出:** bg: bg_guild
```text
八日目の夕暮れ。ついに交易都市の城壁が見えた。
門をくぐると、商会の代理人が笑顔で出迎えてくれた。
```

#### `reward_scene`（text）
**演出:** bg: bg_guild, speaker: 交易商会の代理人
```text
「全頭無事！ 荷も完品！ さすがだな、傭兵。
　約束の報酬だ。また頼むぞ」
```

#### `end_success`（end_success）
**演出:** bg: bg_guild
```text
重い金袋を受け取った。
8日間の砂と汗の代償。それでも、生きて帰れたことに感謝した。
```
**rewards:** Gold:500, Chaos:10, Exp:150, Rep:5

#### `end_failure`（end_failure）
**演出:** bg: bg_desert
```text
砂漠の容赦ない牙の前に、膝をついた。
荷は奪われ、商隊は散り散りになった。
```

---

## 4. 敵定義参照（新規エネミーグループ 2件）

### エネミーグループ: `grp_desert_bandit` (ID: 420)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_bandit_thug | チンピラ | 2 | 40 | 20 | 2 |
| enemy_bandit_thug | チンピラ | 2 | 40 | 20 | 2 |
| enemy_bandit_archer | 野盗の射手 | 4 | 35 | 24 | 1 |
| enemy_bandit_archer | 野盗の射手 | 4 | 35 | 24 | 1 |

### エネミーグループ: `grp_desert_beast` (ID: 421)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_markand_sand_worm | サンドワーム | 14 | 180 | 45 | 5 |
| enemy_markand_scorpion | デザートスコーピオン | 8 | 90 | 30 | 15 |
| enemy_markand_scorpion | デザートスコーピオン | 8 | 90 | 30 | 15 |

---

## 5. CSVエントリ（quests_normal.csv）

```csv
7020,qst_mar_caravan,大砂漠の長距離交易護衛,5,3,8,loc_marcund,,,,,Gold:500|Chaos:10|Exp:150|Rep:5,交易商会,[護衛] 広大な砂漠を越える商隊の用心棒。盗賊と魔獣の連戦を耐え抜け。
```

---

## 6. 実装チェックリスト

- [ ] 出現拠点 `loc_marcund` のみ
- [ ] エネミーグループ `grp_desert_bandit`（420）がenemy_groups.csvに登録済み
- [ ] エネミーグループ `grp_desert_beast`（421）がenemy_groups.csvに登録済み
- [ ] 2連戦フローが正しく遷移する
- [ ] Gold:500 + Chaos:10 + Exp:150 + Rep:5 が付与される
- [ ] time_cost: 8（成功）/ 4（失敗）が正しく経過する
