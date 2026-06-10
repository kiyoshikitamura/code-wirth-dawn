# クエスト仕様書：6101 — 忘却の五英霊 ―レガリア崩落の真実―

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | 6101 |
| **Slug** | `qst_spot_roland` |
| **クエスト種別** | スポットシナリオ（Special） |
| **推奨レベル** | 20（Hard） |
| **難度** | 5 |
| **依頼主** | 聖騎士団 |
| **出現条件** | メインep08クリア / 聖王国拠点滞在 / 秩序(Order)50%以上 |
| **リピート** | 現世代で1回（継承後は再出現） |
| **難易度Tier** | Hard（rec_level: 20） |
| **経過日数 (time_cost)** | 7 |
| **ノード数** | 50ノード |
| **サムネイル画像** | `/images/quests/bg_spot_roland_tomb.png` |

---

## 1. クエスト概要

### 短文説明
```
王都レガリアに突如現れた「五英霊」。暴走する彼らを止め、真実を暴け。
```

### 長文説明
```
王都レガリアで、禁忌の術「英霊再臨」が失敗した。
かつての守護者である『五英霊』が、王家への復讐者として蘇り、街を破壊している。
避難民と共に地下墓所へ逃れ、英霊たちの暴走を止める手段を探せ。
光り輝くレガリアの歴史の裏に隠された「犠牲と裏切り」の真実とは。
```

---

## 2. 報酬定義

**ルートA（討伐ルート）CSV記載形式:**
```
Exp:500|Gold:10000|Rep:200|Item:602
```

**ルートB（封印ルート）CSV記載形式:**
```
Exp:500|Rep:-100|Item:603
```

---

## 3. シナリオノード構成

### 全体フロー
```text
start → start_02 → start_03 → start_04 → start_05 → start_06 → start_07 → start_monologue
  → escape_underground → escape_underground_02 → escape_underground_03 → escape_underground_04
  → battle_protos → get_promise → get_promise_02 → get_promise_03 → get_promise_04 → get_promise_monologue
  → eluka_intro → eluka_intro_02 → eluka_intro_03 → eluka_intro_04 → battle_eluka
  → baram_intro → baram_intro_monologue → baram_intro_02 → baram_intro_03 → baram_intro_04 → battle_baram
  → shirasu_intro → shirasu_intro_monologue → shirasu_intro_02 → shirasu_intro_03 → shirasu_intro_04 → battle_shirasu
  → lyra_intro → lyra_intro_monologue → lyra_intro_02 → lyra_intro_03 → lyra_intro_04 → battle_lyra
  → alvin_intro → alvin_intro_02 → alvin_intro_03 → alvin_intro_04 → alvin_intro_05 → battle_alvin
  → alvin_defeated → king_appear → king_talk → alvin_talk → choice_node
  ├─[王の命令に従い討伐する]→ end_kill → end_kill_02
  └─[誓約の力で彼らを安らかに封印する]→ end_seal → end_seal_02
  (各バトル敗北時) → end_failure
```

### ノード詳細

#### `start`（text）
**演出:** bg: bg_spot_roland_fire, bgm: bgm_roland
```text
王都レガリアの中央広場。かつて清らかな水を湛えていた噴水は、今や赤黒い血のような液体で染まり、不気味に沸き立っていた。
```

#### `start_02`（text）
**演出:** bg: bg_spot_roland_fire
```text
広場の奥から、一人の聖騎士が血まみれになって走ってくる。その白銀の甲冑は、何者かの凄まじい力によって無残に歪められ、押し潰されていた。
```

#### `start_03`（text）
**演出:** bg: bg_spot_roland_fire, speaker: 負傷した聖騎士
```text
「ゴハッ……！ に、逃げろ！ 奴らは……奴らは人間などではない！」
```

#### `start_04`（text）
**演出:** bg: bg_spot_roland_fire, speaker: 負傷した聖騎士
```text
「王家が封印したはずの……かつての守護者『五英霊』が蘇り、街を滅ぼそうとしているんだ……！」
```

#### `start_05`（text）
**演出:** bg: bg_spot_roland_fire
```text
その言葉をかき消すように、大聖堂が轟音と共に爆発する。立ち上る粉塵の向こうに、青白く光る五つの人影が静かに浮かび上がった。
```

