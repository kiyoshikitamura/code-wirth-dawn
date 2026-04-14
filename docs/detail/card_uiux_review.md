# UI/UX レビューレポート ＆ アセット連携提案（カードマスタ編）

Logic-Expertによる「カードマスタ60種とショップ配分」を基に、プレイヤー体験を最大化するためのフロントエンドUI演出や、継続的なゲームプレイを促すための誘導UXについての提案を作成しました。

---

## 1. 手札制限とバトルUX（APコストの視覚的区別）

最大6枚の手札という制約の中で、APコスト（1〜5）の重みが直感的に伝わるUIデザインは極めて重要です。数字を見る前に、**カードの枠線の太さやオーラで強弱が本能的にわかる設計**を提案します。

### 【提案: Tailwindを活用したコスト別カードUI】
カードコンポーネント（`BattleCard.tsx`など）において、コストに応じたTailwindのクラスを出し分ける事で視覚的なメリハリをつけます。

* **AP 1〜2（汎用クラス・軽量）**
  * `border-slate-600 bg-slate-800`
  * デザイン: シンプルな薄いグレー枠。小回りがきく無骨なデザイン。
* **AP 3（主戦力・国家固有）**
  * `border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] bg-gradient-to-t from-blue-950 to-slate-900`
  * デザイン: 青い光を帯びており、ダメージソースや強力なヒールとして頼りになる質感を出す。
* **AP 4〜5（英雄専用・闇市・重コスト）**
  * `border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] bg-gradient-to-t from-amber-950 to-slate-900 animate-pulse`
  * デザイン: 強い黄金や赤熱したようなオーラを放つ（場合によっては `animate-pulse` で微細に明滅）。これを使ったターンの重みや一発逆転のロマンを強調。
  * 闇市スキルの場合は、アンバーではなく深い紫（ `border-purple-600` など）で禍々しさを表現。

**実装イメージ**:
```tsx
const getCostStyles = (ap: number) => {
    if (ap >= 4) return 'border-amber-500 shadow-amber-500/60 ring-1 ring-amber-400';
    if (ap === 3) return 'border-blue-500 shadow-blue-500/30';
    return 'border-slate-600';
}
<div className={`relative rounded-lg p-2 border-2 ${getCostStyles(card.ap_cost)}`}>
  <div className="absolute top-1 left-1 bg-black/80 rounded-full w-6 h-6 flex items-center justify-center font-bold text-white border border-slate-700">
    {card.ap_cost}
  </div>
  {/* カード内容 */}
</div>
```

---

## 2. ショップUIの誘導と探索のモチベーション

「国家固有スキルはその国の首都に行かないと買えない（手に入らない）」仕様は素晴らしいですが、プレイヤーがその事実を知らなければ「いつもの初期拠点でレベルを上げるだけのゲーム」に陥落します。
世界を旅するモチベーションを高めるため、以下のUXを提案します。

### ① 未解放（他国）スキルのシルエット開示
ショップUI（`ShopModal.tsx`等）にて、現在地の拠点で販売されているスキルの一覧の下段に、**「他の世界で噂される技術」として他国の固有スキルのシルエットを薄く表示**させます。

* **表示方法**: `opacity-30 grayscale blur-sm` を重ねたカード枠に、国名を薄く表示。
* **メリット**: 「強力な青枠（AP3）のカードがある」「"聖なる〜"という名前からしてローランに行けば手に入るのかも」という想像を強烈に掻き立てます。

### ② Rumors（噂話）APIとの連動
酒場の閑話休題やイベントノード（Textエリア）にて、NPCのセリフとして国家固有スキルを示唆させます。

* *「マルカンドの防砂兵が持つ『砂嵐の加護』……あれがあれば、この先の砂漠を抜けるのも造作ないはずなんだがな。」*
* *「夜刀の浪人たちが使う『ツバメ返し』という剣術、見たことがあるか？ ここ（ローラン）じゃ絶対に教えてもらえない秘伝の技術だそうだ。」*

これにより、「ゴールドが貯まったから次の国へ通行証を買って向かう」という明確なゲームの導線が生まれます。

### ③ 闇市への導線
「崩壊した拠点（Chaoticが高い状態）」の街でのみ出現する『闇市』では、UI自体を禍々しい赤黒いテーマ（`bg-red-950`）へと切り替え、カテゴリ4の「即死攻撃」などでプレイヤーに危険な誘惑を提示する演出を推奨します。

---

## 3. バトルv3.0 スキル効果のUI表示指針

バトルエンジンv3.0の実装に合わせ、スキル効果のUIテキストを**実装値に忠実に**表示するよう統一します。

### 3.1 カード詳細ポップアップのテキスト表示規則

