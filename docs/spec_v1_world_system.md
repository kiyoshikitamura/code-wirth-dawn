Code: Wirth-Dawn Specification v11.0 (Revised based on actual implementation)
# World System Specification

## 1. 概要 (Overview)
Code: Wirth-Dawn における世界は、全プレイヤーの行動集計によって6時間ごとに更新される「巨大な共有ステート」である。
本ドキュメントは、国家間の覇権争い、拠点の興亡、およびそれらが個人のバトルや経済に与える影響のロジックを定義する。

<!-- v11.0: 実装に合わせてスキーマ定義を更新、world_statesテーブル追記 -->
<!-- v11.1: 日次→6時間毎サイクルへ変更、Resistanceロジック・繁栄度価格乗数を仕様化 -->
<!-- v26.0: アライメント対立軸モデル導入、6時間遅延リセット、拠点同期、闇市条件変更 -->

---

## 2. 世界構造と4大国家 (World Structure)
世界は4つの根源的イデオロギー（属性）と、それを象徴する4大国家によって分割統治されている。

| 国家名 | 属性 (Alignment) | 首都 (Capital) | 文化・特徴 |
|---|---|---|---|
| ローランド聖王国 | Order (秩序) | 王都レガリア | 中世欧州風。騎士道と法による統治。 |
| 砂塵の王国マルカンド | Chaos (混沌) | 黄金都市イスハーク | 中世アラブ風。交易と錬金術、自由競争。 |
| 夜刀神国 (やとのかみくに) | Justice (正義) | 神都「出雲」 | 中世日本風。神話と義、呪術的調和。 |
| 華龍神朝 (かりゅうしんちょう) | Evil (悪) | 天極城「龍京」 | 中世中華風。力と実利、覇道による支配。 |

### 2.1 型定義 (TypeScript)
<!-- v11.0: 実装準拠のNationId型を追記 -->
```typescript
export type NationId = 'Roland' | 'Markand' | 'Karyu' | 'Yato' | 'Neutral';
```

---

## 3. 世界変遷サイクル (The 6h Cycle)
サーバーは**6時間ごと**に以下のプロセスを実行し、世界の状態（World State）を更新する。

### 3.1 集計フェーズ (Aggregation)
全プレイヤーの以下のログを集計し、各拠点（全20箇所）の属性値を更新する。
- **Clear Log**: 依頼達成による属性変動。クエスト報酬の `alignment_shift` がクエスト受注拠点の `world_states` に自動加算される。
- **Prayer Log**: 「祈り（通貨消費）」による直接干渉。

> **v26.0 遅延リセット**: バッチ処理の代替として、APIリクエスト時に `world_states.updated_at` が6時間以上経過していた場合、前回期間の結果を覇権に反映した上でスコアをリセットする「遅延評価方式」を採用。

### 3.2 領土遷移ロジック (Territory Shift)
1. **Global Power**: 全拠点の属性合計比率を算出。
2. **Expansion**: 比率が高い国家は、首都から物理的距離が近い隣接拠点を自国領として併合する。
3. **Resistance**: 拠点の「地域属性値」が侵攻国の属性と反発する場合（摩擦スコア ≥ 51）、
   併合は成立するが拠点の繁栄度 Lv は即座に **1（崩壊）** に強制設定される。
   これにより、征服者は崩壊した廃墟を支配することになる。

> **Resistance の詳細:**
> - 摩擦スコア = `ABS(NationIdealAttribute - CurrentLocationAttribute)`
> - `friction ≥ 51` かつ 新たに支配国が変わった場合にのみ発動する
> - world_states_history に `resistance_collapse` イベントが記録される

### 3.3 6時間更新バッチ
<!-- v32.2: JST運行に合わせてcronスケジュールを同期 -->
- **API**: `POST /api/cron/daily-update`（名称は互換のため維持）
- バッチ処理は Vercel Cron Job として登録。

