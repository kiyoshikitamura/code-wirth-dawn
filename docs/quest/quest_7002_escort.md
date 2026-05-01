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
| **ノード数** | 12ノード（うち選択肢1件） |
| **サムネイル画像** | `/images/quests/bg_guild.png` |

---

## 1. クエスト概要

### 短文説明
```
[護衛] 旅の商人を隣街まで護衛する。商人が倒れれば失敗。
```

### 長文説明
```
「行商人を連れて隣街まで往復する仕事だ。相手はよく喋るが足は遅い。夜盗に見つかったら庇ってやれ」
```

---

## 2. 報酬定義

**CSV記載形式:**
```
Gold:350|Rep:3
```

---


## 2.5. 失敗ペナルティ（共通仕様）

| 条件 | ペナルティ |
|------|-----------|
| クエスト失敗（敗北/撤退/ギブアップ） | 名声 -3〜-10（ランダム、現在拠点） |
| バトル敗北（全般） | VIT -1（クエスト/ランダムエンカウント/賞金稼ぎ共通） |
| 経過日数 | クエスト定義の days_failure 値を適用 |

> 備考: クエスト失敗時は結果画面でペナルティが表示され、確認後に拠点へ帰還する。バトル敗北のVIT -1はクエスト固有ではなくシステム共通のペナルティであり、マップ移動中のランダムエンカウントや賞金稼ぎ戦でも同様に適用される。特別な指定があるクエストはこの限りではない。

---

## 3. シナリオノード構成

### 全体フロー

```text
start
  └─[続ける]→ meet_merchant
       └─[続ける]→ join_escort ← 商人がパーティに加入
            └─[出発する]→ travel_start
                 └─[続ける]→ road_talk
                      └─[続ける]→ midway (random_branch)
                           ├─ [60%: 夜盗出現] → bandit_encounter
                           │    └─[戦う]→ battle_bandit
                           │         ├─ [勝利] → after_battle → travel_end
                           │         └─ [敗北] → end_failure
                           └─ [40%: 無事通過] → travel_end
                                └─[続ける]→ arrive_town
                                     └─[続ける]→ farewell
                                          └─[続ける]→ leave_escort → end_success
```

### ノード詳細

#### `start`（type: text）
**BGM**: `bgm_quest_calm`
**背景画像**: `bg_guild`
**SE**: `se_quest_accept`

**テキスト:**
```
旅商人組合の窓口で依頼書を受け取った。
「護衛対象は行商人のマルコ。隣街まで往復八日の旅だ。
　積み荷は雑貨と薬品。狙われやすい品ばかりだな」
受付の女が書類をめくりながら付け加えた。
「先月、同じ路線で護衛二名が殺された。気を抜くなよ」
```

---

#### `meet_merchant`（type: text）
**背景画像**: `bg_tavern_day`

**テキスト:**
```
酒場の片隅で、小柄な中年男が荷物に囲まれて待っていた。
額の汗を拭きながら、こちらに気づくと大袈裟に手を振った。

「あんたが護衛かい？ ありがてえ！
　マルコだ。見ての通り、腕っぷしはからきしでね。
　でも商売の話なら一晩中でも付き合うぜ」

人懐こいが、どこか落ち着きがない。何か気にかかることがあるのだろう。
```

---

#### `join_escort`（type: join）
**背景画像**: `bg_tavern_day`

**テキスト:**
```
マルコがパーティに加わった。
大きな背負い箱を担ぎ、よたよたと歩き出す。

「よし、行こう！ ……ところで、前の護衛はどうなったんだい？」
「殺されたそうだ」
「…………はは、冗談きついな旦那」
```
**params:**
```
type:join, npc_slug:npc_gen_merchant, is_escort_target:true, next:travel_start
```

> **is_escort_target: true** — マルコのHP=0で即 `end_failure` へ遷移。

---

#### `travel_start`（type: travel）
**背景画像**: `bg_road_day`

**テキスト:**
```
街を出て、隣街へ続く街道を歩き始めた。
マルコの歩調は遅い。荷が重いのもあるが、息が上がるのが早い。
```
**params:**
```
type:travel, dest:loc_border_town, days:4, gold_cost:0, next:road_talk
```

---

#### `road_talk`（type: text）
**背景画像**: `bg_road_day`

**テキスト:**
```
日が傾き始めた頃、マルコが荷物越しに話しかけてきた。

「なあ旦那、この荷の中に薬草が何束か入ってるんだが……
　正直に言うと、表向きは雑貨だが、中に少しだけ"特別な品"がある」

こちらの表情を窺うように目を細めた。
「あんたの報酬には響かねえよ。ただ、もし追い剥ぎに荷を見られたら——
　少し面倒なことになるかもしれねえって、それだけの話さ」

何を運んでいるかは、深く聞かないことにした。
```

---

#### `midway`（type: random_branch）
**背景画像**: `bg_road_day`

**テキスト:**
```
街道の曲がり角。
林の向こうに煙が見える——焚き火か、あるいは。
```
**params:**
```
type:random_branch, prob:60, next:bandit_encounter, fallback:travel_end
```

