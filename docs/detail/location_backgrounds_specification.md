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

### 🏜️ 砂塵の王国マルカンド（中東・砂漠圏）
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

---

## 🗡️ クエスト専用シーン背景（11種）

各地方クエスト（7030-7034, 7040-7044）で使用するシーン背景画像。拠点背景とは異なり、繁栄度パターンは不要（単一パターン）。
`src/config/assets.ts` の `QUEST_BACKGROUNDS` に登録。

### 夜刀地方クエスト背景（6種 / 7030-7034）

| slug | 使用クエスト | Base Prompt |
|------|------------|-------------|
| `bg_yato_road` | 7030: 街道シーン | `(Traditional japanese countryside road, rice paddy fields, gentle hills, wooden bridge over a small stream, serene rural atmosphere)` |
| `bg_yato_forest` | 7030, 7031: 森林シーン | `(Dense japanese bamboo and cedar forest, dappled sunlight filtering through thick canopy, mossy ancient stone path, mystical and quiet atmosphere)` |
| `bg_yato_city` | 7031, 7034: 城下町シーン | `(Traditional japanese castle town streets, wooden merchant shops, paper lanterns, stone walls, busy yet orderly atmosphere)` |
| `bg_yato_den` | 7031: 忍びの隠れ家 | `(Hidden underground ninja hideout, dim torch lighting, wooden planks and secret doors, weapons hanging on walls, tense secretive atmosphere)` |
| `bg_yato_mountain` | 7032, 7033: 山岳シーン | `(Steep japanese mountain trail, ancient torii gates along the path, misty peaks in background, autumn leaves, dramatic and sacred atmosphere)` |
| `bg_yato_shrine` | 7032: 廃神社シーン | `(Abandoned traditional japanese shrine in deep forest, broken torii gate, overgrown with vines and moss, eerie spiritual atmosphere, faint ghostly glow)` |

### 華龍地方クエスト背景（5種 / 7040-7044）

| slug | 使用クエスト | Base Prompt |
|------|------------|-------------|
| `bg_karyu_mountain` | 7040, 7041: 霊山シーン | `(Mystical chinese fantasy mountain, steep rocky cliffs, clouds swirling below, ancient stone steps carved into mountainside, spiritual qi energy visible in the air)` |
| `bg_karyu_palace` | 7041, 7043: 宮殿・屋敷シーン | `(Luxurious chinese imperial palace interior, ornate red and gold pillars, silk curtains, jade decorations, grand throne room, opulent atmosphere)` |
| `bg_karyu_village` | 7042: 農村シーン | `(Poor chinese farming village, thatched-roof mud houses, dried rice paddies, simple wooden fences, struggling but resilient rural atmosphere)` |
| `bg_karyu_coast` | 7044: 海岸シーン | `(Chinese fantasy coastal scenery, rocky shore with crashing waves, distant fishing junks, old stone dock, dramatic stormy sky, salty wind atmosphere)` |
| `bg_karyu_port` | 7044: 港町シーン | `(Bustling chinese fantasy river port, wooden trading junks with colorful sails, waterfront market stalls, stone bridges, lanterns reflecting on water)` |

### 追加地方クエスト背景（2種 / 7035, 7045）

| slug | 使用クエスト | Base Prompt |
|------|------------|-------------|
| `bg_yato_den` | 7035: 影守の怨霊屋敷 | ※既存（忍びの隠れ家）を流用 |
| `bg_karyu_village` | 7045: 妖狐の婚礼 | ※既存（農村シーン）を流用 |

### 伝説級ボス専用背景（1種 / 6106）

| slug | 使用クエスト | Base Prompt |
|------|------------|-------------|
| `bg_holy_empire` | 6106: 天使の降臨 | `(Magnificent holy empire capital city, towering white marble cathedrals, grand castle spires, golden sunlight streaming through stained glass windows, grand stone architecture with religious motifs, beautiful blue sky)` |

### エイリアス背景（既存画像へのフォールバック）

以下のBGキーは `src/config/assets.ts` 内で既存画像へのフォールバックとして定義されています。専用画像は未生成。

| slug | フォールバック先 | 使用クエスト | 概要 |
|------|----------------|------------|------|
| `bg_ruin_crypt` | `bg_crypt.png` | 6105, 6109, 6111 | 遺跡の地下墓地。暗い石壁と松明の灯り |
| `bg_marcund_desert` | `bg_desert.png` | 6107, 6110 | マルカンド砂漠の広大な砂原 |
| `bg_karyu_river` | `bg_karyu_village.png` | 5104 | 華龍地方の河畔 |
| `bg_yato_street_night` | `bg_yato_city.png` | 5113 | 夜の夜刀城下町 |
| `bg_desert_night` | `bg_desert.png` | 7020 | 夜の砂漠 |