#### `start_06`（text）
**演出:** bg: bg_spot_roland_fire
```text
先頭に立つ聖女の影が静かに手を翳すと、その指先から放たれた魔力によって、立ち向かおうとした聖騎士たち次々と膝から崩れ落ちていく。
```

#### `start_07`（text）
**演出:** bg: bg_spot_roland_fire
```text
これほどの神威を前に、もはやまともに対峙することすら不可能だった。あなたは王都の混乱を抜け、薄暗い地下墓所へと逃げ込んだ。
```

#### `start_monologue`（text）
**演出:** bg: bg_spot_roland_fire
```text
（大聖堂が文字通り一瞬で吹き飛ぶとは……。あの五つの影が、王国の裏歴史に隠された『五英霊』なのか。今の力では勝負にならん、墓所で活路を探すしかない！）
```

#### `escape_underground`（text）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_quest_mystery
```text
避難民の怒号と悲鳴が反響する暗闇を抜け、あなたは地下墓所の最も深い区画へと辿り着いた。
```

#### `escape_underground_02`（text）
**演出:** bg: bg_spot_roland_tomb
```text
並び立つ古い石棺の間を走るうち、苔むした壁の一角に、かつて隠された通路への隙間と空気の流れがあることに気づく。
```

#### `escape_underground_03`（text）
**演出:** bg: bg_spot_roland_tomb
```text
壁の隠しスイッチを押し込むと、静かに石壁がスライドし、隠し祭壇が現れた。そこには、歴史から抹消されたはずの英雄たちの名が刻まれていた。
```

#### `escape_underground_04`（text）
**演出:** bg: bg_spot_roland_tomb
```text
祭壇へ一歩近づいた瞬間、周囲の石壁から砂埃を巻き上げ、巨大な石造りの守護巨人が這い出てきて行く手を阻んだ。
```

#### `battle_protos`（battle）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 300, next: get_promise, fail: end_failure

#### `get_promise`（reward）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_quest_mystery
```text
激しい戦いの末、守護者の石体がガラガラと崩れ落ちる。その大石の中から、淡く明滅する五角形の不思議な宝珠が現れた。
```
**パラメータ:** item_id: 601, next: get_promise_02

#### `get_promise_02`（text）
**演出:** bg: bg_spot_roland_tomb
```text
あなたが宝珠に触れて手に入れた瞬間、脳裏に直接、哀切を帯びた英霊の声が響き渡る。
```

#### `get_promise_03`（text）
**演出:** bg: bg_spot_roland_tomb, speaker: 英霊の声
```text
「我らは……王家に裏切られた。この石に込められた誓約の力で、暴走する我らの魂を止めてくれ……」
```

#### `get_promise_04`（text）
**演出:** bg: bg_spot_roland_tomb
```text
英霊たちの悔恨の意思があなたに流れ込み、パッシブスキル『五英霊の誓約』が魂に刻まれた。
```

#### `get_promise_monologue`（text）
**演出:** bg: bg_spot_roland_tomb
```text
（五英霊の誓約……。彼らは国を守りながらも裏切られ、怨嗟の力で無理やり蘇らされたのか。この宝珠の力を使えば、彼らを止められるかもしれないな）
```

#### `eluka_intro`（text）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_quest_mystery
```text
暗い通路を奥へと進むと、青白い光を放ちながら、白い法衣をまとった女性の霊体が宙に浮かんでいるのが見えた。
```

#### `eluka_intro_02`（text）
**演出:** bg: bg_spot_roland_tomb, speaker: 聖女エルーカ
```text
「……あなた、生きているのね。珍しいこともあるものね」
```

#### `eluka_intro_03`（text）
**演出:** bg: bg_spot_roland_tomb
```text
彼女はかつて疫病から多くの民を救ったが、その聖なる血を惜しんだ王家により、死ぬまで地下牢で血を抜かれ続けた悲劇の聖女だった。
```

#### `eluka_intro_04`（text）
**演出:** bg: bg_spot_roland_tomb, speaker: 聖女エルーカ
```text
「私が暗闇で乾いていく時、誰も助けには来なかった。それでもまだ、私に『慈愛』を求めるというの？」
```

#### `battle_eluka`（battle）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 301, next: baram_intro, fail: end_failure

#### `baram_intro`（text）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_quest_mystery
```text
倒れ伏したエルーカは「やっと静かに眠れる……」と小さく呟き、光の塵となって消え去った。
```

