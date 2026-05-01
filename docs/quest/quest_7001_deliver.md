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
| **ノード数** | 9ノード（うち選択肢1件） |
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
| クエスト失敗（敗北/撤退/ギブアップ） | 名声 -3〜-10（ランダム、現在拠点） |
| バトル敗北（全般） | VIT -1（クエスト/ランダムエンカウント/賞金稼ぎ共通） |
| 経過日数 | クエスト定義の days_failure 値を適用 |

> 備考: クエスト失敗時は結果画面でペナルティが表示され、確認後に拠点へ帰還する。バトル敗北のVIT -1はクエスト固有ではなくシステム共通のペナルティであり、マップ移動中のランダムエンカウントや賞金稼ぎ戦でも同様に適用される。特別な指定があるクエストはこの限りではない。

---

## 3. シナリオノード構成

### 全体フロー

```text
start
  └─[続ける]→ briefing
       └─[続ける]→ receive_letter
            └─[続ける]→ depart
                 └─[移動中 (random_branch)]
                      ├─ [40%: 追い剥ぎ遭遇] → encounter_thief
                      │    └─[続ける]→ battle_thief
                      │         ├─ [勝利] → after_battle → arrive_inn
                      │         └─ [敗北] → end_failure
                      └─ [60%: 無事到着] → arrive_inn
                           └─[封書を渡す]→ delivery_ok
                                └─[続ける]→ end_success
```

### ノード詳細

#### `start`（type: text）
**演出パラメータ:**
- **BGM**: `bgm_quest_calm`
- **背景画像**: `bg_guild`
- **SE**: `se_quest_accept`

**テキスト:**
```
配達組合の窓口に、小太りの受付がうんざりした顔で座っていた。
「ああ、来たか。隣街の旅籠『黄昏亭』の主人宛てに、封書を一通。
　内容は知らん。組合は中身に関知しない決まりだ」
書類にサインを走らせると、受付は奥から蝋封された手紙を持ってきた。
```

---

#### `briefing`（type: text）
**背景画像**: `bg_guild`

**テキスト:**
```
「往復で八日は見ておけ。街道の整備が追いつかなくなってから、
　追い剥ぎが出るようになった。何人か帰ってきてない配達人もいる」
受付は淡々と言い、煙管に火をつけた。
「まあ、そのぶん報酬は上乗せしてある。死んだら払えんがな」
```
**次ノード:** `receive_letter`（auto-advance）

---

#### `receive_letter`（type: text）
**背景画像**: `bg_guild`

**テキスト:**
```
二重封印の封書を受け取った。思ったより重い。
蝋に押された紋章は見覚えがない——どこかの商家のものだろうか。
指で封を確かめると、かすかに薬草の匂いがした。
気にしても仕方ない。運ぶだけだ。
```
**次ノード:** `depart`（auto-advance）

---

#### `depart`（type: travel + random_branch）
**背景画像**: `bg_road_day`
**BGM**: `bgm_quest_calm`

**テキスト:**
```
街を出て、隣街へ続く街道を歩く。
乾いた風が土埃を巻き上げ、道端の草は薄汚れている。
轍（わだち）の跡が途中で途切れている場所がある——荷馬車が引き返したのだろう。
```
**params:**
```
type:travel, dest:loc_border_town, days:4, gold_cost:0
random_branch: prob:40, next:encounter_thief, fallback:arrive_inn
```

---

#### `encounter_thief`（type: text）
**BGM**: `bgm_quest_tense`
**背景画像**: `bg_road_day`

**テキスト:**
```
街道の曲がり角で、大柄な男が道を塞いでいた。
背後の茂みからもう一人、やせぎすの男が姿を見せる。

「おう、配達屋さんよ。その手紙、金目のものが入ってんだろ？」
大柄な男がナイフを弄びながら、にやりと笑った。
「置いていきな。手紙だけでいい。命までは取らねえよ——たぶんな」
```
**次ノード:** `battle_thief`（auto-advance）

---