| 効果 | UIテキスト例 |
|---|---|
| `def_up` (value=10) | 「2ターンの間、受けるダメージを **10** 軽減」 |
| `def_up_heavy` (value=30) | 「3ターンの間、受けるダメージを **30** 軽減（鉄壁）」 |
| `bleed_minor` | 「出血（軽微）: カード使用ごとに **+1** ダメージ」 |
| `bleed` | 「出血: カード使用ごとに **+3** ダメージ」 |
| `blind` | 「目潰し: 敵の攻撃が **50%** でミス」 |
| `blind_minor` | 「目潰し（軽微）: 敵の攻撃が **30%** でミス」 |
| `evasion_up` | 「回避UP: 攻撃を **30%** で回避」 |
| `atk_down` | 「ATK DOWN: 敵の攻撃力を **30%** ダウン」 |
| `instakill` | 「**30%** の確率で即死。失敗時は通常攻撃」 |
| `recoil` | 「全体攻撃後、最大HP **10%** を自傷」 |
| `cure_status` | 「毒・出血・スタン等の状態異常を**全解除**」 |
| `cure_debuff` | 「ATK DOWN・目潰し等のデバフを**解除**」 |

### 3.2 ツバメ返し（card_swallow_rev）の表示
ツバメ返しは `counter` の実装待ちのため、現在は**高威力単体攻撃（50固定ダメージ）**として動作します。  
UIテキスト: 「神速の一撃で **50** の大ダメージを与える。」

> ⚠️ **注意**: `description` カラムはDBからSQLで更新します（`update_card_descriptions.sql` 参照）。フロントエンドのハードコードは禁止。

### 3.3 カード説明文の更新手順
1. `update_card_descriptions.sql` をSupabaseのSQL Editorで実行
2. `cards` テーブルの `description` カラムが更新される
3. バトル画面のカード詳細ポップアップは `card.description` を表示するよう実装

---

## 4. カードデータのDB取得フロー（v3.3 実装確認）

### 4.1 現在の実装状態

| カード種別 | 画像表示 | description表示 | 取得元 |
|---|---|---|---|
| 装備スキル（user_skills経由） | ✅ | ✅ | `inventory/route.ts` → `cards` JOIN（v3.3でdescription追加） |
| 初期スキル（強打・斬撃・防御等） | ✅ | ✅ | 同上（user_skills テーブルで管理） |
| パーティカード（inject_cards） | ✅ | ✅ | `startBattle` → `/api/cards?ids=...` フェッチ |
| 環境カード（ノイズ等） | ❌（意図的） | ✅（固定） | `buildBattleDeck` 内でハードコード |

### 4.2 `inventory/route.ts` のカードデータ取得

```typescript
// user_skills JOIN で cards テーブルの全必要カラムを取得（v3.3）
cards (
    id, slug, name, type, cost_type, cost_val, effect_val,
    ap_cost, target_type, effect_id,
    image_url,    // ← v3.3で確実に取得
    description   // ← v3.3で追加（以前は欠落し card.name にフォールバックしていた）
)

// effectData の description 解決順序
description: skill.description || card.description || card.name
```

### 4.3 startBattle での image_url 取得フロー（v3.3）

```
startBattle()
    → fetchInventory() を必ず実行（キャッシュ破棄）
    → inventory の is_equipped スキルから equippedCards を生成
        → image_url: i.effect_data?.image_url || i.image_url
        → description: i.effect_data?.description || ''
    → /api/cards?ids=... でパーティカードプール取得
        → 基本カード(id=1-10)も含めてフェッチ
```

---

## 5. HPバーのリアルタイム同期（v3.3）

バトルUI（`BattleView.tsx`）ではタイプライターエフェクトとHPバーが連動する。

### 5.1 仕組み

ログメッセージ配列（`battleState.messages`）の中に、以下のマーカーを非表示メッセージとして挿入：

| マーカー | 対象 | タイミング |
|---|---|---|
| `__hp_sync:NNN` | プレイヤーHPバー | ダメージ受ける/回復するログの直後 |
| `__party_sync:ID:NNN` | パーティメンバーHPバー | パーティがダメージ/回復のログ直後 |

### 5.2 BattleView でのマーカー解析

```typescript
// processQueue() のタイプライター処理中
if (text.startsWith('__hp_sync:')) {
    const newHp = parseInt(text.split(':')[1]);
    setLiveHp(newHp);  // HPバーを即時更新
    // テキストログには表示しない
    setCurrentIndex(prev => prev + 1);
    return;
}
if (text.startsWith('__party_sync:')) {
    const [, id, valStr] = text.split(':');
    setLivePartyDurability(prev => ({ ...prev, [id]: Number(valStr) }));
    setCurrentIndex(prev => prev + 1);
    return;
}
```

### 5.3 マーカー挿入対象イベント一覧

| イベント | 挿入関数 | マーカー |
|---|---|---|
| 敵→プレイヤーへのダメージ | `processEnemyTurn` | `__hp_sync:newHp` |
| プレイヤーの治癒カード | `attackEnemy` (heal case) | `__hp_sync:newHp` |
| NPCがプレイヤーを治癒 | `processPartyTurn` | `__hp_sync:newHp` |
| 敵→パーティへのダメージ | `processEnemyTurn` | `__party_sync:ID:newDur` |
| NPCがパーティを治癒 | `processPartyTurn` | `__party_sync:ID:newDur` |

---

## 更新履歴

| 日付 | 内容 |
|---|---|
| 2026-04-11 | バトルv3.0スキル効果UI表示指針（§3）追加 |
| **2026-04-12** | **カードDB取得フロー（§4）・HPバーリアルタイム同期仕様（§5）追加（v3.3対応）** |
