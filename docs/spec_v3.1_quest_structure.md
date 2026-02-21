Code: Wirth-Dawn Specification v3.1: Quest Structure & Classification
1. 概要 (Overview)
本ドキュメントは、クエスト管理構造の改修定義である。 従来の混在していたクエスト群を、リソース収集用の**「通常依頼（Normal）」と、ストーリー/イベント進行用の「特別依頼（Special）」**の2つのストリームに分離する。 これにより、プレイヤーは「日々の稼ぎ」と「冒険の目的」を明確に区別してプレイ可能となる。
Dependencies:
• spec_v3_quest_system.md (Scenario Engine)
• spec_v4_location_details.md (Prosperity Logic)

--------------------------------------------------------------------------------
2. クエスト分類 (Classification)
2.1 通常依頼 (Normal Quests)
拠点の酒場に常設される、日常的な依頼。
• 目的: ゴールド稼ぎ、経験値稼ぎ、素材収集。
• 出現ロジック: 拠点の**「繁栄度 (Prosperity)」と「支配国 (Nation)」**に基づいて、プールからランダムに選出される。
• リセット: ゲーム内時間で毎日（または一定サイクルで）入れ替わる。
• 例: 「地下水道のネズミ退治」「商隊の護衛」「聖帝国の巡回任務」
2.2 特別依頼 (Special Quests)
特定の条件を満たした時のみ出現する、一回性の強い依頼。旧仕様の「条件付き/緊急クエスト」は全てここに統合される。
• 目的: 重要アイテム入手、エリア解放、ボス討伐、英霊化への道。
• 出現ロジック: プレイヤーが特定の**「トリガー条件（アイテム所持、名声値、フラグ）」**を満たした場合にのみ、リスト上部に固定表示される。
• リセット: 原則として達成するまで消えない（または特定の期間のみ出現）。
• 例: 「古びた地図の解読（要アイテム）」「深淵への誘い（要禁術使用歴）」「王都防衛戦（要名声）」

--------------------------------------------------------------------------------
3. データ構造 (Data Structure)
管理を容易にするため、CSVファイルをカテゴリごとに分割する。
3.1 ファイル構成 (src/data/csv/)
シナリオ本文（scenarios/*.csv）とは別に、クエストのメタデータを定義するファイルを分ける。
File Name
Description
Note
quests_normal.csv
通常依頼のプールデータ。
繁栄度や地域タグでフィルタリングされる。
quests_special.csv
特別依頼の定義データ。
厳格な出現条件（Requirements）を持つ。
3.2 カラム定義 (Metadata Schema)
共通カラム: id, title, difficulty (1-5), scenario_script_id (参照するシナリオファイル), rewards (JSON)
quests_normal.csv 固有: | Column | Description | Example | | :--- | :--- | :--- | | location_tags | 出現する拠点や国家のタグ。 | holy_empire, slum, all | | min_prosperity | 出現に必要な最低繁栄度。 | 3 (繁栄度3以上で出現) | | max_prosperity | 出現する最大繁栄度（治安悪いクエ用）。 | 2 (繁栄度2以下で出現) |
quests_special.csv 固有: | Column | Description | Example | | :--- | :--- | :--- | | requirements | 出現条件（JSONB）。 詳細は後述。 | {"has_item": "map_01", "min_level": 10} | | is_urgent | UIでの強調表示フラグ。 | true | | chain_id | 連続クエストのID（前提クエスト）。 | quest_1001 (1001クリア後に出現) |

--------------------------------------------------------------------------------
4. 出現条件ロジック (Requirements Logic)
特別依頼（Special）の requirements カラムには、以下の条件を組み合わせて定義できる。
// Example: 王家の紋章を持っており、かつ聖帝国の名声が20以上
{
  "has_item": "key_item_royal_emblem",
  "min_reputation": { "loc_holy_empire": 20 },
  "min_level": 15,
  "min_vitality": 50,  // 余命が十分にあるか
  "class_tag": "swordsman",
  "completed_quest": "q_tutorial_05"
}
• Logic: 定義された全ての条件が TRUE の場合のみ、そのクエストはリストに出現する。

--------------------------------------------------------------------------------
5. クエストボード API (API Logic)
GET /api/location/quests のレスポンス構造を変更し、UI側でタブ分け可能な形にする。
5.1 Request
• location_id: 現在の拠点UUID
• user_id: プレイヤーUUID
5.2 Processing
1. Fetch Special:
    ◦ quests_special テーブルをスキャン。
    ◦ requirements をユーザーの状態（所持品、名声、クリア履歴）と照合。
    ◦ 条件一致するものを抽出。
2. Fetch Normal:
    ◦ quests_normal テーブルをスキャン。
    ◦ location_tags が現在の拠点（または支配国）と一致するか確認。
    ◦ 現在の拠点の prosperity_level が min/max の範囲内か確認。
    ◦ ランダムに数件（例: 5件）をピックアップ。
5.3 Response Structure
{
  "special_quests": [
    { "id": "sp_001", "title": "【緊急】王都防衛戦", "type": "special", "tag": "URGENT" }
  ],
  "normal_quests": [
    { "id": "nm_102", "title": "下水道の清掃", "type": "normal", "difficulty": 1 },
    { "id": "nm_105", "title": "聖騎士の訓練", "type": "normal", "difficulty": 3 }
  ]
}

--------------------------------------------------------------------------------
6. UI/UX 変更要件
クエスト選択画面（Quest Board）を以下の2部構成に変更する。
A. 特別依頼エリア (Top / Highlighted)
• 表示: 目立つヘッダー、赤い枠、または「緊急（URGENT）」バッジ。
• 挙動: 条件を満たしている重要案件。ストーリーを進めたい場合はこちらを選択する。
• Empty State: 特別依頼がない場合は非表示。
B. 通常依頼エリア (Bottom / List)
• 表示: 羊皮紙風のリスト。「本日の依頼」として表示。
• 挙動: 稼ぎプレイ用。
• 更新: 「更新まであと XX:XX」のカウントダウンを表示（日次リセット）。

--------------------------------------------------------------------------------
7. Antigravity Implementation Tasks
Task 1: Schema Migration
• 既存の quests テーブルを廃止（または移行）し、quest_definitions テーブルを作成。
• Column: type ('normal' / 'special') を追加。
• Column: requirements (JSONB), location_conditions (JSONB) を追加。
Task 2: Importer Update (seed_quests.ts)
• quests_normal.csv と quests_special.csv を読み分け、DBの type カラムにマッピングして保存するロジックを実装。
Task 3: Board Logic Implementation (GET /api/location/quests)
• Filter Engine: ユーザーの inventory, reputation, history を取得し、Special Quest の requirements JSONを評価するエンジンを実装すること。
    ◦ has_item チェックの実装。
    ◦ completed_quest 履歴チェックの実装。
