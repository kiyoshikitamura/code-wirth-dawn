# クエスト仕様書：7002 — 放浪商人の護衛

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7002 |
| **Slug** | `qst_gen_escort` |
| **クエスト種別** | 護衛（Escort） |
| **推奨レベル** | 2 |
| **難度** | 2 |
| **所要日数（成功）** | 1 |
| **所要日数（失敗）** | 1 |
| **依頼主** | 旅商人組合 |
| **出現拠点** | 全拠点（`all`） |
| **出現条件** | 特になし（常時） |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。
| **敵スラッグ** | `enemy_bandit_thug`（チンピラ） |

---

## 1. クエスト概要

### 短文説明（クエストボード表示・40文字以内）
```
旅の商人を目的地まで護衛せよ。夜盗の出没に注意。
```

### 長文説明（詳細モーダル・フレーバーテキスト）
```
旅商人組合から護衛依頼が舞い込んだ。
依頼人はマルコという名の中年商人。
いつもの交易路を通れば問題ないはずだが、
最近このあたりで夜盗の顔が増えているらしく、
「一人はどうにも心細い」と組合に駆け込んできた。
目的地まで無事に送り届ければそれでいい。
ただし——マルコが倒れた場合、依頼は即時失敗となる。
彼の命、そして商品を守り抜け。
```

---

## 2. 報酬定義

| 種別 | 内容 |
|-----|-----|
| Gold | 300G |
| EXP | ― |
| アイテム | なし |
| 名声変動 | なし |

**CSV記載形式:**
```
Gold:300
```

---

## 3. シナリオノード構成

### 全体フロー

```
start
  └─[続ける]→ join_escort         ← NPCのマルコがパーティに加入
       └─[出発する]→ travel_start
            └─[続ける]→ midway    ← 道中イベント
                 ├─[夜盗が現れた！]→ battle_bandit
                 │    ├─[勝利]→ after_battle → travel_end
                 │    └─[敗北]→ end_failure
                 └─[夜盗は現れなかった（ランダム分岐）]→ travel_end
                       └─[続ける]→ arrive
                            └─[続ける]→ leave_escort → end_success
```

### ノード詳細

#### `start`（type: text）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_quest_calm]`
- **背景画像**: `bg_tavern_day`
- **SE**: `[要定義 (必要時のみ)]`

**テキスト:**
```
旅商人組合からの依頼を受けた。
護衛対象はマルコ、中年の行商人だ。
顔色はよくないが、口は達者そうだ。
「よろしく頼みますぜ。旦那なら夜盗の二人や三人、平気でしょう？」
```
**次ノード:** `join_escort`（auto-advance）

---

#### `join_escort`（type: join）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_quest_calm]`
- **背景画像**: `bg_tavern_day`
- **SE**: `[要定義 (必要時のみ)]`

**テキスト:**
```
マルコがパーティに加わった。
彼のHPが0になると依頼は失敗する。守り抜け。
```
**params:**
```
type:join, npc_slug:npc_merchant_marco, is_escort_target:true, next:travel_start
```

> **is_escort_target: true** — このフラグが立つと、NPCが戦闘不能になった瞬間に `end_failure` へ強制遷移する。

---

#### `travel_start`（type: travel）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_quest_calm]`
- **背景画像**: `bg_tavern_day`
- **SE**: `[要定義 (必要時のみ)]`

**テキスト:**
```
目的地へ向かって出発した。
```
**params:**
```
type:travel, dest:隣街, days:1, gold_cost:0, next:midway
```

---

#### `midway`（type: random_branch）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_quest_calm]`
- **背景画像**: `bg_tavern_day`
- **SE**: `[要定義 (必要時のみ)]`

**テキスト:**
```
日が傾き始めたころ、街道の曲がり角で人の気配を感じた。
```
**params:**
```
type:random_branch, prob:60, next:battle_bandit, fallback:travel_end
```

> - 60% の確率で夜盗との戦闘が発生する
> - 40% の確率でそのまま目的地へ

---

#### `battle_bandit`（type: text）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_quest_calm]`
- **背景画像**: `bg_tavern_day`
- **SE**: `[要定義 (必要時のみ)]`

**テキスト:**
```
「金を出せ！ガタガタすんなよ！」
夜盗のチンピラが飛び出してきた。
マルコの悲鳴が耳に刺さる。
```
**選択肢:**

| ラベル | 次ノード |
|--------|---------|
| 戦う | `battle` |

---

#### バトルノード（type: battle）
**params:**
```
type:battle, enemy_group_id:[要定義: enemy_bandit_thug が含まれるグループ], next:after_battle, fail:end_failure
```

