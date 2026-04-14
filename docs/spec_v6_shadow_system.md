Code: Wirth-Dawn Specification v13.0 (Active Shadow 詳細仕様追記 2026-04-13)
# Shadow Mercenary System

## 1. 概要 (Overview)
「残影 (Shadow)」システムは、他プレイヤーのキャラクターを傭兵NPCとして雇えるシステムである。
プレイヤーのキャラクターデータのスナップショットがNPC化され、他プレイヤーのパーティに参加する。

> **重要**: 本システムはリアルタイム協力プレイではない。別プレイヤーの操作はAI制御の「残影コピー」たる傭兵として動作する。

<!-- v12.0: UI改修・傭兵料金変更を反映 -->


---

## 2. 残影の種別

| 種別 | origin_type | 説明 | AI Grade |
|---|---|---|---|
| アクティブ残影 | `shadow_active` | 現在同じ拠点にいる生存プレイヤーのスナップショット | `random` |
| 英霊 (Heroic) | `shadow_heroic` | 引退/死亡したキャラクターの固定データ | `smart` |
| システムNPC | `system_mercenary` | ゲームが提供する固定NPC | `random` |

---

## 3. 登録と管理

### 3.1 残影登録
- 引退 / 死亡時に `LifeCycleService.handleCharacterDeath()` 内で自動登録。
- `party_members` テーブルに `origin: 'ghost'`, `origin_type: 'shadow_heroic'` として保存。

### 3.2 party_members テーブル
<!-- v11.0: 実装のスキーマを反映 -->
```sql
CREATE TABLE party_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  gender TEXT DEFAULT 'Unknown',
  origin TEXT DEFAULT 'system',       -- 'system' | 'ghost'
  origin_type TEXT,                    -- 'system_mercenary' | 'shadow_heroic' | 'active_shadow'
  job_class TEXT,
  durability INT DEFAULT 100,
  max_durability INT DEFAULT 100,
  atk INT DEFAULT 0,                  -- v8.1: 基礎攻撃力 (0-15). カード攻撃に加算される。英靈登録時に user_profiles.atk をコピー。
  def INT DEFAULT 0,
  cover_rate INT DEFAULT 20,          -- 0-100
  loyalty INT DEFAULT 50,
  inject_cards INT[],                  -- Card IDs
  passive_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  icon_url TEXT,                       -- NPCアイコンまたは立ち絵
  image_url TEXT,                      -- 同上
  personality TEXT,
  location_id UUID REFERENCES locations(id)
);
```

---

## 4. バトル中の挙動

### 4.1 基本ルール
- 固定手札: `inject_cards` → `signature_deck` として解決。
- AI行動: `processPartyTurn()` 内で実行（詳細: v2 Addendum NPC AI 仕様）。
- Cover: `cover_rate` に基づき確率でプレイヤーへのダメージを庇う。
- 死亡: `durability <= 0` → `is_active: false`, DBに即反映。

### 4.2 AI Grade別の挙動
| Grade | 特徴 |
|---|---|
| `random` | デッキからランダムに1枚選択して使用 |
| `smart` | 効率的なスキル選択（※現状は random と同等の実装） |

---

## 5. 酒場 (Tavern) システム
<!-- v11.0: /api/party/list の実装を反映 -->
<!-- v12.1: 通報機能を追記 -->

### 5.1 雇用可能NPCの表示
- **API**: `GET /api/party/list?owner_id={userId}`
- 現在地の `location_id` に基づき、雇用可能なNPCを表示。
- 既にパーティに参加しているNPCは非表示。
- 残影カードに表示される `icon_url` / `image_url` は引退時の `avatar_url` を引き継いでいる。

### 5.2 雇用と契約金 (spec v14 実装済み)

*   **API**: `POST /api/party/hire`
*   パーティ上限: **4名**（プレイヤー含め最大5名）。
*   **契約金算出式**: `5,000G（基本料） + (レベル × 1,000G)`
*   **ロイヤリティ分配（英霊 `shadow_heroic`）**:
    *   契約金の **20%** が元プレイヤーに還元。
    *   残りの **80%** はシステム税として消滅。
    *   **日額上限**: 元プレイヤーのレベルに依存（Lv1-10=100G/日, Lv11-20=300G/日, Lv21+=50,000G/日）。超過分はシステム税となる。
    *   元プレイヤー自身が自分の英霊を雇用した場合は分配金は発生しない。
