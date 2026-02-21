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

**ローラン聖帝国圏**
- 王都レガリア (regalia) — 首都
- フェルクリンゲン (volklingen)
- アイゼンブルク (eisenburg)
- シャンポール (champor)
- 国境砦エーデルシュタイン (edelstein)

**砂塵の王国マルカンド圏**
- 黄金都市イスハーク (ishak) — 首都
- 交易都市サマラ (samara)
- 砂漠のオアシス・バスラ (basra)
- 遺跡都市ニシャプール (nishapur)
- 自由港ダール (dar)

**夜刀神国圏**
- 神都「出雲」(izumo) — 首都
- 古城「天満」(tenma)
- 漁港「松浦」(matsuura)
- 温泉地「別府」(beppu)
- 関門「壇ノ浦」(dannoura)

**華龍神朝圏**
- 天極城「龍京」(ryukyo) — 首都
- 港町「明州」(meishu)
- 辺境の村「雲南」(unnan)
- 学問都市「洛陽」(rakuyo)
- 要塞「長城」(chojo)

---

## 3. 座標とマップ

### 3.1 マップ座標
<!-- v11.0: x/yで実装（旧仕様の map_x/map_y ではない） -->
各拠点は `x: INT`, `y: INT` のピクセル座標を持つ。`WorldMap.tsx` コンポーネントがこれに基づきSVGノードをプロット。

### 3.2 接続描画
`connections: TEXT[]` に隣接拠点の slug を格納。WorldMap はこのデータに基づき街道ライン（Edge）を描画。

---

## 4. 隣接移動と移動コスト

### 4.1 neighbors フィールド
<!-- v11.0: Record<string, number>の実装を反映 -->
```typescript
neighbors: Record<string, number>;  // { "target_slug": days_cost }
```

旧仕様の `{ days: number, type: string }` は採用せず、**移動日数のみ**を格納。

### 4.2 移動コスト API
<!-- v11.0: POST /api/travel/cost の実装を反映 -->
```
POST /api/travel/cost
Body: { target_location_slug: string }
Response: { from: string, to: string, days: number }
```

**処理フロー**:
1. ユーザーの `current_location_id` から現在地を取得。
2. 現在地の `neighbors` から `target_slug` をルックアップ。
3. 一致すれば日数を返却、不一致ならエラー。

> **Note (v11.0)**: Dijkstra等の最短経路探索は未実装。隣接拠点への直接移動のみサポート。非隣接拠点への移動はエラー (400) を返す。

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
<!-- v11.0: 現実装ではインフレ計算は未適用。将来的に追加予定。 -->
> **⚠️ 未実装**: ショップ価格へのインフレ係数適用は未実装。現在は `base_price` を直接使用（初心者保護を除く）。

---

## 6. ビジュアル表現

### 6.1 WorldMap コンポーネント
- ノード: 拠点をSVG要素で描画。繁栄度に応じた色分け。
- エッジ: `connections` に基づく接続線。
- 現在地: 特別なマーカーで強調。
- インタラクション: ノードクリックで移動 / 情報表示。
- **null座標の処理**: `x` または `y` が null の場合、拠点は描画から除外（v11.0 修正）。
