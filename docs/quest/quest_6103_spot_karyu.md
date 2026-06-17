# クエスト仕様書：6103 — 天を衝く塔 ―華龍の秘宝と、神の遊戯―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6103 |
| **Slug** | `qst_spot_karyu` |
| **クエスト種別** | スポットシナリオ（Special） |
| **推奨レベル** | 20（Hard） |
| **難度** | 5 |
| **依頼主** | 天命の使者 |
| **出現条件** | 華龍拠点滞在 / 世界・悪(Evil)50%以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **難易度Tier** | Hard（rec_level: 20） |
| **経過日数 (time_cost)** | 7 |
| **ノード数** | 48ノード |
| **サムネイル画像** | `/images/quests/bg_spot_karyu_tower.png` |

---

## 1. クエスト概要

### 短文説明
```
世界の中心「虚無の塔」。華龍の四方に座す四神を討ち、神の残酷な遊戯を終わらせよ。
```

### 長文説明
```
塔の頂上には願いを叶える楽園があるとされる。
しかし、神の結界により近づく事はできない。解くためには四神討伐が必要だ。
すべては、高みで退屈を貪る「神」が仕掛けた遊戯であった。
```

---

## 2. 報酬定義

**ルートA（神の座を継ぐルート）CSV記載形式:**
```
Exp:500|Gold:10000|Rep:200|Item:625
```

**ルートB（塔を破壊するルート）CSV記載形式:**
```
Exp:500|Rep:-100|Item:626
```

---

## 3. シナリオノード構成

