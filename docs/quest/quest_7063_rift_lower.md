# クエスト仕様書：7063 — 狭間の迷宮・下層

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 7063 |
| **Slug** | `qst_rift_lower` |
| **クエスト種別** | 特別クエスト（Special） |
| **推奨レベル** | 14（Hard） |
| **難度** | 5 |
| **依頼主** | 冒険者ギルド |
| **出現条件** | 「中層」クリア |
| **リピート** | 可能 |
| **経過日数 (time_cost)** | 10 |
| **ノード数** | 65ノード（ランダムバトル 10〜15回、キャンプ 2回、アライメント分岐中ボス戦 1回、最深部ボス戦 1回） |
| **ゲストNPC** | なし |
| **難易度Tier** | Hard |
| **サムネイル画像** | /images/quests/bg_rift_maze.png |

---

## 1. クエスト概要

### 短文説明
```
[探索] 迷宮下層（B8F〜B10F）の属性分岐門を突破し、邪悪な魔導士ヴァルグナを討て。
```

### 長文説明
```
「狭間の迷宮」下層階、地下8階から地下10階の最終決戦が迫る。
下層の地下9階には、侵入者の精神属性を試す「アライメントゲート」が設置されている。
プレイヤーの属性に応じて「秩序・正義の門」または「混沌・悪の門」が開き、それぞれの門の先で強力な中ボスが待ち受ける。
アライメント中ボスを撃破した先には、迷宮の創設者であり、悪魔の召喚ゲートを開こうとする邪悪な大魔導士「ヴァルグナ」が待ち構えている。
彼を討ち果たし、魔界への扉を閉ざす鍵「光の宝珠」を回収せよ。
```

---

## 2. 報酬定義

```
Gold:2000|Rep:12
```
※クリア時の宝箱から、下層の新規アイテムが確率で獲得可能。
※アライメント分岐のルートクリア報酬として、「大魔道士の思念」または「闇 of 宝珠」を獲得。

---

## 3. シナリオノードフロー

```text
start_prep → start → maze_b8_start 
  → [B8F探索] B8F_battle_01 → B8F_treasure_01 → B8F_battle_02
  → camp_01 (地下8階キャンプ)
  → [B9F アライメント分岐] gate_check
       ├── 秩序・正義ルート (order_pts >= 50% && justice_pts >= 50%) ──→ order_gate → mid_boss_acheron
       │                                                                  ├─ win → mid_treasure_acheron (大魔道士の思念 獲得) ──→ b9_end
       │                                                                  └─ lose → end_failure
       ├── 混沌・悪ルート (chaos_pts >= 50% && evil_pts >= 50%) ──────→ chaos_gate → mid_boss_gereger
       │                                                                  ├─ win → mid_treasure_gereger (闇の宝珠 獲得) ────────→ b9_end
       │                                                                  └─ lose → end_failure
       └── 通常ニュートラルルート (上記条件のいずれも満たさない場合) ──→ neutral_route → mid_battle_neutral → b9_end
  → camp_02 (地下9階キャンプ)
  → [B10F最深部] boss_gate → boss_battle (魔導士ヴァルグナ)
    ├─ win → boss_treasure (光の宝珠 確定獲得) → exit_gate → end_success
    └─ lose → end_failure
```
※各バトルノードの勝利先は、必ず直後の宝箱ノード（`type: 'treasure'`）に遷移する。

---

## 4. ノード詳細（抜粋・主要ギミック）

#### `gate_check`（event / conditional branch）
**演出:** bg: bg_rift_maze
**処理:**
*   アライメント割合を判定。
*   `order_pts` 割合 >= 50% かつ `justice_pts` 割合 >= 50% の場合、`order_gate` へ遷移。
*   `chaos_pts` 割合 >= 50% かつ `evil_pts` 割合 >= 50% の場合、`chaos_gate` へ遷移。
*   それ以外の場合、`neutral_route` へ遷移。

#### `order_gate` (text)
**演出:** bg: bg_rift_maze, layer: layer_rift_gate_order
```text
目の前に、まばゆい黄金の光を放つ神聖な門が立ち塞がっている。私たちの正義と秩序の意思に呼応するように、重い石の扉がゆっくりと開いていく。
```

#### `chaos_gate` (text)
**演出:** bg: bg_rift_maze, layer: layer_rift_gate_chaos
```text
目の前に、妖しい黒紫色の魔力が渦巻く不気味な悪魔の門が立ち塞がっている。私たちの内に眠る混沌と悪の意思に呼応するように、門が脈打ち、開き始めた。
```

#### `mid_boss_acheron` (battle)
**演出:** bg: bg_rift_maze
**敵編成:** **【新規】光なき思念 アケロン (Lv.14)**
*   **win:** `mid_treasure_acheron` へ遷移。
*   **lose:** `end_failure` へ遷移。

#### `mid_treasure_acheron` (treasure)
**演出:** bg: bg_rift_maze, layer: layer_rift_chest
*   **処理:** 特殊アクセサリー **「330: 大魔道士の思念」** を確定で獲得。

#### `mid_boss_gereger` (battle)
**演出:** bg: bg_rift_maze
**敵編成:** **【新規】生贄の番人 ゲレゲール (Lv.14)** ＆ **【既存】レイス (Lv.10) × 2**
*   **win:** `mid_treasure_gereger` へ遷移。
*   **lose:** `end_failure` へ遷移。

#### `mid_treasure_gereger` (treasure)
**演出:** bg: bg_rift_maze, layer: layer_rift_chest
*   **処理:** 特殊アクセサリー **「329: 闇の宝珠」** を確定で獲得。

#### `boss_battle` (battle)
**演出:** bg: bg_rift_maze
**敵編成:** **【新規】魔導士ヴァルグナ (Lv.15)** ＆ **【新規】デーモンソルジャー (Lv.12) × 2**
*   **win:** `boss_treasure` へ遷移。
*   **lose:** `end_failure` へ遷移。

#### `boss_treasure` (treasure)
**演出:** bg: bg_rift_maze, layer: layer_rift_chest
*   **処理:** 特殊アクセサリー **「328: 光の宝珠」** を確定で獲得。

---

## 5. 新規生成する背景画像アセット定義

*   **`layer_rift_gate_order.png`**:
     アライメントゲート「秩序・正義」のオーバーレイ画像。黄金の光の粒子が周囲を漂う、彫刻が施された大理石の神聖な門。
*   **`layer_rift_gate_chaos.png`**:
     アライメントゲート「混沌・悪」のオーバーレイ画像。黒紫色の不気味な魔力の霧が立ち上る、悪魔の角と顔が装飾された黒い鉄の門。
