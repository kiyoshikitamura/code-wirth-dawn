# クエスト仕様書：7024 — 闇市オークションの用心棒

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7024 |
| **Slug** | `qst_mar_auction` |
| **クエスト種別** | マルカンドクエスト（Markand） |
| **推奨レベル** | 5（Normal） |
| **難度** | 3 |
| **依頼主** | 闇市の元締め |
| **出現条件** | max_reputation: -50 / 出現拠点: loc_marcund |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 5） |
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ノード数** | 20ノード |
| **サムネイル画像** | `/images/quests/bg_slums.png` |

## 1. クエスト概要

### 短文説明
```
[防衛] 違法国宝が取引される闇の競売場で、乱入者を排除する。
```

### 長文説明
```
マルカンドの地下で開かれる闇のオークション。出品されるのは盗品の国宝、禁制品の薬物、そして名もなき奴隷たち。元締めはこの一夜の売り上げを守るため、腕の立つ用心棒を雇う。会場に乱入する者があれば、音を立てずに排除しろ——それが仕事だ。良心の呵責は金で埋めろ。
```

## 2. 報酬定義

```
Gold:500|Chaos:10|Evil:5|Exp:120|Rep:-5
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
start → intro_1 → intro_2 → wait_outside
  → auction_start → auction_item_1 → first_alarm
    → intruder_1 → battle_wave1 (チンピラ x3 / 野盗の射手 x1)
       ├─ [勝利] → after_wave1 → auction_item_2 → second_alarm
       │    → intruder_2_desc → intruder_2_talk
       │      → battle_wave2 (見習い暗殺者 x2 / 凄腕の刺客 x1)
       │         ├─ [勝利] → after_wave2 → auction_end → payment → end_success
       │         └─ [敗北] → end_failure
       └─ [敗北] → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
マルカンドの地下水路の入り口で、目隠しをされた。
案内人に手を引かれ、長い階段を下りる。
```

#### `intro_1`（text）
**演出:** bg: bg_slums
```text
目隠しが外された。地下の広間に、
豪華な絨毯と燭台が並ぶ即席の競売場が設けられている。
```

#### `intro_2`（text）
**演出:** bg: bg_slums, speaker: 闇市の元締め
```text
「今夜の客は品が良いが、鼻が利くハイエナも引き寄せる。
　騒ぎを起こす輩がいれば、目立たぬように始末しろ」
```

#### `wait_outside`（text）
**演出:** bg: bg_slums
```text
指示通り、会場の入り口付近で待機する。
壁越しに、競りの声と金貨が積み上がる音が聞こえてくる。
```

#### `auction_start`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_calm
```text
オークションが始まった。
最初の出品は、どこかの国の王宮から盗み出された宝冠だ。
```

#### `auction_item_1`（text）
**演出:** bg: bg_slums
```text
「200金貨！ 300！ 500金貨！」
競りの声が熱を帯びる。壁の向こうで、途方もない額の金が動いている。
```

