# 拠点背景ビジュアル（Location Backgrounds）生成仕様書

『Code: Wirth-Dawn』における、各拠点（全20拠点、初期拠点である「名もなき旅人の拠所」を除く）の背景ビジュアルを生成するためのプロンプト仕様と生成ルールを定義します。
各拠点は繁栄度システムと連動するため、拠点ごとに「崩壊（Ruined）」「通常（Normal）」「繁栄（Prosperous）」の3パターンの画像を生成します。

## 🎨 画像生成における共通ルール (Visual Pipeline Rules)

1. **テイストと塗り方**: 日本人に馴染みのあるクリアなJRPG風アニメ調セルルック。ファンタジー世界の旅情を感じさせる緻密な背景美術。
2. **キャラクターの排除**: 背景レイアウトとして使用するため、意図しない人物キャラクターを配置しないこと。
3. **構図と比率**: モバイルおよびデスクトップUI向けのワイドな風景画構図（アスペクト比 16:9 程度）。空、中景（メインとなる建物群）、手前の地面のバランスを意識する。
4. **テキスト生成の禁止**: `(no text, no letters, no characters, no people)` 等を含め、文字の混入を固く禁じる。
5. **差分生成（Prosperity Patterns）**: 基本となる地形・構図の概念は変えずに、光の当たり方、建物の損壊状態、活気（小道具や装飾など）の変化で繁栄度を表現する。

---

## 🏗️ 繁栄度パターン別 修飾プロンプト (Prosperity Patterns)

背景生成時は、後述の「拠点ベースプロンプト」に対して、以下の「繁栄度修飾プロンプト」を組み合わせてAIに指示を出します。

### 1. 崩壊 (Ruined: Lv 1)
**テーマ**: 荒廃、絶望、暗雲、瓦礫、静寂
**修飾プロンプト例**:
```text
(ruined, destroyed buildings, heavily damaged architecture, dark cloudy sky, gloomy and depressing atmosphere, abandoned town, debris everywhere, war-torn scars, no signs of life, somber dim lighting)
```

### 2. 通常 (Normal: Lv 3~4)
**テーマ**: 平穏な日常、自然光、適度な生活感
**修飾プロンプト例**:
```text
(peaceful everyday life, clear blue sky, natural beautiful sunlight, well-maintained buildings, standard fantasy town, serene atmosphere, calm and comfortable breeze)
```

### 3. 繁栄 (Prosperous: Lv 5)
**テーマ**: 豪華、圧倒的な活気、黄金の光、祭りのような賑わい
**修飾プロンプト例**:
```text
(extremely prosperous, wealthy metropolis, vibrant and rich colors, golden hour lighting, flying colorful banners, beautifully decorated buildings, festival atmosphere, sparkling light rays, magnificent and lively)
```

---

## 🗺️ 全20拠点 ベースプロンプト定義 (Base Location Prompts)

各拠点の名称と、ベースとなる風景プロンプト（Base Prompt）の定義です。これに修飾プロンプトを掛け合わせます。

### 🛡️ ローランド（西洋ファンタジー圏）
中世ヨーロッパ風の石造りの建築、雄大な自然に囲まれた騎士の国。

1. **王都レガリア**
   - **Base Prompt**: `(Grand fantasy capital city, huge white majestic castle in background, stone paved wide streets, medieval european architecture, flags flying on high towers)`
2. **白亜の砦**
   - **Base Prompt**: `(Massive white stone fortress built on a mountain cliff, tall defensive thick walls, military stronghold, medieval watchtowers, overlooking a deep green valley)`
3. **港町**
   - **Base Prompt**: `(Busy trading port town, wooden docks stretching to the sea, large sailing ships anchored, beautiful ocean view, seagulls flying, stone buildings leaning towards the coast)`
4. **国境の町**
   - **Base Prompt**: `(Modest frontier town, surrounded by sturdy wooden palisades, simple medieval wooden and stone houses, dense dark forest in the background, crossing gate)`
5. **鉄の鉱山村**
   - **Base Prompt**: `(Mining village, built into a rocky mountainous area, giant wooden cranes and minecart tracks creeping up the slopes, forging smoke rising from chimneys, rugged unyielding environment)`

### 🏜️ マーカンド（中東・砂漠圏）
広大な砂漠、オアシス、アラビアンナイト風の建築、熱砂とバザールの国。

