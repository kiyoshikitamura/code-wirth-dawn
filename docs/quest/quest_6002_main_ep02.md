# クエスト仕様書：6002 — 第2話「砂塵の陰謀」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6002 |
| **Slug** | `main_ep02` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 2 |
| **依頼主** | 王国軍 |
| **ゲストNPC** | ガウェイン（guest_join → leave） |
| **サムネイル画像** | `/images/quests/bg_road_day.png` |

---

## 1. クエスト概要

### 短文説明
```
国境警備任務。正体不明の武装集団との遭遇。
```

---

## 2. 報酬定義
```
Exp:100|Gold:200|Rep:5|Order:5
```

---

## 3. シナリオノード構成（37ノード）

### 全体フロー
```text
start → start_02 → gawain_join → patrol_01 → patrol_02
  → suspicion_01 → suspicion_02 → suspicion_03 → hunch_01
  → choice1
    ├─「隣国マルカンドの兵士では？」→ reply_01
    └─「誰であろうと、斬るだけです」→ reply_01
  → reply_01 → reply_02 → reply_03
  → approach_01 → approach_02 → formation_01 → formation_02
  → enemy_01 → enemy_02 → battle → choice2「迎撃する」→ post_01
  → post_02 → dying_01 → dying_02 → corpse_01 → corpse_02
  → silent_01 → silent_02 → report_01 → farewell_01
  → gawain_leave → end_01 → end_node
```

### ノード詳細

#### `start`（type: text）— BGM: `bgm_quest_calm` / 背景: `bg_road_day`
「野盗撃退の働きが認められ、ガウェインの推薦で国境警備任務に配属された。」

#### `start_02`（type: text）— 背景: `bg_road_day`
「配属先はローランドとマルカンドの国境地帯。赤茶けた荒野が地平線まで続く。」

#### `gawain_join`（type: guest_join）— guest_id: `npc_guest_gawain`

#### `patrol_01`〜`patrol_02`（type: text）— 背景: `bg_road_day`
国境の荒野を並んで歩く。兵士たちの間に緊張感が漂う。

#### `suspicion_01`〜`suspicion_03`（type: text）— speaker: `ガウェイン`
武装集団の統率と正規軍官給品の武器について語る。

#### `hunch_01`（type: text）— speaker: `ガウェイン`
「嫌な予感がする。二十年の勘がな」

#### `choice1`（選択肢）→ いずれも `reply_01` へ

#### `reply_01`〜`reply_03`（type: text）— speaker: `ガウェイン`
マルカンド側の警戒、あるいは自国側の関与への疑念。

#### `approach_01`〜`approach_02`（type: text）— BGM: `bgm_quest_tense`
黒い布で顔を覆った武装集団が半包囲陣形で接近。

#### `formation_01`〜`formation_02`（type: text）— speaker: `ガウェイン`
陣形を崩すなと指示。

#### `enemy_01`〜`enemy_02`（type: text）
黒布の男が「全員殺せ」と命令。

#### `battle`（type: battle）— enemy_group_id: `202` / BGM: `bgm_battle`

#### `post_01`〜`post_02`（type: text）— BGM: `bgm_quest_tense`
攻撃を辛くも凌ぐ。黒布の下の顔は若い。

#### `dying_01`〜`dying_02`（type: text）
「命令に従わなければ家族が殺される。選択肢がなかった」

#### `corpse_01`〜`corpse_02`（type: text）
死体の武器に削り潰された正規軍紋章の痕跡。

#### `silent_01`〜`silent_02`（type: text）
ガウェインが紋章の跡をなぞり、武器を投げ捨てた。

#### `report_01`（type: text）— speaker: `ガウェイン`
「泥沼の戦乱を予感させる不穏な空気だ。俺は本隊に報告する」

#### `farewell_01`（type: text）— speaker: `ガウェイン`
「また別の任務で会うだろう。死ぬなよ」

#### `gawain_leave`（type: leave）— guest_id: `npc_guest_gawain`

#### `end_01`〜`end_node`（type: end_success）— 背景: `bg_road_day`
「家族が殺される」——この戦いは誰のためのものなのか。
