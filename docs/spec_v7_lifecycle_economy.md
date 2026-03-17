Code: Wirth-Dawn Specification v11.0 (Revised based on actual implementation)
# Lifecycle & Economy — Death, Succession, Newbie Protection

## 1. 概要 (Overview)
キャラクターの死亡・継承ルールと、初心者保護メカニクス、経済セキュリティを定義する。

<!-- v11.0: LifeCycleServiceの実装に合わせて改訂。初心者保護の実装範囲を明記。 -->

---

## 2. キャラクターの死亡 (Character Death)

### 2.1 死亡トリガー
| トリガー | 条件 |
|---|---|
| Vitality 枯渇 | `vitality <= 0` — 寿命が尽きた |
| 自主引退 | プレイヤー操作で `POST /api/character/retire` (cause: 'voluntary') |

### 2.2 死亡処理 (LifeCycleService.handleCharacterDeath)
<!-- v11.0: lifeCycleService.ts の実装を反映 -->
1. `user_profiles.is_alive = false` に更新。
2. 墓地データ (Graveyard) のスナップショットを作成。
3. レガシーポイント計算（次の世代への引き継ぎ用）。
4. サブスクリプション加入者の場合 → 英霊 (Heroic Shadow) として登録。

---

## 3. 継承 (Succession)
<!-- v11.0: LifeCycleService.processInheritance() を反映 -->

### 3.1 継承ルールと削減率 (spec v14 実装済み)

*   **継承対象**: 所持金(ゴールド) と インベントリアイテムのみ。
*   **知識/レシピ**: **開発範囲外（正式除外）**。次代プレイでは初期化される。
*   ゴールド継承上限: `[MAX: 50,000G]`。超過分はシステムが没収。
*   アイテム引継ぎ: 最大**5枠**まで選択可能（同名アイテムのスタックは1枠と数える）。

### 3.2 API: POST /api/character/retire
<!-- v12.1 (Phase 2-B): Bodyパラメータを正式化 -->
```
POST /api/character/retire
Body: {
  cause: 'dead' | 'voluntary',
  heirloom_item_ids?: string[],   // 形見にするアイテムIDの配列
  paid_gold_for_slots?: number    // 栖拡張のために支払うGold（50,000G→栖+1, 200,000G→栖+2）
}
```

---

## 4. 初心者保護 (Newbie Protection)
<!-- v11.0: 実装範囲を正確に記載 -->

### 4.1 定義
- **対象**: `user.level <= 5`

### 4.2 適用される保護

| 保護 | 効果 | 実装状態 |
|---|---|---|
| ショップ価格割引 | 繁栄度インフレ後の価格に対して **50%OFF**（闇市アイテムを除く） | ✅ 実装済み |
| ノイズカード混入防止 | 崩壊拠点でもノイズ未混入 | ✅ **実装済み** (`buildBattleDeck()`: `userLevel <= 5` の場合スキップ) |
| 対人攻撃防止 | PvPからの保護 | ❌ 企画から正式削除 |

---

## 5. 経済セキュリティ
<!-- v11.0: 未実装項目を明記 -->

> **⚠️ 大部分が未実装 (v11.0時点)**

### 5.1 UGCエコシステムの税とロイヤリティ (spec v14 実装済み)

UGCアセットが使用された場合、以下が適用される：
*   **パブリッシュ料**: 固定 500G
*   **雇用ロイヤリティ（英霊）**: 契約金の **20%** を登録プレイヤーに還元。
    *   **日額上限**: Lv1-10=100G, Lv11-20=300G, Lv21+=50,000G。上限超過分はシステム税となる。/日。

### 5.2 不正検知バッチ (spec v14 実装済み)
- **エンドポイント**: `POST /api/cron/fraud-detect`（Vercel Cron: 毎時0分）
- **検出条件**: `user_profiles.gold >= 500,000G` かつ `is_flagged = false` のアカウントを抽出。
- **対応**: `is_flagged = true`・`flagged_at = now()`・`flag_reason = 超過額の詳細` をDBに記録。
- **通知**: 環境変数 `DISCORD_WEBHOOK_URL` が設定されていれば Discord にアラートメッセージを送信。
- **必要カラム**: `user_profiles.is_flagged (BOOLEAN)`・`flagged_at (TIMESTAMPTZ)`・`flag_reason (TEXT)`（マイグレーション: `20260305000000_add_fraud_flag.sql`）


### 5.3 新機能での強力なゴールドシンク (v7.1 追加 / Phase 2-A 実装済み)
インフレを防ぐため、以下のゲームシステムをゴールドシンク（資金回収）として機能させる。
1. **パブリッシュ税 (Publishing Tax)** ✅ **実装済み**: ユーザーがUGCクエストを新規作成・公開する際、設定した報酬アイテムの価値（`ugc_item.base_price`、未設定時は50,000G）+ 基本税100Gをパブリッシュ税として支払う必要がある（`POST /api/ugc/publish`）。
2. **形見枠の拡張購入 (Premium Inheritance)**: 引退時、大量のゴールドを寄付することで、次代へ引き継げる形見スロットを拡張できる。
3. **英霊システム税** ✅ **実装済み**: 酒場で英霊（`shadow_heroic`）を雇用する際、高額な契約金（`5,000G + Level × 1,000G`）が要求される。そのうち **80%** がシステム税として消滅し、**20%** のみが元プレイヤー（`owner_id`）へロイヤリティとして付与される（`POST /api/tavern/hire`）。
4. **闇市の禁術の秘薬** ✅ **実装済み**: 崩壊拠点（Prosperity=1）限定で販売される、Vitalityを1回復できる超高額アイテム（50,000G）。崩壊拠点では通常アイテムが非表示となり、闇市アイテムのみ表示される。

### 5.4 経済的ペナルティ (Bounty Hunters)
- **賞金稼ぎの襲撃**: 特定拠点での名声が激減（-100以下）した状態で移動した場合、確定で「賞金稼ぎ」の強敵とエンカウントする。このバトルに敗北した場合、通常の「リタイア（Vitality 0）」ではなく、「所持ゴールドの半分（または全額）を没収される」という特殊な経済ペナルティが適用される。

---

## 6. 祈りと可視化 (Prayer)

### 6.1 祈りの仕組み
- プレイヤーはゴールドを消費して、拠点の属性値にブーストをかける。
- **API**: `POST /api/world/pray`
- 集計結果はワールド状態更新に反映。

### 6.2 可視化
- 祈り実行時のエフェクト表示（クライアントサイド演出）。
- ワールドマップ上で祈りの集中度を表現（将来実装）。