### 3.4 実行タイミング (v32.2 実装済み)
*   **バッチスケジュール**: Vercel Cron Job を用いて **6時間毎、日本標準時（JST）の 6:00, 12:00, 18:00, 24:00 (0:00)** に `POST /api/cron/daily-update` を実行。
    - UTC基準では **21:00 (前日), 3:00, 9:00, 15:00** に該当。
    - `vercel.json` の cron スケジュール: `"0 3,9,15,21 * * *"`
*   **初回更新の制限 (リリース前ガード)**:
    - 初回シミュレーション実行は、ゲームリリース前であるため **2026年6月15日 12:00 JST** 以降に制限される。
    - それ以前に Cron または API 経由で実行された場合は、自動的に処理がスキップされ、初期状態が維持される。
*   **CRON_SECRET**: 不正実行を防ぐため Bearer Token で検証。
*   **手動実行**: 開発エディタやシステム管理画面からの実行も可能（GETメソッド対応）。

## 4. ワールドマップUI表現とエフェクト (Map Representation)
モバイル端末のプレイを前提とし、以下の視覚的エフェクトと操作性を持たせる。

### 4.1 マップ描画アーキテクチャ・スワイプ操作
- **ベースレイヤー**:
  `worldmap.png` を背景画像として配置し、十分な広さ（例: `min-w-[1200px] min-h-[1200px]`）を確保することで、モバイル画面幅に収まらない部分を `overflow-auto` によるスワイプ（パン）操作で閲覧できるようにする。
- **インタラクティブレイヤー (SVG/Canvas)**:
  - `locations` テーブルの `x`, `y` 座標を **パーセンテージ（0%〜100%）** として扱い、背景画像上の適切な位置に全20拠点のノードを絶対配置する。
  - `connections` 配列に基づき、拠点間を繋ぐ街道をSVGの `<line>` 等で描画する。
  - ※ `x` または `y` が null の拠点は、描画から完全に除外する。

### 4.2 繁栄度とプレイヤー現在地のエフェクト
- **現在地の強調**: プレイヤーの現在地（`user_profiles.current_location_id`）に一致する拠点ノード上には、「現在地マーカー」を配置する。
- **繁栄度 (Prosperity Levels) 表現**:
  - **Lv 5 (絶頂)**: 拠点アイコンの背後に「神々しい輝き（グロウエフェクト）」をレンダリングする。
  - **Lv 1 (崩壊)**: 拠点アイコンの周囲に「黒煙」または不吉なエフェクト（暗い枠線等）をレンダリングする。
- **祈りの可視化（将来拡張枠）**: `POST /api/world/pray` で干渉が行われた拠点にエフェクトを追加できる設計にしておく。

---

## 5. データ構造 (Data Schema)

### 5.1 locations テーブル
<!-- v11.0: 実装準拠にスキーマを刷新 -->
```sql
CREATE TABLE locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  ruling_nation_id TEXT,
  prosperity_level INT CHECK (prosperity_level BETWEEN 1 AND 5),
  x INT,                               -- ワールドマップ上のX座標
  y INT,                               -- ワールドマップ上のY座標
  type TEXT DEFAULT 'town',            -- 'town', 'city', 'fortress', etc.
  connections TEXT[],                   -- 接続先slugの配列
  neighbors JSONB DEFAULT '{}'::jsonb, -- { "loc_slug": { "days": 3, "gold_cost": 150 } }
  current_attributes JSONB,            -- {order, chaos, justice, evil}
  description TEXT
);
```

> **Note (v12.0)**: `neighbors` は `Record<string, { days: number; gold_cost: number }>` 形式。旧仕様の `Record<string, number>` からv12.0で移行。`gold_cost` には繁栄度インフレを適用しない（固定値）。

