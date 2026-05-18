# クエスト仕様書：6104 — 砂塵の王墓 ―三千年の忘却―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6104 |
| **Slug** | `qst_spot_markand` |
| **クエスト種別** | スポットシナリオ（Special） |
| **推奨レベル** | 20（Hard） |
| **難度** | 5 |
| **依頼主** | 語り部の老人 |
| **出現条件** | メインep10クリア / マルカンド拠点滞在 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **難易度Tier** | Hard（rec_level: 20） |
| **経過日数 (time_cost)** | 7（成功: 7日 / 失敗: 5日） |
| **ノード数** | 66ノード |
| **サムネイル画像** | `/images/quests/bg_spot_markand_ruins.png` |

> [!IMPORTANT]
> **謎解きループ仕様**: 鏡の間（第1の間）、秤の間（第2の間）、棺の間（第3の間）の3つの謎解きがある。間違えるとバトル発生＆第1の間に戻される。正解すれば次の間へ進む。

---

## 1. クエスト概要

### 短文説明
```
「砂の病」の原因を探り、三千年前の無名王が眠る王墓の最深部へ挑め。
```

### 長文説明
```
マルカンドで原因不明の「砂の病」が蔓延している。
語り部の老人によれば、三千年前の王——名すら忘れられた「無名王」が
自分を忘れるなという呪いをかけたという。
王墓に挑み、呪いの核を破壊するか、力を受け継ぐか、選択を迫られる。
```

---

## 2. 報酬定義

**ルートA（呪い破壊ルート）:**
```
Exp:500|Gold:10000|Rep:200|Item:632
```

**ルートB（呪い制御ルート）:**
```
Exp:500|Rep:-100|Item:631|Align:混沌+100
```

### 報酬アイテム詳細

| ID | Slug | 名前 | Type | 効果 | 入手 |
|---|---|---|---|---|---|
| 631 | `spot_sand_curse` | 砂塵の支配 | skill(card) | dmg30+DEF DOWN(3T), deck_cost:4 | ルートB |
| 632 | `spot_sand_blade` | 砂王の断罪刃 | equipment/weapon | ATK+12, HP+30 | ルートA |

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 5日 |

---

## 3. シナリオノードフロー

```text
start → start_02~09
 └─ trap_01（鏡の間入口）→ trap_01_2~04 → trap_01_q（選択）
      ├─ 謙譲（正解）→ trap_02（秤の間）→ trap_02_2~04 → trap_02_q（選択）
      │    ├─ 沈黙（正解）→ trap_03（棺の間）→ trap_03_2~03 → trap_03_q（選択）
      │    │    ├─ 忘却（正解）→ text_king → text_king_2~8 → boss_king
      │    │    │    ├─ win → fc_01~07 → choice_final
      │    │    │    │    ├─ 破壊 → end_break_01~end_break
      │    │    │    │    └─ 制御 → end_curse_01~end_curse
      │    │    │    └─ lose → end_failure~fin
      │    │    └─ 不正解 → battle_trap_03 → punish_03~02 → trap_01（ループ）
      │    └─ 不正解 → battle_trap_02 → punish_02~02 → trap_01（ループ）
      └─ 不正解 → battle_trap_01 → punish_01~02 → trap_01（ループ）
```

### ノード詳細

#### `start`～`start_09`（text）
**演出:** bg: bg_spot_markand_ruins, bgm: bgm_markand
- speaker: 語り部の老人（05-09）
砂の病の説明、王墓への道案内。

#### 第1の間: `trap_01`～`trap_01_q`（choice）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_quest_mystery
- 4体の石像から選択。正解は「目を伏せた像（謙譲）」→ trap_02
- 不正解 → battle_trap_01（enemy_group_id: 330）→ 第1の間に戻される

#### 第2の間: `trap_02`～`trap_02_q`（choice）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_quest_mystery
- 4つの箱から選択。正解は「空の箱（沈黙）」→ trap_03
- 不正解 → battle_trap_02（enemy_group_id: 331）→ 第1の間に戻される

#### 第3の間: `trap_03`～`trap_03_q`（choice）
**演出:** bg: bg_spot_markand_mirror, bgm: bgm_quest_mystery
- 4つの言葉から選択。正解は「忘却（真実）」→ text_king
- 不正解 → battle_trap_03（enemy_group_id: 332）→ 第1の間に戻される

#### `text_king`～`text_king_8`（text）→ `boss_king`（battle）
**演出:** bg: bg_spot_markand_king, bgm: bgm_spot_final_boss → bgm_battle_boss
- speaker: 無名王（04, 05, 07, 08）
**パラメータ:** enemy_group_id: 333, fail: end_failure

#### `fc_01`～`fc_07`（text）→ `choice_final`（choice）
**演出:** bgm: bgm_spot_final_choice, speaker: 無名王（03, 05, 06, 07）
- 選択肢: 「心臓を破壊し呪いを断つ」→ `end_break_01` / 「心臓を宿し呪いを制御する」→ `end_curse_01`

#### `end_break_01`～`end_break`（end_success）
**演出:** bg_spot_markand_ruins（後半）, speaker: 語り部の老人（04, 05）
**rewards:** Exp:500, Gold:10000, Rep:200, Item:632

#### `end_curse_01`～`end_curse`（end_success）
**演出:** speaker: 無名王（04）, 語り部の老人（07）
**rewards:** Exp:500, Rep:-100, Item:631, Chaos:100

#### `end_failure`～`end_failure_fin`（end_failure）
**演出:** bg: bg_spot_markand_king, speaker: 無名王（02）

---

## 4. 新規エネミー・アイテム定義参照

既存エネミー・アイテムを使用。追加なし。

---

## 5. CSVエントリ

`quests_special.csv`
```csv
6104,qst_spot_markand,砂塵の王墓 ―三千年の忘却―,20,5,7,loc_markand,,,,,Exp:500|Gold:10000|Rep:200|Item:632,語り部の老人,「砂の病」の原因を探り三千年前の無名王が眠る王墓の最深部へ挑め。
```

---

## 6. 実装チェックリスト

- [x] テキスト分割（30-35文字/ノード）適用
- [x] speaker_name 全ノードに適用
- [x] ノード数: 66ノード
- [x] 全バトルにwin/loseの両方のCHOICE行あり
- [x] 謎解きループ構造（不正解→第1の間に戻る）維持
- [ ] enemy_group_id 330-333 がDBに登録済み
- [ ] 報酬アイテム 631-632 がDBに登録済み