#### `baram_intro_monologue`('text')
**演出:** bg: bg_spot_roland_tomb
```text
（民を救い続けた聖女の末路がこれか……。救いを求めたはずの人間に裏切られ、怨嗟の英霊と化すなど、あまりにも残酷だな）
```

#### `baram_intro_02`（text）
**演出:** bg: bg_spot_roland_tomb
```text
複雑な思いを胸に次の通路へと進むと、青白く光る魔法陣の中心で、古い書物をめくる男の影があった。
```

#### `baram_intro_03`（text）
**演出:** bg: bg_spot_roland_tomb, speaker: 賢者バラム
```text
「客人か。最後にこうして人と対面して喋ったのは、処刑される前日のことだったな」
```

#### `baram_intro_04`（text）
**演出:** bg: bg_spot_roland_tomb, speaker: 賢者バラム
```text
「私の生涯の研究は全て王家に強奪され、名さえも消された。まあよい、死後の退屈な暇つぶしとしよう」
```

#### `battle_baram`（battle）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 302, next: shirasu_intro, fail: end_failure

#### `shirasu_intro`（text）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_quest_mystery
```text
バラムは研究者らしい冷静さで「敗北の数式を解くのも悪くない」と言い残し、霧のように消え去った。
```

#### `shirasu_intro_monologue`（text）
**演出:** bg: bg_spot_roland_tomb
```text
（国のために知恵を絞り尽くした賢者を処刑し、その成果だけを奪う。この国の歴史は、英雄たちの屍の上に成り立っているのか）
```

#### `shirasu_intro_02`（text）
**演出:** bg: bg_spot_roland_tomb
```text
堅牢な石造りの門をくぐると、巨大な盾を構え、微動だにせず通路を塞ぐ巨漢の騎士が立ち塞がっていた。
```

#### `shirasu_intro_03`（text）
**演出:** bg: bg_spot_roland_tomb, speaker: 盾のシラス
```text
「俺は己の身を盾にして王を守り抜いて死んだ。だが、王は俺が死んだ後、俺の家族を冷酷に見捨てて処刑した」
```

#### `shirasu_intro_04`（text）
**演出:** bg: bg_spot_roland_tomb, speaker: 盾のシラス
```text
「もはや語るべき言葉などない。お前が王家の眷属を名乗るなら、我が大盾がその肉を叩き潰すのみだ」
```

#### `battle_shirasu`（battle）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 303, next: lyra_intro, fail: end_failure

#### `lyra_intro`（text）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_quest_mystery
```text
シラスは、はるか遠い家族の安息を祈るように祈りを捧げ、静かに石化して崩れ去った。
```

#### `lyra_intro_monologue`（text）
**演出:** bg: bg_spot_roland_tomb
```text
（命を賭して王を守った結果が、家族の処刑か。この騎士が抱える絶望の重さは、測り知れんな）
```

#### `lyra_intro_02`（text）
**演出:** bg: bg_spot_roland_tomb
```text
冷たい風が吹き抜ける大広間。薄暗闇の中から、鋭い殺気を放つ長弓を引いた女性の英霊があなたを狙い定めていた。
```

#### `lyra_intro_03`（text）
**演出:** bg: bg_spot_roland_tomb, speaker: 射手リラ
```text
「英雄なんて、王家にとっては使い捨ての都合の良い道具に過ぎないわ。用が済めば、邪魔者として消されるだけ」
```

#### `lyra_intro_04`（text）
**演出:** bg: bg_spot_roland_tomb, speaker: 射手リラ
```text
「私がその生きた証拠。裏切りの痛みを、お前の身体に矢として突き刺してあげるわ！」
```

#### `battle_lyra`（battle）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_battle_strong
**パラメータ:** enemy_group_id: 304, next: alvin_intro, fail: end_failure

#### `alvin_intro`（text）
**演出:** bg: bg_spot_roland_tomb, bgm: bgm_quest_mystery
```text
リラは「少しだけ、お前を信じてみるのもいいかもね……」と呟き、安らかな表情で消滅していった。
```

#### `alvin_intro_monologue`（text）
**演出:** bg: bg_spot_roland_tomb
```text
（四人が四人とも、王家の身勝手な都合で切り捨てられた。だが、最深部にいる最後の英霊は……一体何者なのだ）
```

#### `alvin_intro_02`('text')
**演出:** bg: bg_spot_roland_core
```text
最深部。王国のシンボルたる冠を被り、虚ろな光を放つ瞳をした「不滅の王」アルヴィンが、大剣を地面に突き立てて待っていた。
```

