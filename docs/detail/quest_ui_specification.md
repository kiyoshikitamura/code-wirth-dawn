# クエストUI仕様書

**最終更新**: 2026-04-22

## 概要

クエスト画面（`/quest/[id]`）のUI構成、レイアウト、ステータス表示ルールを定義する。

---

## レイアウト構成

```
┌─────────────────────────────────────┐
│  QuestHeader（固定上部）             │
│  ├ アバター + ステータスポップアップ   │
│  ├ HP バー（装備ボーナス込み）        │
│  ├ ATK / DEF / VIT / Gold           │
│  └ パーティ折りたたみ               │
├─────────────────────────────────────┤
│  ScenarioEngine / BattleView       │
│  （メインコンテンツ・フレックス拡張） │
└─────────────────────────────────────┘
```

### レスポンシブ対応

| 画面サイズ | レイアウト |
|---|---|
| モバイル（<1024px） | 全幅 × `100dvh` 全高。フレームなし |
| デスクトップ（≥1024px） | `max-w-[430px]` × `844px` のスマホフレーム表示 |

### safe-area 対応

- QuestHeader に `padding-top: max(env(safe-area-inset-top, 0px), 6px)` を適用
- iOS Safari のアドレスバー縮小時にも時計・電池残量と重ならない

---

## QuestHeader (`src/components/quest/QuestHeader.tsx`)

### HP 表示ルール

```
表示HP = userProfile.hp
表示MaxHP = getEffectiveMaxHp(userProfile, { equipBonus })
         = (userProfile.max_hp || 100) + equipBonus.hp
```

> **重要**: HPバーは装備ボーナスを含む実効値で計算する。
> バトル画面（BattleView）と同じ計算式を使用する。

### ステータス行

コンパクトにATK / DEF / VIT / Gold を表示:

- **ATK**: `userProfile.atk + equipBonus.atk`
- **DEF**: `userProfile.def + equipBonus.def`
- **VIT**: `userProfile.vitality / userProfile.max_vitality`（VIT ≤ 20 で赤色警告）
- **Gold**: `userProfile.gold`（カンマ区切り）

### ステータスポップアップ

- アバターをタップ → `StatusModal` を全画面表示
- StatusModal は宿屋画面と共通コンポーネント（`src/components/inn/StatusModal.tsx`）
- タブ構成: デッキ / 所持品 / 装備 / パーティ

### パーティ表示

折りたたみ式。メインパーティとゲストNPCを分離表示。

### 廃止した要素

| 要素 | 理由 |
|---|---|
| **MPバー** | MP システムは未実装。レガシーコードとして `max_mp`, `mp` をUI・型定義・APIから完全削除 |

---

## ScenarioEngine (`src/components/quest/ScenarioEngine.tsx`)

### バトルノード表示

- 敵名: `currentNode.enemy_name || params.enemy_name || '敵勢力'`
  - CSVにenemy_nameが未定義の場合、「敵勢力」を汎用表示
- 戦闘開始ボタン: 赤背景の大型ボタン

### ノードタイプ一覧

| type | 説明 |
|---|---|
| `text` | テキスト表示 |
| `battle` | 戦闘遭遇 |
| `travel` | 拠点移動 |
| `guest_join` | ゲストNPC合流 |
| `leave` | メンバー離脱 |
| `check_possession` | アイテム所持チェック |
| `check_delivery` | 納品チェック |
| `trap` / `modify_state` | HP減少トラップ |
| `reward` | 報酬付与 |
| `end` | シナリオ終了 |

---

## バトル開始フロー (`QuestPage.startBattle()`)

```
1. ScenarioEngine → onBattleStart(enemy_group_id, successNodeId)
2. enemy_group_id で enemy_groups テーブルを検索
3. members JSON配列から敵slugリストを取得
4. enemies テーブルから各slugの詳細データを取得
5. Enemy[] を構築して gameStore.startBattle() に渡す
6. viewMode を 'battle' に切替
```

### フォールバック

- 敵データがDB未登録の場合、「正体不明の敵」(HP:80, DEF:3) をフォールバック生成
- 進行不能を防止するための安全策

---

## BattleView (`src/components/battle/BattleView.tsx`)

### 背景画像

- `bgImageUrl` プロパティが渡された場合のみ背景表示
- 未指定時はグラデーション背景のみ（外部URL依存を排除）

### HP表示

- プレイヤーHP: `liveHp` (タイプライター表示中の即時反映値)
- パーティHP: `livePartyDurability` (メンバーID → HP のマップ)