6. **黄金都市イスハーク**
   - **Base Prompt**: `(Magnificent desert metropolis, giant golden domes reflecting the sun, arabic fantasy architecture, beautiful oasis river running through the city, abundant palm trees, grand bazaar tents)`
7. **市場町**
   - **Base Prompt**: `(Crowded desert market town, colorful awnings and silk cloths hanging, densely packed sandstone houses, dusty bustling streets, major trading post)`
8. **オアシスの村**
   - **Base Prompt**: `(Small peaceful village surrounding a crystal clear oasis pool, lush green palm trees, simple tents and dome-shaped adobe houses, serene desert hideaway)`
9. **平原の都市**
   - **Base Prompt**: `(City situated in a dry endless savanna plain, flat-roofed sandstone buildings, wide open horizon, large wind turbines or fabric sails catching the wind, ancient stone aqueducts)`
10. **高原の村**
    - **Base Prompt**: `(Village built on a dangerous rocky desert plateau, high altitude feeling, steep red sandstone cliffs, step-like adobe houses cleverly built on the edge, overlooking an immense canyon)`

### 🌸 夜刀神組国（和風ファンタジー圏）
瓦屋根、鳥居、桜や竹林など、江戸〜戦国時代をベースとした純和風ファンタジー。

11. **神都「出雲」**
    - **Base Prompt**: `(Grand japanese fantasy capital, massive brilliant red torii gates, traditional beautiful wooden castle in background, shinto shrines, pink cherry blossom petals gently falling in the wind)`
12. **門前町**
    - **Base Prompt**: `(Traditional bustling japanese town leading up to a great mountain shrine, stone lanterns lining the wide path, wooden merchant shops and tea houses, slightly mystical atmosphere)`
13. **谷間の集落**
    - **Base Prompt**: `(Hidden ninja village in a deep forested valley, traditional wooden houses built on incredibly steep slopes, dense green bamboo forest, hanging rope bridges, misty and secretive)`
14. **最果ての村**
    - **Base Prompt**: `(Remote snow-covered traditional japanese village, thick thatched-roof houses buried in snow, isolated setting, harsh freezing winter environment, quiet and peaceful atmosphere)`
15. **保養地**
    - **Base Prompt**: `(Luxurious hot spring resort town, incredibly beautiful traditional japanese ryokan inns, warm thick steam rising from onsens, brilliant deep red autumn maple trees, relaxing and healing atmosphere)`

### 🐉 華龍神朝（中華ファンタジー圏）
反り返った屋根、赤い提灯、巨大な城壁など、仙郷や武侠をテーマとした中華ファンタジー。

16. **天極城「龍京」**
    - **Base Prompt**: `(Massive imperial chinese fantasy city, incredibly magnificent palace with golden curved roofs, huge thick red pillars, ornate dragon statues, extremely wide ceremonial brick avenues)`
17. **北の防衛砦**
    - **Base Prompt**: `(Gigantic immense great wall-style fortress, monumental dark stone watchtowers, harsh northern mountainous border, military banners snapping in the wind, highly imposing defensive structure)`
18. **監視哨**
    - **Base Prompt**: `(Tall isolated stone and wood watchtower on an incredibly high mountain peak, classical chinese architecture, beautiful sea of clouds stretching far below, lonely but highly strategic outpost)`
19. **古代遺跡の町**
    - **Base Prompt**: `(Town comfortably built within massive ancient chinese structural ruins, gigantic stone Buddha statues integrated into the walls, beautifully overgrown with green vines, mystical and highly historic atmosphere)`
20. **闘技都市**
    - **Base Prompt**: `(Bustling aggressive martial arts city, huge impressive circular fighting arena standing in the very center, various open training grounds, glowing red lanterns hanging overhead, vibrant and highly energetic vibe)`

---

## 💻 生成プロンプト構築例 (Usage Example)

**対象**: 夜刀神組国「保養地」の「繁栄（Prosperous）」状態

**Final Prompt**:
```
JRPG anime art style background illustration, (no text, no letters, no characters, no people), wide landscape aspect ratio, (Luxurious hot spring resort town, incredibly beautiful traditional japanese ryokan inns, warm thick steam rising from onsens, brilliant deep red autumn maple trees, relaxing and healing atmosphere), (extremely prosperous, wealthy metropolis, vibrant and rich colors, golden hour lighting, flying colorful banners, beautifully decorated buildings, festival atmosphere, sparkling light rays, magnificent and lively)
```
