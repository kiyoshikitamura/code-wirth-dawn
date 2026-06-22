Code: Wirth-Dawn Specification v13.2 (v4.1 英霊改善 2026-05-16)
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
  durability INT DEFAULT 100,          -- Vitality (VIT): パーティメンバーの寿命。クエスト毎に減少。
  max_durability INT DEFAULT 100,       -- バトルHP上限 (npcs.max_hp からスナップショット)
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
- バトルHP0: バトル中のHPが0になった場合、バトルから脱落。DBで`is_active=false, durability=0`に即時更新。
- VIT0離脱: クエスト完了時にVIT（`durability`カラム）が0以下になると`party_members`から削除され離脱。形見アイテム生成。

> **用語定義 (v4.1)**: 「バトルHP」= `max_durability`（バトル毎にリセット）。「VIT(寿命)」= `durability`（クエスト完了毎に減少、回復困難）。
> - UIでの表示において、プレイヤーのVIT上限が100であるのに対しNPCのdurabilityは高値（例: 250等）をとるため、NPCのVITはパーセンテージ `(durability / max_durability) * 100` で100点満点に正規化して表示する。
> - クエスト結果画面での寿命減少表示は、誤解を避けるため「VIT」ではなく「耐久」ラベル（例: `耐久 250 ▸ 245`）を使用する。

- **VIT摩耗計算** (`POST /api/quest/complete`):
  - 成功: -5, 失敗/撤退: -10, バトルHP0追加: -10
  - `is_active=false`（バトルで力尽きた）メンバーは `durability=0` として扱い確実に削除対象にする
  - 全`owner_id`メンバーを取得（`is_active`フィルタなし）し、バトル脱落メンバーの漏れを防止
  - `delete()` 失敗時は `update({is_active: false, durability: 0})` でフォールバック

### 4.2 AI Grade別の挙動
| Grade | 特徴 |
|---|---|
| `random` | デッキからコスト順に1枚選択して使用。バフ・デバフもロールに応じて使用 |
| `smart` | 攻撃カード**2枚/ターン**、AP貯蓄判断、クリティカル率上昇(8%)、緊急回復閾値優遍(50%)、**瘀死ターゲット優先攻撃**。詳細は spec_v3 §4.3 参照 |

### 4.3 レガシースキル（v4.1: 英霊固有APパッシブ）

`shadow_heroic` のみ、元キャラクターのレベルに応じたターン開始APボーナスを自動付与。

| 英霊レベル | レガシースキル名 | 効果 | 発動間隔 |
|:---:|:---|:---|:---:|
| Lv 1-9 | 残響の導き | AP+1 | 3ターンに1回 |
| Lv 10-19 | 古の知恵 | AP+1 | 2ターンに1回 |
| Lv 20-29 | 英雄の覇気 | AP+1 | 毎ターン |
| Lv 30+ | 不滅の加護 | AP+2 | 毎ターン |

実装: `npcAI.ts` 内の `getLegacySkill()` / `applyLegacySkill()`。

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

> **英霊の酒場リスト非表示ポリシー (v2.9.3f)**: 英霊（`shadow_heroic`）は酒場の雇用メインリストには**表示しない**。英霊の管理・閲覧は「影の記録」タブ（§5.6）専用。これはFree/国家枚と英霊が混在して表示不整合を引き起こしていたための措置。

---

## 5A. アクティブ残影（同拠点プレイヤー雇用）の詳細仕様

<!-- v13.0: 調査レポートのギャップ分析に基づき追記 -->

### 5A.1 酒場リストの表示条件

`GET /api/party/list` この3つの条件を全て満たすプレイヤーのみ表示される。

| 条件 | 詳細 |
|---|---|
| 同拠点 | `current_location_id` が雇用者と同一 |
| アクティブ判定 | `updated_at` が現在時刻から24時間以内 |
| 生存種別 | `is_alive = true` |

