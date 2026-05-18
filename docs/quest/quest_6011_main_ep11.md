# クエスト仕様書：6011 — 第11話「天使侵攻」

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6011 |
| **Slug** | `main_ep11` |
| **クエスト種別** | メインエピソード（Main） |
| **推奨レベル** | 11 |
| **ゲストNPC** | なし（エピソード内でヴォルグと出会うが加入は次話） |
| **特記** | 連続3戦（上位使徒×2 + ヴォルグ試練） |

---

## 2. 報酬定義
```
Exp:300|Gold:1200|Rep:15|Order:5
```

---

## 3. シナリオノード構成（52ノード）

### 全体フロー
```text
start〜karyu_02（華龍到着）
  → sky_01〜sky_03（天変異常）→ villagers_01〜villagers_02
  → voice_01〜voice_02（天の声）→ angels_01〜angels_03（使徒降臨）
  → slaughter_01〜stand_02 → battle1(210) → post_battle〜post_02
  → wave_01〜wave_02 → battle2(210) → retreat_01〜retreat_02
  → volg_01〜volg_07（ヴォルグ登場）→ battle3(213)
  → close_01〜approve_02 → decision_01〜decision_02
  → depart_01〜depart_02 → end_node
```

### ノード詳細（主要ノード）

#### 華龍到着（start〜karyu_02）— 背景: `bg_road_day`
第2部の真実を知り華龍神朝へ。豊かな穀倉地帯。

#### 天変異常（sky_01〜villagers_02）— BGM: `bgm_quest_crisis`
太陽が三つ。空が黄金色に。村人が恐怖に膝をつく。

#### 使徒降臨（voice_01〜angels_03）— 背景: `bg_ruins_field`
「地上の穢れを焼却せよ」上位使徒の群れが降下。

#### 戦闘1・2（battle1, battle2）— enemy_group_id: `210`
上位使徒との連続戦。退路を確保し村を脱出。

#### ヴォルグ登場（volg_01〜volg_07）— 背景: `bg_bandit_camp`
使徒の残骸7体。「不死の傭兵王」ヴォルグが試練を課す。

#### 戦闘3（battle3）— enemy_group_id: `213` / BGM: `bgm_battle_strong`
ヴォルグとの戦闘。

#### 承認〜出発（approve_01〜end_node）
「しばらく付き合ってやる」マルカンド首都イスハークへ急ぐ。（第3部開始）

#### `end_failure`（type: end_failure）— 背景: `bg_ruins_field`
力尽きた。何も守れなかった。
