# NPC・傭兵マスタデータ一覧

本ドキュメントは、ゲーム内に登場するすべてのNPC（酒場で雇用できるシステム傭兵、シナリオ専用のゲスト同行者、およびクエスト護衛対象）のステータス、スキル、出現条件、および仕様を網羅した一覧カタログです。

---

## 1. クエスト護衛対象NPC（Escort Target）特殊仕様

戦闘中に護衛対象（`is_escort_target: true`）となるNPCは、特殊なゲームルールが適用されます。

### 護衛ミッションルール
1. **護衛失敗（ゲームオーバー）判定**:
   - **戦闘終了時**: 戦闘に勝利しても、護衛対象のHPが0以下になっている場合、勝利は取り消され強制的にゲームオーバー（`end_failure` ノード）へ遷移します。
   - **シナリオ進行時**: シナリオエンジンが各ノード処理時に護衛対象が死亡（`deadNpcs` に存在）しているかチェックし、該当する場合はその場で失敗となります。
2. **戦闘中の挙動**:
   - 護衛対象NPCは基本的に戦闘力が極めて低いか、あるいは一切攻撃を行わずに防御や回復に専念します。
   - プレイヤーは「挑発」や「庇う」スキル、または全体バリアなどを駆使して護衛対象に攻撃がいかないよう保護する必要があります。

### 護衛対象NPC一覧

| ID | 名前 | 職業 / Lv | HP / ATK / DEF | 該当クエスト | 特徴・戦闘行動 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **4051** | **商人** | Merchant<br>Lv.1 | HP: 30<br>ATK: 1 / DEF: 1 | [7002 放浪商人の護衛](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7002_escort.md) | 戦闘能力は皆無（攻撃力1）。所持カードは「回避」のみで自衛する。HP30と非常に打たれ弱い。 |
| **4060** | **薛 (せつ)** | Official<br>Lv.1 | HP: 40<br>ATK: 0 / DEF: 1 | [7043 巡検使の護衛と汚職隠蔽](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7043_official.md) | 悪徳官僚。戦闘への貢献は皆無。HP40。 |
| **4104** | **撫子** | Miko<br>Lv.10 | HP: 100<br>ATK: 5 / DEF: 5 | [6102 冥食の残滓](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6102_spot_yato.md) | 生贄の少女。自身で「防御」や「治癒」のカードを使用して必死に生き残ろうとする。 |
| **4105** | **アルバート** | Miko<br>Lv.10 | HP: 100<br>ATK: 5 / DEF: 5 | [7012 聖地巡礼者の護衛](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7012_pilgrim.md) | 狂信的な巡礼者。撫子と同一のステータスを持ち、同じく「防御」「治癒」カードで自衛する。 |

---

## 2. 全NPC・傭兵カタログ（58体）

> **【ステータスに関する注記】**
> NPCはプレイヤーと異なり装備品を装着できません。そのため、以下のATKおよびDEFの数値には、実装上のルール（通常NPCはLv帯に応じて `Lv1-9: +2/+2`, `Lv10-19: +4/+3`, `Lv20-29: +6/+5`, `Lv30+: +8/+6` を加算。ヒーラー系はATK加算のみ80%に減衰。意図的設計の最弱NPC・一部ゲストは加算なし）が適用された最終的なマスタ値（`npcs.csv` 同期値）が記載されています。
> 
> また、VITコスト廃止に伴い、NPCの所持カードからVIT/MP消費の仕様はクリーンアップされ、すべてAP消費のみに統一されています。

