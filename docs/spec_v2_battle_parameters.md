Code: Wirth-Dawn Specification v2.11: Battle System & Data Architecture (Final)
1. 概要 (Overview)
本仕様書は、Code: Wirth-Dawn のバトルシステム、および関連するリソース管理の最終定義である。 v2.10に対し、他システム（World, Shadow, Progression）との結合時に発生する**「詰み（Softlock）」や「経済崩壊（Exploit）」を防ぐための例外規定**を追加している。
Core Philosophy:
• Determinism: ダメージ計算に乱数やスケーリングを含めず、計算通りの結果を出力する（完全情報ゲーム）。
• High Risk: 敗北時のリソース全ロストと、回復しないVitality（寿命）による緊張感。

--------------------------------------------------------------------------------
2. データアーキテクチャ (Data Architecture)
2.1 CSV構造拡張 (src/data/csv/)
File Name
Key Columns
Note
enemies.csv
id, hp, atk, def, resistance
ステータスは固定値。スケーリング補正なし。
items.csv
id, type, cost, ap_cost, discard_cost
discard_cost: ノイズカード廃棄用コスト。
2.2 データベーススキーマ (schema.sql)
• enemies Table:
    ◦ resistance (TEXT[]): 無効化する状態異常ID配列 (例: ['stun', 'poison'])。
• items Table:
    ◦ target_type (TEXT): single_enemy, all_enemies, self, single_ally.
    ◦ cost (INT): デッキ構築コスト（Progression制限用）。
    ◦ ap_cost (INT): バトル内使用コスト。

--------------------------------------------------------------------------------
3. ターン進行プロセス (Turn Sequence)
3.1 フェーズ詳細
1. Draw Phase (ドロー):
    ◦ Hand Fill: 手札上限（Default: 5）まで引く。上限を超える分は引かない。
    ◦ Cycling: 山札不足時、捨て札をリシャッフル。
    ◦ Struggle (あがき - 救済措置): ドロー開始時に「山札+捨て札+手札」の合計が 0枚 の場合、システムカード Struggle (0 AP, 1 Dmg) を生成して手札に加える。
2. Energy Phase (AP回復):
    ◦ AP = Min(10, CurrentAP + 5)。
3. Action Phase (行動):
    ◦ プレイヤーはAPがある限り行動可能。
    ◦ Purge (ノイズ廃棄): type: noise のカードは、定義された discard_cost (例: 1 AP) を支払うことで、効果を発動せずに手札から消滅（Exhaust）させることができる。
4. End Phase (ターン終了):
    ◦ 状態異常の処理（Poison, Regen）。
    ◦ バフ・デバフの期間減算。
5. Enemy Phase (敵行動):
    ◦ 敵AIによる攻撃処理。
3.2 ターン制限 (Turn Limit)
• Limit: 30ターン。
• Result: 30ターン経過時点で敵が生存している場合、強制的に 敗北 (EXIT_FAIL) となる。

--------------------------------------------------------------------------------
4. ダメージとステータス計算 (Deterministic Logic)
4.1 計算式（固定値・乱数なし）
Damage=(User.ATK+Card.Power)∗BuffMultiplier−Enemy.DEF
• User.ATK/DEF: user_profiles の値（成長・老化反映済み）を使用。
• Variance: 乱数幅、クリティカルは実装しない。計算結果が常に正解となる。
• Min Damage: 最終値が0以下の場合、1 に補正する（防御無視攻撃を除く）。
4.2 特殊ダメージ：Vitality (寿命)
• Effect: drain_vit 属性を持つ攻撃は、HPではなく user.current_vitality を直接減らす。
• Damage Value: 固定で -1。
• Safety Cap (即死防止):
    ◦ 多段ヒット等による事故死を防ぐため、**「Vitalityダメージは1ターンにつき最大1回まで」**とする。
    ◦ 同ターン2回目以降の drain_vit は無効化（0ダメージ）される。

--------------------------------------------------------------------------------
5. リソースの永続性とロスト (Persistence & Risk)
クエスト内での連戦、および完了時のルール。
Resource
Persistence Rule
Implementation Note
HP
Carry Over (持ち越し)
前のバトルの終了時HPが、次戦の開始時HPとなる。<br>自動回復は一切しない。
AP / Deck
Reset
バトルごとに初期化される。
Loot / EXP
Risk (全ロスト)
取得したアイテムと経験値は一時プールに保管。<br>敗北・撤退時は全て破棄される。<br>勝利（EXIT）時のみ獲得確定。
NPC
Permadeath (消滅)
HP 0になったNPCは即座に消滅し、そのクエスト中は復帰しない。<br>クエスト終了後、契約解除となる。
Consumables
Consumed
使用した消費アイテムは即座に在庫減算。クエスト中は補充されない。

--------------------------------------------------------------------------------
6. システム間干渉の解決 (Conflict Resolution)
6.1 環境カード介入 (World Injection)
• Issue: 拠点繁栄度により強制混入されるカード（Support/Noise）が、デッキコスト上限を圧迫する。
• Resolution:
    ◦ システムによって強制挿入されるカード（Injection Cards）は、**デッキコスト計算の対象外（Cost 0扱い）**とする。
    ◦ バトル開始時のデッキ構築ロジックにて、バリデーション後に挿入する処理順とする。
6.2 汚染カード対策 (Noise Handling)
• Issue: 手札が「使用不可カード（Noise）」で埋まるとパスし続けるしかなくなり、死を待つのみとなる（Softlock）。
• Resolution:
    ◦ 全ての type: noise カードに、共通アクション 「廃棄 (Purge)」 を付与する。
    ◦ Cost: 1 AP。
    ◦ Effect: そのカードをゲームから除外する（手札枠を空ける）。
6.3 残影の不正利用防止 (Shadow Constraints)
• Issue: 残影（Shadow）が消費アイテムを使うと、雇用主の在庫が減るか、無限に使えてしまう。
• Resolution:
    ◦ Shadow登録時 (signature_deck)、消費アイテム (type: consumable) の登録を禁止する。
    ◦ Shadowはスキルカード (type: skill) のみ使用可能とする。

--------------------------------------------------------------------------------
7. ターゲットとAI挙動 (Targeting)
7.1 ターゲット属性
• single_enemy: 敵単体（挑発の影響を受ける）。
• all_enemies: 敵全体（挑発無視）。
• single_ally: 味方単体（回復用）。
7.2 状態異常と耐性
• Resistance Check: enemies.resistance 配列に含まれるIDのデバフは、付与されず "RESISTED" となる。
• Definitions:
    ◦ stun: 行動不能（AP回復なし）。
    ◦ poison: ターン終了時 HP -5% (Min 1)。
    ◦ taunt: 単体攻撃を引きつける。

--------------------------------------------------------------------------------
8. Antigravity Implementation Tasks (Summary)
1. Damage Engine: 固定値計算式、および Vitalityダメージのターン1回制限の実装。
2. Turn Logic: ノイズカードの「1 APで廃棄」機能の実装。
3. Persistence: 敗北時の loot_pool, exp_pool 全破棄ロジックの実装。
4. Validation: Shadow登録時の消費アイテム禁止チェックの実装。
5. World Injection: バトル初期化時、環境カードをデッキコスト無視で混入させる処理の実装。