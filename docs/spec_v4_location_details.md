Code: Wirth-Dawn Specification v4.2: Location, Prosperity & World Topology
1. 概要 (Overview)
本ドキュメントは、Code: Wirth-Dawn における各拠点（Location）の動的な状態変化、および**「世界地図の構造（Topology）」の詳細定義である。spec_v1 で定義された世界構造に基づき、と、spec_v3.4 で定義されたクエスト移動（Travel）のための地理データ**を規定する。
Dependencies:
• spec_v1_world_system.md (Nation & Attribute definitions)
• spec_v3.4_quest_system.md (Travel Logic)
• spec_v6_shop_system.md (Inflation Logic)

--------------------------------------------------------------------------------
2. 世界トポロジーと移動データ (World Topology)
クエスト中の「移動（Travel）」を実現するため、各拠点はグラフ構造上のノードとして定義される。
2.1 データ構造拡張 (locations table)
既存のテーブルに、地図上の座標と接続情報を追加する。
Column
Type
Description
map_x
INT
ワールドマップUI上のX座標 (0-1000)。
map_y
INT
ワールドマップUI上のY座標 (0-1000)。
neighbors
JSONB
隣接する拠点とその移動コストを定義する隣接リスト。
2.2 隣接リスト定義 (neighbors)
移動にかかる日数は、直線距離ではなく「街道の整備状況」や「地形」によって定義される（重み付きグラフ）。
// location_id: "loc_regalia" (王都) の neighbors 例
{
  "loc_north_fort": { "days": 1, "type": "road" },    // 街道: 1日で到着
  "loc_mountain_path": { "days": 3, "type": "rough" } // 山道: 3日かかる
}
2.3 ルート計算ロジック (Route Calculation)
spec_v3.4 の type: travel 実行時、以下のロジックで総移動日数を算出する。
1. Dijkstra: 現在地から目的地までの最短経路（所要日数の合計が最小）を探索する。
2. Total Cost: 経路上の days の合計値を算出。
    ◦ Example: A -> B (1 day) -> C (2 days) = Total 3 days.
3. Visual: UI上では、この経路に沿ってプレイヤーの駒をアニメーション移動させる。

--------------------------------------------------------------------------------
3. 繁栄度レベル定義 (Prosperity Levels)
各拠点は prosperity_level (Int: 1-5) を持ち、この値によってゲーム体験が劇的に変化する。
Lv
Name
State Description
Economy Impact
Battle Impact (Deck Injection)
5
絶頂 (Zenith)
完全なる調和<br>祝祭状態。支配国と民意が一致。
Bonus: レアアイテム出現。<br>限定スキル販売。
Support Injection:<br>「市民の支援」などのバフカードが混入。<br>(Cost: 0扱い)
4
繁栄 (Prosperous)
安定<br>標準状態。
Normal:<br>標準価格 (x1.0)。
None:<br>影響なし。
3
停滞 (Stagnant)
陰り<br>活気の低下。
Warning:<br>品揃えが少し減る。
None:<br>影響なし。
2
衰退 (Declining)
荒廃の予兆<br>治安悪化。スラム化。
Inflation:<br>価格 x1.5。<br>宿屋回復量低下。
Risk:<br>低確率でノイズカードが混ざる。<br>(Cost: 0扱い)
1
崩壊 (Ruined)
機能不全<br>火災・瓦礫・無人化。
Collapse:<br>ショップ利用不可。<br>闇市（Black Market）のみ。
Hazard Injection:<br>Noise Cards (Fear, Debris) が強制混入。<br>(Cost: 0扱い / Discard Cost: 1 AP)
3.1 環境カード介入ルール (Injection Rules)
• NPC Exception: spec_v3.4 に基づき、環境カードの混入はプレイヤーに対してのみ発生し、同行NPC（残影）のデッキは汚染されない。
• Purge Mechanic: 崩壊時に混入する Noise カードは、1 AP を支払うことで手札から廃棄（Purge）可能。

--------------------------------------------------------------------------------
4. 統治摩擦と変動ロジック (Alignment Friction)
繁栄度はランダムではなく、「支配国の思想」と「土地の民意」のズレによって計算される。
4.1 計算式
Friction=ABS(RulingNation.Attribute−Location.CurrentAttribute)
• 摩擦係数が高い（支配国の思想と、その土地の民意がズレている）ほど、繁栄度は低下に向かう。
4.2 復興と崩壊
• 崩壊条件: Friction が閾値を超え、かつ Level が 2 の状態で日付変更を迎えると Level 1 (Ruined) へ転落。
• 復興条件: プレイヤーの行動（クエスト/祈り）により Friction が緩和された場合、翌日に Level 2 へ復帰する。

--------------------------------------------------------------------------------
5. ビジュアル表現 (Visual Logic)
5.1 背景画像 (Location Background)
拠点の背景画像は、**「支配国家 × 繁栄度」**のマトリクスで決定される。
• Naming: bg_{nation_id}_{prosperity_level}.png
• Example: bg_holy_empire_ruined.png
5.2 ワールドマップ表現 (World Map)
• Nodes: map_x, map_y に基づいて拠点をプロット。
• Edges: neighbors に基づいて街道（線）を描画。
• State: 繁栄度に応じて、拠点アイコンの周りにエフェクト（輝き/黒煙）を表示する。

--------------------------------------------------------------------------------
6. SNS連動：号外システム (Extra Edition)
世界に劇的な変化があった場合、SNS（X）用のOG画像生成と投稿をトリガーする。
6.1 Trigger Conditions
1. Collapse (崩壊): Lv 2 -> Lv 1 ("王都レガリア、炎上。")
2. Recovery (復興): Lv 1 -> Lv 2 ("黄金都市、奇跡の復興。")
3. Annexation (陥落/併合): Ruling Nation Change ("神都出雲、陥落。")
6.2 Witness System
変化が発生したタイミングで、その拠点に location_id が一致していたプレイヤーに対し、リザルト画面等で「号外画像（目撃者クレジット入り）」を配布する。

--------------------------------------------------------------------------------
7. Antigravity Implementation Tasks
Task 1: Topology Seeding (seed_locations.ts)
• locations テーブルに map_x, map_y, neighbors カラムを追加。
• 初期データとして、主要20拠点の座標と接続関係（移動日数）を定義・投入すること。
    ◦ Requirement: 全ての拠点は少なくとも1つの他拠点と接続されており、孤立ノードがないこと。
Task 2: Route Finder Utility (utils/worldMap.ts)
• Input: start_id, end_id.
• Process: Dijkstra法またはBFSを用いて、neighbors を探索し、最短経路と総移動コスト（日数）を返す関数を実装すること。
    ◦ Return: { path: ['loc_a', 'loc_b'], total_days: 3 }
Task 3: Visual Logic Integration
• <LocationBackground />: Nation ID と Prosperity Level を受け取り、適切な背景画像をレンダリング。
• <WorldMap />: クエスト移動演出時、計算された path に沿ってプレイヤーアイコンをアニメーションさせる。
