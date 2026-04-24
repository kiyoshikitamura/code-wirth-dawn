# クエスト仕様書：7005 — 冬ごもりの凶熊狩り

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7005 |
| **Slug** | `qst_gen_bear` |
| **クエスト種別** | 討伐（Hunt） |
| **推奨レベル** | 2（Easy） |
| **難度** | 2 |
| **依頼主** | 開拓村の長 |
| **出現条件** | 制限なし / 出現拠点: 全拠点 |
| **リピート** | リピート可能 |
| **難易度Tier** | Easy（rec_level: 2） |
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
Gold:250|Item:3001
```

---

## 3. シナリオノードフロー

```
start → enter_forest → find_bear → battle_bear
  ├─ 勝利 → collect_pelt → end_success
  └─ 敗北 → end_failure
```

#### `start`（text）
```
開拓村の村長から依頼。山から下りてきた凶熊を狩る仕事だ。
前に挑んだ猟師が行方不明になっている。気を引き締めて向かう。
```

#### `enter_forest`（text）
```
凍えた山道を登る。獣の足跡が雪に深く刻まれていた。
大きい。相当な体格の個体だ。
```

#### `find_bear`（text）
```
沢のほとりで、巨大な熊と目が合った。
毛並みは荒れ、目は充血している——本当に腹が減っているんだな。
```
- 選択肢: 「戦う」→ `battle_bear`

#### `battle_bear`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_bear` |
| 敵名 | 凶熊 |
| 備考 | HP高め・ATK高め。1体のボス型戦闘 |

```
params: type:battle, enemy_group_id:[要定義: enemy_bear が含まれるグループ], next:collect_pelt, fail:end_failure
```

#### `collect_pelt`（reward）
```
熊を仕留めた。手際よく毛皮を剥ぐ。しっかりした質だ、高く売れそうだ。
params: type:reward, item_id:3001, quantity:1, next:end_success
```

#### `end_success`（end, result: success）
```
討伐完了。村長からの報酬と、毛皮を受け取った。
```

#### `end_failure`（end, result: failure）
```
熊の力に圧倒され、退散した。村はまだ脅威にさらされている。
```

---

## 4. CSVエントリ

```csv
7005,qst_gen_bear,冬ごもりの凶熊狩り,2,2,1,all,,,,,Gold:250|Item:3001,開拓村の長,[討伐] 開拓村の脅威となっている大型の熊を狩る。
```

---

## 5. 実装チェックリスト

- [ ] `enemy_bear` がDBに登録済み（HP・ATK高め想定）
- [ ] `items` テーブル ID=3001 が「獣の毛皮」として登録済み
- [ ] `reward` ノードでアイテムが正しく付与される
- [ ] Gold + Item 複合報酬が正しく処理される

---

## 6. 拡張メモ

- 「熊を殺さず追い払う」選択肢（Combat回避ルート / Justice変動）
