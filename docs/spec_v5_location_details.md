Code: Wirth-Dawn Specification v11.0 (Revised based on actual implementation)
# Location Details — Topology, Travel & Prosperity

## 1. 概要 (Overview)
全拠点の地理的データ、マップ座標、隣接拠点関係、移動コスト、繁栄度の定義。

<!-- v11.0: 隣接直接ルックアップの実装に合わせて改訂。Dijkstra未使用を明記。 -->

---

## 2. トポロジー (World Topology)
世界は20の拠点で構成され、各拠点は隣接拠点と接続されている。

### 2.1 拠点構成
<!-- v11.0: 実装のlocationsテーブルに準拠 -->

**ローラン聖帝国圏 (マップ北西部 / 左上)**
- 王都レガリア (loc_regalia) — 首都
- 白亜の砦 (loc_white_fort)
- 港町 (loc_port_city)
- 国境の町 (loc_border_town)
- 鉄の鉱山村 (loc_iron_mine)

**砂塵の王国マルカンド圏 (マップ南西部 / 左下)**
- 黄金都市イスハーク (loc_meridia) — 首都
- 市場町 (loc_market_town)
- オアシスの村 (loc_oasis)
- 平原の都市 (loc_plains_city)
- 高原の村 (loc_highland)

**夜刀神国圏 (マップ北東部 / 右上)**
- 神都「出雲」(loc_yato) — 首都
- 門前町 (loc_temple_town)
- 谷間の集落 (loc_valley)
- 最果ての村 (loc_frontier_village)
- 保養地 (loc_resort)

**華龍神朝圏 (マップ南東部 / 右下)**
- 天極城「龍京」(loc_charon) — 首都
- 北の防衛砦 (loc_north_fort)
- 監視哨 (loc_monitor_post)
- 古代遺跡の町 (loc_ancient_ruins)
- 闘技都市 (loc_coliseum)

---

## 3. 座標とマップ

### 3.1 マップ座標
<!-- v11.0: x/yで実装（相対パーセンテージ） -->
各拠点は `x: INT`, `y: INT` のパーセンテージ座標（0%〜100%）を持つ。モバイル閲覧を前提とした背景画像（`worldmap.png`）の上に、これらに基づき絶対配置でSVGノードをプロットする。
- **例外処理 (v12.0)**: `locations.x` または `y` が `null` の拠点は、ワールドマップの描画から完全に除外される。

### 3.2 接続描画
`connections: TEXT[]` に隣接拠点の slug を格納。Mapコンポーネントは、このデータに基づき拠点間を繋ぐSVG `<line>` （街道ライン / Edge）を描画する。

### 3.3 地理的配置と背景マップ (Geographical Distribution)
データベースの（x, y）座標（0,0 = 左上）に従い、世界は大きく4つの象限に分割される。
背景画像となる `worldmap.png` は、この配置に完全準拠して描画されること。

- **北西 (左上)**: ローラン聖帝国（西洋ファンタジー・緑・平原・砦）
- **南西 (左下)**: マルカンド（アラビアン・砂漠・オアシス）
- **北東 (右上)**: 夜刀神国（和風・桜・雪山・渓谷）
- **南東 (右下)**: 華龍神朝（中華・険しい岩峰・古き遺跡）
- **中央部**: 中心（x:50, y:50付近）にはハブである「名もなき旅人の拠所」およびローラン側の「港町」が存在し、海や大きな内湾が中央に向かって入り込んでいる地形を形成する。

---

## 4. 隣接移動と移動コスト

### 4.1 neighbors フィールド
<!-- v12.0: gold_costを含むオブジェクト形式に変更 -->
```typescript
neighbors: Record<string, { days: number; gold_cost: number }>;  // { "target_slug": { days, gold_cost } }
```

旧仕様の `Record<string, number>` は廃止。移動日数に加え、移動費用（ゴールド）を固定値として格納。

> **Note (v12.0)**: `gold_cost` には繁栄度に基づくインフレ係数を適用しない。常にマスターデータの固定値を使用する。

### 4.2 移動コスト API
<!-- v12.0: gold_costをレスポンスに追加、ゴールドバリデーションを追加 -->
```
POST /api/travel/cost
Body: { target_location_slug: string }
Response: { from: string, to: string, days: number, gold_cost: number }
```

**処理フロー**:
1. ユーザーの `current_location_id` から現在地を取得。
2. 現在地の `neighbors` から `target_slug` をルックアップ。
3. 一致すれば `days` と `gold_cost` を返却、不一致ならエラー。

> **Note (v12.0)**: Dijkstra等の最短経路探索は**仕様から正式除外**。企画・UX方針として「プレイヤーに1拠点ずつ巡る旅情を感じてほしい」ため、隣接移動のみを正式仕様とする。非隣接拠点への移動はエラー (400) を返す。
> **【UI/モバイル対応】**: 非隣接拠点を選択した場合、UIのボトムシート（Bottom Sheet）では移動ボタンを Disabled または非表示とし、「直接移動はできません」等の警告文を表示する。

### 4.3 移動実行 API
<!-- v12.0: ゴールドバリデーションと減算処理を追加 -->
```
POST /api/move
Body: { target_location_slug: string } or { target_location_name: string }
Response: { success: true, travel_days: number, new_age: number, ... }
```

**処理フロー**:
1. 現在地の `neighbors` から `target_slug` をルックアップし `days` と `gold_cost` を取得。
2. `user_profiles.gold >= gold_cost` を確認。不足の場合は HTTP 400 (`INSUFFICIENT_FUNDS`) を返却。
3. バリデーション通過後、現在地更新・日数加算・加齢処理と同一トランザクションで `gold - gold_cost` を反映。

---

## 5. 繁栄度 (Prosperity) と影響

### 5.1 繁栄度レベル定義
| Lv | 名称 | ショップ | バトル | 経済 |
|---|---|---|---|---|
| 5 | 絶頂 | 全品揃え、ボーナスカード | 弱い敵 | 物価安定 |
| 4 | 繁栄 | 通常品揃え | 通常 | 通常価格 |
| 3 | 停滞 | 品揃え減少 | 通常 | 微高 |
| 2 | 衰退 | 品揃え激減 | 強敵出現 | 物価 x1.5 |
| 1 | 崩壊 | 利用不可 | ノイズ混入 | 闇市のみ |

### 5.2 影響: デッキ注入 (Deck Injection)
繁栄度に応じて `buildBattleDeck()` でカードを自動注入:
- **Lv 5**: ボーナスカード (Blessing)
- **Lv 1**: ノイズカード (Corruption)
- Injection cards は `isInjected: true`, `cost: 0`。

### 5.3 影響: インフレ
<!-- v2.9.3p: インフレ係数実装済み。初心者保護割引は廃止。 -->
> **実装済み (v2.9.3p)**: ショップ価格にはインフレ係数（繁栄度に基づく乗数）が適用される。初心者保護割引は廃止済み。

---

## 6. ビジュアル表現

### 6.1 WorldMap コンポーネント
- ノード: 拠点をSVG要素で描画。繁栄度に応じた色分け。
- エッジ: `connections` に基づく接続線。
- 現在地: 特別なマーカーで強調。
- インタラクション: ノードクリックで移動 / 情報表示。
- **null座標の処理**: `x` または `y` が null の場合、拠点は描画から除外（v11.0 修正）。
