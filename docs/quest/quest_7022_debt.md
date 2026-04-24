# クエスト仕様書：7022 — 逃亡奴隷の連れ戻し

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7022 |
| **Slug** | `qst_mar_debt` |
| **クエスト種別** | マルカンドクエスト（Markand） |
| **推奨レベル** | 5（Normal） |
| **難度** | 2 |
| **依頼主** | 奴隷商 |
| **出現条件** | 制限なし / 出現拠点: loc_marcund |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 5） |
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
Gold:450
```

---

## 3. シナリオノードフロー

```
start → locate_colony → confront_fugitive
  ├─ [逃亡者を「説得」する] → battle_guards → capture → end_success
  └─ [強引に連れ帰る] → battle_guards → capture → end_success
  各バトル敗北 → end_failure
```

> **設計メモ:** 選択肢の文言は違うが、いずれも同じ `battle_guards` → `capture` へ合流する。道徳的選択の演出だが、機能的には同一フロー。

#### `start`（text）
```
奴隷商の依頼。逃亡奴隷を追跡する仕事だ。
砂漠の端にある無法者集落へ向かう。
気が重い——が、金は金だ。
```

#### `locate_colony`（text）
```
集落に近づくと、見張りの男が槍を構えた。
「お前は奴隷商の犬か。アイツには渡さないぞ」
```

#### `confront_fugitive`（text）
```
奥の小屋から若い男が顔を出した。怯えているが、目に覚悟がある。
どう動くか——お前次第だ。
```
- 選択肢:「説得する（強がっても無駄だ）」→ `battle_guards`
- 選択肢:「黙って連れ帰る（余計な話は不要だ）」→ `battle_guards`

#### `battle_guards`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_fugitive_guard` |
| 敵名 | 逃亡者の仲間（無法者） |

```
params: type:battle, enemy_group_id:[要定義: enemy_fugitive_guard が含まれるグループ], next:capture, fail:end_failure
```

#### `capture`（text）
```
仲間を制圧した。男は抵抗をやめ、うなだれた。
「……負けだ」
これが依頼の完遂だ。
```

#### `end_success`（end, result: success）
```
逃亡奴隷を奴隷商に引き渡した。報酬を受け取った。
男の目が何を語っていたか——考えるのはやめた。
```

#### `end_failure`（end, result: failure）
```
無法者集落の守りに阻まれた。逃亡奴隷は今も砂漠のどこかにいる。
```

---

## 4. CSVエントリ

```csv
7022,qst_mar_debt,逃亡奴隷の連れ戻し,2,2,1,loc_marcund,,,,-50,Gold:450|Evil:5,奴隷商,[捕縛] 借金を踏み倒して逃げた元奴隷を、生死問わず連れ戻す。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_marcund` のみ
- [ ] 受注条件 `max_reputation: -50` が機能する
- [ ] `enemy_fugitive_guard` がDBに登録済み
- [ ] Evil +5 アライメント変動が適用される

---

## 6. 拡張メモ

- 「逃亡奴隷を見逃す」隠し選択肢（Justice変動・失敗扱い・フレーバー会話あり）
- 逃亡奴隷が後続ストーリーで再登場する伏線要素