### 5.2 world_states テーブル
<!-- v11.1: 実実装に準拠したスキーマを記載。location_nameをキーとして使用 -->
```sql
CREATE TABLE world_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_name TEXT UNIQUE NOT NULL,  -- ※ 実装ではlocation_idではなくlocation_nameで識別
  controlling_nation TEXT,
  status TEXT DEFAULT 'Prosperous',    -- 'Zenith','Prosperous','Stagnant','Declining','Ruined'
  prosperity_level INT DEFAULT 4,      -- 1〜5 の数値（statusと連動）
  order_score NUMERIC DEFAULT 0,       -- 累積Orderスコア
  chaos_score NUMERIC DEFAULT 0,
  justice_score NUMERIC DEFAULT 0,
  evil_score NUMERIC DEFAULT 0,
  daily_order_pool NUMERIC DEFAULT 0,  -- 当日の祈りプール
  daily_chaos_pool NUMERIC DEFAULT 0,
  daily_justice_pool NUMERIC DEFAULT 0,
  daily_evil_pool NUMERIC DEFAULT 0,
  last_friction_score NUMERIC,         -- 最後に算出した摩擦スコア
  total_days_passed INT DEFAULT 0,     -- グローバル経過日数カウンタ
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

> **実装メモ:** `location_id UUID FK` ではなく `location_name TEXT` で行を識別している。
> これは初期実装時の設計によるもので、拠点名は変更しない前提のもと運用する。
> 将来的に FK 移行する場合はマイグレーションが必要。

### 5.3 location_encounters テーブル
<!-- v11.1: 追加 -->
```sql
CREATE TABLE location_encounters (
  id BIGSERIAL PRIMARY KEY,
  location_id UUID REFERENCES locations(id),
  encounter_type TEXT NOT NULL,        -- 'random' | 'bounty_hunter'
  enemy_group_slug TEXT NOT NULL,      -- enemy_groups.slug
  weight INT DEFAULT 1                 -- 重み付き抽選用
);
```

### 5.4 フロントエンド型定義
<!-- v11.0: 実装の Location interface を反映 -->
```typescript
export interface Location {
  id: string;
  slug: string;
  name: string;
  ruling_nation_id: string;
  prosperity_level: number;
  description?: string;
  x: number;
  y: number;
  type: string;
  nation_id?: string;
  connections: string[];
  neighbors?: Record<string, { days: number; gold_cost: number }>;
  world_states?: { controlling_nation: string }[];
  current_attributes?: { order: number; chaos: number; justice: number; evil: number };
}
```

---

## 6. 拠点ロジック (Location Logic)

### 6.1 繁栄度ステータス (Prosperity Levels)
拠点の状態は5段階で管理される。

| Lv | 名称 | 条件・影響 |
|---|---|---|
| 5 | 絶頂 (Zenith) | 支配国と地域属性が完全に一致。バトル開始時に市民支援カード（HP300回復/コスト0）が自動注入。 |
| 4 | 繁栄 (Prosperous) | 安定状態。通常価格。 |
| 3 | 停滞 (Stagnant) | わずかな摩擦。品揃え減少。価格 ×1.2。 |
| 2 | 衰退 (Declining) | 支配国への反発増。価格 ×1.5、宿屋の回復量低下。バトルにノイズカード1枚混入。**（※ビジュアル背景や演出は通常と同等）** |
| 1 | 崩壊 (Ruined) | [危険] 統治機能の喪失。**闇市アイテムのみ価格 ×3.0 で表示**（通常ショップ閉鎖）。バトルにノイズカード3枚混入（Lv5以下は免除）。 |

**バトルへの繁栄度影響（実装済み）:**
- **Lv1（崩壊）**: プレイヤーデッキにノイズカード（Unusable Glitch / 廃棄コスト 1 AP）を3枚注入
- **Lv2（衰退）**: ノイズカードを1枚注入
- **Lv5（絶頂）**: 市民支援カード（HP 300 回復 / コスト 0 / バトル開始時に1枚注入）
- Lv5 以下のプレイヤーはノイズ注入を免除（初心者保護）

**キービジュアルへの繁栄度影響（v32.2 改修）:**
- **Lv1（崩壊）**: 崩壊背景画像（`_ruined.png`）が表示され、赤黒いビネットグラデーションおよび赤いGlow演出が適用される。
- **Lv2（衰退）**: 通常背景画像（`_normal.png`）が表示され、通常ビネット・Glow無しが適用される（テキストバッジの「衰退」のみ維持）。
- **Lv3（停滞）**: 通常背景画像（`_normal.png`）が表示される。
- **Lv4〜5（繁栄・絶頂）**: 繁栄背景画像（`_prosperous.png`）が表示される。

**ショップへの繁栄度影響（価格乗数）:**

| Lv | 価格乗数 | 備考 |
|---|---|---|
| 5 | ×1.0 | 標準 |
| 4 | ×1.0 | 標準 |
| 3 | ×1.2 | 微高騰 |
| 2 | ×1.5 | 高騰 |
| 1 | ×3.0 | 闇市アイテムのみ表示 |

### 6.2 統治摩擦 (Alignment Friction)
```
Friction = ABS(RulingNation.PrimaryAttribute − Location.CurrentPrimaryAttribute)
```
摩擦係数が高いほど繁栄度は低下に向かう。また、**摩擦スコアが51以上**の場合は Resistance（§3.2）が発動する。

---

## 6A. アライメントシステム (v26.0)

### 6A.1 対立軸モデル (Dual-Axis)

アライメントは「累積絶対値」ではなく「対立軸ベースの割合」で評価する。

```
秩序(Order) ←── 50% ──→ 混沌(Chaos)
  order_ratio = order_pts / (order_pts + chaos_pts) × 100