#### `alvin_intro_03`（text）
**演出:** bg: bg_spot_roland_core, speaker: 不滅の王アルヴィン
```text
「……俺はかつて国を守るため、大義の名の下に、四人の無二の友を裏切り、その手を血で汚して殺した」
```

#### `alvin_intro_04`（text）
**演出:** bg: bg_spot_roland_core, speaker: 不滅の王アルヴィン
```text
「その裏切りの罪と友を殺した悔恨は、何度我が肉体が滅び、魂が磨り減ろうとも決して消えることはない」
```

#### `alvin_intro_05`（text）
**演出:** bg: bg_spot_roland_core, speaker: 不滅の王アルヴィン
```text
「だからこそ、ここで俺を殺し、友らの怒りを鎮めてくれ！ 俺を止められる継承者よ、全力で来い！」
```

#### `battle_alvin`（battle）
**演出:** bg: bg_spot_roland_core, bgm: bgm_spot_final_boss
**パラメータ:** enemy_group_id: 305, next: alvin_defeated, fail: end_failure

#### `alvin_defeated`（text）
**演出:** bg: bg_spot_roland_core, bgm: bgm_spot_final_choice
```text
激闘の末、アルヴィンの巨躯が大剣を支えに深く膝をついた。その胸で輝く核が、限界を迎えて激しく明滅し始める。
```

#### `king_appear`（text）
**演出:** bg: bg_spot_roland_core
```text
静寂が戻ろうとしたその時、墓所の入口から無数の兵士を引き連れ、現ローランド国王が冷酷な笑みを浮かべて現れた。
```

#### `king_talk`（text）
**演出:** bg: bg_spot_roland_core, speaker: ローランド国王
```text
「よくやった、旅人よ。これで英霊の魔力は再び我が国の管理下に入る。彼らの魂を回収し、国の強大なる資源とするのだ」
```

#### `alvin_talk`（text）
**演出:** bg: bg_spot_roland_core, speaker: 不滅の王アルヴィン
```text
「う、うおおお……！ また俺たちを、王家の便利極まる道具として呪縛するつもりか……！ 頼む、お前が決めてくれ……！」
```

#### `choice_node`（choice）
**演出:** bg: bg_spot_roland_core, bgm: bgm_spot_final_choice
```text
目の前で兵を構える国王と、魂の解放を願うアルヴィン。あなたはどのような決断を下すだろうか。
```
| 選択肢 | next_node |
|---|---|
| 王の命令に従い討伐する | `end_kill` |
| 誓約の力で彼らを安らかに封印する | `end_seal` |

#### `end_kill`（text）
**演出:** bg: bg_spot_roland_core, bgm: bgm_quest_calm
```text
あなたは国王の命令に従い、アルヴィンの核を完全に叩き割った。五英霊の魂は霧散し、王家は再びその魔力を手に入れた。
```

#### `end_kill_02`（end_success）
**演出:** bg: bg_spot_roland_core
```text
王都の危機を救ったとして、あなたは新たな英雄と祭り上げられた。しかし、使い潰された五英霊の歴史を知るあなたに、その称賛はひたすら虚しく響くだけだった。口止め料として『神の法衣』を授けられた。
```
**rewards:** Exp:500, Gold:10000, Rep:200, Item:602, Order:5

#### `end_seal`（text）
**演出:** bg: bg_spot_roland_core, bgm: bgm_quest_calm
```text
あなたは国王の兵たちを睨み退け、誓約の宝珠を掲げた。宝珠から放たれた温かい光がアルヴィンと四人の魂を優しく包み込み、呪縛を解いていく。
```

#### `end_seal_02`（end_success）
**演出:** bg: bg_spot_roland_core
```text
「感謝する……」と残し、五つの光は今度こそ安らかに天へと消えていった。国王は激怒したが、託された力は奪われない。固有スキル『五星の加護』を手に入れた！
```
**rewards:** Exp:500, Rep:-100, Item:603, Order:5

#### `end_failure`（end_failure）
**演出:** bg: bg_spot_roland_tomb
```text
冷たい石の床へと倒れ伏す。全身を蝕む英霊の圧倒的な魔力の前に、あなたの意識は凍りつき、冷たい暗闇の中へと溶けて消え去った。
```
**rewards:** Gold:0
