Code: Wirth-Dawn Specification v12.0
# UGC Creator System & Visual Expansion

## 1. 概要 (Overview)
本仕様書は、ユーザーが独自のクエストやアセットを作成・公開するための「UGC（ユーザー生成コンテンツ）システム」の詳細と、それに伴うゲーム全体の「共通ビジュアル（画像表示）およびテキスト表現の拡張」について定義する。
UGCの実装に先立ち、公式コンテンツ（既存のマスターデータ）も含めたゲーム全体のUI/データ構造のアップデートを行う。

---

## 2. 共通仕様アップデート：ビジュアル拡張とテキスト2段階化
UGCおよび公式コンテンツの表現力を向上させるため、既存の仕様書（データベースとUI）に対して以下の拡張を行う。画像データはSupabase Storage等での管理を前提とする。

### 2.1 クエストテキストの2段階化
- **対象DB**: `scenarios` テーブル
- **追加カラム**:
  - `short_description`: クエスト一覧（ボード）に表示される簡素な依頼概要やキャッチコピー（最大40文字程度）。
  - `full_description`: クエストを受領（クリック）した際の詳細モーダルに表示される、依頼の背景や長文のフレーバーテキスト。

### 2.2 シナリオノードへの画像表示追加
- **対象データ**: `scenarios.flow` (JSONB) のノード定義
- **追加プロパティ**:
  - `speaker_image_url`: テキスト（会話）ノードにて、発言しているキャラクターの立ち絵やアイコンを表示可能にする。
  - **【UI/モバイル対応】**: SPA化に伴い、該当ノードでは `speaker_image_url` の画像を背景中央に透過表示させ、`full_description`（本文）および `choices`（選択肢）部分は画面下部に固定されるダイアログウィンドウ型UIとして結合表示する。

### 2.3 エネミー・NPC・アイテムの画像対応
以下のマスターデータテーブルおよび型定義に画像URLカラムを追加し、UI上で表示可能にする。
- **エネミー**: `enemies` テーブルに `image_url` を追加。バトル画面での敵グラフィックとして使用。
- **NPC / 残影**: `party_members` テーブルに `icon_url` または `image_url` を追加。バトル中のパーティUIや、酒場での雇用リストに表示。
- **アイテム / カード**: `items` テーブルおよび `cards` テーブルに `image_url` を追加。インベントリ画面やバトル中の手札UIに適用。

---

## 3. UGCクリエイターエディタ仕様 (UGC Editor)
ユーザーがゲーム内でクエストやアセットを作成するための専用エディタ機能。

### 3.1 クエスト作成の基本ルール
- **作成場所の制限**: エディタの起動および編集作業は、プレイヤーが「名も無き旅人の拠所」に滞在している時のみ可能とする。
- **発生場所の自由度**: クエストの出発拠点（発生場所）は、全20拠点の中から自由に選択・設定できる。
- **シナリオ構成**: 最大 **20ノード** まで拡張可能。会話、バトル、アイテム要求（`check_delivery` 等）に加え、一時的にNPCをパーティに加える「同行NPCノード」を配置できる。

### 3.2 カスタムアセット生成とTP（脅威度）システム
<!-- v12.1 (Phase 3): TP算出式・コスト表を実装値で確定 -->
プレイヤーが独自の画像（アップロード画像）を設定したエネミーや同行NPCを作成できる。バランス崩壊を防ぐため、ステータスは完全な自由入力ではなく「TPポイント制」とする。

- **TP (Threat Point) の割り振り**:
  - **Total TP 算出式**: `10 + (level × 5)`（例: Lv1=15TP, Lv10=60TP, Lv30=160TP, Lv50=260TP）
  - HP、ATK、DEF、および所持スキルは、このTPを消費して購入・割り振る。
  - **TPコスト表**:

| ステータス/スキル | TPコスト |
|---|---|
| HP +10 | 1 TP |
| ATK +1 | 2 TP |
| DEF +1 | 2 TP |
| 全体攻撃スキル付与 | 20 TP |
| `drain_vit`（寿命吸収）スキル付与 | 30 TP |

  - **バリデーション**: 消費TPが Total TPを超過している場合は`400 Bad Request`で保存をブロック。
  - **API**: `POST /api/ugc/asset/enemy`