正義(Justice) ←── 50% ──→ 悪(Evil)
  justice_ratio = justice_pts / (justice_pts + evil_pts) × 100
```

- 各軸は **0〜100** のスケール。**50 = 中立**。
- DBカラム `order_pts`, `chaos_pts`, `justice_pts`, `evil_pts` の累積加算は従来通り維持。
- **読み取り時に割合を算出**する方式（既存データ移行不要）。
- 実装: `src/lib/alignment.ts` の `calcAlignmentPcts()` 関数。

### 6A.2 個人アライメント

| 判定項目 | 旧方式 | 新方式 (v26) |
|---------|--------|-------------|
| 闇市出現 | `evil > 20`（絶対値） | `evil_ratio >= 60%` OR `chaos_ratio >= 60%` |
| 称号判定 | `order > 50 && justice > 50` | `order_ratio >= 65% && justice_ratio >= 65%` |
| クエスト出現 | `min_align_order: 30`（絶対値） | `min_align_order_pct: 60`（割合%） |

### 6A.3 世界・拠点アライメント

- 各拠点の `world_states` に `order_score` / `chaos_score` / `justice_score` / `evil_score` を蓄積。
- **6時間ごとの20%減衰 (v32.2)**: 6時間ごとのシミュレーションバッチ（`updateWorldSimulation`）実行時に、全アライメントスコアに一律 `0.8` を乗算し四捨五入する（下限値 `10` で保護）。従来の「6時間放置で0リセット」ロジックは廃止。
- **1ヶ月ごとの月次リセット (v32.2)**: シミュレーション更新時に「月」の切り替わりを検知し、月が変わった最初の実行時に全拠点のアライメントスコアを一括で `50`（初期値）に自動初期化する。
- **Friction計算のバグ修正 (v32.2)**: アライメント値が100を超えた場合に摩擦値が跳ね上がるのを防ぐため、摩擦計算時の属性値に `Math.min(100, currentVal)` の上限キャップを適用。
- **クエスト報酬の拠点反映**: クエスト完了時の `alignment_shift` を受注拠点の `world_states` にも加算。
- 祈り (`POST /api/world/pray`) でも同様に拠点スコアに加算。

### 6A.4 クエスト出現条件（個人/世界 AND条件）

`requirements` JSONB で以下のキーを使用:

| キー | 説明 | 例 |
|------|------|----|
| `min_align_order_pct` | 個人の秩序率が指定%以上 | `60` |
| `min_align_evil_pct` | 個人の悪率が指定%以上 | `70` |
| `min_world_alignment` | 世界の指定軸が指定%以上 | `{ "axis": "chaos", "min_pct": 40 }` |
| `alignment_and` | **AND条件**: 個人+世界を同時に要求 | 下記参照 |

**AND条件の使用例:**
```json
{
  "alignment_and": [
    { "scope": "personal", "axis": "evil", "min_pct": 60 },
    { "scope": "world", "axis": "chaos", "min_pct": 40 }
  ]
}
```
→ 「個人がevil寄り60%以上」かつ「世界がchaos寄り40%以上」の時のみ出現。

---

## 7. プレイヤーとの社会的相互作用

### 7.1 名声 (Reputation)
<!-- v11.0: 実装のReputationRank型を反映 -->
名声は**「拠点ごと」**に管理される。

```typescript
export type ReputationRank = 'Hero' | 'Famous' | 'Stranger' | 'Rogue' | 'Criminal';

