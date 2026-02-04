Code: Wirth-Dawn Specification v7.0: Lifecycle, Succession & Security
1. 概要 (Overview)
本ドキュメントは、キャラクターの**「死と継承（Lifecycle）」、「初心者保護（Newbie Protection）」、および「経済の健全性（Anti-Fraud）」**に関する仕様定義である。 spec_v2 (Vitality) および spec_v5 (Shadow Economy) の仕様を補完し、長期運営に耐えうる堅牢なループを構築する。

--------------------------------------------------------------------------------
2. 死と継承 (Death & Succession)
Vitalityが0になったキャラクターは「死亡/引退」扱いとなり、その資産の一部を次世代（新規作成キャラ）へ継承する。
2.1 死亡処理プロセス (The Death Sequence)
1. Trigger: vitality <= 0 となった時点で、データベース上の is_alive フラグを false に更新。
2. Snapshot: 現在のステータスを historical_logs テーブルに保存（墓標データ）。
3. Shadow Registration:
    ◦ Subscriber: 自動的に shadow_heroic として酒場登録（不労所得化）。
    ◦ Free User: データは記録されるが、酒場には登録されない。
2.2 遺言と継承 (The Will / Inheritance)
次のキャラクター作成時、直前の死亡キャラから資産を引き継ぐ。サブスクリプション加入状況により継承率が変動する（Pay for History）。
継承項目
Free User
Subscriber (Premium)
Gold
10%
50%
Items
なし
「家宝」として装備1つを指定継承
Reputation
0 (リセット)
10% (「〇〇家の末裔」として認知される)
• Implementation: user_profiles に legacy_points カラムを作成し、次回キャラ作成時に参照する。

--------------------------------------------------------------------------------
3. 初心者保護 (Newbie Protection)
「崩壊（Ruined）」した世界にLv1で放り出される理不尽を防ぐ。
3.1 安全なスポーン (Safe Spawn Logic)
新規アカウント作成時の初期位置（location_id）はランダムではなく、以下の優先順位で決定される。
1. Priority 1: 繁栄度 Lv 5 (Zenith) または Lv 4 (Prosperous) の拠点。
2. Priority 2: 治安が悪化していない（frictionが低い）拠点。
3. Fallback: 上記がない場合のみランダム。
3.2 初心者の加護 (Novice Blessing)
Level 1 〜 5 の間、プレイヤーには不可視のバフ buff_novice が付与される。
• Effect A (Anti-Noise): 拠点が「崩壊（Ruined）」していても、デッキへのノイズカード（Debris/Fear）混入を無効化する。
• Effect B (Price Cap): ショップのインフレ係数を無視し、常に定価（1.0x）で購入可能。
• Note: Lv 6 になった瞬間、または「禁術」を初めて使用した瞬間にこの加護は消滅する。

--------------------------------------------------------------------------------
4. 経済セキュリティ (Anti-Fraud Economy)
サブアカウントによる「自作自演の雇用（ロイヤリティ稼ぎ）」を防ぐ。
4.1 ロイヤリティ制限 (Royalty Cap)
spec_v5 で定義されたロイヤリティ受け取りに対し、以下の制限（Circuit Breaker）を設ける。
1. Daily Cap: 1日に受け取れるロイヤリティの上限額を設定。
    ◦ Formula: UserLevel * 1000 Gold (高レベルほど上限緩和)
2. Deduplication: 同一の user_id からの雇用報酬は、24時間につき1回のみ発生する。
    ◦ Logic: AさんがBさんの残影を100回雇っても、Bさんに報酬が入るのは最初の1回分のみ。
4.2 インフレ抑制 (Gold Sink)
サーバー全体の総ゴールド量が増えすぎた場合、自動的に調整を行う。
• Dynamic Prayer Cost: 「祈り」に必要なゴールド単価を、世界総資産に応じて変動させる（富裕層から多く回収する仕組み）。

--------------------------------------------------------------------------------
5. 祈りのフィードバック (Prayer Visualization)
「祈り」ボタンを押した際のUXを定義。単なる数値変動ではなく「手応え」を返す。
5.1 API Response
POST /api/world/pray のレスポンス定義。
{
  "success": true,
  "cost": 1000,
  "impact_value": 0.5, // 属性値への寄与量
  "visual_cue": "light_pillar_gold", // クライアント側での演出指定
  "message": "あなたの祈りが、王都の秩序を強固にしました。"
}
5.2 演出 (Visual Cues)
• Order: 天から光が降り注ぐエフェクト。
• Chaos: 紫色の霧が湧き上がるエフェクト。
• Justice: 桜吹雪または青い炎。
• Evil: 赤黒い落雷。

--------------------------------------------------------------------------------
6. Implementation Notes for Antigravity
Task 1: Succession Logic (createCharacter)
キャラクター作成フローを更新し、previous_character_id がある場合は legacy_package を適用して初期Gold/Itemを加算する処理を実装すること。
Task 2: Fraud Check (distributeRoyalty)
ロイヤリティ分配処理の前に、royalty_logs テーブルを参照し、daily_cap および deduplication チェックを行うミドルウェアを挟むこと。
Task 3: Novice Buff (DeckInitializer)
バトル開始時のデッキ構築ロジックにおいて、user.level <= 5 の場合は inject_noise_cards 処理をスキップする条件分岐を追加すること。

--------------------------------------------------------------------------------