Code: Wirth-Dawn Specification v6.0: Dynamic Shop & Economy
1. 概要 (Overview)
本仕様書は、ゲーム内の経済活動拠点である「ショップ（市場/闇市）」の定義である。 静的な品揃えではなく、spec_v1（世界情勢）および spec_v4（拠点詳細）の状態変数を参照し、**価格（インフレ）と品揃え（フィルタリング）**が動的に変化するロジックを実装する。

--------------------------------------------------------------------------------
2. 商品分類 (Item Categories)
取り扱う商品は大きく2種類に分類され、それぞれ管理方法が異なる。
Type
名称
定義・仕様
データベース挙動
Consumable
消費アイテム
使い捨ての道具。<br>（例：薬草、松明、投擲ナイフ）<br>デッキに組み込まず、インベントリから消費する。
inventory テーブルで数量（quantity）管理。<br>使用すると減る。
Skill / Gear
スキル・装備
永続的なカード。<br>（例：鉄の剣、ヒール、火球）<br>購入すると「カードプール」に追加され、デッキ構築に使用可能。
user_cards テーブルで管理。<br>一度買えば永続所持（ユニーク制）。

--------------------------------------------------------------------------------
3. 動的変動ロジック (Dynamic Logic)
ショップのAPIは、リクエストごとに以下の計算を行い、レスポンス（商品リストと価格）を生成する。
3.1 価格変動（Inflation Logic）
拠点の「繁栄度（Prosperity Level）」に基づき、価格係数を適用する。
繁栄度 (Lv)
状態
価格係数 (Price Multiplier)
経済状況
5 (Zenith)
絶頂
x 1.0
安定供給。レア物が出現しやすい。
4 (Prosperous)
繁栄
x 1.0
標準価格。
3 (Stagnant)
停滞
x 1.2
軽微な物価上昇。
2 (Declining)
衰退
x 1.5
インフレ発生。 物資不足により高騰。
1 (Ruined)
崩壊
-
ショップ機能停止、または闇市（x 3.0）のみ。
3.2 品揃えフィルタリング (Lineup Filtering)
プレイヤーに提示される商品リストは、以下の条件でフィルタリングされる。
A. 国家・文化フィルタ (Nation Filter)
現在の支配国（ruling_nation_id）に紐付いた特産品のみが並ぶ。
• Example: 聖帝国支配下の街では「聖水（Holy Water）」が買えるが、マルカンド支配下に変わると「火薬（Gunpowder）」に置き換わる。
B. 属性・名声フィルタ (Alignment & Reputation)
プレイヤーの属性や名声によって、閲覧権限が変わる（Show/Hide）。
• 聖遺物: Player.Alignment.Order が高い場合のみ販売される。
• 闇市 (Black Market): Player.Reputation が低い（悪名高い）場合、あるいは Alignment.Evil が高い場合のみ出現する「裏メニュー」。

--------------------------------------------------------------------------------
4. データ構造 (Database Schema)
4.1 items Table (Master Data)
全アイテムの定義。販売条件（タグ）を含む。
CREATE TABLE items (
  id TEXT PRIMARY KEY, -- e.g., 'item_potion_mid', 'skill_holy_smite'
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('consumable', 'skill')),
  base_price INT NOT NULL,
  effect_data JSONB, -- 回復量や攻撃力
  
  -- Availability Logic
  nation_tags TEXT[], -- e.g., ['loc_holy_empire', 'loc_all']
  min_prosperity INT DEFAULT 1,
  required_alignment JSONB, -- e.g., { "order": 20 }
  is_black_market BOOLEAN DEFAULT FALSE -- 闇市限定フラグ
);
4.2 API Response Example
GET /api/shop?location_id=xxx
{
  "location_status": {
    "prosperity": "Declining",
    "inflation_rate": 1.5
  },
  "items": [
    {
      "id": "item_dried_meat",
      "name": "干し肉",
      "base_price": 50,
      "current_price": 75, // 50 * 1.5
      "is_available": true
    },
    {
      "id": "skill_royal_sword",
      "name": "近衛騎士の剣技",
      "reason_hidden": "Low Reputation" // 条件未達時はグレーアウトまたは非表示
    }
  ]
}

--------------------------------------------------------------------------------
5. UI/UX 要件
• 店主のリアクション:
    ◦ spec_v4 のビジュアル変化に合わせ、店主の立ち絵やセリフが変化する。
    ◦ 繁栄時: 「良い品が入ったよ！」
    ◦ 崩壊時: 「……水ならあるが、高いぞ。」
• 動的価格の可視化:
    ◦ 価格が高騰している場合、価格表示を赤字にし、横に (Inflation x1.5) と警告アイコンを表示する。

--------------------------------------------------------------------------------
6. Antigravity Implementation Tasks
Task 1: ItemFetcher Service
spec_v1 (World) と spec_v2 (User) のデータを参照し、動的に商品リストを生成するクエリ関数を実装してください。
• Input: locationId, userId
• Process:
    1. Locationの ruling_nation と prosperity_level を取得。
    2. Userの alignment と reputation を取得。
    3. items テーブルをスキャンし、条件合致するアイテムのみ抽出し、価格係数を掛ける。
Task 2: Purchase Transaction
購入処理の実装。
• Gold Check: インフレ後の価格で所持金チェックを行う。
• Constraint: type: skill の場合、既に所持していないかチェック（重複購入不可）。
• Gold Sink: 支払われたゴールドはシステムにより回収される（市場から消滅する）。

--------------------------------------------------------------------------------