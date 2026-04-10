# クエスト仕様書：6103 — 天を衝く塔 ―華龍の秘宝と、神の遊戯―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | `[要定義: 6103 等]` |
| **Slug** | `scenario_03_karyu` |
| **クエスト種別** | スポットシナリオ |
| **推奨レベル** | 5 |
| **難度** | 5 |
| **依頼主** | - |
| **出現拠点** | 華龍（`loc_haryu`等） |
| **出現条件** | スポット専用: 発生条件未定義（[要定義]） |
| **サムネイル画像** | `/images/quests/bg_spot_karyu_tower.png` |

※BGM、SE、進行中の背景画像などはノードごとに指定します。

---

## 1. クエスト概要

### 短文説明
```
世界の中心「虚無の塔」。華龍の四方に座す四神を討ち、神の残酷な遊戯を終わらせよ。
```

### 長文説明
```
塔の頂上には願いを叶える楽園があるとされる。
しかし、神の結界により近づく事はできない。解くためには四神討伐が必要だ。
すべては、高みで退屈を貪る「神」が仕掛けた遊戯であった。
```

---

## 2. 報酬定義

| 種別 | 内容 |
|-----|-----|
| 道中報酬 | 四神の宝珠（パッシブスキル4種）`[要定義]` |
| ルートA報酬 | 名声 および 「神の法衣」 `[要定義]` |
| ルートB報酬 | 固有スキル『神殺しの光芒（デウス・エクス・マキナ）』 `[要定義]` |

---

## 3. シナリオノード構成

### 全体フロー
```text
start
  └─[続ける]→ choose_path
       ├─[青龍ルート]→ trap_seiryu → boss_seiryu → (戻る)
       ├─[白虎ルート]→ trap_byakko → boss_byakko → (戻る)
       ├─[朱雀ルート]→ trap_suzaku → boss_suzaku → (戻る)
       ├─[玄武ルート]→ trap_genbu  → boss_genbu  → (戻る)
       └─[結界を解く(条件: 宝珠4つ)]→ final_boss_kami
            ├─[勝利]→ final_choice
            │    ├─[神の座を継ぐ]→ end_rule
            │    └─[塔を破壊する]→ end_destroy
            └─[敗北]→ end_failure
```

### ノード詳細

#### `start`（type: text）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_quest_epic]`
- **背景画像**: `bg_spot_karyu_tower`

**テキスト:**
```
天から神の声明が降り注ぐ。
結界を破るため、四神の宝珠を集めてこいと。
```
**params:**
```
type:text, bgm_key:[要定義], bg_image:bg_spot_karyu_tower, next:choose_path
```

---

#### `choose_path`（type: text）
**テキスト:**
```
どの試練から挑むか。
```
**選択肢:**
| ラベル | 次ノード |
|--------|---------|
| 東の青龍 | `trap_seiryu` |
| 西の白虎 | `trap_byakko` |
| 南の朱雀 | `trap_suzaku` |
| 北の玄武 | `trap_genbu` |
| 中央の塔へ進む (要: 宝珠4つ) | `final_boss_kami` |

*(※条件分岐ノードの詳細な仕様（特定のアイテムを4つ持っているかで選択肢が変わる等）は `requirements` 等で制御想定)*

---

#### `trap_seiryu`（type: text）
**演出パラメータ:**
- **背景画像**: `bg_spot_karyu_tower`

**テキスト:**
```
落雷の洗礼！ HPが減少した状態で戦闘が始まる。
```
**params:**
```
type:text, bg_image:bg_spot_karyu_tower, hp_damage:[要定義: 例 20], next:boss_seiryu
```

#### `boss_seiryu`（type: battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_boss]`

| 設定 | 値 |
|-----|-----|
| 敵グループ | `[要定義: 青龍 (例: enemy_group_id: boss_seiryu)]` |

**params:**
```
type:battle, bgm_key:[要定義], enemy_group_id:[要定義], next:choose_path, fail:end_failure
```
*(※中略: 他の四神討伐ノード群も同様)*

---

#### `final_boss_kami`（type: battle）
**演出パラメータ:**
- **BGM**: `[要定義: 例 bgm_battle_boss_final]`
- **背景画像**: `bg_spot_karyu_tower`

**テキスト:**
```
塔の最上階。
すべての理を操る「神」自身が牙をむいた。
```
| 設定 | 値 |
|-----|-----|
| 敵グループ | `[要定義: 神 (例: enemy_group_id: boss_kami)]` |

**params:**
```
type:battle, bgm_key:[要定義], enemy_group_id:[要定義], next:final_choice, fail:end_failure
```

---

#### `final_choice`（type: text）
**テキスト:**
```
神は倒れ、力を失いゆく。
消えゆく神が「最後の問い」を投げかける。
```
**選択肢:**
| ラベル | 次ノード |
|--------|---------|
| 神の代理人として統べる | `end_rule` |
| 神の理を破壊し自由を掴む | `end_destroy` |

---

#### `end_rule`（type: end）
**テキスト:**
```
神の座を引き継ぎ、新たな絶対者となった。
秩序は守られるが、人々は再び意思を奪われた。神の法衣を手に入れた。
```
**params:**
```
type:end, result:success, reputation_change:[要定義], item:[要定義: 神の法衣]
```

---

#### `end_destroy`（type: end）
**テキスト:**
```
神の力を拒否し、塔を破壊した。天界と地上の繋がりは完全に断たれた。
人の時代が幕を開ける。固有スキル『神殺しの光芒』を手に入れた！
```
**params:**
```
type:end, result:success, item:[要定義: デウス・エクス・マキナ]
```