| ID | 二つ名 / 名前 | 職業 / Lv | HP / ATK / DEF | かばう率 | 雇用費 | 出現・雇用条件 | 所持カード（スキル） | 所属 / 特徴・コメント |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **4001** | 見習い僧侶<br>**エレナ** | Cleric<br>Lv.5 | HP: 80<br>ATK: 3 / DEF: 2 | 15% | 300 G | **常時出現**<br>(聖帝国の酒場) | [治癒](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L15) (ID:14)<br>[強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1) | 聖帝国: 基本的なヒーラー。回復と最低限の自衛を行う。 |
| **4002** | 黒鉄の傭兵<br>**ガッツ** | Mercenary<br>Lv.10 | HP: 200<br>ATK: 8 / DEF: 10 | 60% | 1200 G | **常時出現**<br>(すべての酒場 / Free) | [強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1)<br>[挑発](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L10) (ID:9) | 共通: 典型的なタンク。挑発と攻撃を持つ。 |
| **4003** | 荷運びの<br>**トビー** | Porter<br>Lv.1 | HP: 40<br>ATK: 4 / DEF: 2 | 50% | 50 G | **常時出現**<br>(すべての酒場 / Free) | [クイックステップ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L9) (ID:8)<br>[強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1) | 共通: 安価な肉壁。回避と基本攻撃。すぐ逃げ出そうとする。 |
| **4004** | 薄汚れた<br>**野犬** | Animal<br>Lv.1 | HP: 30<br>ATK: 5 / DEF: 2 | 80% | 30 G | **常時出現**<br>(すべての酒場 / Free) | [強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1)<br>[クイックステップ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L9) (ID:8) | 共通: 最も安い壁。噛みつきと回避。 |
| **4005** | 新米衛兵<br>**ハンス** | Guard<br>Lv.8 | HP: 110<br>ATK: 5 / DEF: 2 | 40% | 400 G | **常時出現**<br>(聖帝国の酒場) | [斬撃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L3) (ID:2)<br>[挑発](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L10) (ID:9) | 聖帝国: 平均的な性能。剣と挑発。 |
| **4006** | 歴戦の騎士<br>**ガッド** | Knight<br>Lv.15 | HP: 250<br>ATK: 7 / DEF: 3 | 75% | 2000 G | **常時出現**<br>(聖帝国の酒場) | [シールドバッシュ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L7) (ID:6)<br>[防御](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L5) (ID:4) | 聖帝国: 堅牢な盾。シールドバッシュで気絶させる。 |
| **4007** | 巡礼の神官<br>**アンナ** | Priest<br>Lv.10 | HP: 100<br>ATK: 3 / DEF: 2 | 10% | 500 G | **常時出現**<br>(聖帝国の酒場) | [治癒](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L15) (ID:14)<br>[祈り](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L14) (ID:13) | 聖帝国: 回復特化。単体治癒と全体祈り。 |
| **4008** | 聖騎士<br>**レオ** | Paladin<br>Lv.20 | HP: 300<br>ATK: 10 / DEF: 5 | 70% | 3000 G | **常時出現**<br>(聖帝国の酒場) | [聖剣](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L12) (ID:11)<br>[聖壁](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L16) (ID:15)<br>[治癒](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L15) (ID:14) | 聖帝国: 聖剣・聖壁・治癒の万能パラディン。 |
| **4009** | 森の狩人<br>**サム** | Hunter<br>Lv.12 | HP: 120<br>ATK: 9 / DEF: 3 | 20% | 600 G | **常時出現**<br>(聖帝国の酒場) | [強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1)<br>[突き](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L4) (ID:3) | 聖帝国: 手数重視。基本攻撃2種。 |
| **4010** | 王立学士<br>**クロヴィス** | Scholar<br>Lv.15 | HP: 70<br>ATK: 6 / DEF: 3 | 5% | 800 G | **常時出現**<br>(聖帝国の酒場) | [裁き](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L13) (ID:12) | 聖帝国: 後衛火力。裁きの魔法を撃つ。 |
| **4011** | ドブネズミの<br>**ラット** | Thief<br>Lv.5 | HP: 80<br>ATK: 5 / DEF: 2 | 10% | 200 G | **常時出現**<br>(マルカンドの酒場) | [強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1)<br>[クイックステップ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L9) (ID:8) | マルカンド: 逃げ足の速い盗賊。 |
| **4012** | 強欲商人<br>**ギム** | Merchant<br>Lv.8 | HP: 110<br>ATK: 3 / DEF: 2 | 30% | 350 G | **常時出現**<br>(マルカンドの酒場) | [オアシスの水](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L21) (ID:20)<br>[集中](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L8) (ID:7) | マルカンド: オアシスの水で回復し、集中バフで支援。 |
| **4013** | 砂漠の踊り子<br>**ライラ** | Dancer<br>Lv.10 | HP: 100<br>ATK: 3 / DEF: 2 | 15% | 400 G | **常時出現**<br>(マルカンドの酒場) | [治癒](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L15) (ID:14)<br>[応急手当](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L6) (ID:5) | マルカンド: 治癒と応急手当で回復。 |
| **4014** | 怪しい錬金術師<br>**ゾーイ** | Alchemist<br>Lv.12 | HP: 80<br>ATK: 7 / DEF: 3 | 10% | 450 G | **常時出現**<br>(マルカンドの酒場) | [石投げ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L11) (ID:10)<br>[毒刃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L19) (ID:18) | マルカンド: 毒と投擲。 |
| **4015** | 曲刀使いの傭兵<br>**バドル** | Mercenary<br>Lv.15 | HP: 160<br>ATK: 9 / DEF: 3 | 50% | 1000 G | **常時出現**<br>(マルカンドの酒場) | [毒刃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L19) (ID:18) (2枚所持) | マルカンド: 毒刃で攻撃する傭兵。 |
| **4016** | 暗殺者<br>**K** | Assassin<br>Lv.18 | HP: 100<br>ATK: 10 / DEF: 3 | 10% | 900 G | **常時出現**<br>(マルカンドの酒場) | [毒刃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L19) (ID:18)<br>[強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1) | マルカンド: 毒スキル持ち。 |
| **4017** | 砂の民の斥候<br>**カシム** | Scout<br>Lv.10 | HP: 130<br>ATK: 8 / DEF: 3 | 30% | 500 G | **常時出現**<br>(マルカンドの酒場) | [強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1)<br>[砂の罠](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L17) (ID:16) | マルカンド: 攻撃と砂の罠で拘束。 |
| **4018** | ランプ使いの老人<br>**ハッサン** | Summoner<br>Lv.20 | HP: 70<br>ATK: 8 / DEF: 5 | 5% | 700 G | **常時出現**<br>(マルカンドの酒場) | [蜃気楼](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L20) (ID:19)<br>[吸血](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L57) (ID:56) | マルカンド: 蜃気楼と吸血の魔法使い。 |
| **4019** | 巨漢の奴隷<br>**ゴリアテ** | Slave<br>Lv.15 | HP: 300<br>ATK: 9 / DEF: 3 | 90% | 1500 G | **常時出現**<br>(マルカンドの酒場) | [強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1) | マルカンド: 最高のHPを持つが攻撃は大雑把。無言で立ちふさがる壁。 |
| **4020** | イカサマ師<br>**ジャック** | Gambler<br>Lv.8 | HP: 100<br>ATK: 5 / DEF: 2 | 20% | 300 G | **常時出現**<br>(マルカンドの酒場) | [強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1)<br>[砂塵の目眩まし](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L18) (ID:17) | マルカンド: 砂塵で目眩ましを仕掛けるトリックスター。 |
| **4021** | 浪人<br>**ケンジ** | Samurai<br>Lv.18 | HP: 180<br>ATK: 12 / DEF: 3 | 40% | 2500 G | **常時出現**<br>(夜刀神国の酒場) | [居合切り](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L26) (ID:25) (2枚所持) | 夜刀: 攻撃特化。居合2枚積み。 |
| **4022** | 見習い巫女<br>**サクラ** | Miko<br>Lv.10 | HP: 80<br>ATK: 3 / DEF: 2 | 10% | 300 G | **常時出現**<br>(夜刀神国の酒場) | [防御](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L5) (ID:4)<br>[治癒](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L15) (ID:14) | 夜刀: 防御と回復。 |
| **4023** | 下忍<br>**ハンゾウ** | Ninja<br>Lv.15 | HP: 110<br>ATK: 8 / DEF: 3 | 20% | 600 G | **常時出現**<br>(夜刀神国の酒場) | [クナイ投げ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L23) (ID:22)<br>[石投げ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L11) (ID:10) | 夜刀: クナイ投げと石投げ。 |
| **4024** | 琵琶法師<br>**ホウイチ** | Monk<br>Lv.12 | HP: 110<br>ATK: 6 / DEF: 3 | 30% | 400 G | **常時出現**<br>(夜刀神国の酒場) | [防御](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L5) (ID:4)<br>[強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1) | 夜刀: 防御と基本攻撃。 |
| **4025** | 侍大将<br>**ゴウ** | Samurai<br>Lv.25 | HP: 230<br>ATK: 13 / DEF: 5 | 60% | 3000 G | **常時出現**<br>(夜刀神国の酒場) | [居合切り](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L26) (ID:25)<br>[挑発](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L10) (ID:9) | 夜刀: 攻守のバランスが良い指揮官。 |
| **4026** | マタギの<br>**老人** | Hunter<br>Lv.10 | HP: 130<br>ATK: 8 / DEF: 3 | 30% | 500 G | **常時出現**<br>(夜刀神国の酒場) | [強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1)<br>[ツバメ返し](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L22) (ID:21) | 夜刀: 強打とツバメ返しを使う古強者。 |
| **4027** | 陰陽師<br>**アベ** | Caster<br>Lv.15 | HP: 100<br>ATK: 6 / DEF: 3 | 10% | 700 G | **常時出現**<br>(夜刀神国の酒場) | [影縫い](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L24) (ID:23)<br>[防御](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L5) (ID:4) | 夜刀: 影縫いと防御の呪術。 |
| **4028** | 足軽兵<br>**ゴンペイ** | Soldier<br>Lv.8 | HP: 120<br>ATK: 6 / DEF: 2 | 50% | 350 G | **常時出現**<br>(夜刀神国の酒場) | [斬撃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L3) (ID:2)<br>[防御](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L5) (ID:4) | 夜刀: 攻守兼備の前衛。 |
| **4029** | くノ一<br>**アヤメ** | Ninja<br>Lv.15 | HP: 100<br>ATK: 9 / DEF: 3 | 15% | 700 G | **常時出現**<br>(夜刀神国の酒場) | [毒刃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L19) (ID:18)<br>[強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1) | 夜刀: 毒使い。 |
| **4030** | 神主<br>**ヤスマサ** | Priest<br>Lv.12 | HP: 110<br>ATK: 4 / DEF: 2 | 10% | 500 G | **常時出現**<br>(夜刀神国の酒場) | [治癒](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L15) (ID:14)<br>[清め](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L25) (ID:24) | 夜刀: 治癒と清めの浄化特化。 |
| **4031** | 鉄拳の<br>**リー** | Monk<br>Lv.18 | HP: 160<br>ATK: 11 / DEF: 3 | 40% | 1500 G | **常時出現**<br>(華龍神朝の酒場) | [連撃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L30) (ID:29) (2枚所持) | 華龍: 連撃2枚積み。拳一つで戦う武闘家。 |
| **4032** | 道士<br>**ウェイ** | Taoist<br>Lv.12 | HP: 100<br>ATK: 6 / DEF: 3 | 10% | 400 G | **常時出現**<br>(華龍神朝の酒場) | [飛刀](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L31) (ID:30)<br>[防御](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L5) (ID:4) | 華龍: 飛刀と防御。 |
| **4033** | 槍術師範代<br>**リン** | Lancer<br>Lv.20 | HP: 200<br>ATK: 12 / DEF: 5 | 50% | 1500 G | **常時出現**<br>(華龍神朝の酒場) | [突き](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L4) (ID:3) (2枚所持) | 華龍: 突きによる貫通攻撃。 |
| **4034** | <br>**キョンシー** | Undead<br>Lv.10 | HP: 260<br>ATK: 8 / DEF: 3 | 80% | 800 G | **常時出現**<br>(華龍神朝の酒場) | [連撃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L30) (ID:29)<br>[防御](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L5) (ID:4) | 華龍: HP壁。連撃と防御。 |
| **4035** | 戦闘料理人<br>**ワン** | Chef<br>Lv.12 | HP: 130<br>ATK: 7 / DEF: 3 | 40% | 500 G | **常時出現**<br>(華龍神朝の酒場) | [強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1)<br>[氣の癒やし](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L27) (ID:26) | 華龍: 攻撃と氣の癒やし。 |
| **4036** | 毒手の<br>**メイ** | Assassin<br>Lv.18 | HP: 100<br>ATK: 10 / DEF: 3 | 10% | 900 G | **常時出現**<br>(華龍神朝の酒場) | [毒刃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L19) (ID:18)<br>[連撃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L30) (ID:29) | 華龍: 毒攻撃特化。 |
| **4037** | 荒法師<br>**ジン** | Monk<br>Lv.15 | HP: 210<br>ATK: 9 / DEF: 3 | 60% | 1500 G | **常時出現**<br>(華龍神朝の酒場) | [連撃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L30) (ID:29)<br>[挑発](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L10) (ID:9) | 華龍: 頑丈な前衛。 |
| **4038** | 天才軍師<br>**シュウ** | Tactician<br>Lv.20 | HP: 80<br>ATK: 7 / DEF: 5 | 5% | 500 G | **常時出現**<br>(華龍神朝の酒場) | [石投げ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L11) (ID:10)<br>[防御](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L5) (ID:4) | 華龍: 後ろで指示を出すのみの軍師。 |
| **4039** | 酔拳の達人<br>**ソウ** | Monk<br>Lv.18 | HP: 150<br>ATK: 9 / DEF: 3 | 30% | 1000 G | **常時出現**<br>(華龍神朝の酒場) | [連撃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L30) (ID:29)<br>[クイックステップ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L9) (ID:8) | 華龍: 連撃と回避。 |
| **4040** | 山賊王<br>**バオ** | Bandit<br>Lv.22 | HP: 230<br>ATK: 13 / DEF: 5 | 50% | 2000 G | **常時出現**<br>(華龍神朝の酒場) | [強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1)<br>[龍の咆哮](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L28) (ID:27) | 華龍: 強打と龍の咆哮で敵を威圧する。 |
| **4041** | 駆け出し冒険者<br>**アレン** | Adventurer<br>Lv.5 | HP: 130<br>ATK: 5 / DEF: 2 | 50% | 200 G | **常時出現**<br>(すべての酒場 / Free) | [斬撃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L3) (ID:2)<br>[突き](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L4) (ID:3) | 共通: 斬撃と突きの二刀流。標準的な性能。 |
| **4042** | 路地裏の<br>**猫** | Animal<br>Lv.1 | HP: 20<br>ATK: 2 / DEF: 2 | 90% | 50 G | **常時出現**<br>(すべての酒場 / Free) | [応急手当](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L6) (ID:5)<br>[クイックステップ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L9) (ID:8) | 共通: 癒やしと回避。生存率が非常に高い黒猫。 |
| **4043** | 森の<br>**熊** | Animal<br>Lv.10 | HP: 240<br>ATK: 12 / DEF: 3 | 70% | 2000 G | **常時出現**<br>(すべての酒場 / Free) | [連撃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L30) (ID:29) (2枚所持) | 共通: 野生の脅威。非常にタフで強力。 |
| **4044** | 古代の<br>**自律人形** | Machine<br>Lv.15 | HP: 160<br>ATK: 9 / DEF: 3 | 20% | 1200 G | **常時出現**<br>(すべての酒場 / Free) | [斬撃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L3) (ID:2)<br>[石投げ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L11) (ID:10) | 共通: ロストテクノロジーの人形。 |
| **4045** | 幽霊<br>**メイド** | Ghost<br>Lv.1 | HP: 2<br>ATK: 0 / DEF: 99 | 0% | 500 G | **常時出現**<br>(すべての酒場 / Free) | [治癒](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L15) (ID:14)<br>[防御](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L5) (ID:4) | 共通: HPは2だがDEF99。回復とサポートに回る。 |
| **4046** | 呪いの<br>**鎧** | Armor<br>Lv.10 | HP: 300<br>ATK: 7 / DEF: 10 | 100% | 1800 G | **常時出現**<br>(すべての酒場 / Free) | [血の怒り](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L43) (ID:42) | 共通: 完全なかばう壁（かばう率100%）。血の怒りで自己強化する。 |
| **4047** | 吟遊詩人<br>**エドワード** | Bard<br>Lv.8 | HP: 80<br>ATK: 2 / DEF: 2 | 20% | 300 G | **常時出現**<br>(すべての酒場 / Free) | [治癒](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L15) (ID:14)<br>[集中](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L8) (ID:7) | 共通: 治癒と集中バフでパーティを支援。 |
| **4048** | <br>**グリフォン** | Monster<br>Lv.20 | HP: 260<br>ATK: 12 / DEF: 5 | 50% | 2500 G | **常時出現**<br>(すべての酒場 / Free) | [連撃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L30) (ID:29)<br>[強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1) | 共通: 高コストな騎乗生物。 |
| **4049** | 英雄の<br>**石像** | Object<br>Lv.1 | HP: 400<br>ATK: 0 / DEF: 8 | 100% | 1000 G | **常時出現**<br>(すべての酒場 / Free) | [クイックステップ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L9) (ID:8) | 共通: 動かない壁。高いHPで確実に攻撃を引き受ける。 |
| **4050** | ただの村人<br>**ボブ** | Villager<br>Lv.1 | HP: 40<br>ATK: 0 / DEF: 0 | 90% | 10 G | **常時出現**<br>(すべての酒場 / Free) | [クイックステップ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L9) (ID:8) | 共通: 巻き込まれた一般人。一瞬で倒れてしまう最安のデコイ。 |
| **4051** | 旅の<br>**商人** | Merchant<br>Lv.1 | HP: 30<br>ATK: 1 / DEF: 1 | 10% | 雇用不可 | **護衛対象ゲスト**<br>(クエ [7002](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7002_escort.md) 同行) | [クイックステップ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L9) (ID:8) | 共通: 汎用護衛対象。戦闘には参加しない。 |
| **4060** | 悪徳官僚<br>**薛** | Official<br>Lv.1 | HP: 40<br>ATK: 0 / DEF: 1 | 10% | 雇用不可 | **護衛対象ゲスト**<br>(クエ [7043](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7043_official.md) 同行) | [クイックステップ](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L9) (ID:8) | 専用: 護衛対象。文官のため戦闘能力なし。 |
| **4101** | 歴戦の小隊長<br>**ガウェイン** | Knight<br>Lv.30 | HP: 800<br>ATK: 10 / DEF: 25 | 80% | 雇用不可 | **クエスト一時同行**<br>(第5話戦闘のみ) | [防御](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L5) (ID:4)<br>[挑発](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L10) (ID:9) | 専用: ガウェイン同行時の頼もしい前衛タンク。 |
| **4102** | 不死の傭兵王<br>**ヴォルグ** | Mercenary<br>Lv.50 | HP: 1600<br>ATK: 20 / DEF: 15 | 60% | 6000 G | **クエストクリア解放**<br>(第13話クリア後に50%の確率で酒場出現) | [強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1)<br>[連撃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L30) (ID:29)<br>[鉄布衫](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L29) (ID:28) | 専用: 圧倒的な強さを誇る生ける伝説。 |
| **4103** | 先代の<br>**英霊** | Adventurer<br>Lv.40 | HP: 1200<br>ATK: 15 / DEF: 20 | 50% | 雇用不可 | **クエスト一時同行**<br>(第16話〜第20話メイン進行中に同行) | [斬撃](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L3) (ID:2)<br>[強打](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L2) (ID:1)<br>[防御](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L5) (ID:4) | 専用: 英霊としてプレイヤーをサポートする。 |
| **4104** | 宿命の<br>**撫子** | Miko<br>Lv.10 | HP: 100<br>ATK: 5 / DEF: 5 | 10% | 雇用不可 | **護衛対象ゲスト**<br>(スポット [6102](file:///d:/dev/code-wirth-dawn/docs/quest/quest_6102_spot_yato.md) 同行) | [防御](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L5) (ID:4)<br>[治癒](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L15) (ID:14) | 専用: 護衛対象。冥食の夜の生贄の少女。 |
| **4105** | 狂信の<br>**アルバート** | Miko<br>Lv.10 | HP: 100<br>ATK: 5 / DEF: 5 | 10% | 雇用不可 | **護衛対象ゲスト**<br>(クエ [7012](file:///d:/dev/code-wirth-dawn/docs/quest/quest_7012_pilgrim.md) 同行) | [防御](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L5) (ID:4)<br>[治癒](file:///d:/dev/code-wirth-dawn/src/data/csv/cards.csv#L15) (ID:14) | 専用: 護衛対象。聖地を目指し歩く狂信者。 |
