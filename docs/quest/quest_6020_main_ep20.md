# クエスト仕様書：6020 — 第20話「蒼暁の剣」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6020 |
| **Slug** | `main_ep20` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 20 |
| **特記** | 最終決戦。ボス: 全能神ゼウス。check_item分岐（遺産3種で難度変動） |

---

## 2. 報酬定義
```
Exp:1000|Gold:15000|Rep:50|Order:5|Items:504
```

---

## 3. シナリオノード構成（48ノード）

### 全体フロー
```text
start〜start_02 → regalia_01〜regalia_02
  → ruins_01〜ruins_02 → entrance_01 → descent_01〜descent_02
  → chamber_01〜chamber_02 → stele_01〜stele_02
  → touch_01〜touch_03（ガウェインの記憶）
  → comrade_01〜comrade_02 → zeus_01〜zeus_03
  → zeus_voice_01〜zeus_challenge_02(speaker:全能神ゼウス)
  → check_items
    ├─[遺産あり] relics_glow → relics_02 → battle_weak(9053)
    └─[遺産なし] relics_missing → relics_missing_02 → battle_strong(9054)
  → zeus_defeat〜zeus_defeat_02(speaker:全能神ゼウス)
  → dawn_01〜dawn_03 → epilogue_01〜epilogue_02 → end_node
```

### ノード詳細（主要ノード）

#### 遺跡到着（start〜descent_02）— 背景: `bg_ruins_field` → `bg_catacombs`
レガリア郊外の古代遺跡。壁画に二人の人間が背中を合わせて戦う姿。

#### 最後の石碑（chamber_01〜touch_03）— 背景: `bg_boss_altar` → `bg_memory_gawain`
記憶の中でガウェインの若き日の姿と再会。英霊と共に戦った騎士。

#### ゼウス降臨（zeus_01〜zeus_challenge_02）— speaker: `全能神ゼウス` / BGM: `bgm_spot_final_boss`
白い髭。雷光。「英霊を超える力があるか——この場で証明せよ！」

#### check_items（type: check_item）
- **判定**: items [505, 506, 507]（護符・剣・鎧）
- **成功** → `relics_glow`: 三つの遺産が共鳴し光の鎧に。battle_weak(enemy_group_id: `9053`)
- **失敗** → `relics_missing`: 加護不完全。battle_strong(enemy_group_id: `9054`)

#### ゼウス撃破（zeus_defeat〜zeus_defeat_02）— speaker: `全能神ゼウス`
「馬鹿な。なぜ人間は神を超えようとする？」

#### 蒼暁の剣（dawn_01〜dawn_03）— 背景: `bg_boss_altar`
石碑が砕け光の粒が凝縮し一振りの蒼い剣となった。人間の意志の結晶。

#### `end_node`（type: end_success）
全能神を打ち破り蒼暁の剣を手にした。世界は自由だ。
- **rewards**: items: [504]

#### `end_failure`（type: end_failure）— 背景: `bg_memory_gawain`
ゼウスの雷に打たれた。「まだ足りぬか、人間よ」