#### `first_alarm`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
見張りの男が駆け込んできた。
「入口に怪しい連中が来た。武装している。間違いなく狙いはここだ」
```

#### `intruder_1`（text）
**演出:** bg: bg_slums
```text
地下水路の入り口に、粗末な武装の男たちが群がっている。
闇市の噂を聞きつけた盗賊崩れだ。中の金品を狙っている。
```

#### `battle_wave1`（battle）【第1戦】
**演出:** bg: bg_slums, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `427`（新規作成） |
| 敵グループSlug | `grp_auction_raider_1` |
| 構成 | チンピラ(1101) x3 / 野盗の射手(1102) x1 |
| 敵表示名 | 乱入者の先遣隊 |

```text
闇市を嗅ぎつけた盗賊どもが乱入してきた！
```

#### `after_wave1`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_calm
```text
盗賊崩れを排除した。死体を水路に流し、血痕を砂で隠す。
元締めが顔を出し、「見事だ」と一言だけ言って戻っていった。
```

#### `auction_item_2`（text）
**演出:** bg: bg_slums
```text
オークションは続いている。
次の出品は——禁制品の毒薬。競りの声がさらに上がる。
```

#### `second_alarm`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_tense
```text
再び見張りが来た。今度は顔色が違う。
「やべえ……今度のは盗賊じゃねえ。腕利きだ」
```

#### `intruder_2_desc`（text）
**演出:** bg: bg_slums
```text
暗闘用の黒装束に身を包んだ男たちが、音もなく水路を進んでくる。
動きが違う。訓練された暗殺者——誰かに雇われた連中だ。
```

#### `intruder_2_talk`（text）
**演出:** bg: bg_slums, speaker: 黒装束の男
```text
「邪魔をするな。我々の標的は元締めだけだ。
　道を空けるなら命は助けてやる」
```

#### `battle_wave2`（battle）【第2戦】
**演出:** bg: bg_slums, bgm: bgm_battle

| 設定 | 値 |
|-----|-----|
| 敵グループID | `428`（新規作成） |
| 敵グループSlug | `grp_auction_raider_2` |
| 構成 | 見習い暗殺者(1121) x2 / 凄腕の刺客(1122) x1 |
| 敵表示名 | 暗殺者の精鋭 |

```text
暗殺者の精鋭部隊が襲いかかってきた！
```

#### `after_wave2`（text）
**演出:** bg: bg_slums, bgm: bgm_quest_calm
```text
暗殺者を退けた。今度の死体は水路に流すだけでは済まない。
元締めの手下たちが、手際よく痕跡を処理していく。
```

#### `auction_end`（text）
**演出:** bg: bg_slums
```text
深夜。オークションが無事に終了した。
客たちは目隠しをされ、一人ずつ違うルートで帰っていく。
```

#### `payment`（text）
**演出:** bg: bg_slums, speaker: 闇市の元締め
```text
「いい仕事だ。お前のおかげで今夜の売り上げは過去最高だ。
　また声をかける。口は堅いだろうな？」
```

#### `end_success`（end_success）
**演出:** bg: bg_slums
```text
厚い封筒を受け取った。
闇の競売場は跡形もなく片付けられ、もう何もなかったかのようだ。
```
**rewards:** Gold:500, Chaos:10, Evil:5, Exp:120, Rep:-5

#### `end_failure`（end_failure）
**演出:** bg: bg_slums
```text
暗殺者の刃は正確だった。
崩れ落ちる視界の端で、オークション会場が蹂躙されていくのが見えた。
```

---

## 4. 敵定義参照（新規エネミーグループ 2件）

### エネミーグループ: `grp_auction_raider_1` (ID: 427)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_bandit_thug | チンピラ | 2 | 40 | 20 | 2 |
| enemy_bandit_thug | チンピラ | 2 | 40 | 20 | 2 |
| enemy_bandit_thug | チンピラ | 2 | 40 | 20 | 2 |
| enemy_bandit_archer | 野盗の射手 | 4 | 35 | 24 | 1 |

### エネミーグループ: `grp_auction_raider_2` (ID: 428)

| Slug | 名前 | Lv | HP | ATK | DEF |
|------|------|----|----|-----|-----|
| enemy_assassin_trainee | 見習い暗殺者 | 8 | 70 | 42 | 2 |
| enemy_assassin_trainee | 見習い暗殺者 | 8 | 70 | 42 | 2 |
| enemy_assassin_master | 凄腕の刺客 | 15 | 150 | 75 | 5 |

---

## 5. CSVエントリ（quests_normal.csv）

```csv
7024,qst_mar_auction,闇市オークションの用心棒,5,3,1,loc_marcund,,,,-50,Gold:500|Chaos:10|Evil:5|Exp:120|Rep:-5,闇市の元締め,[防衛] 違法国宝が取引される闇の競売場で、乱入者を排除する。
```

---

## 6. 実装チェックリスト

- [ ] 出現拠点 `loc_marcund` のみ
- [ ] 受注条件 `max_reputation: -50` が機能する
- [ ] エネミーグループ `grp_auction_raider_1`（427）がenemy_groups.csvに登録済み
- [ ] エネミーグループ `grp_auction_raider_2`（428）がenemy_groups.csvに登録済み
- [ ] 2連戦フローが正しく遷移する
- [ ] Gold:500 + Chaos:10 + Evil:5 + Exp:120 + Rep:-5 が付与される
- [ ] time_cost: 1（成功）/ 1（失敗）が正しく経過する
