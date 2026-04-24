# クエスト仕様書：7030 — 古道にはびこる妖討伐

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7030 |
| **Slug** | `qst_yat_yokai` |
| **クエスト種別** | 矢渡クエスト（Yato） |
| **推奨レベル** | 6（Normal） |
| **難度** | 2 |
| **依頼主** | 自警団 |
| **出現条件** | 制限なし / 出現拠点: loc_yatoshin |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 6） |
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
Gold:300
```

---

## 3. シナリオノードフロー

```
start → patrol_road → encounter_yokai_01 → battle_yokai_01
  ├─ 勝利 → deeper_night → encounter_yokai_02 → battle_yokai_02
  │    ├─ 勝利 → road_cleared → end_success
  │    └─ 敗北 → end_failure
  └─ 敗北 → end_failure
```

#### `start`（text）
```
自警団から護符の束を受け取った。
月の出ない夜に、古道を一人歩く——これが囮の作戦だ。
```

#### `patrol_road`（text）
```
提灯一つで暗い道を歩く。風が止んだとき、
空気が変わった。何かがいる。
```

#### `encounter_yokai_01`（text）
```
道の脇から、大きな唐傘がひょっこりと現れた。
一つ目で、にやりと笑っている——からかさ小僧だ。
```

#### `battle_yokai_01`（battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_normal]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `enemy_yokai` |
| 敵名 | からかさ小僧 |
| 備考 | 素早い・回避率高め・HP低め |

```
params: type:battle, enemy_group_id:[要定義: enemy_yokai が含まれるグループ], next:deeper_night, fail:end_failure
```

#### `deeper_night`（text）
```
からかさ小僧を退けたが、道はまだ続く。
道の奥から、地鳴りのような足音が聞こえてきた。
```

#### `encounter_yokai_02`（text）
```
巨大な赤い影が現れた。棍棒を持った赤鬼だ。
「人間！ 美味そうだな！」
```

#### `battle_yokai_02`（battle）
```
params: type:battle, enemy_group_id:[要定義: enemy_yokai が含まれるグループ], next:road_cleared, fail:end_failure
```
> 第2戦は `enemy_yokai_oni`（赤鬼）として、HP高め・ATK高めの強化版を使用。

#### `road_cleared`（text）
```
赤鬼を退けると、古道の空気が一変した。
静かで、清潔な夜の風が通り抜ける。怪異は去った。
```

#### `end_success` / `end_failure`
（標準定義）

---

## 4. CSVエントリ

```csv
7030,qst_yat_yokai,古道にはびこる妖討伐,2,2,1,loc_yatoshin,,,,,Gold:300,自警団,[討伐] 夜の街道筋に現れる怪異（からかさ小僧や赤鬼）を退治する。
```

---

## 5. 実装チェックリスト

- [ ] 出現拠点 `loc_yatoshin` のみ
- [ ] `enemy_yokai`（からかさ小僧）がDBに登録済み
- [ ] `enemy_yokai_oni`（赤鬼）がDBに登録済み（強化版）
- [ ] 2連戦フローが正しく動作する

---

## 6. 拡張メモ

- 夜刀神国の妖怪百種を順次実装するシリーズ化（7030は第1弾）
- 護符を使ったバトル特殊演出（将来実装）
