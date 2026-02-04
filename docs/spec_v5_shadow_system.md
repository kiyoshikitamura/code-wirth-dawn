Code: Wirth-Dawn Specification v5.0: Shadow Mercenary & Economy
1. 概要 (Overview)
本仕様書は、他プレイヤーのキャラクターデータをNPCとして雇用する「残影（Shadow）」システムの定義である。 spec_v2_battle_parameters.md で定義された「パーティメンバー＝生きた装備品」の概念を拡張し、**プレイヤー間の非同期経済圏（Gig Economy）**を構築する。
コア・コンセプト
1. Asynchronous Co-op: 他者はリアルタイムの仲間ではなく、強力なスキルを提供する「機能（Function）」として振る舞う。
2. Passive Income: 自分の残影が雇用されることで、ログアウト中もゴールド（活動資金）を獲得できる。
3. Subscription Value: サブスクリプション加入者は、引退後のキャラを「英霊」として資産化し、永続的な不労所得を得る権利を持つ。

--------------------------------------------------------------------------------
2. 残影の分類 (Shadow Types)
party_members テーブルの origin カラムを拡張し、以下の3種類を管理する。
Type Code
名称
定義・特徴
デッキへの影響
サブスク依存
shadow_active
傭兵<br>(Mercenary)
現役プレイヤーの写し身。<br>直近24時間以内に活動したプレイヤーのスナップショット。<br>レベル変動あり。
Signature Deck:<br>プレイヤーが登録した「代表スキル」3〜5枚を注入。
No
shadow_heroic
英霊<br>(Heroic)
引退/死亡したプレイヤーの記録。<br>ステータスは全盛期で固定。<br>非常に強力だが契約金が高い。
Legacy Deck:<br>引退時に固定された「遺産カード」を注入。
Yes<br>(加入者のみ登録可)
system
住人<br>(NPC)
システム生成キャラクター。<br>平均的な能力。特定のクエスト条件（タグ）を満たすために存在。
Basic Cards:<br>汎用スキル。
-

--------------------------------------------------------------------------------
3. 経済システム：ロイヤリティ (Royalty Economy)
残影システムは、雇用者（Hirer）と被雇用者（Source User）の間に金銭的授受を発生させる。
3.1 雇用コストと分配
酒場（Tavern）での雇用時、以下のロジックでゴールドが分配される。
• 契約金 (Contract Fee): 雇用者が支払う総額。レベルとステータスに基づき算出。
• システム手数料 (Tax): 運営が回収（インフレ抑制）。
• ロイヤリティ (Royalty): 元プレイヤーの「報酬ボックス」に振り込まれる額。
3.2 サブスクリプション優遇 (Premium Benefits)
サブスクリプション加入状況（is_subscriber）により、税率と表示が優遇される。
User Status
契約金分配率 (手取り)
酒場での表示 (Visual)
メリット
Free User
10% (90% Tax)
通常枠 (Standard Frame)
小遣い稼ぎ程度。
Subscriber
30% (70% Tax)
黄金枠 (Premium Frame)
不労所得化。<br>目立つため雇用率が上がり、実入りも3倍になる。
• Business Logic: この格差により、ユーザーは「稼ぐために課金する（Pay for Asset）」という動機を持つ。稼いだゴールドは「祈り（Prayer）」に変換され、世界への影響力となる。

--------------------------------------------------------------------------------
4. データ構造拡張 (Data Schema)
4.1 party_members Table Extension
既存のNPCテーブルに、ソース情報の紐付けを追加する。
ALTER TABLE party_members 
ADD COLUMN IF NOT EXISTS source_user_id UUID REFERENCES user_profiles(id), -- 元プレイヤー
ADD COLUMN IF NOT EXISTS origin_type TEXT CHECK (origin_type IN ('system', 'shadow_active', 'shadow_heroic')),
ADD COLUMN IF NOT EXISTS snapshot_data JSONB, -- 雇用時点のステータス固定
ADD COLUMN IF NOT EXISTS royalty_rate INT DEFAULT 10; -- 10% or 30%
4.2 user_profiles Table Extension
プレイヤー側で「貸し出し設定」を行う必要がある。
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS signature_deck TEXT[], -- 貸し出し用カードIDリスト (Max 5)
ADD COLUMN IF NOT EXISTS total_royalty_earned INT DEFAULT 0; -- 累計獲得ロイヤリティ

--------------------------------------------------------------------------------
5. バトル・挙動仕様 (Battle Behavior)
5.1 スナップショットと固定 (Snapshot)
shadow_active は雇用された瞬間のステータスで固定される。
• 元プレイヤーが装備を変更しても、現在雇用中の残影には反映されない。
• 再雇用（Re-hire）することでデータが更新される。
5.2 共鳴ボーナス (Resonance) - [Active Only]
「今、この世界にいる」というライブ感を演出する。
• Condition: 元プレイヤーが「オンライン」かつ「同じ拠点（Location）」にいる。
• Effect: 残影の ATK / DEF に +10% のボーナス。
• UI: ポートレートが明滅し、「[PlayerName]と共鳴中！」のログを表示。
5.3 ロストと通知 (Loss & Notification)
• In Battle: 残影の durability が0になると消滅（契約終了）。
• Notification: 元プレイヤーに対し、翌日ログイン時に通知を送る。

--------------------------------------------------------------------------------
6. Antigravity Implementation Tasks
Task 1: API GET /api/tavern/list
酒場の雇用リスト生成ロジックを実装してください。
1. Filter: 現在の location_id に滞在している active ユーザーを検索。
2. Sort: reputation (名声) と subscriber_status (サブスク会員優先) でソート。
3. Inject: 元ユーザーの signature_deck を inject_cards プロパティにマッピング。
Task 2: Function distributeRoyalty (Server Action)
雇用確定時のトランザクション処理。
1. User A (Hirer) から contract_fee を減算。
2. User B (Source) の assets.gold に contract_fee * royalty_rate を加算。
3. party_members にレコードを作成。
Task 3: Deck Validation
signature_deck 登録時のバリデーション。
• Restriction: cost_type: 'vitality' (禁術) を持つカードは登録不可とする。
    ◦ Reason: 借り手の寿命を勝手に消費する荒らし行為（Griefing）を防ぐため。