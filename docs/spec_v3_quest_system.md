Code: Wirth-Dawn Specification v3.5: Quest Inventory & Moral Choices
1. 概要 (Overview)
本仕様書は、クエストシステムにおける**「物品管理（Inventory）」と「道徳的選択（Moral Choices）」の定義である。v3.4までの「移動」「戦闘」に加え、「貴重品を届ける（Delivery）」や「特定アイテムを入手する（Acquisition）」といったクエストタイプをサポートする。また、クエスト遂行に必要なアイテムをショップで売却して私腹を肥やす（裏切り）**システムを導入し、プレイヤーにローグライクな決断を迫る。
Dependencies:
• spec_v3.4_quest_system.md (Travel & Context)
• spec_v6.1_shop_system.md (Shop API)
• spec_v2.11_battle_parameters.md (Loot Pool)

--------------------------------------------------------------------------------
2. インベントリとアイテム定義 (Inventory System)
2.1 アイテムタイプの拡張 (items Table)
バトル用カードとは別に、所持・換金・納品用のアイテムタイプを定義する。
Type
名称
特徴
用途
trade_good
交易品 / 貴重品
売却可能。バトル使用不可。<br>デッキにセットできない。
納品クエストの対象。<br>換金アイテム。<br>裏切り（横領）の対象。
key_item
重要物品
売却不可。バトル使用不可。
ストーリー進行用。<br>絶対に手放せないもの。
consumable
消費アイテム
売却可能。バトル使用可能。
回復・バフ。
items.csv Example:
id,name,type,base_price,description
item_royal_letter,王家の密書,trade_good,0,隣国の王へ届ける親書。売ることは許されない...はずだ。
item_golden_idol,黄金の像,trade_good,2000,古代遺跡の秘宝。闇市で高く売れる。
• Note: item_royal_letter のように base_price: 0 のものは売却不可とするか、闇市でのみ安値が付くように設定する。
2.2 ユーザーインベントリ (user_inventory Table)
プレイヤーが所持しているアイテムを管理する。
CREATE TABLE user_inventory (
  user_id UUID REFERENCES auth.users(id),
  item_id TEXT REFERENCES items(id),
  quantity INT DEFAULT 1,
  acquired_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

--------------------------------------------------------------------------------
3. シナリオエンジンの拡張 (Scenario Nodes)
Unified CSVパーサーを拡張し、アイテムの所持チェックを行うノードを追加する。
3.1 納品判定ノード (type: check_delivery)
「宅配（Delivery）」クエスト用。指定のアイテムを持っており、かつ指定の拠点にいるかを判定する。
• Params:
    ◦ item_id: 対象アイテムID。
    ◦ remove_on_success: (Boolean) 成功時にアイテムを回収するか（Default: true）。
    ◦ target_location: (Optional) 納品すべき拠点ID。省略時は「現在地」で判定。
• Logic:
    ◦ 条件を満たす場合: next ノードへ遷移（成功ルート）。
    ◦ 満たさない場合: fallback ノードへ遷移（紛失・売却済みルート）。
CSV Example:
NODE,arrive_target,"目的地に到着した。依頼人に会いますか？",,
CHOICE,,密書を渡す (クエスト完了),check_letter_node,
NODE,check_letter_node,,,,"type:check_delivery, item_id:item_royal_letter, next:success_end, fallback:fail_lost_item"
NODE,success_end,"「確かに受け取った。ご苦労だった。」",EXIT,"type:reward, gold:500"
NODE,fail_lost_item,"「...密書がない？ どういうことだ！」依頼人は激怒した。",EXIT_FAIL,"impact:reputation_down"
3.2 入手確認ノード (type: check_possession)
「入手（Acquisition）」クエスト用。アイテムを持っているかを確認する（場所は問わない）。
• Params: item_id
• Use Case: 「黄金の像」をドロップまたはショップで購入して手に入れたかを確認し、クエスト完了フラグを立てる。

--------------------------------------------------------------------------------
4. 裏切りシステム (The Betrayal Mechanic)
プレイヤーは、クエストで預かった（または入手した）trade_good を、納品せずにショップで売却することができる。
4.1 売却 API の挙動 (POST /api/shop/sell)
ショップでの売却時、以下のロジックで「裏切り」を判定する。
1. Check Quest Relation:
    ◦ 売却しようとしている item_id が、現在進行中のクエスト (current_quest_id) の items.quest_req_id と一致するか？
    ◦ あるいは、クエスト定義の required_items に含まれているか？
2. Moral Hazard Execution:
    ◦ 一致する場合（＝重要アイテムの横領）:
        ▪ Transaction: 売却を成立させ、Gold を付与する。
        ▪ Quest Fail: 現在のクエストステータスを即座に 失敗 (EXIT_FAIL) に更新する。
        ▪ Penalty: その拠点の 名声 (reputation) を大幅に減少させる（例: -50）。
        ▪ Response: クライアントに { success: true, trigger_fail: true, message: "依頼を裏切りました" } を返す。
4.2 ドロップと入手
• Enemy Drop: エネミーのドロップテーブルに trade_good を設定可能にする。
• Loot Logic: バトル勝利時、loot_pool に入ったアイテムは、クエスト完了 (EXIT) 時だけでなく、クエスト中のショップ売却によっても利益確定できる。

--------------------------------------------------------------------------------
5. UI/UX 要件
5.1 インベントリ画面
• メニューに「所持品（Items）」タブを追加。
• カードデッキとは異なり、スタック可能なリスト形式で表示。
5.2 ショップ売却画面
• Warning: クエスト進行に必要なアイテムを選択した際、「警告：このアイテムは現在の依頼に必要です。売却すると依頼は失敗します。」 というダイアログを表示する。
• Confirm: それでも「売却」を選んだ場合、裏切り処理を実行する。
5.3 リザルト処理
• ショップモーダルが閉じた後、trigger_fail フラグを受け取っていた場合、強制的に「クエスト失敗リザルト」へ遷移させる。
    ◦ Message: 「任務放棄。信頼を失い、金を得た。」

--------------------------------------------------------------------------------
6. Antigravity Implementation Tasks
Task 1: Schema Update
• DB: user_inventory テーブル作成。
• Items: items.csv に type: trade_good を追加し、trade_good アイテムデータを投入。
Task 2: Scenario Engine Update (useQuest.ts)
• type: check_delivery ノードの実装。
    ◦ user_inventory を参照し、指定アイテムの有無と現在地を検証するロジック。
    ◦ 成功時、remove_on_success: true ならアイテムを削除する処理。
Task 3: Shop Sell Logic (POST /api/shop/sell)
• 売却処理の実装。
• Betrayal Logic: 売却アイテムと current_quest の依存関係をチェックし、黒ならクエストを失敗させ、名声を減らす副作用（Side Effect）を実装。
Task 4: Client Integration
• クエスト中にインベントリを確認できるUIの実装。
• ショップ売却時の警告モーダルと、失敗リザルトへの遷移ハンドリング。