---

#### `bandit_encounter`（type: text）
**BGM**: `bgm_quest_tense`
**背景画像**: `bg_road_day`

**テキスト:**
```
「止まれ！ 荷を置いていけ！」

木の陰から数人の男が飛び出してきた。
粗末な革鎧に、刃こぼれした剣。食い詰めた夜盗の類だ。

マルコの顔が青ざめた。
「旦那ッ！ 頼むッ！ 荷だけは——荷だけは守ってくれ！」

背後でマルコが荷物を抱えて縮こまっている。
こいつを守りながら戦わなければならない。
```
**次ノード:** `battle_bandit`（auto-advance）

---

#### `battle_bandit`（type: battle）
**BGM**: `bgm_battle_normal`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_bandit_thug` x3 |
| 敵名 | 夜盗 |
| 備考 | マルコは非戦闘。護衛対象のため被弾に注意 |

**params:**
```
type:battle, enemy_group_id:grp_bandit_pair, next:after_battle, fail:end_failure
```

---

#### `after_battle`（type: text）
**BGM**: `bgm_quest_calm`
**背景画像**: `bg_road_day`

**テキスト:**
```
夜盗を蹴散らした。
逃げていく背中を見送ると、マルコがおそるおそる荷物から顔を出した。

「……終わったかい？ 全部あるか確認させてくれ」
震える手で荷を検める。しばらくして、深い息をついた。
「……全部ある。あんた、本物だ」
```
**次ノード:** `travel_end`（auto-advance）

---

#### `travel_end`（type: text）
**背景画像**: `bg_road_day`

**テキスト:**
```
残りの道のりは平穏だった。
マルコは黙って歩いていたが、やがてぽつりと呟いた。

「……前の護衛が死んだ話、冗談じゃなかったんだな。
　あんたに頼んでよかったよ」
```

---

#### `arrive_town`（type: text）
**背景画像**: `bg_tavern_day`

**テキスト:**
```
隣街に到着した。
マルコは通りかかる知人に声をかけながら、慣れた手つきで荷を降ろし始めた。
「ここまで来りゃ安心だ。知り合いの問屋に卸してくる」
```

---

#### `farewell`（type: text）
**背景画像**: `bg_tavern_day`

**テキスト:**
```
取引を終えたマルコが、上機嫌で戻ってきた。
懐から報酬の入った革袋を差し出す。

「約束通りだ、受け取ってくれ。
　……あの"特別な品"のこと、口外しないでくれよ？ ははっ」
冗談めかしてはいるが、目は笑っていなかった。
```

---

#### `leave_escort`（type: leave）
**テキスト:**
```
マルコがパーティから離脱した。
「またいい仕事があったら組合に顔を出してくれ。次も頼むよ、旦那！」
```
**params:**
```
type:leave, npc_slug:npc_gen_merchant, next:end_success
```

---

#### `end_success`（type: end, result: success）
**SE**: `se_quest_success`

**テキスト:**
```
護衛任務完了。組合に帰還し、報酬を受け取った。
マルコの"特別な品"が何だったかは、考えないことにした。
```

---

#### `end_failure`（type: end, result: failure）

**テキスト:**
```
マルコが倒れた。荷物は散乱し、夜盗に奪われた。
組合に戻ると、受付の女が冷たい目で書類を処理していた。
「護衛失敗。報酬はなし。次があるかは、組合の判断だ」
```

---

## 4. NPC定義参照：マルコ（旅の商人）

| 項目 | 値 |
|-----|-----|
| Slug | `npc_gen_merchant` (ID:4051) |
| 名前 | 旅の商人（マルコ） |
| 役割 | 護衛対象（`is_escort_target: true`） |
| HP | 30 |
| ATK | 1 |
| DEF | 1 |
| 戦闘参加 | なし（非戦闘型） |
| 死亡時 | 即時 `end_failure` 遷移 |

> **実装メモ:** `mercenary_master_specification.md` ID:4051 `npc_gen_merchant` を使用。パラメータは確認済みで問題なし。

---

## 5. CSVエントリ（quests_normal.csv）

```csv
id,slug,title,rec_level,difficulty,time_cost,location_tags,min_prosperity,max_prosperity,min_reputation,max_reputation,rewards_summary,client_name,_comment
7002,qst_gen_escort,放浪商人の護衛,2,2,8,all,,,,,Gold:350|Rep:3,旅商人組合,[護衛] 旅の商人を隣街まで護衛する。商人が倒れれば失敗。
```

---

## 6. 実装チェックリスト

- [ ] CSVエントリが `quests_normal.csv` に存在する
- [ ] `npcs` テーブルに `npc_gen_merchant` (ID:4051) が登録済み
- [ ] `enemies` テーブルに `enemy_bandit_thug` が登録済み
- [ ] `join` ノードで `is_escort_target: true` が正しく機能する
- [ ] マルコのHP=0 で `end_failure` に遷移する
- [ ] `random_branch`（60%）が適切に動作する
- [ ] time_cost:8 が正しく経過する
- [ ] Gold:350 + Rep:3 が正しく付与される