- **アイテム / スキルカードの作成制限**:
  - アップロード画像と独自のフレーバーテキストを設定可能。
  - **レプリカ化**: 作成されたアイテムはすべて内部的に `is_ugc: true` が付与され、ショップ売却価格は 1 Gold に固定される。
  - **コスト算定**: カードの強さを `power_score = effect_value / max(ap_cost, 1)` で数値化し、`cost_val = clamp(round(power_score × 2), 1, 20)` として自動算出する。効果量が大きいのにAPコストが低い（壊れ性能）場合、cost_valは自動的に上限（20）に跳ね上がる。
  - **API**: `POST /api/ugc/asset/item`

---

## 4. 審査・公開とパブリッシュ税フロー (Publish Pipeline)
作成したクエストを世界に公開するためのライフサイクルと、経済インフレを防ぐためのロジック。
`scenarios` テーブルに `status` カラム（`draft`, `pending_review`, `published`, `unpublished`）を追加して管理する。

### 4.1 テストプレイ (Clear Check) の必須化
公開申請（Submit）を行う前に、クリエイター自身が「現在のキャラクターとデッキ」を使用して、作成したクエストを最後まで通しプレイし **クリア（勝利・完了）** しなければならない。
- **フルフローテストの実装 (v13.0)**: テストプレイは単なる敵とのバトルではなく、作成した `ScenarioEngine` のフロー全体（会話ノードの遷移、アイテム納品 `check_delivery` の動作などを含む）を実際に実行し、エラーなく終了（完了ノードへ到達）できるかを検証する仕様とする。
> ※テストプレイ中の敗北によるVitalityロストや、クリア時の報酬獲得・アイテム喪失は発生しない。

### 4.2 審査ステートとパブリッシュ税（ゴールドシンク）
<!-- v12.1 (Phase 2-A): 税計算式と実装詳細を追記 -->
<!-- v12.1 (Phase 3): 運営審査APIの詳細を確定 -->
1. **申請と仮引き落とし (`draft` → `pending_review`)** ✅ **実装済み** (`POST /api/ugc/publish`)
   - テストプレイ合格後、「審査申請」を実行する。
   - **公開枠チェック**: 申請前に `subscription_tier` を確認し、枠上限（Free:1, Basic:5, Premium:20）に達している場合は `403 Forbidden` を返す。
   - **パブリッシュ税の計算式**: `100 G（基本税）+ rewards.ugc_item.price`
     - `ugc_item.price` が未設定（カスタムアイテムなし）の場合は `500 G` をフォールバックとして使用。
   - **【UI対応】**: 申請（Submit）ボタンの近くに、動的に算出されたパブリッシュ税の額を明記する。所持ゴールドが不足している場合は赤文字で警告し、SubmitボタンをDisabled化する。
   - 税額が `user_profiles.gold` を上回る場合は API 側でも `400 Bad Request` を返し、処理を中断する。
   - ゴールド減算後、シナリオ更新に失敗した場合はゴールドを自動ロールバックする。
2. **申請の取り下げ (`pending_review` → `draft`)**:
   - 審査中にユーザー自身が取り下げた場合、ステータスが `draft` に戻り、仮引き落としされたパブリッシュ税は全額払い戻し（返金）される。
3. **運営審査 (Admin Review)** — `POST /api/admin/ugc/review`:
   - **認証**: `x-admin-secret` ヘッダー（`ADMIN_SECRET_KEY` 環境変数と照合）。
   - **承認 (Approve)**: `status: published` となり世界へ公開。税金はシステムに正式回収される。
   - **却下 (Reject)**: 不適切コンテンツ等で却下された場合、`draft` に戻り、パブリッシュ税（`100 + rewards.ugc_item.price`）が全額払い戻しされる。
4. **非公開化 (`published` → `unpublished`)** — `POST /api/ugc/archive`:
   - 公開中のクエストをユーザー任意で非公開（アーカイブ）にできるが、この際のパブリッシュ税の払い戻しは一切行われない。
   - アーカイブ前に `unpublished` 枠のチェックを行い、上限超過の場合は `403 Forbidden`。

