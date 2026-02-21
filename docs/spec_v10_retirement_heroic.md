Code: Wirth-Dawn Specification v10.1: Retirement & Heroic Spirits
1. 概要 (Overview)
本ドキュメントは、キャラクターの**「引退・死亡（End of Life）」、引退後のデータを資産化する「英霊（Heroic Spirit）」、および次世代キャラクターへの「資産継承（Succession）」**の統合仕様である。 本作においてキャラクターの死は終わりではなく、「魂を資産に変え、次世代を有利にするための通過儀礼」として位置づけられる。
Dependencies:
• spec_v5_shadow_system.md (Shadow Economy & Validation)
• spec_v7_lifecycle_economy.md (Succession Rates)
• spec_v9_character_creation.md (Aging & Decay)
• spec_v2_battle_parameters.md (Vitality Damage Logic)

--------------------------------------------------------------------------------
2. 引退と死亡のトリガー (Triggers)
キャラクターの生涯が終了する条件は以下の2つである。どちらの場合も、システム上は「死亡（is_alive = false）」として処理され、継承プロセスへ移行する。
2.1 力尽きる (Depletion)
• Condition: バトルでの敗北、イベント、または加齢により current_vitality が 0 になった瞬間。
• Vitality Damage Rules (v2.11準拠):
    ◦ 敵からの drain_vit 攻撃による減少は、1ターンにつき最大1ポイントまでとする（多段ヒットによる即死事故防止）。
    ◦ プレイヤー自身の「禁術（Vitalityコスト）」使用による減少は制限なし（自殺可能）。
• Effect: 「死亡（Dead）」。強制的にゲームオーバー画面へ遷移し、継承フローが開始される。
2.2 自主的な引退 (Voluntary Retirement)
• Condition: 街（Town）の宿屋にて「引退する」コマンドを実行。
• Effect: 「安らかな隠居（Retired）」。Vitalityが残っていても、現在のステータスで確定させる。
• Strategy: spec_v9 の加齢によるステータス減衰（Decay）が進行しきる前、つまり**「全盛期のステータス」で英霊として保存したい場合**に利用する。

--------------------------------------------------------------------------------
3. 英霊登録 (Heroic Registration)
生涯を終えたキャラクターは、その記録（スナップショット）が保存される。 ここで、プレイヤーのサブスクリプション加入状況によって、「ただの記録」になるか「稼ぐ資産」になるかが分岐する。
3.1 登録分岐 (Registration Logic)
項目
Free User (無料会員)
Subscriber (サブスク会員)
データ保存
墓標（Logs）のみ保存。
「英霊（Heroic Shadow）」 として酒場に登録。
他者からの雇用
不可。 リストに並ばない。
可能。 永続的にリストに掲載される。
ロイヤリティ
発生しない。
発生する。 (契約金の30%を獲得)
デッキ登録
なし。
引退時のデッキが 「遺産デッキ」 として固定される。
3.2 遺産デッキのバリデーション (Legacy Deck Validation)
英霊として登録する際、spec_v5.1 の規定に基づき厳格なチェックを行う。
• Constraint 1: type: consumable (ポーション等) は登録不可。
• Constraint 2: cost_type: vitality (禁術) は登録不可（借り手へのGriefing防止）。
• Fallback: バリデーションエラーとなるカードが含まれていた場合、それらは自動的に除外され、穴埋めとして「錆びた剣」がセットされる。
3.3 英霊の仕様 (Heroic Specs)
• Status Freeze: 引退した瞬間の Level, HP, ATK, DEF が永続的に保存される（以降の成長も老化もない）。
• AI Grade: 英霊は必ず ai_grade: smart (弱点狙い・AP温存行動) が割り当てられる。
• Visual: 酒場リストにて「黄金のフレーム」で表示され、雇用率が優遇される。

--------------------------------------------------------------------------------
4. 継承システム (Succession System)
「死亡/引退」処理が完了した後、プレイヤーは**「次のキャラクター」**を作成する。 この際、前世の功績に応じてスタートダッシュが可能になる。
4.1 継承資産 (Inheritance Assets)
継承項目
Free User
Subscriber
解説
Gold
10%
50%
前世の所持金の引き継ぎ。
Reputation
0 (Reset)
10%
拠点ごとの名声を一部継承。「〇〇家の末裔」として認知される。
Heirloom
なし
1個
インベントリ内の装備カードを1つ指定し、次世代の初期デッキに混入させる。
• Note: 錬金術レシピ等のシステムは未実装のため、現状は継承対象外とする。
4.2 継承フロー (UX Flow)
1. Result Screen: 「あなたの冒険は終わった」画面。生涯成績（獲得Gold、到達階層、年齢）を表示。
2. Inheritance Select (Sub only): 「家宝（Heirloom）」にするアイテムを1つ選択。
3. New Game: キャラクター作成画面（spec_v9）へ遷移。
    ◦ 入力フォームの上部に 「継承ボーナス適用中」 のバッジを表示。

--------------------------------------------------------------------------------
5. 英霊の運用と削除 (Management)
プレイヤーは複数の「英霊」を保有することができるが、枠数は制限される（マネタイズ要素）。
5.1 スロット管理
• Default: 1枠。
• Expansion: 課金アイテムまたは上位プランにより拡張可能。
• Replacement: 枠が一杯の状態で新しいキャラが英霊化する場合、既存の英霊を1体「完全消滅（削除）」させるか、新キャラの英霊化を諦める（墓標のみ残す）かを選択する。
5.2 サブスクリプション切れの挙動
• サブスクリプションを解約した場合、登録済みの英霊はすべて 「休眠状態（Dormant）」 となり、酒場リストから非表示になる（ロイヤリティも停止）。
• 再加入することで、即座に再公開される。

--------------------------------------------------------------------------------
6. Antigravity Implementation Tasks
Task 1: Retirement Transaction (POST /api/character/retire)
• Input: cause ("dead" or "voluntary"), heirloom_item_id (Optional).
• Process:
    1. user_profiles.is_alive を false に更新。
    2. Heroic Registration (Sub only):
        ▪ party_members テーブルに origin_type = 'shadow_heroic' としてレコード作成。
        ▪ 現在の atk, def, level を snapshot_data に保存。
        ▪ Deck Filter: 現在のデッキから禁止カード（消耗品・禁術）を除外して保存。
    3. Succession Setup:
        ▪ 次回の createCharacter 用に legacy_data (継承Gold額, heirloom_item_id) を user_accounts メタデータ等に一時保存。
Task 2: Tavern Filtering (GET /api/tavern/list)
• shadow_heroic (英霊) を含めて返すように修正。
• Filter: 元ユーザーの is_subscriber が false の場合、その英霊を除外する（Dormant処理）。
Task 3: Inheritance Logic (POST /api/auth/register)
• キャラクター作成処理において、legacy_data が存在するか確認。
• 存在する場合：
    ◦ 初期 assets.gold に継承分を加算。
    ◦ 初期 deck に heirloom_item_id のカードを追加（コストオーバーしないよう注意、あるいは初期コスト上限を一時的に無視するロジック）。
