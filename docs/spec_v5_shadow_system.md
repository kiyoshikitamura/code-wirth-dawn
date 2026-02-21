Code: Wirth-Dawn Specification v5.1: Shadow Mercenary & Economy
1. 概要 (Overview)
本仕様書は、他プレイヤーのキャラクターデータをNPCとして雇用する「残影（Shadow）」システムの定義である。 spec_v2_battle_parameters.md で定義された「パーティメンバー」の枠組みを使用し、プレイヤー間の非同期経済圏を構築する。
Core Concept:
• Asset Value: キャラクターは単なるアバターではなく、育成することで他者に貸し出し、利益（Gold/Reputation）を生む「資産」となる。
• Asynchronous: リアルタイム同期ではなく、特定時点の「スナップショット」を雇用する。
• Security: 貸し出しによるアイテム消費や、借り手の寿命リソースへの悪意ある干渉（Griefing）をシステム側で防止する。
Dependencies:
• spec_v2_addendum_npc_ai.md (AI Logic & Roles)
• spec_v10_retirement_heroic.md (Heroic Spirit Definition)
• spec_v2_battle_parameters.md (Battle Persistence)

--------------------------------------------------------------------------------
2. 残影の分類 (Shadow Types)
party_members テーブルで管理されるNPCは、以下の3種類に分類される。
Type Code
名称
定義・特徴
デッキソース
サブスク依存
shadow_active
傭兵 (Mercenary)
現役プレイヤーの写し身。<br>直近24時間以内に活動したプレイヤーの動的データ。<br>現在のレベル・装備が反映される。
Signature Deck<br>(貸出用設定)
No
shadow_heroic
英霊 (Heroic)
引退/死亡したプレイヤーの記録。<br>ステータスは全盛期（引退時）で固定。<br>非常に強力だが契約金が高い。
Legacy Deck<br>(遺産固定)
Yes<br>(加入者のみ登録可)
system
住人 (NPC)
システム生成キャラクター。<br>平均的な能力。特定のクエスト条件（タグ）を満たすために存在。
Basic Cards<br>(汎用スキル)
-

--------------------------------------------------------------------------------
3. 登録とバリデーション (Registration Logic)
3.1 デッキ登録ルール
プレイヤーは自身のキャラクターを貸し出す際、最大5枚のスキルカードを登録する。 この際、spec_v2.11 の「システム間干渉対策」に基づき、以下の厳格なバリデーションを行う。
• Restriction 1: No Consumables
    ◦ type: consumable (ポーション等) は登録不可。
    ◦ Reason: 雇用主の在庫を勝手に消費したり、逆に無限に使用できてしまう経済バグを防ぐため。
• Restriction 2: No Vitality Cost
    ◦ cost_type: vitality (禁術) を持つカードは登録不可。
    ◦ Reason: 借り手（雇用主）の寿命を勝手に削る荒らし行為（Griefing）を防ぐため。
• Fallback:
    ◦ バリデーションに通るカードが1枚もない場合、自動的に「錆びた剣 (Basic Attack)」のみが登録される。
3.2 スナップショット更新
• Active Shadow: プレイヤーが宿屋で宿泊（セーブ）したタイミング、または装備変更画面で「貸出設定」を保存したタイミングで更新される。
• Heroic Spirit: 引退・死亡 (is_alive: false) した瞬間のデータで固定され、以降二度と更新されない。

--------------------------------------------------------------------------------
4. 経済システム：ロイヤリティ (Royalty Economy)
残影システムは、雇用者（Hirer）と被雇用者（Source User）の間に金銭的授受を発生させる。
4.1 雇用コスト分配
酒場（Tavern）での契約時、以下のロジックで Gold が分配される。
1. Contract Fee (総額): 雇用者が支払う額。レベルとステータスに基づき算出。
    ◦ Fee = (Level * 100) + (TotalStats * 10)
