# クエスト仕様書：7001 — 隣街への親書配達

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
| **難易度Tier** | Easy（rec_level: 2） |
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ノード数** | 4ノード（うち選択肢0件） |
| **サムネイル画像** | `/images/quests/bg_guild.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
[要定義: 短文説明]
```

### 長文説明
```
[要定義: フレーバーテキスト]
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:150
```

---

## 3. シナリオノード構成

### 全体フロー

```text
start
  └─[続ける]→ receive_letter
       └─[続ける]→ travel_start
            └─[移動中 (random_branch)]
                 ├─ [10%: トラブル発生] → encounter_thief → battle_thief
                 │    ├─ [勝利] → arrive_inn
                 │    └─ [敗北] → end_failure
                 └─ [90%: 平和な移動] → arrive_inn
                      └─[手紙を渡す]→ delivery_ok
                           └─[続ける]→ end_success
                      └─[様子を見る]→ suspicious ← optional 分岐
                           └─[続ける]→ delivery_ok
```

### ノード詳細

#### `start`（type: text）
**演出パラメータ:**
- **BGM**: `bgm_quest_calm` （※ここで指定し、変更があるまで継続）
- **背景画像**: `bg_guild`
- **SE**: `se_quest_accept` （※ノード突入時に1回のみ再生）

**テキスト:**
```
配達組合から依頼が来た。
隣街の旅籠「黄昏亭」の主人に、封書を届けるだけの仕事だ。
受け取りは必ず本人の手に。それだけが条件だ。
```
**params:**
```
type:text, bgm_key:bgm_quest_calm, se_trigger:se_quest_accept, bg_image:bg_guild, next:receive_letter
```

---

#### `receive_letter`（type: text）
**テキスト:**
```
組合の受付から、二重封印の封書を受け取った。
思ったより重い。……気にしても仕方ない。
```
**次ノード:** `travel_start`（auto-advance）

---

#### `travel_start`（type: travel）
**演出パラメータ:**
- **背景画像**: `bg_guild`

**テキスト:**
```
目的地：隣の宿場町。特に指定はないが、日が暮れる前には届けたい。
```
**params:**
```
type:travel, bg_image:bg_guild, dest:[要定義: 具体的なロケーションスラッグ 例: loc_border_town], days:1, gold_cost:0, default_next:arrive_inn
```

#### `travel_event` (type: random_branch) ※内部判定ノード
**params:**
```
type:random_branch, prob:10, next:encounter_thief, fallback:arrive_inn
```

> **注意:** `dest` の値はプレイヤーの現在地から隣接するロケーションの正しいスラッグをユーザー様にて定義してください。

---

#### `encounter_thief`（type: text）
**演出パラメータ:**
- **BGM**: `bgm_quest_tense` （※ここから緊張感のあるBGMに変更）
- **背景画像**: `bg_guild`

**テキスト:**
```
道中、茂みから追い剥ぎが飛び出してきた！
「おい、その手紙の中身、金目のものだろう？ 置いていきな！」
```
**params:**
```
type:text, bgm_key:bgm_quest_tense, bg_image:bg_guild, next:battle_thief
```

---

#### `battle_thief`（type: battle）
**演出パラメータ:**
- **BGM**: `bgm_battle_normal`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `[要定義: 敵グループのSlug 例: enemy_group_id: bandit_group]` |

**params:**
```
type:battle, bgm_key:bgm_battle_normal, enemy_group_id:[要定義], next:arrive_inn, fail:end_failure
```

---

#### `arrive_inn`（type: text）
**演出パラメータ:**
- **BGM**: `bgm_quest_calm` （※戦闘終了後、静かな曲に戻す）
- **背景画像**: `bg_guild`

**テキスト:**
```
「黄昏亭」に到着した。
宿の主人らしき初老の男が、こちらを見てわずかに眉をひそめた。
「……配達か。組合から？」
```
**選択肢:**

| ラベル | 次ノード |
|--------|---------|
| 封書を渡す | `delivery_ok` |
| 封印を確認してから渡す（変化なし） | `suspicious` |

---

#### `suspicious`（type: text）
**テキスト:**
```
封書を透かして見るが、中身は読めない。
まあいい、依頼通りに動くだけだ。
```
**次ノード:** `delivery_ok`（auto-advance）

---

#### `delivery_ok`（type: text）
**テキスト:**
```
主人は封書を受け取り、ゆっくり懐に収めた。
「ご苦労だった。組合への返答は……また別の使いに頼む」
何かありそうな雰囲気だが、こちらの仕事は終わった。
```
**次ノード:** `end_success`（auto-advance）

---

#### `end_success`（type: end, result: success）
**演出パラメータ:**
- **SE**: `se_quest_success`

**テキスト:**
```
配達完了。報酬を受け取った。
```
**params:**
```
type:end, result:success, se_trigger:se_quest_success
```

---

## 4. CSVエントリ（quests_normal.csv）

```csv
id,slug,title,rec_level,difficulty,time_cost,location_tags,min_prosperity,max_prosperity,min_reputation,max_reputation,rewards_summary,client_name,_comment
7001,qst_gen_deliver,隣街への親書配達,2,2,1,all,,,,,Gold:150,配達組合,[配達] 隣街の親族へ仕送り入りの手紙を無事に届ける。
```

---

## 5. 実装チェックリスト

- [ ] CSVエントリが `quests_normal.csv` に存在する
- [ ] `seed_master.ts` 実行でDBに登録済み
- [ ] シナリオ JSON（`script_data`）が DB の `scenarios.flow` に設定済み
- [ ] travel ノードの `dest` スラッグが実際のロケーションと一致している
- [ ] クエストボードの一覧で表示されることを確認
- [ ] `end_success` でゴールド報酬が正しく付与されることを確認

---

## 6. 拡張メモ（将来対応）

- 封書の中身が「密告状」だった場合の道徳的分岐（`alignment` 変動）
- 配達途中に追いはぎが出現するイベントの派生（依頼主からの追加報酬フラグ等）