*   **ロイヤリティ分配（アクティブ残影 `shadow_active`）**:
    *   Subscription Tier に応じたレートで元プレイヤーに還元。

    | Subscription Tier | ロイヤリティ率 |
    |---|---|
    | Free | 10% |
    | Basic | 30% |
    | Premium | 50% |

    *   **日額CAP**: 英靈と同様に Lv 連動の日額上限を適用（**§5A.4**参照）。超過分はシステム税となる。
    *   元プレイヤーがオフラインまたは別拠点にいても還元は発生する。

*   **英霊の高額契約金**: 英霊（`shadow_heroic`）の雇用コストは、NPCのレベルやステータスに比例して飛躍的に高く設定される（強力なゴールドシンク）。

**定数一覧** (`src/constants/game_rules.ts`):
| 公式 | 定数 | 値 |
|---|---|---|
| システムNPC | `HIRE_MERCENARY_PER_LEVEL` | Lv×100G |
| アクティブ残影 | `HIRE_ACTIVE_PER_LEVEL` | **Lv×1,000G** |
| 英霊（基本料） | `HIRE_HEROIC_BASE` | 5,000G |
| 英霊（Lv迻加） | `HIRE_HEROIC_PER_LEVEL` | 1,000G |


### 5.3 解雇
- **API**: `POST /api/party/dismiss`
- パーティから除外し、酒場に戻す。

---

## 5A. アクティブ残影（同拠点プレイヤー雇用）の詳細仕様

<!-- v13.0: 調査レポートのギャップ分析に基づき追記 -->

### 5A.1 酒場リストの表示条件

`GET /api/party/list` この3つの条件を全て満たすプレイヤーのみ表示される。

| 条件 | 詳細 |
|---|---|
| 同拠点 | `current_location_id` が雇用者と同一 |
| アクティブ判定 | `updated_at` が現在時刱30晄32分時間指定（「24時間以内」） |
| 生存種別 | `is_alive = true` |

- **服し自身は除外**: `neq(id, currentUserId)`
- **既雇用製は除外**: 既に自パーティの `source_user_id` に存在するプレイヤーは魔除
- **表示上限**: 10件（システムNPC・英靈と合算）

### 5A.2 雇用時のサーバー側バリデーション

`POST /api/tavern/hire` 内で以下をサーバー側にて再検証する。

| ステップ | 内容 |
|---|---|
| 1 | 雇用対象が `is_alive = true` |
| 2 | 雇用者と雇用対象の `current_location_id` が一致（同拠点再検証） |
| 3 | 契約金をサーバー側で再計算（`level * HIRE_ACTIVE_PER_LEVEL`）クライアント値は不信任 |
| 4 | ゴールド残高チェック |
| 5 | embarge（名声マイナス）チェック |
| 6 | 重複雇用チェック（同名 or 同一 source_user_id） |
| 7 | パーティ上限チェック（最大4名） |

> **重要**: ステップ2により、雇用操作中に対象プレイヤーが別拠点に移動していた場合は契約が失敗する（「対象のプレイヤーは既に別の地点に移動しました」エラー）。

### 5A.3 stats ・デッキの参照元

雇用時の `user_profiles` から次の値を**スナップショット**として `party_members` テーブルに直接保存。

| フィールド | 参照先 (`user_profiles`) | `party_members` 保存先 |
|---|---|---|
| HP | `max_hp` | `durability`（耒久値として使用） |
| ATK | `attack` | `atk` |
| DEF | `defense` | `def` |
| デッキ | `signature_deck`（card ID配列） | `inject_cards`（card ID配列） |

> **重要**: 雇用後は `party_members` の値が固定される。元プレイヤーがステータスを山ててもリアルタイム山増しはされない。

### 5A.4 ロイヤリティ日額CAP（v13.0 新規定義）

`shadow_active` へのロイヤリティは、英靈と同様に日額CAPを適用する。

| 元プレイヤーの Lv | 日額CAP |
|---|---|
| Lv 1-10 | 100G / 日 |
| Lv 11-20 | 300G / 日 |
| Lv 21以上 | 50,000G / 日 |

- **超過分**: システム税として消滅（誤用防止）。
- **雇用者自身の残影を雇用した場合**: 分配金は発生しない。
- **元プレイヤーがオフライン/別拠点の場合**: 雇用後に還元は発生する。

