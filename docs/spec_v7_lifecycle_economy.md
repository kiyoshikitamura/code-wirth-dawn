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

### 3.1 継承ルール

| 資産 | 継承ルール | 上限 |
|---|---|---|
| ゴールド | 前世代の50%を引き継ぎ | なし |
| 名声 | 前世代の各拠点名声の30%を引き継ぎ | 各拠点の上限に従う |
| 形見アイテム | 1個のみ選択して引き継ぎ | 1個 |

> **Note (v11.0)**: レシピ/知識の継承は**未実装**。

### 3.2 API: POST /api/character/retire
```
POST /api/character/retire
Body: { cause: 'dead' | 'voluntary', heirloom_item_id?: string }
```

---

## 4. 初心者保護 (Newbie Protection)
<!-- v11.0: 実装範囲を正確に記載 -->

### 4.1 定義
- **対象**: `user.level <= 5`

### 4.2 適用される保護

| 保護 | 効果 | 実装状態 |
|---|---|---|
| ショップ価格割引 | 全アイテム **50%OFF** | ✅ 実装済み |
| ノイズカード混入防止 | 崩壊拠点でもノイズ未混入 | ❌ 未実装 |
| 対人攻撃防止 | PvPからの保護 | ❌ PvP自体が未実装 |

---

## 5. 経済セキュリティ
<!-- v11.0: 未実装項目を明記 -->

> **⚠️ 大部分が未実装 (v11.0時点)**

### 5.1 ロイヤリティ上限（設計のみ）
- レベルに応じた日額制限。
- Lv1-10: 100G/日、Lv11-20: 300G/日、Lv21+: 500G/日。

### 5.2 不正検知（設計のみ）
- 短時間でのゴールド急増を検出するバッチ。
- サブスクリプション特典の不正利用防止。

---

## 6. 祈りと可視化 (Prayer)

### 6.1 祈りの仕組み
- プレイヤーはゴールドを消費して、拠点の属性値にブーストをかける。
- **API**: `POST /api/world/pray`
- 集計結果はワールド状態更新に反映。

### 6.2 可視化
- 祈り実行時のエフェクト表示（クライアントサイド演出）。
- ワールドマップ上で祈りの集中度を表現（将来実装）。