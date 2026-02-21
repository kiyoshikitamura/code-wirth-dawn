Code: Wirth-Dawn Specification v6.2: Dynamic Shop, Inventory & Betrayal
1. 概要 (Overview)
本仕様書は、ゲーム内の経済活動拠点である「ショップ（市場/闇市）」およびプレイヤーの「所持品管理（Inventory）」の定義である。 v6.1までの「購入とインフレ」に加え、v6.2では**「アイテム売却（Selling）」機能を実装する。特筆すべきは、クエストで預かった重要アイテムをショップで換金して任務を放棄する（裏切り / Betrayal）**システムであり、これによりプレイヤーにローグライクな道徳的選択を迫る。
Dependencies:
• spec_v4.2_location_details.md (Prosperity Levels)
• spec_v3.5_quest_system.md (Quest Inventory & Logic)
• spec_v7_lifecycle_economy.md (Economy Security)

--------------------------------------------------------------------------------
2. アイテム分類とインベントリ (Categories & Inventory)
2.1 アイテムタイプの拡張 (items Table)
売買可能なアイテムと、そうでないものを明確に区分する。
Type
名称
定義・仕様
売却可否
用途
consumable
消費アイテム
使い捨ての道具。<br>インベントリ管理。
可
回復、探索補助。
trade_good
交易品 / 貴重品
バトル使用不可。<br>インベントリ管理。
可
納品クエスト対象。<br>換金用アイテム。<br>裏切り（横領）対象。
skill
スキル・装備
永続的なカード。<br>カードプール管理。
不可
バトルデッキ構築。<br>※カードの売却は現状不可とする。
key_item
重要物品
ストーリー進行用。<br>インベントリ管理。
不可
クエスト進行フラグ。<br>絶対に手放せない。
2.2 ユーザーインベントリ構造 (user_inventory)
消費アイテムと交易品を格納するテーブル。
CREATE TABLE user_inventory (
  user_id UUID REFERENCES auth.users(id),
  item_id TEXT REFERENCES items(id),
  quantity INT DEFAULT 1 CHECK (quantity >= 0),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

--------------------------------------------------------------------------------
3. 売却と裏切りシステム (Sell & Betrayal Logic)
ショップAPIに売却エンドポイントを追加し、クエストアイテムを売却した際のペナルティロジック（裏切り）を実装する。
3.1 売却 API (POST /api/shop/sell)
• Request:
    ◦ item_id: 売却するアイテムID。
    ◦ quantity: 売却数。
• Process:
    1. Validation: ユーザーが指定個数のアイテムを所持しているか確認。
    2. Price Calculation: items.base_price × inflation_rate (繁栄度係数) で売却額を算出。
        ▪ Economy Note: 売却額は購入額の 30-50% 程度に抑える係数をかけてもよい（今回は等価交換または 50% とする）。
    3. Betrayal Check (裏切り判定):
        ▪ 売却アイテムが、現在進行中のクエスト (current_quest) の必須アイテム (quest_req_id や requirements) であるかを確認する。
        ▪ YES (裏切り):
            • Quest Fail: クエスト状態を即座に EXIT_FAIL に更新する。
            • Reputation Penalty: その拠点の reputation を大幅に減算（例: -50）。
            • Log: 「任務放棄・横領」としてログを記録。
            • Response Flag: trigger_fail: true を返す。
        ▪ NO (通常売却):
            • 通常通りアイテムを削除し、Goldを加算。
    4. Inventory Update: user_inventory から個数を減算（0になったらレコード削除）。
    5. Asset Update: user.assets.gold に売却額を加算。
3.2 闇市での高額買取 (Black Market Bonus)
拠点が「崩壊 (Ruined)」している場合、または type: trade_good の特定のアイテム（禁制品など）は、通常よりも高く売れる場合がある。
• Logic: prosperity_level === 1 の場合、売却額係数を x1.5 とする。
• Flavor: 「こんな崩壊した街だ、食料や物資は金より重いぞ。」

--------------------------------------------------------------------------------
4. 購入ロジックの改修 (Purchase Logic Update)
v6.1の内容を維持しつつ、インベントリへの追加処理を明確化する。
4.1 購入処理 (POST /api/shop/buy)
• Skill Cards: 従来通り user_cards テーブルへ追加（ユニーク制限あり）。
• Consumable / Trade Good:
    ◦ user_inventory テーブルへ追加（UPSERT 処理: 既存なら quantity 加算）。
    ◦ Stock Limit: クエスト限定品などは在庫（購入可能数）に制限を設ける場合がある。

--------------------------------------------------------------------------------
5. UI/UX 要件
5.1 ショップ画面構成
タブ切り替えにより「購入」「売却」を行き来できるUIとする。
• Buy Tab:
    ◦ カテゴリ別フィルタ（消耗品 / スキル / 交易品）。
    ◦ クエスト限定品の強調表示。
• Sell Tab:
    ◦ 現在のインベントリを表示。
    ◦ 各アイテムの買取価格を表示。
    ◦ クエスト重要アイテムには「★」や「！」マークを付け、注意を促す。
5.2 裏切り警告モーダル (Betrayal Warning)
クエストに関連するアイテムを売却しようとした場合、以下の確認フローを挟む。
• Message:
• Action:
    ◦ [ 売却して金を稼ぐ ] (赤色ボタン)
    ◦ [ キャンセル ]
5.3 失敗リザルト遷移
売却APIから trigger_fail: true が返された場合、ショップモーダルを閉じた直後に**「クエスト失敗リザルト画面」**へ強制遷移させる。
• Result Text: 「目先の金に目が眩み、あなたは任務を放棄した。」

--------------------------------------------------------------------------------
6. Antigravity Implementation Tasks
Task 1: Schema Migration
• user_inventory テーブルを作成する。
• items テーブルの type カラム制約に trade_good を追加する。
Task 2: Inventory API (GET /api/user/inventory)
• ユーザーの現在の所持品リスト（アイテム詳細含む）を返すエンドポイントを実装。
Task 3: Sell API Implementation (POST /api/shop/sell)
• 所持数チェック、Gold加算、アイテム減算のトランザクション実装。
• Betrayal Logic:
    ◦ quests テーブル定義または quest_state を参照し、売却アイテムが進行中クエストのキーアイテムか判定するロジックを実装。
    ◦ 該当する場合、quest_state を更新し、名声減少処理を実行する。
Task 4: Client Integration
• ショップUIに「売却」タブを追加。
• インベントリ表示と売却機能の結合。
• 裏切り時の警告モーダルとリザルト遷移の実装。