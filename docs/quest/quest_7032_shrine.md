# クエスト仕様書：7032 — 結界石の修復と奉納

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7032 |
| **Slug** | `qst_yat_shrine` |
| **クエスト種別** | 矢渡クエスト（Yato） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | 神社 |
| **出現条件** | 制限なし / 出現拠点: loc_yatoshin |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 6） |
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ノード数** | 5ノード（うち選択肢2件） |
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
Gold:250
```

---

## 3. シナリオノードフロー

```
start → mountain_search → collect_shard_01（random_branch：妖怪遭遇50%）
  → collect_shard_02（random_branch：妖怪遭遇50%）
  → collect_shard_03 → return_shrine → enshrine → end_success
妖怪バトル敗北 → end_failure
```

#### `start`（text）
```
神社の神主から破片の大まかな場所を聞いた。
山のあちこちに散らばっているらしい。三か所に向かう。
```

#### `mountain_search`（text）
```
深い山道を登る。苔むした岩の間に、光る欠片が転がっているのが見えた。
```

#### `collect_shard_01`（reward + random_branch）
```
1つ目の破片を拾い上げた。冷たいが、不思議な温かさも感じる。
→ random_branch: prob:50, next:yokai_01, fallback:collect_shard_02
```

#### `yokai_01`（battle）
```
落ちた破片の気に引き寄せられたのか、木陰から妖怪が現れた。
params: type:battle, enemy_group_id:[要定義: enemy_yokai が含まれるグループ], next:collect_shard_02, fail:end_failure
```

#### `collect_shard_02` / `collect_shard_03`
（同様のパターンで3か所収集）

#### `return_shrine`（text）
```
三つの破片を全て集めて神社に戻った。
神主が両手で受け取り、深く頭を下げた。
```

#### `enshrine`（text）
```
神主が破片を祠の台座に並べ、祝詞を唱えた。
光が収まると、結界石が元の姿に戻っていた。
「おありがとう存じます」
```

#### `end_success`（end, result: success）
```
結界石の修復完了。神主から謝礼を受け取り、山を下りた。
```

---

## 4. CSVエントリ

```csv
7032,qst_yat_shrine,結界石の修復と奉納,2,2,1,loc_yatoshin,,,,,Gold:250,神社,[修復] 神隠しを防ぐため、破られた結界石の破片を集めて祠に納める。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_yatoshin` のみ
- [ ] `enemy_yokai` がDBに登録済み
- [ ] `reward` ノードで結界石破片（仮ID）が付与される
- [ ] 3段階の収集フローが正しく動作する
- [ ] `random_branch` による妖怪遭遇が50%で機能する

---

## 6. 拡張メモ

- 結界石を壊した犯人を追う後続クエストへの伏線
- 破片の数量に応じた結界の強度変動フレーバー
