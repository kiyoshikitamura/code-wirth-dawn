Code: Wirth-Dawn Specification v2.0: Parameters & Battle System
1. 概要 (Overview)
本ドキュメントは、非同期型RPG「Code: Wirth-Dawn」におけるキャラクターパラメータ、パーティシステム、およびバトルロジックの定義書である。 **「有限の寿命（Vitality）」と「歴史への介入（Alignment）」**をシステムの中核とし、バトルを単なるHPの削り合いから「リソース管理とリスクヘッジの物語」へと昇華させる。

--------------------------------------------------------------------------------
2. プレイヤーパラメータ定義 (User Profile)
プレイヤーは「観測者」であり、有限の時間を生きる人間として定義される。
2.1 Identity & Time (アイデンティティと時間)
Column Name
Type
Description
Note
name
string
プレイヤー名
gender
enum
Male / Female / Unknown
[New] アバター生成、装備条件、NPC反応分岐に使用。
age
int
年齢 (Default: 18)
365日経過で+1。生存判定の基礎値。
location_id
uuid
現在地
移動には日数を消費する。
title
string
二つ名 (自動生成)
Alignmentに基づき自動付与される（例：「混沌の放浪者」）。
2.2 Life Cycle Resources (生命と寿命)
Column Name
Type
Description
Note
hp
int
Short-term Health
0で敗北（敗走）。宿屋で回復可能。
mp
int
Skill Resource
スキル使用コスト。宿屋で回復可能。
vitality
int
Long-term Life (The Candle)
[Critical] 回復不能な寿命リソース。<br>初期値: 100。<br>加齢、禁術使用、敗走、強行軍で減少。<br>0になると「引退/死亡」イベント発生。
max_vitality
int
最大生命力
加齢イベントにより上限自体が削られていく。
2.3 Mind & Society (精神と社会)
Column Name
Type
Description
Note
alignment
jsonb
{order: int, chaos: int, justice: int, evil: int}
4軸独立管理。行動ログにより蓄積。
reputation
jsonb
{"loc_id": score, ...}
拠点ごとの名声値。ショップ/宿屋の利用可否を判定。
assets
jsonb
{gold: int, gift_pts: int, prayer_pts: int}
所持金、称賛（作者への投げ銭）、祈り（世界干渉）。

--------------------------------------------------------------------------------
3. パーティメンバー定義 (Party Member / NPC)
NPCは自律行動するユニットではなく、**「人格を持った装備品（Living Equipment）」**として定義する。
3.1 Basic Info
Column Name
Type
Description
Note
id
uuid
Unique ID
owner_id
uuid
User ID
name
string
NPC名
gender
enum
Male / Female / Unknown
[New] 性別特攻攻撃などの判定に使用。
origin
enum
System (Generated) / Ghost (Retired Player)
将来的に他プレイヤーの引退キャラを雇用可能にするため。
loyalty
int
忠誠度 (0-100)
低いとデッキに「サボり」カードが混ざるリスク。
3.2 Combat Function (戦闘機能)
Column Name
Type
Description
Note
durability
int
NPC's HP
0になると死亡/契約終了（ロスト）。<br>戦闘から除外され、提供カードも消滅する。
inject_cards
text[]
提供カードリスト
[Core Mechanic]<br>このNPCを連れている間、プレイヤーの山札に追加されるカードID。<br>例: ['card_heal_light', 'card_holy_smite']
cover_rate
int
庇う確率 (%)
プレイヤーへの被弾を肩代わりする確率。
passive_id
string
常時効果ID
例: shop_discount_holy (聖帝国での買い物割引)

--------------------------------------------------------------------------------
4. バトルシステム v2.0 (Battle Logic)
「デッキインジェクション」と「ミートシールド」によるリソース管理バトル。
4.1 デッキ生成ロジック (Deck Injection)
戦闘開始時、山札（Draw Pile）は以下の3要素をマージして生成される。
1. User Deck: プレイヤー自身が装備しているカード。
2. Party Injection: 生存している(durability > 0)同行NPCの inject_cards 配列。
3. World Injection:
    ◦ 拠点が「繁栄(Prosperous)」: 支援カード（回復など）が混ざる。
    ◦ 拠点が「崩壊(Ruined)」: **ノイズカード（恐怖、泥沼など）**が混ざる。
4.2 ダメージ解決ロジック (Meat Shield)
敵の攻撃時、プレイヤーのHPを減らす前に以下の判定を行う。
function resolveDamage(damage: number, target: User, party: PartyMember[]) {
  // 1. 性別特攻などの判定 (例: サキュバスは男性優先)
  // ...

  // 2. 庇う判定 (Cover Check)
  for (const member of party) {
    if (member.durability > 0 && Math.random() * 100 < member.cover_rate) {
      // Hit NPC
      member.durability -= damage;
      log(`${member.name} blocked the attack!`);
      
      if (member.durability <= 0) {
        handleNpcDeath(member); // ロスト処理 & デッキからカード除外
      }
      return; // プレイヤーへのダメージは0
    }
  }

  // 3. プレイヤー被弾
  target.hp -= damage;
  if (target.hp <= 0) {
    handleDefeat(target); // 敗走処理 & Vitality減少
  }
}
4.3 コストシステム (Cost Management)
カード使用時のコストは2種類存在する。
• MP Cost: 通常スキル。宿屋で回復可能。
• Vitality Cost: **禁術（Forbidden Arts）**や奥義。
    ◦ 使用すると vitality を直接消費する。
    ◦ 「命を削って強敵を倒す」選択肢を提供する。

--------------------------------------------------------------------------------
5. 世界・拠点パラメータ (World & Location)
NPC（住人）の反応は、個別の好感度ではなく「世界の状態」と「プレイヤーの属性」のマッチングで決定される。
Parameter
Logic
所属国 (Owner)
4大国家（聖帝国/マルカンド/夜刀神国/華龍神朝）。24時間ごとの集計で変動。
繁栄度 (State)
Zenith > Prosperous > Stagnant > Declining > Ruined<br>支配国属性と土地属性の摩擦（Friction）で低下。
ショップ品揃え
繁栄度が高いほど良品が並ぶ。崩壊時は食料すら枯渇する。
反応 (Reaction)
以下の条件でNPCのセリフ分岐。<br>1. プレイヤーの称号 (Title)<br>2. その拠点での名声 (Reputation)<br>Example: 名声高=「英雄殿！」 / 名声低=「出て行け！」

--------------------------------------------------------------------------------
6. Implementation Notes for Antigravity
• Database: Supabaseを使用。user_profilesとparty_membersのリレーションを確立すること。
• Immutability: Vitality の減少は重要なイベントであり、不用意に回復させないこと（デバッグ機能除く）。
• UI: バトル画面では、User HPだけでなく Party Memberの耐久バー を可視化し、「誰がデッキを支えているか」を直感的にすること。