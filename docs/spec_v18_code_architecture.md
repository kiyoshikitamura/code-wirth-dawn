# Code: Wirth-Dawn — コードアーキテクチャ仕様 v1.0

## 概要

本ドキュメントは `Code: Wirth-Dawn` フロントエンドのソースコード構成と、各モジュールの責務を定義する。

バトルシステム・クエストシステムともに **クライアントサイド中心** で実装されており、状態管理には [Zustand](https://github.com/pmndrs/zustand) を採用している。2026年4月のリファクタリング (v1.0) により、モノリシックな `gameStore.ts` をドメインスライスへ分割した。

---

## 1. ディレクトリ構造（主要部分）

```
src/
├── app/                  # Next.js App Router ページ
│   ├── inn/page.tsx      # 旅籠（メインハブ）
│   ├── quest/[id]/       # クエストページ
│   └── ...
│
├── components/
│   ├── battle/           # バトルUI
│   │   ├── BattleView.tsx               # バトル画面本体 (~970行)
│   │   ├── StatusEffectBadges.tsx       # 状態異常バッジ
│   │   └── hooks/
│   │       └── useBattleTypewriter.ts   # [NEW v1.0] タイプライター管理
│   ├── quest/
│   │   ├── ScenarioEngine.tsx           # クエストノードエンジン (~560行)
│   │   └── hooks/
│   │       └── useScenarioNodeProcessor.ts  # [NEW v1.0] ノード自動処理フック
│   └── inn/
│       ├── StatusModal.tsx
│       └── TavernModal.tsx
│
├── store/                # Zustand 状態管理
│   ├── gameStore.ts      # [SLIM v1.0] エントリポイント (~75行)
│   ├── types.ts          # [NEW v1.0] GameState 型定義
│   ├── useQuestState.ts  # クエスト進行状態
│   └── slices/           # [NEW v1.0] ドメインスライス
│       ├── index.ts         # バレルエクスポート
│       ├── profileSlice.ts  # プロフィール・装備・ゴールド
│       ├── battleSlice.ts   # バトルロジック全体
│       ├── inventorySlice.ts # インベントリ
│       └── questSlice.ts    # クエスト・戦術・逃走
│
├── lib/                  # ピュアロジックライブラリ
│   ├── battleEngine.ts   # ダメージ計算・デッキ構築
│   ├── statusEffects.ts  # 状態異常ロジック
│   ├── npcAI.ts          # NPC AI 判断ロジック
│   ├── enemySkills.ts    # 敵スキル定義
│   ├── cardEffects.ts    # カード効果分類
│   ├── targeting.ts      # ターゲット選択
│   ├── passiveEffects.ts # パッシブ効果
│   └── soundManager.ts   # BGM/SE 管理
│
├── types/
│   └── game.ts           # ゲーム型定義 (Card, Enemy, BattleState, etc.)
│
└── constants/
    └── game_rules.ts     # 成長ルール (GROWTH_RULES)
```

---

## 2. 状態管理アーキテクチャ（Zustand スライスパターン）

### 2.1 背景と設計方針

リファクタリング前 (v14.0 以前) は全ゲームロジックが `src/store/gameStore.ts` 1ファイル（2,154行）に集中していた。

v1.0 リファクタリングでは **スライスパターン** を採用し、以下を実現した：

- `useGameStore()` の呼び出し方は **全ての既存コンポーネントで変更なし**（破壊的変更ゼロ）
- `create()` と `persist()` 設定のみが `gameStore.ts` に残る
- ロジックは責務単位のスライスファイルに移動

### 2.2 スライス一覧

| ファイル | 責務 | 主要アクション |
|---|---|---|
| `slices/profileSlice.ts` | プロフィール、ワールド、装備、ゴールド | `fetchUserProfile`, `fetchWorldState`, `fetchHubState`, `fetchEquipment`, `addGold`, `spendGold` |
| `slices/battleSlice.ts` | バトル全体 | `startBattle`, `attackEnemy`, `runNpcPhase`, `runEnemyPhase`, `advanceTurn`, `processPartyTurn`, `processEnemyTurn`, `dealHand`, `useBattleItem` |
| `slices/inventorySlice.ts` | インベントリ | `fetchInventory`, `toggleEquip` |
| `slices/questSlice.ts` | クエスト・戦術・逃走 | `selectScenario`, `setTactic`, `setTarget`, `fleeBattle`, `waitTurn` |

### 2.3 gameStore.ts の構造（v1.0 以降）

```typescript
// src/store/gameStore.ts — エントリポイントのみ（~75行）

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            // 初期値のみ記述
            userProfile: null,
            battleState: INITIAL_BATTLE_STATE,
            // ...

            // スライスを展開
            ...createProfileSlice(set, get),
            ...createBattleSlice(set, get),
            ...createInventorySlice(set, get),
            ...createQuestSlice(set, get),
        }),
        { name: 'game-storage', ... }
    )
);
```

### 2.4 getEffective ヘルパー関数の配置

装備ボーナス・共鳴ボーナスを含む有効ステータスの計算関数は `profileSlice.ts` でエクスポートされ、`battleSlice.ts` がインポートして使用する。

```typescript
// src/store/slices/profileSlice.ts
export function getEffectiveAtk(userProfile, battleState): number
export function getEffectiveDef(userProfile, battleState): number
export function getEffectiveMaxHp(userProfile, battleState): number
```

> **Note**: 旧仕様書 spec_v2 Section 10.3 では `src/store/gameStore.ts` に定義されていると記載していたが、リファクタリング後は `src/store/slices/profileSlice.ts` に移動した。

---

## 3. カスタムフック構成

### 3.1 `useBattleTypewriter` (NEW v1.0)

**パス**: `src/components/battle/hooks/useBattleTypewriter.ts`

バトルログのタイプライター表示・キュー管理・HP同期を `BattleView.tsx` から分離したフック。

**提供する状態:**
- `displayedLogs`, `typingText` — 表示ログ
- `isTypingDone` — キュー処理完了フラグ
- `liveHp`, `livePartyDurability` — タイプライターと同期したHPバー値

**提供するアクション:**
- `processQueue()` — キューから1メッセージを処理
- `flushQueue()` — キュー即時フラッシュ（NEXT 早送り用）
- `enqueuedUpToRef` — stale closure 防止インデックス

**メッセージマーカー対応:**

| マーカー | 処理 |
|---|---|
| `__hp_sync:NNN` | `setLiveHp(NNN)` — HPバー更新のみ（非表示） |
| `__party_sync:ID:NNN` | `setLivePartyDurability` — パーティHPバー更新（非表示） |
| `--- ... ---` | 即時表示（タイプライターなし） |
| その他 | タイプライター（20ms/文字） |

---

### 3.2 `useScenarioNodeProcessor` (NEW v1.0)

**パス**: `src/components/quest/hooks/useScenarioNodeProcessor.ts`

`ScenarioEngine.tsx` のノード自動処理 `useEffect` を抽出したフック。全ての `processNode()` ロジックを担う。

**対応ノードタイプ:**

| ノードタイプ | 処理内容 |
|---|---|
| `random_branch` | 確率分岐 |
| `check_status` | アライメント条件チェック |
| `check_possession` | アイテム所持チェック |
| `check_equipped` | 装備チェック |
| `check_delivery` | 納品チェック（API消費） |
| `travel` | 移動コスト計算API呼び出し |
| `guest_join` | ゲストNPC参加API呼び出し |
| `leave` | ゲストNPC離脱 |
| `trap` / `modify_state` | トラップダメージ |
| `modify_flag` | クエストフラグ操作 |
| `check_flags` | クエストフラグ条件分岐 |
| `modify_reputation` | 名声変動API呼び出し |
| `reward` | 中間報酬付与API呼び出し |
| `shop_access` | ショップリダイレクト |
| `end` | クエスト終了状態セット |

---

## 4. バトルシステム責務分担

```
BattleView.tsx (UI・イベントハンドリング)
  ├── useBattleTypewriter (ログ表示・HP同期)
  └── useGameStore (状態参照・アクション)
       └── battleSlice.ts (ゲームロジック)
            ├── battleEngine.ts (ダメージ計算)
            ├── statusEffects.ts (状態異常)
            ├── npcAI.ts (NPC判断)
            ├── enemySkills.ts (敵スキル)
            └── profileSlice.ts (ステータス計算)
```

---

## 5. クエストシステム責務分担

```
quest/[id]/page.tsx (ページ・バトル統合)
  └── ScenarioEngine.tsx (ノードUI・選択肢表示)
       ├── useScenarioNodeProcessor (ノード自動処理)
       └── useQuestState (クエスト진行状態)
```

---

## 6. バージョン履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| v1.0 | 2026-04-15 | 初版。gameStore.ts スライス分割、useBattleTypewriter、useScenarioNodeProcessor 抽出。ScenarioEngine 988行→559行、gameStore 2,154行→75行 |

---

## 7. 開発ガイドライン

### 新機能追加時のルール

1. **バトルロジック変更** → `src/store/slices/battleSlice.ts` を編集
2. **プロフィール/ステータス変更** → `src/store/slices/profileSlice.ts` を編集
3. **新しいストアアクション追加** → 対応するスライスに追加後、`src/store/types.ts` の `GameState` インターフェースを更新
4. **BattleView に状態を追加** → まず `useBattleTypewriter` や他フックへの切り出しを検討
5. **ScenarioEngine に新ノードタイプ追加** → `useScenarioNodeProcessor.ts` の `processNode` 関数内に追加

### 型安全性

- `GameState` の型定義は `src/store/types.ts` で一元管理
- 各スライスの `set` / `get` は `GameState` を参照するため型安全
- `npx tsc --noEmit` でコンパイルエラーがないことを確認してからコミット