2. Tax (手数料): 運営回収分（インフレ抑制）。
3. Royalty (報酬): 元プレイヤーの assets.gold に振り込まれる額。
4.2 サブスクリプション優遇 (Premium Benefits)
サブスクリプション加入状況 (is_subscriber) により、税率と表示が優遇される。
User Status
ロイヤリティ (手取り)
酒場表示 (Visual)
メリット
Free User
10% (90% Tax)
通常枠
小遣い稼ぎ程度。
Subscriber
30% (70% Tax)
黄金枠 (Premium)
不労所得化。<br>目立つため雇用率が上がり、実入りも3倍になる。
• Security Cap: spec_v7 に基づき、同一ユーザーからの重複雇用による報酬発生は 1日1回まで とする。

--------------------------------------------------------------------------------
5. バトル・挙動仕様 (Behavior & Lifecycle)
5.1 AIルーチン
戦闘中の行動は spec_v2_addendum_npc_ai.md に従う。
• 固定手札: 山札を持たず、登録された5枚のスキルを AP クールダウン制で使用する。
• Heroic AI: 英霊のみ "Smart" AI (弱点狙い、AP温存) が適用される。
5.2 共鳴ボーナス (Resonance) - Active Only
「今、この世界にいる」というライブ感を演出するためのボーナス。
• Condition: 元プレイヤーが「オンライン」かつ、雇用者と「同じ拠点 (location_id)」にいる。
• Effect: 残影の ATK / DEF +10%。
• UI: ポートレートが明滅し、「[User]と共鳴中！」のログを表示。
5.3 契約終了と消滅 (Termination)
クエスト内での死亡は、あくまで「契約の終了」であり、元プレイヤーのデータには影響しない。
• In-Quest Death: HPが0になった残影は即座に消滅し、以降のバトルに参加しない。
• Contract End: クエスト完了時（成功/失敗問わず）、すべての雇用契約は解除される（持ち越し不可）。

--------------------------------------------------------------------------------
6. データ構造拡張 (Data Schema)
6.1 user_profiles Table Extension
プレイヤー側で「貸し出し設定」を行う必要がある。
• signature_deck (TEXT[]): 貸し出し用カードIDリスト (Max 5)。
• total_royalty_earned (INT): 累計獲得ロイヤリティ（実績用）。
• is_hirable (BOOLEAN): 貸し出し許可フラグ。
6.2 party_members Table Extension
既存のNPCテーブルに、ソース情報の紐付けを追加する。
• source_user_id (UUID): 元プレイヤーのID。
• origin_type (TEXT): system, shadow_active, shadow_heroic。
• snapshot_data (JSONB): 雇用時点のステータス（Level, ATK, DEF, Deck）。
    ◦ Note: 元プレイヤーが装備を変えても、雇用中のNPCには影響しないようにここに値をコピーする。

--------------------------------------------------------------------------------
7. Antigravity Implementation Tasks
Task 1: Tavern List API (GET /api/tavern/list)
酒場の雇用リスト生成ロジックを実装してください。
1. Search: 現在の location_id に滞在している Active ユーザー、および登録済みの Heroic Spirit を検索。
2. Filter: 自分自身を除外。
3. Sort: subscriber_status (降順) > reputation (降順) > level (近しい順)。
4. Mapping: snapshot_data を構築してレスポンスに含める。
Task 2: Deck Validation (POST /api/equip/signature)
貸出用デッキ保存時のバリデーションを実装してください。
• Input: カードIDの配列。
• Logic:
    ◦ items テーブルを参照。
    ◦ type === 'consumable' が含まれていればエラー。
    ◦ cost_type === 'vitality' が含まれていればエラー。
    ◦ 有効なカードが0枚なら、デフォルト武器 (ID: 1001) を強制セット。
Task 3: Royalty Transaction (distributeRoyalty)
雇用確定時のトランザクション処理。
1. Source Check: 元プレイヤーの is_subscriber を確認し、レート (0.1 or 0.3) を決定。
2. Cap Check: royalty_logs を確認し、同一ペアの支払いが本日既にないかチェック。
3. Transfer: Hirerから減算し、Sourceに加算。ログを記録。