**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_bandit_thug` |
| 敵名 | チンピラ |
| 選定理由 | 夜道での追いはぎに最適なアーキタイプ敵 |
| 難易度 | 低（序盤向け）|
| 特殊行動 | なし |

---

#### `after_battle`（type: text）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_quest_calm]`
- **背景画像**: `bg_tavern_day`
- **SE**: `[要定義 (必要時のみ)]`

**テキスト:**
```
夜盗を退けた。
マルコは震える手で荷を確かめていたが、
「……全部ありますぜ。あんた、本物だ」と呟いた。
```
**次ノード:** `travel_end`（auto-advance）

---

#### `travel_end`（type: text）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_quest_calm]`
- **背景画像**: `bg_tavern_day`
- **SE**: `[要定義 (必要時のみ)]`

**テキスト:**
```
目的地が見えてきた。
```
**次ノード:** `arrive`（auto-advance）

---

#### `arrive`（type: text）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_quest_calm]`
- **背景画像**: `bg_tavern_day`
- **SE**: `[要定義 (必要時のみ)]`

**テキスト:**
```
無事に到着した。
マルコは通りかかる知人に声をかけながら、慣れた手つきで荷を降ろし始めた。
```
**次ノード:** `leave_escort`（auto-advance）

---

#### `leave_escort`（type: leave）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_quest_calm]`
- **背景画像**: `bg_tavern_day`
- **SE**: `[要定義 (必要時のみ)]`

**テキスト:**
```
マルコがパーティから離脱した。
「報酬はちゃんと組合に伝えておきますよ。ありがとさんでした」
```
**params:**
```
type:leave, npc_slug:npc_merchant_marco, next:end_success
```

---

#### `end_success`（type: end, result: success）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_quest_calm]`
- **背景画像**: `bg_tavern_day`
- **SE**: `[要定義 (必要時のみ)]`

**テキスト:**
```
護衛任務完了。報酬を受け取った。
```

---

#### `end_failure`（type: end, result: failure）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_quest_calm]`
- **背景画像**: `bg_tavern_day`
- **SE**: `[要定義 (必要時のみ)]`

**テキスト:**
```
マルコが倒れた——依頼は失敗だ。
報酬は支払われない。
```

---

## 4. NPC定義：マルコ

| 項目 | 値 |
|-----|-----|
| Slug | `npc_merchant_marco` |
| 名前 | マルコ |
| 役割 | 護衛対象（`is_escort_target: true`） |
| HP | 30（低め） |
| 戦闘参加 | なし（非戦闘型） |
| 死亡時 | 即時 `end_failure` 遷移 |

> **実装メモ:** `join` ノードの `is_escort_target: true` フラグをScenarioEngineが検出し、毎ターン終了時にHP確認の処理を行う。DBの `npcs` テーブルにマルコのレコードが必要。

---

## 5. 敵定義参照：チンピラ

| 項目 | 値 |
|-----|-----|
| Slug | `enemy_bandit_thug` |
| 名前 | チンピラ |
| HP | 中（序盤向け） |
| ATK | 中 |
| 特殊技 | なし |
| ドロップ | なし（このクエストでは設定不要） |

---

## 6. CSVエントリ（quests_normal.csv）

```csv
id,slug,title,rec_level,difficulty,time_cost,location_tags,min_prosperity,max_prosperity,min_reputation,max_reputation,rewards_summary,client_name,_comment
7002,qst_gen_escort,放浪商人の護衛,2,2,1,all,,,,,Gold:300,旅商人組合,[護衛] 旅の商人を目的地まで護衛し、夜盗の襲撃から商品を守る。
```

---

## 7. 実装チェックリスト

- [ ] CSVエントリが `quests_normal.csv` に存在する
- [ ] `seed_master.ts` 実行でDBに登録済み
- [ ] `npcs` テーブルに `npc_merchant_marco` が登録済み
- [ ] `enemies` テーブルに `enemy_bandit_thug` が登録済み
- [ ] `join` ノードで `is_escort_target: true` が正しく機能することを確認
- [ ] マルコのHP = 0 で `end_failure` に遷移することを確認
- [ ] `random_branch` の発生確率（60%）が適切に動作することを確認
- [ ] 戦闘勝利後の `after_battle` → `travel_end` 遷移を確認
- [ ] 戦闘敗北時の `end_failure` 遷移を確認

---

## 8. 拡張メモ（将来対応）

- 夜盗の人数を複数にしたHard版（難易度3以上向け）
- マルコが持つ荷物の中身フレーバー（「実は密輸品では？」疑惑ルート）
- 無事に届けた場合の隠し報酬（マルコから追加アイテムをもらう）
