# spec_v20: ランダムエンカウント改善仕様

> 更新: 2026-05-15
> 前提: spec_v16 §1 (移動エンカウント基礎仕様)
> **本仕様は spec_v16_economy_reputation.md §1（移動エンカウント仕様）を完全に置換する。v16の§2-4（首都入場制限/名声/ゴールドシンク）は spec_v1 §9, spec_v11, spec_v7 に分散統合済み。**

## §1 概要

ワールドマップ移動時のランダムエンカウントシステムを以下の4点で改善する。

1. **拠点固有エンカウント敵グループの設定**
2. **プレイヤーレベルによる出現敵フィルタ**
3. **賞金稼ぎのレベル連動**
4. **移動日数とエンカウント確率の連動**

---

## §2 日数連動エンカウント確率

### 旧仕様
移動距離に関わらず固定20%。

### 新仕様
1日あたりの基礎エンカウント率を5%とし、移動日数に応じて確率が上昇する。

**計算式**: `エンカウント率 = 1 - (1 - 0.05)^移動日数`

| 移動日数 | エンカウント確率 | 体感 |
|:---:|:---:|:---|
| 3日 | 14.3% | 短距離、安全 |
| 4日 | 18.5% | やや安全 |
| 5日 | 22.6% | 標準 |
| 6日 | 26.5% | やや危険 |
| 7日 | 30.2% | 危険 |
| 8日 | 33.7% | 非常に危険 |

パッシブ効果「詳細な地図」による軽減はそのまま適用。

### 定数
```
ENCOUNTER_BASE_RATE_PER_DAY: 0.05  // game_rules.ts
```

---

## §3 プレイヤーレベルフィルタ

`location_encounters` テーブルの `min_player_level` / `max_player_level` をクエリ条件に使用。

```sql
SELECT enemy_group_slug, weight
FROM location_encounters
WHERE location_id = $1
  AND encounter_type = $2
  AND min_player_level <= $playerLevel
  AND max_player_level >= $playerLevel
```

→ レベル外の敵グループは出現候補から除外。該当なしの場合は `bandit_group` にフォールバック。

---

## §4 拠点固有エンカウント一覧

### ローランド聖王国

| 拠点 | グループ | Lv帯 | 重み |
|:---|:---|:---:|:---:|
| 国境の町 | bandit_group (チンピラ×1) | 1-10 | 3 |
| | neutral_goblin_group (ゴブリン×2) | 1-15 | 2 |
| 白亜の砦 | roland_undead_group (スケルトン+ゾンビ) | 5-20 | 2 |
| | roland_bandit_group (用心棒+チンピラ) | 5-20 | 2 |
| 鉄の鉱山村 | neutral_wolf_group (ドッグ+ウルフ) | 3-15 | 3 |
| | neutral_goblin_group | 1-10 | 2 |
| 港町 | roland_bandit_group | 5-20 | 3 |
| | roland_monster_group (亡霊騎士+スケルトン) | 8-25 | 1 |
| 王都レガリア | roland_bandit_group | 5-20 | 2 |
| | roland_undead_group | 5-20 | 1 |

### 砂塵の王国マルカンド

| 拠点 | グループ | Lv帯 | 重み |
|:---|:---|:---:|:---:|
| 市場町 | markand_desert_group (サソリ+チンピラ) | 5-20 | 3 |
| | bandit_group | 1-10 | 1 |
| オアシスの村 | markand_desert_group | 5-20 | 2 |
| | markand_worm_group (ワーム+サソリ) | 10-30 | 2 |
| 高原の村 | markand_desert_group | 5-15 | 2 |
| | neutral_wolf_group | 3-15 | 2 |
| 平原の都市 | roland_bandit_group | 5-20 | 2 |
| | markand_desert_group | 5-20 | 2 |
| 黄金都市イスハーク | markand_desert_group | 5-20 | 2 |

### 夜刀神国

| 拠点 | グループ | Lv帯 | 重み |
|:---|:---|:---:|:---:|
| 門前町 | yato_yokai_group (鬼火+からかさ) | 5-15 | 3 |
| | bandit_group | 1-10 | 1 |
| 谷間の集落 | yato_yokai_group | 5-15 | 2 |
| | yato_tengu_group (天狗+鬼火) | 10-25 | 2 |
| 最果ての村 | yato_tengu_group | 10-25 | 3 |
| | yato_yokai_group | 5-15 | 1 |
| 保養地 | neutral_wolf_group | 3-15 | 2 |
| | yato_yokai_group | 5-15 | 2 |
| 神都「出雲」 | yato_yokai_group | 5-15 | 2 |