---

## 5. サブスクリプション管理 (Monetization & Limits)
ストレージ保護とマネタイズのため、ユーザーのTier（サブスクリプション状況） に応じて公開・保存枠を制限する。

### 5.1 枠の制限
<!-- v12.1 (Phase 3): 実装値で確定・APIを明記 -->
<!-- v13.0: 3段階Tier (free/basic/premium) に更新 -->
| ユーザーTier | 公開枠 (published 上限) | アーカイブ枠 (unpublished 上限) | ドラフト保存枠 (draft 上限) |
|---|---|---|---|
| Free (無料) | 最大 1 クエスト | 最大 3 クエスト | 最大 4 クエスト |
| Basic (廉価版) | 最大 5 クエスト | 最大 10 クエスト | 最大 12 クエスト |
| Premium (高価版) | 最大 20 クエスト | 最大 50 クエスト | 最大 52 クエスト |

- **申請時チェック** (`POST /api/ugc/publish`): `published` 件数確認 → 超過で `403`
- **アーカイブ時チェック** (`POST /api/ugc/archive`): `unpublished` 件数確認 → 超過で `403`
- **ドラフト保存時チェック** (`POST /api/ugc/save`): 総クエスト数確認 → 超過で `400`
- **判定カラム**: `user_profiles.subscription_tier` (`'free'` / `'basic'` / `'premium'`)

### 5.2 制限時の挙動
- **公開のブロック**: 公開枠が上限に達している場合、新規クエストの審査申請（Submit）は実行できない。既存の公開クエストを非公開（アーカイブ）にするか削除して枠を空ける必要がある。
- **アーカイブのブロック**: アーカイブ枠が上限に達している場合、公開中のクエストを非公開に移行できない。既存アーカイブの完全削除が必要となる。

---

## 6. アバターカスタマイズ・通報・モデレーション

### 6.1 プレイヤーアバター (Avatar URL)
<!-- v12.1: 新規追加 -->
プレイヤーは自分のキャラクターアイコンをカスタマイズできる。

| 項目 | 仕様 |
|---|---|
| DB カラム | `user_profiles.avatar_url` （TEXT, nullable） |
| 初期値 | `/avatars/adventurer.jpg`（ローカル固定） |
| 変更API | `PATCH /api/character/avatar` |
| 許容形式 | JPEG / PNG / WebP |
| 最大サイズ | 2MB |
| ストレージ | Supabase Storage `avatars` バケット（`{userId}/avatar.{ext}`） |

**バリデーション**: フロントエンド（`AccountSettingsModal.tsx`）とバックエンドAPIの両方でファイルサイズ・形式チェックを実施。

**表示箇所**:
- アカウント設定モーダル（プレビュー）
- 宿屋ヘッダー (`InnHeader.tsx`)
- ステータス画面 (`StatusModal.tsx`)
- ワールドマップの現在地ピン (`world-map/page.tsx`): 自身の居場所を示す拠点の上に現在の `user_profiles.avatar_url` を円形インジケータとして描画。
- 英霊登録後、酒場の残影カード（`party_members.image_url` にコピーされる）

### 6.2 通報機能 (Report)

| 項目 | 仕様 |
|---|---|
| 通報API | `POST /api/report` |
| 管理テーブル | `reports`（`id`, `reporter_id`, `reported_user_id`, `target_url`, `reason`, `status`, `created_at`） |
| `status` | `'pending'` / `'resolved'` / `'dismissed'` |

### 6.3 運営審査フロー (Admin Moderation)
1. 通報が `reports` テーブルに `status: 'pending'` で蓄積される。
2. 運営がデータベースまたは管理ツールから通報を確認。
3. 不適切と判断した場合: `POST /api/admin/reset-avatar` でアバターをデフォルト（`/avatars/adventurer.jpg`）に強制リセット。
   - `user_profiles.avatar_url` → デフォルトに更新
   - `party_members.image_url` → デフォルトに更新（英霊登録分）
   - `reports.status` → `'resolved'` に更新
4. 不問とした場合: `reports.status` → `'dismissed'` に更新。
5. 悪質な違反者へのアカウント停止等のペナルティは将来的な拡張とする。
