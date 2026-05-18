# クエスト仕様書：6102 — 冥食の残滓 ―常闇に消ゆ、宿命の贄―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6102 |
| **Slug** | `qst_spot_yato` |
| **クエスト種別** | スポットシナリオ / 護衛（Special） |
| **推奨レベル** | 20（Hard） |
| **難度** | 5 |
| **依頼主** | 隠れ里の長老 |
| **出現条件** | メインep09クリア / 夜刀拠点滞在 / 正義(Justice)50%以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **難易度Tier** | Hard（rec_level: 20） |
| **経過日数 (time_cost)** | 7（成功: 7日 / 失敗: 5日） |
| **ゲストNPC** | 撫子（護衛対象としてパーティ加入 / クエスト終了後に離脱） |
| **護衛失敗条件** | 撫子のHPがバトル中に0になった場合、クエスト失敗（`end_failure`）に遷移 |
| **ノード数** | 67ノード |
| **サムネイル画像** | `/images/quests/bg_spot_yato_eclipse.png` |

> [!IMPORTANT]
> **護衛ミッション仕様**: `join_nadeshiko` ノードの `is_escort_target: true` により護衛モードが有効化される。

---

## 1. クエスト概要

### 短文説明
```
100年に一度の『冥食』。宿命の子「撫子」を護衛し、冥の門の最深部を目指せ。
```

### 長文説明
```
昼夜が逆転し、空が赤黒く染まる「冥食」が始まった。
夜刀の国では、異界の口「冥の門」を封じるため、宿命の子を贄として捧げる儀式が行われる。
隠れ里で育てられた少女「撫子」と共に、彼女を守り抜きながら門の最深部へ向かえ。
四大妖怪の試練が待ち受けている。
```

---

## 2. 報酬定義

**ルートA（儀式完遂ルート）:**
```
Exp:500|Gold:10000|Rep:200|Item:615
```

**ルートB（撫子救出ルート）:**
```
Exp:500|Rep:-100|Skill:616|Align:正義+100
```

### 報酬アイテム詳細

| ID | Slug | 名前 | Type | 効果 | 入手 |
|---|---|---|---|---|---|
| 611 | `spot_magatama_1` | 朱の勾玉 | passive | HP+3 | 道中(boss_wani勝利後) |
| 612 | `spot_magatama_2` | 蒼の勾玉 | passive | DEF+2 | 道中(boss_tori勝利後) |
| 613 | `spot_magatama_3` | 翠の勾玉 | passive | ATK+2 | 道中(boss_kuruma勝利後) |
| 614 | `spot_magatama_4` | 黄の勾玉 | passive | HP+5 | 道中(boss_shuten勝利後) |
| 615 | `spot_yato_talisman` | 冥界の護符 | equipment/accessory | ATK+8, DEF+8, HP+8 | ルートA |
| 616 | `spot_luna_eclips` | 冥食の理 | skill(card) | dmg25+呪い(3T), deck_cost:4 | ルートB |

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 5日 |

---

## 3. シナリオノードフロー

```text
start → start_02~06
 └─ join_01~04 → join_nadeshiko(guest_join)
     └─ gate_01~03 → battle_1
          ├─ win → after_b1_01~03 → b2_pre~02 → battle_2
          │    ├─ win → wani_pre~03 → boss_wani
          │    │    ├─ win → reward_m1~03 → tori_pre~03 → boss_tori
          │    │    │    ├─ win → reward_m2~02 → kuruma_pre~03 → boss_kuruma
          │    │    │    │    ├─ win → reward_m3~02 → shuten_pre~07 → boss_shuten
          │    │    │    │    │    ├─ win → reward_m4~03 → fc_01~03 → final_choice
          │    │    │    │    │    │    ├─ 完遂 → end_sacrifice_01~end_sacrifice
          │    │    │    │    │    │    └─ 拒絶 → end_save_01~end_save
          │    │    │    │    │    └─ lose → end_failure
          │    │    │    │    └─ lose → end_failure
          │    │    │    └─ lose → end_failure
          │    │    └─ lose → end_failure
          │    └─ lose → end_failure
          └─ lose → end_failure
```