### 華龍神朝

| 拠点 | グループ | Lv帯 | 重み |
|:---|:---|:---:|:---:|
| 北の防衛砦 | karyu_spirit_group (キョンシー+妖狐) | 8-20 | 2 |
| | roland_bandit_group | 5-20 | 2 |
| 監視哨 | karyu_spirit_group | 8-20 | 2 |
| | karyu_terracotta_group (兵馬俑+キョンシー) | 12-30 | 2 |
| 古代遺跡の町 | karyu_terracotta_group | 12-30 | 3 |
| | karyu_spirit_group | 8-20 | 1 |
| 闘技都市 | karyu_spirit_group | 8-20 | 2 |
| | neutral_wolf_group | 3-15 | 2 |
| 天極城「龍京」 | karyu_spirit_group | 8-20 | 2 |

---

## §5 賞金稼ぎレベル連動

名声が -100 以下のプレイヤーが移動時に確定遭遇する賞金稼ぎを、プレイヤーレベルに応じて5段階に分類。

| Lv帯 | グループSlug | 構成 | 備考 |
|:---:|:---|:---|:---|
| 1-5 | bounty_low | 新米ハンター + 狩人 | 序盤 |
| 5-15 | bounty_mid | 賞金稼ぎの剣士 × 2 | 中盤前半 |
| 10-20 | bounty_high | ベテランハンター + 魔術狩り | 中盤 |
| 15-25 | bounty_elite | 重装の処刑人 + ベテランハンター | 中盤後半、きつめ |
| 25-99 | bounty_legend | 王国公認の凶刃 + 伝説の傭兵 + 静寂の死神 | 3体構成、高難度 |

全拠点（loc_hub除く）に上記5段階を `encounter_type = 'bounty_hunter'` で登録。

---

## §6 変更ファイル一覧

| ファイル | 変更内容 |
|:---|:---|
| `constants/game_rules.ts` | `ENCOUNTER_BASE_RATE_PER_DAY: 0.05` 追加 |
| `api/move/route.ts` | 日数連動確率、レベルフィルタ、処理順序変更 |
| `data/csv/enemy_groups.csv` | bounty_low〜bounty_legend 5グループ追加 |
| `migrations/20260515052300_encounter_data.sql` | 全拠点エンカウントデータ |

---

## §7 v27.0 改訂 (2026-05-18)

### §7.1 フォールバック敵のレベル連動

`location_encounters` テーブルから敵が取得できない場合のフォールバック敵ステータスをプレイヤーレベルに連動。

**旧**: HP:300, ATK:15, DEF:5, Lv:20 (固定)
**新**: `HP = max(50, playerLv * 15)`, `ATK = max(3, playerLv * 0.8)`, `DEF = max(1, playerLv * 0.4)`, `Lv = playerLv`

### §7.2 エンカウント戦闘後の日数消費

エンカウント発生時、`move/route.ts` は移動を完了せずに `require_battle` レスポンスを返す。
戦闘後の `encounter-result/route.ts` で移動完了するが、日数消費と加齢処理が欠落していた。

**修正**: `move API` が `travel_days` をレスポンスに含め、`encounter-result API` が受信して `processAging` を適用。

```
move API → { travel_days: N } → battle URL (&days=N) → encounter-result API → processAging(days=N)
```

### §7.3 認証統一

移動API群から `x-user-id` ヘッダーによるフォールバック認証を完全削除。全APIがJWT（Bearerトークン）のみで認証。

| API | 変更 |
|:---|:---|
| `api/move/route.ts` | x-user-id 削除、JWT認証統一 |
| `api/move/encounter-result/route.ts` | 同上 |
| `api/move/bribe/route.ts` | 同上 |
| `api/travel/cost/route.ts` | 同上 |
| `api/map/descend/route.ts` | body.user_id 廃止、JWT認証追加 |

### §7.4 bribe APIの日数消費追加

賄賂による首都入場時にも `processAging` を適用（固定1日）。

### §7.5 slugベース統一

フロントから `target_location_name` → `target_location_slug` に変更。slug検索の方がユニーク性が保証されるため安全。
