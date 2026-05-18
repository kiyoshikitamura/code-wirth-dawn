# クエスト仕様書：6010 — 第10話「神の遊戯」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6010 |
| **Slug** | `main_ep10` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 10 |
| **特記** | 第2部完結。ボス: 神代の守護竜 |

---

## 2. 報酬定義
```
Exp:300|Gold:600|Rep:20|Order:5|Items:502
```

---

## 3. シナリオノード構成（33ノード）

### 全体フロー
```text
start → start_02 → start_03 → interior_01 → interior_02
  → vision_01 → vision_02 → vision_03 → vision_04
  → voice_01 → voice_02 → voice_03
  → real_01 → real_02 → real_03 → real_04
  → rage_01 → rage_02 → rage_03
  → dragon_01 → dragon_02 → dragon_03
  → battle(209) → choice1 → after_01 → after_02
  → end_01 → end_02 → end_node
```

### ノード詳細

#### `start`〜`start_03`— BGM: `bgm_quest_crisis` / 背景: `bg_boss_altar`
禁域の古代神殿。全てを裏で操る「何か」の痕跡を追う。

#### `interior_01`〜`vision_04`— 背景: `bg_boss_altar`
祭壇の水晶に映る世界：炎上するマルカンド、血に染まるローランド、農民の死。

#### `voice_01`〜`voice_03`
祭壇の声「地上の穢れ規定量に達す。第3フェーズ——大浄化へ移行」

#### `real_01`〜`real_04`
全ては天上の神々が仕組んだ「間引き」。ガウェインの「大義」は脚本だった。

#### `rage_01`〜`rage_03`
剣を抜き祭壇に向かって突きつけた。

#### `dragon_01`〜`dragon_03`
「神代の守護竜、顕現せよ」空間が裂け純白の巨竜が現れた。

#### `battle`（type: battle）— enemy_group_id: `209` / BGM: `bgm_battle_boss`

#### `end_node`（type: end_success）
答えを求めて西へ、華龍神朝を目指す。（第2部完）
- **rewards**: items: [502]
