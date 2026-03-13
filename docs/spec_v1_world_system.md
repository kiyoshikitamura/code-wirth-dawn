Code: Wirth-Dawn Specification v11.0 (Revised based on actual implementation)
# World System Specification

## 1. 概要 (Overview)
Code: Wirth-Dawn における世界は、全プレイヤーの行動集計によって24時間ごとに更新される「巨大な共有ステート」である。
本ドキュメントは、国家間の覇権争い、拠点の興亡、およびそれらが個人のバトルや経済に与える影響のロジックを定義する。

<!-- v11.0: 実装に合わせてスキーマ定義を更新、world_statesテーブル追記 -->

---

## 2. 世界構造と4大国家 (World Structure)
世界は4つの根源的イデオロギー（属性）と、それを象徴する4大国家によって分割統治されている。

| 国家名 | 属性 (Alignment) | 首都 (Capital) | 文化・特徴 |
|---|---|---|---|
| ローラン聖帝国 | Order (秩序) | 王都レガリア | 中世欧州風。騎士道と法による統治。 |
| 砂塵の王国マルカンド | Chaos (混沌) | 黄金都市イスハーク | 中世アラブ風。交易と錬金術、自由競争。 |
| 夜刀神国 (やとのかみくに) | Justice (正義) | 神都「出雲」 | 中世日本風。神話と義、呪術的調和。 |
| 華龍神朝 (かりゅうしんちょう) | Evil (悪) | 天極城「龍京」 | 中世中華風。力と実利、覇道による支配。 |

### 2.1 型定義 (TypeScript)
<!-- v11.0: 実装準拠のNationId型を追記 -->
```typescript
export type NationId = 'Roland' | 'Markand' | 'Karyu' | 'Yato' | 'Neutral';
```

---

## 3. 世界変遷サイクル (The 24h Cycle)
サーバーは24時間ごとに以下のプロセスを実行し、世界の状態（World State）を更新する。

### 3.1 集計フェーズ (Aggregation)
全プレイヤーの以下のログを集計し、各拠点（全20箇所）の属性値を更新する。
- **Clear Log**: 依頼達成による属性変動。
- **Prayer Log**: 「祈り（通貨消費）」による直接干渉。

### 3.2 領土遷移ロジック (Territory Shift)
1. **Global Power**: 全拠点の属性合計比率を算出。
2. **Expansion**: 比率が高い国家は、首都から物理的距離が近い隣接拠点を自国領として併合する。
3. **Resistance**: ただし、拠点の「地域属性値」が侵攻国の属性と極端に反発する場合、併合は失敗するか、または「崩壊」状態で併合される。

### 3.3 日次更新バッチ
<!-- v11.0: 実装の cron API を反映 -->
- **API**: `POST /api/cron/daily-update`
- バッチ処理は Vercel Cron Job として登録。

### 3.4 実行タイミング (spec v14 実装済み)
*   **日次バッチ**: Vercel Cron Job を用いて毎日 `0:00 UTC (9:00 JST)` に `POST /api/cron/daily-update` を実行。
*   **CRON_SECRET**: 不正実行を防ぐため Bearer Token で検証。
*   **手動実行**: 開発エディタやシステム管理画面からの実行も可能。

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
- **現在地の強調**: プレイヤーの現在地（`user_profiles.current_location_id`）に一致する拠点ノード上には、「現在地マーカー」を配置し、内部にアバター画像（デフォルト: `/avatars/adventurer.jpg`）を表示する。
- **繁栄度 (Prosperity Levels) 表現**:
  - **Lv 5 (絶頂)**: 拠点アイコンの背後に「神々しい輝き（グロウエフェクト）」をレンダリングする。
  - **Lv 1 (崩壊)**: 拠点アイコンの周囲に「黒煙」または不吉なエフェクト（暗い枠線等）をレンダリングする。
- **祈りの可視化（将来拡張枠）**: `POST /api/world/pray` で干渉が行われた拠点にエフェクトを追加できる設計にしておく。

---

## 4. データ構造 (Data Schema)

### 4.1 locations テーブル
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

### 4.2 world_states テーブル
<!-- v11.0: 実装で追加されたテーブルを仕様化 -->
```sql
CREATE TABLE world_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES locations(id),
  controlling_nation TEXT,
  status TEXT DEFAULT 'stable',        -- 'stable', 'conflict', 'ruined'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.3 フロントエンド型定義
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

## 5. 拠点ロジック (Location Logic)

### 5.1 繁栄度ステータス (Prosperity Levels)
拠点の状態は5段階で管理される。

| Lv | 名称 | 条件・影響 |
|---|---|---|
| 5 | 絶頂 (Zenith) | 支配国と地域属性が完全に一致。最高の品揃え、ボーナスカード支給。 |
| 4 | 繁栄 (Prosperous) | 安定状態。通常価格。 |
| 3 | 停滞 (Stagnant) | わずかな摩擦。品揃え減少。 |
| 2 | 衰退 (Declining) | 支配国への反発増。物価高騰（x1.5）、宿屋の回復量低下。 |
| 1 | 崩壊 (Ruined) | [危険] 統治機能の喪失。ショップ利用不可、バトルへのノイズ混入。 |

### 5.2 統治摩擦 (Alignment Friction)
```
Friction = ABS(RulingNation.Attribute − Location.CurrentAttribute)
```
摩擦係数が高いほど、繁栄度は低下に向かう。

---

## 6. プレイヤーとの社会的相互作用

### 6.1 名声 (Reputation)
<!-- v11.0: 実装のReputationRank型を反映 -->
名声は**「拠点ごと」**に管理される。

```typescript
export type ReputationRank = 'Hero' | 'Famous' | 'Stranger' | 'Rogue' | 'Criminal';

export interface Reputation {
  id: string;
  user_id: string;
  location_id: string;
  score: number;
  rank: ReputationRank;
}
```

### 6.2 祈り (Prayer)
- **API**: `POST /api/world/pray`
- プレイヤーは通貨を消費して、特定の拠点の属性値に直接ブーストをかけることができる。

---

## 7. ワールドマップ表現 (World Map)
<!-- v11.0: 実装のWorldMap.tsxコンポーネントに準拠 -->
- **Nodes**: `x`, `y` に基づいて拠点をプロット。
- **Edges**: `connections` 配列に基づいて街道（線）を描画。
- **State**: 繁栄度に応じて、拠点アイコンの周りにエフェクト（輝き/黒煙）を表示。
- **移動**: WorldMap コンポーネントから移動先を選択し、`POST /api/move` で移動処理。
  - **移動中エンカウント (v16)**: 移動実行時、一定確率でランダムエンカウントが発生、または名声が低い場合（賞金首）は確定で賞金稼ぎの襲撃が発生する。詳細は [spec_v16](spec_v16_economy_reputation.md) 参照。

---

## 8. 首都の特別規則 (Capital Special Rules) (v16)

### 8.1 入場制限
王都レガリア、黄金都市イスハーク、神都「出雲」、天極城「龍京」の4箇所は「首都」として扱われ、以下の入場制限が適用される。
- **通行許可証 (Pass)**: 該当する首都の許可証を所持・有効期限内である必要がある。
- **賄賂 (Bribe)**: 許可証がない場合でも、名声が 0 未満であれば賄賂による入城が可能。

### 8.2 祈りの強化
- 首都での祈り（`POST /api/world/pray`）は、世界属性への干渉力が通常拠点の **2.0倍** となる。
