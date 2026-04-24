# クエスト仕様書：7024 — 闇市オークションの用心棒

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7024 |
| **Slug** | `qst_mar_auction` |
| **クエスト種別** | マルカンドクエスト（Markand） |
| **推奨レベル** | 5（Normal） |
| **難度** | 2 |
| **依頼主** | 闇市の元締め |
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
Gold:500
```

---

## 3. シナリオノードフロー

```
start → auction_begins → wave_01（battle）→ intermission → wave_02（battle）→ auction_ends → end_success
各バトル敗北 → end_failure
```

#### `start`（text）
```
闇市元締めの倉庫で指示を受けた。
オークションが始まるまで会場の外で待機する。
```

#### `auction_begins`（text）
```
夜が深まり、オークションが始まった。
「わかってると思うが——来た奴は全員返せ」と元締めが言った。
```

#### `wave_01`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_raider` |
| 敵名 | 乱入者（第1波） |

```
params: type:battle, enemy_group_id:[要定義: enemy_raider が含まれるグループ], next:intermission, fail:end_failure
```

#### `intermission`（text）
```
第1波を退けた。元締めが「まだ終わってない」とだけ言った。
会場の中ではオークションが続いている。
```

#### `wave_02`（battle）
```
params: type:battle, enemy_group_id:[要定義: enemy_raider が含まれるグループ], next:auction_ends, fail:end_failure
```
> 第2波は政府の密偵風の個体（`enemy_spy`など強化版）を想定。

#### `auction_ends`（text）
```
オークションが無事に終了した。
元締めが厚みのある封筒を差し出した。「仕事ができる奴だ、また頼む」
```

#### `end_success` / `end_failure`
（標準定義）

---

## 4. CSVエントリ

```csv
7024,qst_mar_auction,闇市オークションの用心棒,2,2,1,loc_marcund,,,,,Gold:500|Chaos:5,闇市の元締め,[防衛] 違法国宝が取引される闇の競売場で、乱入者を排除する。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_marcund` のみ
- [ ] `enemy_raider` がDBに登録済み
- [ ] 2波防衛フローが正しく動作する
- [ ] Chaos +5 アライメント変動が適用される

---

## 6. 拡張メモ

- 「密偵として闇市を裏切る」隠し選択肢（Quest失敗・Justice変動・別報酬）
- オークション品の競売結果がフレーバーとして反映されるシステム
