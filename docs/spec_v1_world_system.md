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
  neighbors JSONB DEFAULT '{}'::jsonb, -- { "loc_slug": days_cost }
  current_attributes JSONB,            -- {order, chaos, justice, evil}
  description TEXT
);
```

> **Note (v11.0)**: 旧仕様の `map_x/map_y` は `x/y` として実装。`neighbors` は `Record<string, number>` 形式（移動日数のみ）で、旧仕様の `{days, type}` 構造は採用していない。

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
  neighbors?: Record<string, number>;
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