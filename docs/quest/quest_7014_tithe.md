# クエスト仕様書：7014 — 強圧的な十分の一税徴収

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7014 |
| **Slug** | `qst_rol_tithe` |
| **クエスト種別** | 聖王国クエスト（Roland） |
| **推奨レベル** | 4（Normal） |
| **難度** | 2 |
| **依頼主** | 教会 |
| **出現条件** | 制限なし / 出現拠点: loc_holy_empire |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 4） |
| **経過日数 (time_cost)** | 1（成功: 1日 / 失敗: 1日） |
| **ノード数** | 4ノード（うち選択肢2件） |
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
Gold:600
```

---

## 3. シナリオノードフロー

```
start → first_house → demand_payment
  ├─ [住民が払う] → second_house → demand_payment_2
  │    ├─ [払う] → collect_done → end_success
  │    └─ [抵抗] → battle_mob_2 → force_collect → end_success
  └─ [抵抗] → battle_mob_1 → force_collect → second_house
  各バトル敗北 → end_failure
```

#### `start`（text）
```
教会から内密の依頼。貧民街で税の取り立てをする。
正式な依頼書はない。後で何かあっても「知らない」と言われる類の仕事だ。
```

#### `first_house`（text）
```
最初の住居を訪ねると、痩せた老夫婦が出てきた。
「払えるものは何もない……」老人は布切れのような服を着ている。
```
- 選択肢: 「それでも払えと言う」→ `battle_mob_1` / 「引き下がる」→ `end_failure`

#### `battle_mob_1`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_mob` |
| 敵名 | 抵抗する貧民 |
| 備考 | ATK・HP低め。感情的に動く群衆型 |

```
params: type:battle, enemy_group_id:[要定義: enemy_mob が含まれるグループ], next:force_collect, fail:end_failure
```

#### `force_collect`（text）
```
抵抗を押さえ込んで、家にある数少ない金目のものを巻き上げた。
これが「仕事」だ。
```

#### `end_success`（end, result: success）
```
徴収完了。教会の担当司祭から報酬を受け取った。彼らの顔は見ないようにした。
```

#### `end_failure`（end, result: failure）
```
取り立てを完遂できなかった。教会から報酬は支払われない。
```

---

## 4. CSVエントリ

```csv
7014,qst_rol_tithe,強圧的な十分の一税徴収,2,2,1,loc_holy_empire,,,,-50,Gold:600|Evil:10,教会,[徴収] 貧民層から無理やり税を取り立てる任務。抵抗者は斬れ。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_holy_empire` のみ
- [ ] 受注条件 `max_reputation: -50` が機能する
- [ ] `enemy_mob` がDBに登録済み
- [ ] Evil +10 アライメント変動が適用される

---

## 6. 拡張メモ

- 「途中で依頼を断って住民側につく」道徳的分岐（Justice変動・失敗扱い）
- 高Evil値プレイヤー向けの上位報酬ルート（徴収額ボーナス）
