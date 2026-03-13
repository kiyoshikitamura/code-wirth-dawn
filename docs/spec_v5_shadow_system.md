Code: Wirth-Dawn Specification v11.0 (Revised based on actual implementation)
# Shadow Mercenary System

## 1. 概要 (Overview)
「残影 (Shadow)」システムは、他プレイヤーのキャラクターを傭兵NPCとして雇えるシステムである。
プレイヤーのキャラクターデータのスナップショットがNPC化され、他プレイヤーのパーティに参加する。

<!-- v11.0: party_membersテーブルの実装に合わせて改訂。ロイヤリティ経済未実装を明記。 -->

---

## 2. 残影の種別

| 種別 | origin_type | 説明 | AI Grade |
|---|---|---|---|
| アクティブ残影 | `active_shadow` | 現在プレイ中のプレイヤーのコピー | `random` |
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
*   **ロイヤリティ分配**:
    *   契約金の **20%** が元プレイヤーに還元。
    *   残りの **80%** はシステム税として消滅。
    *   **日額上限**: 元プレイヤーのレベルに依存（Lv1-10=100G/日, Lv11-20=300G/日, Lv21+=50,000G/日）。超過分はシステム税となる。
    *   元プレイヤー自身が自分の英霊を雇用した場合は分配金は発生しない。
*   **英霊の高額契約金**: 英霊（`shadow_heroic`）の雇用コストは、NPCのレベルやステータスに比例して飛躍的に高く設定される（強力なゴールドシンク）。

### 5.3 解雇
- **API**: `POST /api/party/dismiss`
- パーティから除外し、酒場に戻す。

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
<!-- v11.0: 未実装であることを明記 -->

> **⚠️ 未実装 (v11.0時点)**

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