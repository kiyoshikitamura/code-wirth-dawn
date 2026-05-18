# クエスト仕様書：6103 — 天道の塔 ―四神と碁打ちの神―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6103 |
| **Slug** | `qst_spot_karyu` |
| **クエスト種別** | スポットシナリオ（Special） |
| **推奨レベル** | 20（Hard） |
| **難度** | 5 |
| **依頼主** | なし（自発） |
| **出現条件** | メインep10クリア / 華龍拠点滞在 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **難易度Tier** | Hard（rec_level: 20） |
| **経過日数 (time_cost)** | 7（成功: 7日 / 失敗: 5日） |
| **ノード数** | 79ノード（ロジックノード含む） |
| **サムネイル画像** | `/images/quests/bg_spot_karyu_tower.png` |

> [!IMPORTANT]
> **四神自由選択方式**: プレイヤーは東西南北の四方から任意の順番で四神に挑戦できる。各方角にはHP-20%のトラップがあり、四神討伐後に宝珠（アイテム）を入手。四つ全て揃うと中央の塔に進入可能。`check_possession` ノードで所持判定を行う。

---

## 1. クエスト概要

### 短文説明
```
華龍の都の外れに聳える天道の塔。四方を守る四神を討ち、頂上の神に挑め。
```

### 長文説明
```
華龍の都の外れに、誰が建てたかも知れぬ巨大な塔が聳えている。
四方に配された四神——青龍、白虎、朱雀、玄武を全て討ち果たさなければ塔には入れない。
頂上で待つ「碁打ちの神」との対峙。世界の支配か、神の理の破壊か。
```

---

## 2. 報酬定義

**ルートA（神の代理人ルート）:**
```
Exp:500|Gold:10000|Rep:200|Item:625
```

**ルートB（神の理破壊ルート）:**
```
Exp:500|Rep:-100|Item:626|Align:混沌+100
```

### 報酬アイテム詳細

| ID | Slug | 名前 | Type | 効果 | 入手 |
|---|---|---|---|---|---|
| 621 | `spot_orb_seiryu` | 青龍の宝珠 | key | 塔の鍵（東） | 青龍討伐後 |
| 622 | `spot_orb_byakko` | 白虎の宝珠 | key | 塔の鍵（西） | 白虎討伐後 |
| 623 | `spot_orb_suzaku` | 朱雀の宝珠 | key | 塔の鍵（南） | 朱雀討伐後 |
| 624 | `spot_orb_genbu` | 玄武の宝珠 | key | 塔の鍵（北） | 玄武討伐後 |
| 625 | `spot_tendo_naginata` | 天道の薙刀 | equipment/weapon | ATK+15, DEF+5 | ルートA |
| 626 | `spot_kamikiri` | 神殺しの光芒 | skill(card) | dmg50, deck_cost:5 | ルートB |

---

## 2.5 失敗ペナルティ

| 項目 | 値 |
|-----|-----|
| VIT変動 | VIT -1 |
| 経過日数（失敗） | 5日 |

---

## 3. シナリオノードフロー

```text
start → start_02~07
 └─ choose_path（四方選択）
      ├─ 東 → check_done_seiryu → [未] trap_seiryu → sr_pre1~4 → boss_seiryu
      │                              [済] already_done_seiryu → choose_path
      ├─ 西 → check_done_byakko → [未] trap_byakko → bk_pre1~4 → boss_byakko
      │                              [済] already_done_byakko → choose_path
      ├─ 南 → check_done_suzaku → [未] trap_suzaku → sz_pre1~4 → boss_suzaku
      │                              [済] already_done_suzaku → choose_path
      ├─ 北 → check_done_genbu  → [未] trap_genbu → gb_pre1~4 → boss_genbu
      │                              [済] already_done_genbu → choose_path
      └─ 塔 → check_orb_seiryu → check_orb_byakko → check_orb_suzaku → check_orb_genbu
               ├─ 全所持 → kami_pre1~11 → boss_kami
               │            ├─ win → fc_01~05 → final_choice
               │            │    ├─ 統べる → end_rule_01~end_rule
               │            │    └─ 破壊 → end_destroy_01~end_destroy
               │            └─ lose → end_failure_pre~end_failure
               └─ 不足 → missing_orbs → choose_path
```

### ノード詳細（要約）

#### `start`～`start_07`（text）
**演出:** bg: bg_spot_karyu_tower, bgm: bgm_karyu, speaker: 老人（04-06）
老人から四神と塔の存在を聞く。

#### `choose_path`（choice）
四方選択。東/西/南/北の四神 or 中央の塔。

#### 四神パート共通構造
- **トラップ**: `trap_*`（modify_state: HP-20%）
- **前口上**: `*_pre1`～`*_pre4`（各四神のspeaker_name付き台詞）
- **バトル**: `boss_*`（battle + win/lose）
- **報酬**: `reward_orb_*`（reward: 宝珠アイテム）→ choose_path に戻る

| 四神 | bg | enemy_group_id | 報酬 | speaker_name |
|-----|-----|-----|-----|-----|
| 青龍 | bg_spot_karyu_thunder | 320 | 621 | 青龍 |
| 白虎 | bg_spot_karyu_snow | 321 | 622 | 白虎 |
| 朱雀 | bg_spot_karyu_fire | 322 | 623 | 朱雀 |
| 玄武 | bg_spot_karyu_earth | 323 | 624 | 玄武 |

#### `kami_pre1`～`kami_pre11`（text）→ `boss_kami`（battle）
**演出:** bg: bg_spot_karyu_throne, bgm: bgm_battle_boss, speaker: 少年（pre4, pre6, pre9, pre10）
**パラメータ:** enemy_group_id: 324, fail: end_failure_pre

#### `fc_01`～`fc_05`（text）→ `final_choice`（choice）
**演出:** bgm: bgm_spot_final_choice, speaker: 少年（02-05）
- 選択肢: 「神の代理人として統べる」→ `end_rule_01` / 「神の理を破壊し自由を掴む」→ `end_destroy_01`

#### `end_rule_01`～`end_rule`（end_success）
**rewards:** Exp:500, Gold:10000, Rep:200, Item:625

#### `end_destroy_01`～`end_destroy`（end_success）
**rewards:** Exp:500, Rep:-100, Item:626, Evil:100

#### `end_failure_pre`～`end_failure`（end_failure）
**演出:** bg: bg_spot_karyu_tower, speaker: 少年（pre2）

---

## 4. 新規エネミー・アイテム定義参照

既存エネミー・アイテムを使用。追加なし。

---

## 5. CSVエントリ

`quests_special.csv`
```csv
6103,qst_spot_karyu,天道の塔 ―四神と碁打ちの神―,20,5,7,loc_haryu,,,,,Exp:500|Gold:10000|Rep:200|Item:625,なし,華龍の都の外れに聳える天道の塔。四神を討ち頂上の神に挑め。
```

---

## 6. 実装チェックリスト

- [x] テキスト分割（30-35文字/ノード）適用
- [x] speaker_name 全ノードに適用
- [x] ノード数: 79ノード（ロジックノード含む）
- [x] 全バトルにwin/loseの両方のCHOICE行あり
- [x] check_possession による四神宝珠所持チェック維持
- [ ] enemy_group_id 320-324 がDBに登録済み
- [ ] 報酬アイテム 621-626 がDBに登録済み