### 5A.5 AIグレード

- `shadow_active` のAIは現在 `random`（デッキからランダムに1枚選択）で動作。
- `smart` グレードは設計されているが未実装（v13.0時点）。

### 5.5 傑兵一覧 UI 仕様 (v12.0新規)

#### 種別バッジ
傑兵カードの左上に `origin_type` に応じたバッジを表示する。

| `origin_type` | バッジ | 色 |
|---|---|---|
| `shadow_active` | 「残影」 | 青（`bg-blue-600 text-white`）|
| `shadow_heroic` | 「英霊」 | 金（`bg-amber-500 text-slate-950`） |
| `system_mercenary` | なし | — |

#### コンパクトカード情報表示順
1. アイコン + 称号+名前 + バッジ + 契約金（一行目）
2. Lv ・ 職業（日本語） + スキルタグ 最大4枚（二行目）

#### 詳細ポップアップ ステータス表示順
- HP → 攻撃 → 防御（この順序固定）

### 5.6 影の記録タブ (v12.0新規)
酒場UIの「影の記録」タブは「自分の英霊ダッシュボード」として実装される。

- **表示内容**:
  - 「残影とは」説明文
  - サブスクリプション別英霊登録上限
  - 自分の英霊リスト（`/api/tavern/my-heroic`から取得）

- **登録クエリ API**: `GET /api/tavern/my-heroic?user_id={id}`
  - `historical_logs`テーブルから自分のレコードを取得
  - `{ heroics: [{ name, level, job_class, created_at }], subscription_tier, max_slots }`

- **登録は手動不可**: 引退/死亡時に`LifeCycleService`が自動登録。

### 5.4 アバター通報 (Report)
不適切なアバター画像（`image_url`）を発見した場合、タバーン内の残影カードから通報できる。

- **UI**: 残影カードのアイコン右下に🚩ボタン（`system_mercenary` には表示しない）。
- **API**: `POST /api/report`
  - Body: `{ reported_user_id, target_url, reason }`
  - `reports` テーブルに INSERT し、`status: 'pending'` で管理。
- **通報理由の選択肢**: 「不適切な画像」「公序良俗に反する」「その他」
- **運営アクション**: 管理者が確認後、`POST /api/admin/reset-avatar` を実行して対象ユーザーの `avatar_url` と `party_members.image_url` をデフォルト画像にリセット。

---

## 6. 経済システム (Royalty Economy)
<!-- v11.0: 実装済み -->

### 6.1 ロイヤリティ収入（設計のみ）
- 他プレイヤーが自分の残影を雇用した際、バトル参加回数に応じてゴールドを獲得。
- サブスクリプション加入者はロイヤリティ倍率ボーナス。

### 6.2 共鳴ボーナス (spec v14 実装済み)
- **発動条件**: 現在地の `current_location_id` に過去1時間以内に活動した他プレイヤーが1人以上いる場合
- **効果**: バトル開始時にATK / DEF +10%（`Math.ceil(x × 1.1)`）
- **UI**: 開始メッセージに「⚡ 共鳴ボーナス発動！ (ATK/DEF +10%)」を表示
- **実装**: `gameStore.startBattle()` 内で同拠点クエリを実行、`resonanceActive` フラグを `BattleState` に保存

---

## 7. 制約と制限 (spec v14 実装済み)

| 制約 | ルール | 実装状態 |
|---|---|---|
| デッキ検証 | 登録時に消耗品 (`consumable`) の除外 | **簡略化実装** |
| ロイヤリティ上限 | レベルに応じた日額制限 | **実装済み** |
| 契約終了 | 30日間未使用で自動解除 | **実装済み** |
| 同名登録 | 同名のShadow/Heroicは1人しか登録できない。再登録は前のデータを上書き（Update）する。 | **実装済み** |
| 英霊データ清掃 | 雇用されていない状態で**30日間**経過した「英霊」のデータは、日次の世界変遷のタイミングで論理削除（`is_active = false`）される。 | **実装済み** |

### 7.2 雇用ブロック (Embargo Penalty)
- プレイヤーの該当拠点における名声 (Reputation) が **0 未満 (マイナス)** になった場合、その酒場での「残影雇用」はシステム的にブロック（APIで403エラー、UIで無効化）される。