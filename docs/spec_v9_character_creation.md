Code: Wirth-Dawn Specification v9.3: Character Creation & Aging Decay
1. 概要 (Overview)
本ドキュメントは、キャラクターの初期生成および**「加齢（Aging）」によるステータス変動の定義である。 プレイヤーは16〜25歳でゲームを開始するが、クエスト経過により年齢を重ねる。 40歳を超えた肉体は「老化（Decay）」を始め、誕生日を迎えるたびにVitality（寿命）だけでなく、攻撃力・防御力も恒久的に減少する**。
Dependencies:
• spec_v2_battle_parameters.md (Battle Logic & Stats)
• spec_v8_progression_system.md (Growth Limits)
• spec_v3_quest_system.md (Time Progression)

--------------------------------------------------------------------------------
2. 入力パラメータ (Input Parameters)
タイトル画面後のキャラクター作成フォームにおいて、以下の入力を必須とする。
Parameter
Type
Validation / Constraint
Note
Name
String
Max 12 chars
プレイヤー名。
Gender
Enum
Male / Female / Unknown
敵AIターゲット判定に影響。
Birth Date
Date
16 <= Age <= 25
ゲーム開始時点での年齢。範囲外はエラー。

--------------------------------------------------------------------------------
3. 初期ステータス決定 (Initial Stats Logic)
年齢による「肉体的なピーク（ATK/DEF）」と「寿命（Vitality）」のトレードオフを初期値に反映させる。 基礎ATK/DEFは 1〜5 の範囲で決定され、年齢が高いほど即戦力となる。
3.1 基準値テーブル (Base Stats)
Age
Initial HP
Deck Cost
Base ATK
Base DEF
Max Vitality
特徴
16 - 18
Low (15-18)
Low (8)
1 - 2
1 - 2
High (180-200)
晩成型 (Late Bloomer)<br>肉体は未完成だが寿命が長い。<br>長く育成できるため、最終的な到達点は高くなる可能性がある。
19 - 22
Mid (20)
Mid (10)
2 - 3
2 - 3
Mid (140-160)
バランス型 (Standard)<br>標準的なステータス。
23 - 25
High (22-25)
High (12)
3 - 5
3 - 5
Low (100-120)
即戦力型 (Veteran)<br>初期能力は高いが、老化開始までの猶予が短い。<br>序盤の攻略速度を優先する場合向け。
3.2 ランダムゆらぎ (Random Variance)
サーバーサイドで微調整を行う（ATK/DEFはMin 1, Max 5の範囲に収める）。
• HP: -2 〜 +3
• Deck Cost: 0 〜 +1
• Vitality: -10 〜 +10
• Base ATK / DEF: それぞれ 50% の確率で +1 される（ただし最大値 5 を超えない）。

--------------------------------------------------------------------------------
4. 加齢と老化 (Aging & Natural Decay)
クエスト完了時に経過日数 (days_success) が加算され、累積365日で年齢が +1 される。 40歳以降のキャラクターは「老化」によるペナルティを受ける。
4.1 老化トリガー (Decay Trigger)
• Condition: User.age >= 40 になった誕生日、およびそれ以降の誕生日。
• Effect: Max Vitality, Base ATK, Base DEF を以下の計算式で減算する。
4.2 減少量計算式 (Decay Formula)
年齢が高いほど、1年ごとの衰えが加速する。
Age Zone
Vit Decay / Year
ATK/DEF Decay
Description
40 - 49
-2
-1 (2年に1回)
衰えの始まり<br>肉体のキレが落ちる。<br>※偶数年齢時のみ減少などの判定を入れる。
50 - 59
-5
-1 (毎年)
老境<br>明確に弱くなる。<br>レベルアップによる成長分が相殺され始める。
60 +
-10
-2 (毎年)
死への行進<br>戦闘は困難になる。引退（Shadow化）を急ぐべき時期。
• Constraint: ATK/DEF の最低値は 1 とする（0にはならない）。
• Log: 誕生日イベントで「腕の力が落ちたのを感じる... (ATK -1)」等のログを表示。

--------------------------------------------------------------------------------
5. UIフロー: 魂の選定 (The Soul Calibration)
Step 1: Input Form 氏名、性別、生年月日を入力。
Step 2: Confirmation Modal サーバー計算後のステータスを確認し、確定する。
• 23-25歳選択時の警告: 「能力は高いが、全盛期は短い。この魂で始めるか？」
• 16-18歳選択時の警告: 「未熟な肉体。生き残るには知恵が必要だ。」
Step 3: Game Start [ この魂で現世に降り立つ ] ボタン押下で、user_profiles 作成完了。

--------------------------------------------------------------------------------
6. Antigravity Implementation Tasks
Task 1: Initial Stats Logic (POST /api/auth/calculate-stats)
• 入力された生年月日から年齢を計算し、v9.3 のテーブルに基づいて初期値を算出する。
• Randomizer:
    ◦ base_atk = table_value + (Math.random() > 0.5 ? 1 : 0)
    ◦ base_def = table_value + (Math.random() > 0.5 ? 1 : 0)
• Response: 計算結果のプレビューを返す。
Task 2: Aging Logic (POST /api/quest/complete)
クエスト完了処理において、以下の老化ロジックを追加・更新する。
1. user.age_days にクエスト所要日数を加算。
2. if (user.age_days >= 365) の場合:
    ◦ user.age を +1。
    ◦ user.age_days をリセット（余剰分は持ち越し）。
    ◦ Decay Check:
        ▪ if (user.age >= 40):
            • Max Vitality 減少（ゾーン定義参照）。
            • ATK/DEF 減少: ゾーン定義に基づき、該当する場合は base_atk, base_def を減算（Min 1）。
    ◦ レスポンスに aging_event: { years_added: 1, vit_decay: 5, atk_decay: 1 } を含める。
Task 3: UI Feedback
• Result Screen: 誕生日イベント発生時、レベルアップ演出とは逆に、画面が暗くなり心音が鳴る**「老化演出」**を実装。減少したステータスを赤字で表示する。