### 全体フロー
```text
start → start_02 → start_03 → start_04 → start_monologue → choose_path
  ├─[東の青龍]→ trap_seiryu → boss_seiryu → boss_seiryu_02 → battle_seiryu → reward_orb_1 → post_seiryu_monologue → choose_path
  ├─[西の白虎]→ trap_byakko → boss_byakko → boss_byakko_02 → battle_byakko → reward_orb_2 → post_byakko_monologue → choose_path
  ├─[南の朱雀]→ trap_suzaku → boss_suzaku → boss_suzaku_02 → battle_suzaku → reward_orb_3 → post_suzaku_monologue → choose_path
  ├─[北の玄武]→ trap_genbu  → boss_genbu  → boss_genbu_02  → battle_genbu  → reward_orb_4 → post_genbu_monologue → choose_path
  └─[中央の塔へ進む]→ check_orbs
       ├─[items_all_orbs]→ kami_intro → kami_intro_02 → kami_intro_03 → kami_intro_04 → battle_kami → final_choice → final_choice_02 → final_choice_monologue → choice_node
       │    ├─[神の代理人として統べる]→ end_rule → end_rule_02
       │    └─[神の理を破壊し自由を掴む]→ end_destroy → end_destroy_02
       └─[items_missing]→ choose_path
  (各バトル敗北時) → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_spot_karyu_tower, bgm: bgm_karyu
```text
華龍神朝の都の外れ、荒涼とした大地にそびえ立つ。雲を突き抜けて天へと伸びる巨塔の前に、盲目の老人が静かに佇んでいた。
```

#### `start_02`（text）
**演出:** bg: bg_spot_karyu_tower, speaker: 天命の使者
```text
「あの塔の頂上には、あらゆる願いを叶える楽園があるとされる。だが、挑んだ者は誰一人として生きて戻ってこない」
```

#### `start_03`（text）
**演出:** bg: bg_spot_karyu_tower, speaker: 天命の使者
```text
「塔を封じる強固な結界を解くには、華龍の四方に座す青龍、白虎、朱雀、玄武の四神を全て討ち破らねばならぬ」
```

#### `start_04`（text）
**演出:** bg: bg_spot_karyu_tower, speaker: 天命の使者
```text
「すべては、天の頂きで退屈を貪る『あれ』が仕掛けた、残酷な遊戯に過ぎんのだよ……」
```

#### `start_monologue`（text）
**演出:** bg: bg_spot_karyu_tower
```text
（神の仕掛けた遊戯、か。神獣たちを討ち払わねば上へは登れんというわけだな。受けて立とう、その神とやらの面を拝みにな！）
```

#### `choose_path`（choice）
**演出:** bg: bg_spot_karyu_tower, bgm: bgm_quest_mystery
```text
そびえ立つ塔の足元。結界を解くため、まずはどの神獣の試練へと向かうべきだろうか。
```
| 選択肢 | next_node |
|---|---|
| 東の青龍 | `trap_seiryu` |
| 西の白虎 | `trap_byakko` |
| 南の朱雀 | `trap_suzaku` |
| 北の玄武 | `trap_genbu` |
| 中央の塔へ進む | `check_orbs` |

#### `trap_seiryu`（hp_damage）
**演出:** bg: bg_spot_karyu_thunder
```text
東の荒野を進むと、突如暗雲が立ち込め、天から巨大な落雷があなたを直撃した。激しい衝撃が全身を貫き、HPにダメージを受ける。
```
**パラメータ:** percent: -20, next: boss_seiryu

#### `boss_seiryu`（text）
**演出:** bg: bg_spot_karyu_thunder, bgm: bgm_battle_strong
```text
激しく渦巻く雷雲の中から、青く輝く鱗と長い髭を持つ、畏怖の巨龍・青龍がその巨躯を現した。
```

#### `boss_seiryu_02`（text）
**演出:** bg: bg_spot_karyu_thunder, speaker: 青龍
```text
「……千年も同じ番をし続けて、退屈極まっていたのだ。我を楽しませ、その命の輝きを見せてみよ！」
```

#### `battle_seiryu`（battle）
**演出:** bg: bg_spot_karyu_thunder, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 320, next: reward_orb_1, fail: end_failure

#### `reward_orb_1`（reward）
**演出:** bg: bg_spot_karyu_thunder
```text
激闘の末、雷鳴が収まり青龍が崩れ去る。あなたは蒼く強く輝く『青龍の宝珠』を手に入れた。
```
**パラメータ:** item_id: 621, next: post_seiryu_monologue

#### `post_seiryu_monologue`（text）
**演出:** bg: bg_spot_karyu_thunder
```text
（雷を司る東の青龍を討ったか。宝珠から凄まじい力が流れ込んでくる。残る神獣はあと三体だな）
```
**パラメータ:** next: choose_path

#### `trap_byakko`（hp_damage）
**演出:** bg: bg_spot_karyu_thunder
```text
西の険しい山道に踏み入ると、猛烈な吹雪が吹き荒れ、厳しい凍傷があなたを襲った。全身の感覚が麻痺し、HPにダメージを受ける。
```
**パラメータ:** percent: -20, next: boss_byakko

#### `boss_byakko`（text）
**演出:** bg: bg_spot_karyu_thunder, bgm: bgm_battle_strong
```text
立ち込める白い雪煙を切り裂き、鋭い白銀の牙と漆黒の紋様を持つ、俊敏なる獣王・白虎が姿を現した。
```

#### `boss_byakko_02`（text）
**演出:** bg: bg_spot_karyu_thunder, speaker: 白虎
```text
「我らの闘争に、無駄な言葉は要らぬ。その肉を牙で引き裂き、どちらが強者かを語るのが我の流儀だ！」
```

#### `battle_byakko`（battle）
**演出:** bg: bg_spot_karyu_thunder, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 321, next: reward_orb_2, fail: end_failure

#### `reward_orb_2`（reward）
**演出:** bg: bg_spot_karyu_thunder
```text
白虎の猛攻を凌ぎ切り、その巨躯を討ち果たす。雪煙が消え去った跡に、白く鋭く輝く『白虎の宝珠』が残された。
```
**パラメータ:** item_id: 622, next: post_byakko_monologue

#### `post_byakko_monologue`（text）
**演出:** bg: bg_spot_karyu_thunder
```text
（これで西の白虎を倒した。凄まじい闘志を秘めた宝珠だ。体が熱く滾ってくるのを感じるぞ）
```
**パラメータ:** next: choose_path

#### `trap_suzaku`（hp_damage）
**演出:** bg: bg_spot_karyu_thunder
```text
南の火山地帯へ向かうと、足元の亀裂から火柱が吹き上がり、業火があなたを包み込んだ。激しい熱風に焼かれ、HPにダメージを受ける。
```
**パラメータ:** percent: -20, next: boss_suzaku

#### `boss_suzaku`（text）
**演出:** bg: bg_spot_karyu_thunder, bgm: bgm_battle_strong
```text
揺らめく陽炎の奥底から、青い神聖な炎を全身に灯した、美しくも恐ろしい不死鳥・朱雀が優雅に舞い降りてきた。
```

#### `boss_suzaku_02`（text）
**演出:** bg: bg_spot_karyu_thunder, speaker: 朱雀
```text
「消えぬ命、尽きぬ炎は重い呪い。お主の刃が、この退屈な輪廻から我を消し去ってくれることを願うよ」
```

#### `battle_suzaku`（battle）
**演出:** bg: bg_spot_karyu_thunder, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 322, next: reward_orb_3, fail: end_failure

#### `reward_orb_3`（reward）
**演出:** bg: bg_spot_karyu_thunder
```text
激しい炎の舞を退け、朱雀を灰へと還す。その静寂の中に、紅く温かく輝く『朱雀の宝珠』が現れた。
```
**パラメータ:** item_id: 623, next: post_suzaku_monologue

#### `post_suzaku_monologue`（text）
**演出:** bg: bg_spot_karyu_thunder
```text
（南の朱雀の魂を解放したか。彼らにとって、この試練の番人であることは苦痛でしかなかったようだな）
```
**パラメータ:** next: choose_path

#### `trap_genbu`（hp_damage）
**演出:** bg: bg_spot_karyu_thunder
```text
北の湿地帯。激しい地響きと共に崩落した巨大な岩片が頭上から降り注ぎ、あなたの身体を打ち据え、HPにダメージを受ける。
```
**パラメータ:** percent: -20, next: boss_genbu

#### `boss_genbu`（text）
**演出:** bg: bg_spot_karyu_thunder, bgm: bgm_battle_strong
```text
盛り上がった泥土を突き破り、蛇の尾を背負い、巨大な甲羅を持つ大地の巨亀・玄武が重苦しく現れた。
```

#### `boss_genbu_02`（text）
**演出:** bg: bg_spot_karyu_thunder, speaker: 玄武
```text
「神の遊戯に対する恨みはあるが、我らは結界を守る番人。手加減はできぬ、全力で参るぞ！」
```

#### `battle_genbu`（battle）
**演出:** bg: bg_spot_karyu_thunder, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 323, next: reward_orb_4, fail: end_failure

#### `reward_orb_4`（reward）
**演出:** bg: bg_spot_karyu_thunder
```text
堅牢な守りを破り、玄武の甲羅を打ち砕く。崩れ去る大地の底から、深い緑色をした『玄武の宝珠』を手に入れた。
```
**パラメータ:** item_id: 624, next: post_genbu_monologue

#### `post_genbu_monologue`（text）
**演出:** bg: bg_spot_karyu_thunder
```text
（これで青龍、白虎、朱雀、玄武、すべての四神を討ち取った。中央の塔の結界が完全に解けたはずだ）
```
**パラメータ:** next: choose_path

#### `check_orbs`（check_flags）
**演出:** bg: bg_spot_karyu_tower
```text
四神の宝珠がすべて揃っているかを確認する。
```
| 選択肢 | next_node |
|---|---|
| items_all_orbs | `kami_intro` |
| items_missing | `choose_path` |

#### `kami_intro`（text）
**演出:** bg: bg_spot_karyu_throne, bgm: bgm_spot_final_boss
```text
塔の最上階。黄金の碁盤を前に、静かに座っている十歳ほどの無垢な瞳をした少年がいた。彼こそが、この塔の支配者であった。
```

#### `kami_intro_02`（text）
**演出:** bg: bg_spot_karyu_throne, speaker: 神の少年
```text
「やっとここまで来たか、旅人よ。千年もこうして一人で碁を打つのに、すっかり飽き果てていたのだ」
```

#### `kami_intro_03`（text）
**演出:** bg: bg_spot_karyu_throne, speaker: 神の少年
```text
「今まで楽園を夢見て登ってきた者は、全員途中で死んだ。お前は、俺をこの退屈から救い出してくれるか？」
```

#### `kami_intro_04`（text）
**演出:** bg: bg_spot_karyu_throne
```text
そう微笑む少年の全身から、空間そのものを歪めるほどの圧倒的で冷酷な神威が放たれ、塔が激しく震えだす。
```

#### `battle_kami`（battle）
**演出:** bg: bg_spot_karyu_throne, bgm: bgm_spot_final_boss
**パラメータ:** enemy_group_id: 324, next: final_choice, fail: end_failure

#### `final_choice`（text）
**演出:** bg: bg_spot_karyu_throne, bgm: bgm_spot_final_choice
```text
激闘の果てに少年は膝をつき、「負けるのも、悪くない棋譜だった……」と満足そうに微笑み、光となって消え去っていった。
```

#### `final_choice_02`（text）
**演出:** bg: bg_spot_karyu_throne, speaker: 神の少年の残響
```text
「さあ、この力を手に入れて新たな神の代理人として世界を統べるか、それとも塔ごとすべてを破壊し去るか、選ぶといい」
```

#### `final_choice_monologue`（text）
**演出:** bg: bg_spot_karyu_throne
```text
（神の座を継ぎ秩序を統べるか、あるいは神の理そのものを破壊して人間として自由に生きるか……。運命の選択だな）
```

#### `choice_node`（choice）
**演出:** bg: bg_spot_karyu_throne, bgm: bgm_spot_final_choice
```text
神が残した最後の問い。あなたはどの未来を選択するだろうか。
```
| 選択肢 | next_node |
|---|---|
| 神の代理人として統べる | `end_rule` |
| 神の理を破壊し自由を掴む | `end_destroy` |

#### `end_rule`（text）
**演出:** bg: bg_spot_karyu_throne, bgm: bgm_quest_calm
```text
あなたは少年の残した光の座を受け入れ、静かに王座へと腰掛けた。その瞬間、世界中の全ての生命の鼓動が脳裏に流れ込んでくる。
```

#### `end_rule_02`（end_success）
**演出:** bg: bg_spot_karyu_throne
```text
世界の秩序を維持する神の代理人としての重き宿命を引き受け、あなたは神の力を宿した『天道の薙刀』を手に入れた。
```
**rewards:** Exp:500, Gold:10000, Rep:200, Item:625

#### `end_destroy`（text）
**演出:** bg: bg_spot_karyu_throne, bgm: bgm_quest_calm
```text
あなたは黄金の碁盤を力任せに粉砕し、神の王座を破壊した。塔の結界が完全に崩壊し、崩れ落ちる巨塔から地上へと必死に脱出する。
```

#### `end_destroy_02`（end_success）
**演出:** bg: bg_spot_karyu_tower
```text
背後で音を立てて崩壊する巨塔を見つめながら、あなたは神の支配から抜け出し、人間の自由と固有スキル『神殺しの光芒』を手に入れた。
```
**rewards:** Exp:500, Rep:-100, Item:626

#### `end_failure`（end_failure）
**演出:** bg: bg_spot_karyu_throne
```text
神の圧倒的な力に押し潰され、あなたは冷たい石畳の上に力なく倒れ伏した。薄れゆく意識の中、少年の冷ややかな嘲笑が響き渡る。
「やはり、退屈しのぎにもならなかったな。次の挑戦者を待つとしよう」
```
**rewards:** Gold:0
