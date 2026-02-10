Spec v3: Quest & Scenario Engine Specification
1. 概要 (Overview)
本仕様書は、Code: Wirth-Dawn における「クエスト」および、それを駆動するテキストアドベンチャーエンジン「BYORK (Blueprints of Your Own RPG Kit)」の実装定義である。 プレイヤーはクエストを通じて、報酬を得るだけでなく、移動を行い、世界の歴史（World State）に干渉する。

--------------------------------------------------------------------------------
2. シナリオデータ構造 (Unified CSV Format)
シナリオデータは、可読性と管理効率を高めるため、シーン（NODE）と分岐（CHOICE）を単一のファイルに統合した**「ユニファイドCSV形式」**で管理する。
2.1 ファイル構成
• Directory: src/data/csv/scenarios/*.csv
• File Naming: {quest_id}_{slug}.csv (例: 5001_rat_hunt.csv)
2.2 カラム定義
Column
Description
Note
row_type
行の種類
NODE (場面) または CHOICE (選択肢/分岐)。
node_id
ノードID
NODE行のみ必須。CHOICE行は空欄（直上のNODEに紐付く）。
text_label
テキスト
NODE: 本文 / CHOICE: ボタンのラベル。
next_node
遷移先ID
次に進むノードID。EXIT (成功終了), EXIT_FAIL (失敗終了) も指定可。
params
パラメータ
挙動を制御するKey-Value定義 (例: bg:town, type:battle)。
2.3 記述例
row_type,node_id,text_label,next_node,params
NODE,start,"街の城門が見えてきた。",,"bg:gate_day, bgm:field"
CHOICE,,入国する,check_nation,
NODE,check_nation,,,"type:check_world, cond:destination_nation=loc_holy_empire, next:gate_holy, fallback:gate_common"
NODE,gate_holy,"聖騎士が立ちはだかる。「身分証を見せよ」",,
CHOICE,,賄賂を渡す,enter_city,"cost_gold:500, req_card:3058"
NODE,enter_city,"無事に街に入った。",EXIT,"type:reward, move_to:next_town"

--------------------------------------------------------------------------------
3. シナリオエンジン機能 (Scenario Engine Features)
フロントエンドの <ScenarioEngine /> は、CSVから変換されたJSONデータを読み込み、以下の特殊ノードを実行する。
3.1 演出・分岐ノード
1. type: check_world (世界情勢チェック)
    ◦ 機能: 世界の状態（world_states, locations）を参照して分岐する。
    ◦ Params: cond (条件式), next (真の場合), fallback (偽の場合)。
    ◦ Target: destination_prosp (移動先の繁栄度) や destination_nation (移動先の支配国) を参照可能。これにより「到着時の劇的な変化」を演出する。
2. type: random_branch (確率分岐)
    ◦ 機能: 移動中のランダムエンカウント等を表現する。
    ◦ Params: prob (確率%), hit (当選先), miss (落選先)。
3. type: check_status (ステータス判定)
    ◦ 機能: プレイヤーの能力値を判定する。
    ◦ Target: reputation (拠点名声), alignment (属性), level。
4. type: check_party (パーティ判定)
    ◦ 機能: 特定のNPCが同行しているか判定する。
    ◦ Params: npc_id。
    ◦ 用途: 移動中のNPC会話イベント (npc_react)。
3.2 アクションノード
1. type: battle (バトル)
    ◦ 機能: バトルシステム v2 を呼び出す。
    ◦ Params: enemy (敵グループID)。
    ◦ 結果: 勝利時は win 先へ、敗北時は lose 先へ遷移。
2. type: reward (報酬・移動)
    ◦ 機能: クエストを完了し、報酬付与と移動処理を行う。
    ◦ Params:
        ▪ gold, item, exp: 報酬。
        ▪ move_to: "next_town" または拠点UUID。完了時に現在地(current_location_id)を更新する。
        ▪ impact: 世界への影響値 (例: impact_order: 5)。
3.3 静的アセットマッピング (Static Assets)
リアルタイム生成は行わず、JSONキーとローカルファイルをマッピングする。
• Config: src/config/assets.ts
• Logic: bg: "gate_ruined" → /images/bg/gate_ruined.webp (存在しなければ default_gate.webp)。

--------------------------------------------------------------------------------
4. クエスト掲示板ロジック (Quest Board Logic)
4.1 スロット制限 (Limited Slots)
全クエストを表示せず、以下の優先順位で最大6件を選出する。
1. Urgent (+100): 重要フラグ (is_urgent)。
2. Condition (+50): アイテム所持トリガー (has_item:ID) や アライメント一致。
3. Appropriate (+20): 推奨レベル (rec_level) が適正範囲内。
4.2 リスク管理 (Risk & Vitality)
• 推奨レベル警告: Player.Level < Quest.rec_level の場合、警告を表示。
• Vitalityコスト: 禁術使用や特定の選択肢において、回復不能な Vitality を消費させる。
• 時間経過: 成功/失敗に応じて age_days を加算し、キャラクターを老いさせる。

--------------------------------------------------------------------------------
5. Antigravity 実装タスクリスト
1. Importer Update: seed_master.ts を更新し、scenarios/*.csv を一括で読み込み、JSON変換してDBへ保存するロジックを実装。
2. API Update: POST /api/quest/complete に move_to (移動処理) と impact (世界への影響) の処理を追加。
3. Engine Component: <ScenarioEngine /> に check_world (移動先参照含む), random_branch, check_status のロジックを実装。
4. Board API: GET /api/location/quests にスロット選出アルゴリズムとアイテム所持判定 (has_item) を実装。