#### `battle_thief`（type: battle）
**BGM**: `bgm_battle_normal`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_bandit_thug` x3 |
| 敵名 | 追い剥ぎ |
| 選定理由 | 序盤向けの街道エンカウント |

**params:**
```
type:battle, bgm_key:bgm_battle_normal, enemy_group_id:grp_bandit_pair, next:after_battle, fail:end_failure
```

---

#### `after_battle`（type: text）
**BGM**: `bgm_quest_calm`
**背景画像**: `bg_road_day`

**テキスト:**
```
追い剥ぎを退けた。
倒れた男の懐から、安っぽい銅貨が数枚こぼれ落ちた。
こいつらも食い詰めて道に落ちた連中か。同情はしないが、後味は悪い。

封書を確認する。無事だ。先を急ごう。
```
**次ノード:** `arrive_inn`（auto-advance）

---

#### `arrive_inn`（type: text）
**BGM**: `bgm_quest_calm`
**背景画像**: `bg_tavern_day`

**テキスト:**
```
「黄昏亭」に到着した。
看板の文字は半ば消えかけ、壁板は雨に晒されて黒ずんでいる。
それでも酒場の明かりだけは煌々と灯っていた。

奥のカウンターに立つ初老の男がこちらを見た。
「……配達か。組合から？」
無愛想だが、目だけは鋭い。
```

**選択肢:**
| ラベル | 次ノード |
|--------|---------|
| 封書を渡す | `delivery_ok` |

---

#### `delivery_ok`（type: text）
**背景画像**: `bg_tavern_day`

**テキスト:**
```
手紙を差し出すと、主人はゆっくりと封を確かめ、懐に収めた。
「……ご苦労だった。組合への返答は、また別の使いに頼む」

一瞬、主人の目に複雑な色が浮かんだように見えたが、
すぐにいつもの無表情に戻った。
「帰りも気をつけろ。最近は物騒だ」
何かありそうな雰囲気だが、こちらの仕事は終わった。
```
**次ノード:** `end_success`（auto-advance）

---

#### `end_success`（type: end, result: success）
**SE**: `se_quest_success`

**テキスト:**
```
往復八日の旅を終え、組合に帰還した。
受付は相変わらず退屈そうな顔で報酬の袋を投げてよこした。
「次もあるぞ。生きて戻ったんなら、また頼む」
```

---

#### `end_failure`（type: end, result: failure）

**テキスト:**
```
追い剥ぎに叩きのめされ、封書を奪われた。
ボロボロの体で組合に戻ると、受付はため息をひとつついた。
「……補償は出せんぞ。次があるかどうかも、お前次第だ」
```

---

## 4. 敵定義参照

| 項目 | 値 |
|-----|-----|
| Slug | `enemy_bandit_thug` |
| 名前 | チンピラ / 追い剥ぎ |
| HP | 30 |
| ATK | 10 |
| DEF | 2 |
| 特殊技 | なし |
| 出現 | 3体セット |

---

## 5. CSVエントリ（quests_normal.csv）

```csv
id,slug,title,rec_level,difficulty,time_cost,location_tags,min_prosperity,max_prosperity,min_reputation,max_reputation,rewards_summary,client_name,_comment
7001,qst_gen_deliver,隣街への封書配達,2,2,8,all,,,,,Gold:250|Rep:2,配達組合,[配達] 隣街の旅籠へ封書を届けて戻る。道中の追い剥ぎに注意。
```

---

## 6. 実装チェックリスト

- [ ] CSVエントリが `quests_normal.csv` に存在する
- [ ] `seed_master.ts` 実行でDBに登録済み
- [ ] `enemies` テーブルに `enemy_bandit_thug` が登録済み
- [ ] travel ノードの `dest` スラッグが実際のロケーションと一致している
- [ ] `random_branch`（40%確率）が正常に動作する
- [ ] `end_success` でゴールド報酬250G + 名声+2が正しく付与される
- [ ] time_cost:8 が正しく経過する