- **ただし自身は除外**: `neq(id, currentUserId)`
- **既雇用者は除外**: 既に自パーティの `source_user_id` に存在するプレイヤーは除外
- **表示上限**: 10件（システムNPCと合算。英霊は含まない）

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
| HP | `max_hp` | `max_durability`（バトルHP上限として使用） |
| ATK | `attack` | `atk` |
| DEF | `defense` | `def` |
| デッキ | `signature_deck`（card ID配列） | `inject_cards`（card ID配列） |

> **重要**: 雇用後は `party_members` の値が固定される。元プレイヤーがステータスを変更してもリアルタイム反映はされない。

### 5A.4 ロイヤリティ日額CAP（v13.0 新規定義）

`shadow_active` へのロイヤリティは、英靈と同様に日額CAPを適用する。

| 元プレイヤーの Lv | 日額CAP |
|---|---|
| Lv 1-10 | 500G / 日 |
| Lv 11-20 | 300G / 日 |
| Lv 21以上 | 50,000G / 日 |

- **超過分**: システム税として消滅（誤用防止）。
- **雇用時にソーシャル通知** (v4.1): 英霊/残影が雇われた際、元プレイヤーの `notifications` テーブルに「英霊「{name}」が雇われました！」通知をINSERT。
- **雇用者自身の残影を雇用した場合**: 分配金は発生しない。
- **元プレイヤーがオフライン/別拠点の場合**: 雇用後に還元は発生する。

### 5A.5 AIグレード

- `shadow_active` のAIは `random` グレードで動作。
- `shadow_heroic` のAIは `smart` グレードで動作（AP貯蓄・クリティカル率上昇・緊急回復閾値優遍）。
- 詳細は spec_v3_addendum_npc_ai.md §4.3 を参照。

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
- HP → ATK → DEF → VIT（この順序固定）

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

### 5.7 英霊の間タブ (v4.1新規)
酒場UIの第3タブ「英霊の間」は、全英霊を一覧表示し雇用できる専用UI。

- **API**: `GET /api/tavern/heroic-list?location_id={id}&user_id={userId}`
  - `party_members` から `origin_type = 'shadow_heroic'` かつ `is_active = false` を取得
  - 最大10件、レベル降順ソート
  - `ShadowSummary` 形式で返却（カード名も解決）
- **UI**: 傭兵カードと同様のレイアウト。英霊バッジ☆付き、クリックで詳細ポップアップ→雇用可能。

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

### 6.1 ロイヤリティ収入およびアトミック分配
- 他プレイヤーが自分の残影（`shadow_heroic` / `shadow_active`）を雇用した際、契約金の一部が元プレイヤーのゴールド残高に還元される。
- **アトミック処理（二重支払い防止）**: 同一残影に対する超高速連打やマルチ雇用時のレースコンディションを防ぐため、ゴールド還元処理はDB側の `process_royalty_payout` RPC（Postgresトランザクション内の行レベルロック）を通じて一元処理される。
- **日額上限制限**: レベルに応じた日額CAP（超過分はシステム税として処理）が厳密にアトミックに適用され、制限を超えた二重獲得は完全に防止される。
- サブスクリプション加入者はロイヤリティ倍率ボーナス。

### 6.2 共鳴ボーナス (spec v14 実装済み)
- **発動条件**: 現在地の `current_location_id` に過去1時間以内に活動した他プレイヤーが1人以上いる場合
- **効果**: バトル開始時にATK / DEF +10%（`Math.ceil(x × 1.1)`）
- **UI**: 開始メッセージに「⚡ 共鳴ボーナス発動！ (ATK/DEF +10%)」を表示
- **実装**: `battleSlice.startBattle()` 内で同拠点クエリを実行、`resonanceActive` フラグを `BattleState` に保存（旧: `gameStore.startBattle()` / v1.0 リファクタリングにより `src/store/slices/battleSlice.ts` に移動）

---

## 7. 制約と制限 (spec v14 実装済み)