export interface Reputation {
  id: string;
  user_id: string;
  location_name: string;
  score: number;
  rank: ReputationRank;
}
```

### 7.2 祈り (Prayer)
- **API**: `POST /api/world/pray`
- プレイヤーは通貨を消費して、特定の拠点の属性値に直接ブーストをかけることができる。

---

## 8. ワールドマップ表現 (World Map)
<!-- v11.0: 実装のWorldMap.tsxコンポーネントに準拠 -->
- **Nodes**: `x`, `y` に基づいて拠点をプロット。
- **Edges**: `connections` 配列に基づいて街道（線）を描画。
- **State**: 繁栄度に応じて、拠点アイコンの周りにエフェクト（輝き/黒煙）を表示。
- **移動**: WorldMap コンポーネントから移動先を選択し、`POST /api/move` で移動処理。
  - **移動コスト (v26.1 & v27.5)**: 移動日数 × 50G の固定比率。日数レンジは **3〜8日**。
    - 同国内・隣接: 3〜4日 (150〜200G)
    - 同国内・遠距離: 5日 (250G)
    - 国境越え: 5〜8日 (250〜400G)
  - **ルート追加**:
    - 国境の町 ⇔ 白亜の砦: 3日 (150G)
    - 鉄の鉱山村 ⇔ 門前町: 4日 (200G)
  - **ルート削除**:
    - 国境の町 ⇔ 最果ての村 の直結ルートを廃止（谷間の集落経由を強制）
    - 鉄の鉱山村 ⇔ 監視哨 の直結ルートを廃止
  - **移動中エンカウント (v20)**: 移動実行時、移動日数に連動した確率でランダムエンカウントが発生、または名声が低い場合（賞金首）は確定で賞金稼ぎの襲撃が発生する。詳細は [spec_v20](spec_v20_encounter_improvement.md) 参照。
  - **地域別エンカウント**: `location_encounters` テーブルで拠点ごとに出現する敵グループと確率を管理する。
  - **ルート詳細**: [world_map_routes.md](world_map_routes.md) を参照。

---

## 9. 首都の特別規則 (Capital Special Rules) (v16)

### 9.1 入場制限
王都レガリア、黄金都市イスハーク、神都「出雲」、天極城「龍京」の4箇所は「首都」として扱われ、以下の入場制限が適用される。
- **通行許可証 (Pass)**: 該当する首都の許可証を所持・有効期限内である必要がある。
- **賄賂 (Bribe)**: 許可証がない場合でも、名声が 0 未満であれば賄賂による入城が可能。

### 9.2 祈りの強化
- 首都での祈り（`POST /api/world/pray`）は、世界属性への干渉力が通常拠点の **2.0倍** となる。

---

## 10. v27.0 改訂: 覇権モーダル改善 (2026-05-18)

### 10.1 覇権データソースの修正

`GET /api/world/hegemony` のデータソースを変更:

| 項目 | 旧 | 新 |
|:---|:---|:---|
| テーブル | `locations` | `world_states` |
| カラム | `ruling_nation_id` | `controlling_nation` |

**理由**: `ruling_nation_id` は拠点の初期設定値（建国領土）であり、`world-simulation.ts` の6hバッチでは `world_states.controlling_nation` のみが更新される。旧APIでは覇権バーが初期値から動かなかった。

### 10.2 国家定数の一元化

新規ファイル `src/constants/nations.ts` を追加。以下を一元管理:
- `NATIONS`: 4大国家の設定マスター（ID、短縮名、正式名、カラー、属性キー）
- `NATION_NAME_MAP`: NationId → 正式日本語名
- `DEFAULT_HEGEMONY`: フォールバック用デフォルトデータ

### 10.3 覇権データのキャッシュ化

`profileSlice.ts` の `fetchWorldState()` 内で、覇権データを **10分間キャッシュ**。
ストアに `_hegemonyCache: { data, fetchedAt }` を保持し、TTL内はAPIコールをスキップ。

### 10.4 `ruling_nation_id` と `controlling_nation` の関係

| カラム | テーブル | 意味 | 更新タイミング |
|:---|:---|:---|:---|
| `ruling_nation_id` | `locations` | 拠点の建国時の所属（初期値、不変） | 手動更新のみ |
| `controlling_nation` | `world_states` | 現在の支配国（動的） | 6hバッチ (`world-simulation.ts`) |

覇権関連の表示・計算には常に `controlling_nation` を使用すること。

---

## 11. v32.2 改訂: アライメント初期値 50 開始と Hub の覇権除外 (2026-06-12)

### 11.1 アライメント初期値 50 における無操作時の崩壊推移
- プレイヤーが少ない状態で開始した際の自動崩壊を防ぐため、アライメントスコアの初期値を `10` から `50` に引き上げた。
- **自動崩壊の推移（プレイヤー無干渉時）**:
  - 全アライメント初期値が `50` の場合、6時間ごとの20%減衰（下限 `10`）のみが働くと、以下の通り **30時間（シミュレーション更新5サイクル）** で世界全体がレベル1（崩壊状態）に到達する。
    - 0h (初期状態): 属性値 50 (摩擦 50) ➔ 首都: 4 (Prosperous), 一般: 3 (Stagnant)
    - 6h (1回目更新): 属性値 40 (摩擦 60 / 目標 Lv2) ➔ 首都: 3 (Stagnant), 一般: 2 (Declining)
    - 12h (2回目更新): 属性値 32 (摩擦 68 / 目標 Lv2) ➔ 首都: 2 (Declining), 一般: 2 (Declining)
    - 18h (3回目更新): 属性値 26 (摩擦 74 / 目標 Lv2) ➔ 首都: 2 (Declining), 一般: 2 (Declining)
    - 24h (4回目更新): 属性値 21 (摩擦 79 / 目標 Lv2) ➔ 首都: 2 (Declining), 一般: 2 (Declining)
    - 30h (5回目更新): 属性値 17 (摩擦 83 / 目標 Lv1) ➔ 首都: 1 (Ruined), 一般: 1 (Ruined)

### 11.2 覇権計算および領土割り当てからの中立ハブ除外
- 永続的中立ハブ「名もなき旅人の拠所」が他国の領土ドラフト（territory draft）に割り当てられたり、覇権（コントロール割合）チャートの分母に含まれて割合を歪めるバグを防止するため、計算から除外した。
- `world-simulation.ts` の領土ドラフト対象数を 21 から 20（Hub を除く）に変更し、Hub は常に controlling_nation = `'Neutral'` として固定。
- `/api/world/hegemony` の総数計算（totalCount）から controlling_nation = `'Neutral'` である Hub を除外。これにより、覇権バーは 4 大国家の支配拠点数のみ（分母20）で正確に 100% となるように算出される。

### 11.3 中立ハブ拠点の「繁栄(Prosperous / Lv4)」固定とCron更新処理からの完全除外
- 中立ハブ拠点の状態は常に「繁栄 (Prosperous) / 繁栄度レベル4」で固定され、アライメントスコアも `50` に維持される。
- 6時間ごとのシミュレーション更新（`updateWorldSimulation`）時に、中立ハブはアライメントスコアの20%減衰や月次リセット処理からスキップされる。
- シミュレーションの実行時、ハブ拠点に意図しない変更（他国への帰属やレベルの変動など）が検出された場合、自動的に `controlling_nation = 'Neutral'`, `status = 'Prosperous'`, `prosperity_level = 4`, 各アライメントスコアを `50` へと強制リセット・上書きして保護するガードロジックを実装し、Cronのシミュレーション影響から完全に隔離している。