### ノード詳細

#### `start`～`start_06`（text）
**演出:** bg: bg_spot_yato_eclipse, bgm: bgm_yato
- speaker: 長老（04, 05）
冥食の始まり。長老が儀式と贄について説明。

#### `join_01`～`join_04`（text）→ `join_nadeshiko`（guest_join）
**演出:** bg: bg_spot_yato_eclipse, bgm: bgm_yato
- speaker: 長老（01）, 撫子（04, join_nadeshiko）
撫子がパーティに加入（護衛対象: is_escort_target: true）。

#### `gate_01`～`gate_03`（text）→ `battle_1`（battle）
**演出:** bg: bg_spot_yato_entrance, bgm: bgm_battle_strong
- speaker: 撫子（03）
**パラメータ:** enemy_group_id: 310, fail: end_failure

#### `after_b1_01`～`b2_pre2`（text）→ `battle_2`（battle）
**演出:** speaker: 撫子
**パラメータ:** enemy_group_id: 313, fail: end_failure

#### `wani_pre`～`boss_wani`（battle）→ `reward_m1`（reward）
**演出:** speaker: 撫子（pre3）
**パラメータ:** enemy_group_id: 314, reward: 611（朱の勾玉）

#### `tori_pre`～`boss_tori`（battle）→ `reward_m2`（reward）
**演出:** speaker: 撫子（pre3）
**パラメータ:** enemy_group_id: 315, reward: 612（蒼の勾玉）

#### `kuruma_pre`～`boss_kuruma`（battle）→ `reward_m3`（reward）
**演出:** speaker: 撫子（pre3）
**パラメータ:** enemy_group_id: 316, reward: 613（翠の勾玉）

#### `shuten_pre`～`boss_shuten`（battle）→ `reward_m4`（reward）
**演出:** bg: bg_spot_yato_gate, bgm: bgm_spot_final_boss
- speaker: 酒呑童子（pre3, pre5, pre6）, 撫子（pre7, reward_m4_02）
**パラメータ:** enemy_group_id: 317, reward: 614（黄の勾玉）

#### `fc_01`～`fc_03`（text）→ `final_choice`（choice）
**演出:** bg: bg_spot_yato_gate, speaker: 撫子（03）
- 選択肢: 「儀式を見届ける」→ `end_sacrifice_01` / 「彼女の手を掴む」→ `end_save_01`

#### `end_sacrifice_01`～`end_sacrifice`（end_success）
**演出:** bg: bg_spot_yato_gate, speaker: 撫子（02）
**rewards:** Exp:500, Gold:10000, Rep:200, Item:615

#### `end_save_01`～`end_save`（end_success）
**演出:** bg: bg_spot_yato_gate, speaker: 撫子（02）
**rewards:** Exp:500, Rep:-100, Skill:616, Justice:100

#### `end_failure`～`end_failure_fin`（end_failure）
**演出:** bg: bg_spot_yato_gate, speaker: 撫子（02）

---

## 4. 新規エネミー・アイテム定義参照

既存エネミー・アイテムを使用。追加なし。

---

## 5. CSVエントリ

`quests_special.csv`
```csv
6102,qst_spot_yato,冥食の残滓 ―常闇に消ゆ、宿命の贄―,20,5,7,loc_yato,,,,,Exp:500|Gold:10000|Rep:200|Item:615,隠れ里の長老,100年に一度の『冥食』。宿命の子「撫子」を護衛し冥の門の最深部を目指せ。
```

---

## 6. 実装チェックリスト

- [x] テキスト分割（30-35文字/ノード）適用
- [x] speaker → speaker_name キー統一
- [x] ノード数: 67ノード
- [x] 全バトルにwin/loseの両方のCHOICE行あり
- [ ] enemy_group_id 310-317 がDBに登録済み
- [ ] 報酬アイテム 611-616 がDBに登録済み