| 制約 | ルール | 実装状態 |
|---|---|---|
| デッキ検証 | 登録時に消耗品 (`consumable`) の除外 | **簡略化実装** |
| ロイヤリティ上限 | レベルに応じた日額制限 | **実装済み** |
| 契約終了 | 30日間未使用で自動解除 | **実装済み (v4.1 修正)** |
| 同名登録 | 同名のShadow/Heroicは1人しか登録できない。再登録は前のデータを上書き（Update）する。 | **実装済み** |
| 英霊データ清掃 | `last_hired_at` が30日以上前かつ `is_active = true` の英霊を日次バッチで論理削除（`is_active = false`） | **実装済み (v4.1 修正)** |

### 7.2 雇用ブロック (Embargo Penalty)
- プレイヤーの該当拠点における名声 (Reputation) が **0 未満 (マイナス)** になった場合、その酒場での「残影雇用」はシステム的にブロック（APIで403エラー、UIで無効化）される。

---

## 8. 簡易プロフィールポップアップ (Simple User Profile Popup) (v27.1 新規)

他プレイヤーの「アバター画像（アイコン部分）」をタップした際に、画面中央に小さなポップアップで簡易的なプレイヤー情報を表示する。

- **表示条件**:
  - 酒場（`TavernModal`）の各リスト（同行、冒険者、英霊）でアバターアイコン部分をクリックした時。
  - 街の噂話（`GossipModal`）の酒場タブでアバターアイコン部分をクリックした時。
  - アイコン以外のリスト行をクリックした場合は、従来通り詳細雇用ポップアップを開く。
- **表示要素**:
  - アバター画像
  - 名前（通り名がある場合は連結して表示）
  - 自己紹介文 (`introduction`)。自己紹介が未設定の場合は「自己紹介は設定されていません。」を表示。
- **閉じる動作**:
  - 右上の「✕」ボタンクリック、またはポップアップ外の半透明の背景（オーバーレイ）をクリックした時に閉じる。
- **配置**:
  - 画面の完全中央。サイズは小さめのダイアログ。デザインはダークブラウンおよびアンティーク調ゴールドを基調とした世界観に統一する。

---

## 9. 開発・不具合改修における重要教訓 (v4.1.1 追記)

### 9.1 英霊雇用の検証対象クエリ不整合
- **問題**: 英霊の雇用時の契約金検証において、`historical_logs` を `shadow.profile_id`（`party_members` のIDであるUUID）で検索していたため、クエリが常に空となり「無効な英霊IDです」と判定されて雇用できない致命的なバグが存在した。
- **対策**: 英霊検証は `party_members` テーブルに対して `id = shadow.profile_id` で直接照合を行い、そこから `level` および元の所有者 `owner_id` を解決する構造とすること。

### 9.2 英霊雇用時のステータス保存漏れ
- **問題**: 雇用処理で新しく作成するアクティブなパーティメンバー行へのステータス（レベル、攻撃、防御）の引き継ぎが、残影（`shadow_active`）のみに制限されており、英霊（`shadow_heroic`）が無視されていたため、雇用された英霊のステータスが全て `NULL` になってしまっていた。
- **対策**: 雇用時のステータス引き継ぎ条件を `shadow_active || shadow_heroic` に緩和し、英霊のスナップショットステータスも正常にコピーされるようにする。

### 9.3 展開処理時のタイプ文字列の完全一致
- **問題**: `shadowService` 側では `shadow_active` として登録・インサートを行っているのに対し、`PartyService` 側では `active_shadow` でタイプ判定をしていたため不整合が生じていた。結果としてNPC優先解決ルートにフォールバックしてしまい、NPCと名前が重複するアクティブ残影プレイヤーが存在した場合にNPCのステータスで上書きされるバグを引き起こした。
- **対策**: 判定文字列を `'shadow_active'` に修正し、英霊（`'shadow_heroic'`）も含めて正しくスナップショットステータスが優先適用されるように判定式を厳密化する。