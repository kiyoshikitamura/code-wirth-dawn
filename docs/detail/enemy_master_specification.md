# Wirth-Dawn Enemy Master Specification (v16.2) & Security/UX Audit

本ドキュメントは、「Code: Wirth-Dawn」のワールドマップおよび汎用クエストで登場する全50種のエネミー（enemies）および敵スキル（enemy_skills）の定義、ならびにバトルの致命的な脆弱性監査およびUI/UXの追加実装案を統合したものです。

---

## 🟢 STEP 1: データ構造と50種リストの作成 (Logic-Expert)

### 1-1. エンカウント仕様とテーブル定義

エネミーの出現傾向や強さを管理するため、`enemies` テーブルと `enemy_skills` テーブルを定義します。

**【enemies テーブル】**
*   `id` (BIGINT): 一意な識別子
*   `slug` (TEXT): 内部ID (例: `enemy_slime_blue`)
*   `name` (TEXT): 表示名
*   `hp` (INTEGER): 最大HP
*   `atk` (INTEGER): 基礎攻撃力
*   `def` (INTEGER): 基礎防御力
*   `exp` (INTEGER): 撃破時の獲得経験値
*   `gold` (INTEGER): 撃破時の獲得ゴールド
*   `drop_item_id` (BIGINT): ドロップアイテムのID（確率または固定）
*   `spawn_type` (TEXT): `random` (通常), `quest_only` (クエスト専用), `bounty` (賞金稼ぎ/イベント専用)
*   `action_pattern` (JSONB): 行動パターン。確率（prob）や条件（condition）と使用スキル（skill）を定義する。
    *   例: `[{"skill": "slap", "prob": 70}, {"skill": "heal", "condition": "hp_under:30", "prob": 30}]`

**【enemy_skills テーブル】**
*   `id` (BIGINT): 一意な識別子
*   `slug` (TEXT): スキル内部ID
*   `name` (TEXT): スキル名
*   `effect_type` (TEXT): 効果（`damage`, `heal`, `buff_atk`, `stun`, `drain_vit` など）
*   `value` (INTEGER): 効果の基礎値
*   `inject_card_id` (BIGINT): 敵がカードを使用する場合の紐付け（将来拡張用）
*   `description` (TEXT): スキルの説明

---

### 1-2. 50種の配分と設計リスト

#### ① 基礎的な魔物（15種）
各レベル帯の基準となる通常の魔物。序盤〜中盤のランダムエンカウント等で登場。
1.  **ブルースライム (enemy_slime_blue / Lv1)**: ぷるぷるとした青い粘性生物。最も弱いが初心者には厄介な相手。
2.  **レッドスライム (enemy_slime_red / Lv3)**: 熱を帯びた赤いスライム。炎の力を宿しており触れると火傷する。
3.  **キングスライム (enemy_slime_king / Boss Lv8)**: 巨大な王冠を被った巨大スライム。圧倒的な質量で押し潰してくる。
4.  **ゴブリン (enemy_goblin / Lv2)**: 醜悪な小鬼。粗末な武器を持ち、集団で冒険者を襲う。
5.  **ゴブリンアーチャー (enemy_goblin_archer / Lv3)**: 弓を扱う狡猾なゴブリン。遠距離から執拗に狙い撃ってくる。
6.  **ゴブリンシャーマン (enemy_goblin_shaman / Lv5)**: 簡単な魔法を操る希少なゴブリン。味方の回復や炎による攻撃を行う。
7.  **ホブゴブリン (enemy_hobgoblin / Boss Lv10)**: 筋骨隆々に成長したゴブリンの長。太い棍棒で強力な一撃を放つ。
8.  **ワイルドドッグ (enemy_wild_dog / Lv3)**: 野生化し凶暴になった大型犬。素早い動きで鋭い牙を剝く。
9.  **キラーウルフ (enemy_killer_wolf / Lv5)**: 血に飢えた森の狼。集団の連携と強烈な噛みつきが脅威。
10. **ジャイアントベア (enemy_giant_bear / Lv8)**: 人の背丈を優に超える巨大熊。その剛腕は岩をも砕く。
11. **キマイラ (enemy_chimera / Boss Lv15)**: 獅子の頭、山羊の胴、蛇の尾を持つ合成獣。多彩な攻撃手段で獲物を追い詰める。
12. **スケルトン (enemy_skeleton / Lv4)**: 魔力によって動く死者の骨。痛覚を持たず、ただ生者を憎む。
13. **ゾンビ (enemy_zombie / Lv6)**: 腐肉を纏った動く死体。驚異的な再生能力を持ち、倒しても立ち上がる。
14. **レイス (enemy_wraith / Lv10)**: 強い怨念が具現化した悪霊。物理攻撃が通りにくく、生命力を啜る。
15. **リッチ (enemy_lich / Boss Lv20)**: 永遠の命を得るため不死者となった大魔術師。強大な闇の魔力を操るアンデッドの王。

#### ② 人型の敵・野盗（10種）
主にゴールドや交易品を落とす資金源となる敵。治安の悪い地域に出現。
16. **チンピラ (enemy_bandit_thug / Lv2)**: 街の裏路地や街道沿いにたむろするゴロツキ。金品を狙って襲いかかってくる。
17. **野盗の射手 (enemy_bandit_archer / Lv4)**: くすねた弓を扱う野盗。物陰から旅人を狙い、確実に弱らせる。
18. **野盗の用心棒 (enemy_bandit_guard / Lv6)**: 金で雇われた腕利きの荒くれ者。返り血を浴びた大剣を軽々と振るう。
19. **盗賊団の頭領 (enemy_bandit_boss / Boss Lv12)**: 荒くれ者たちを束ねる冷酷なリーダー。実力は本物で、一切の容赦がない。
20. **狂信者 (enemy_cultist / Lv5)**: 邪神を崇拝する狂気の信徒。己の命を顧みず、ただ教義のために戦う。
21. **邪教の司祭 (enemy_cult_priest / Lv9)**: 闇の儀式を取り仕切る妖しき司祭。おぞましい魔法で精神と肉体を蝕む。
22. **教団の執行者 (enemy_cult_exec / Lv14)**: 異端者を狩る教団の暗殺兵。重装甲と恐れを知らぬ猛攻で対象を排除する。
23. **見習い暗殺者 (enemy_assassin_trainee / Lv8)**: 闇ギルドで訓練中の若い刺客。未熟とはいえ、その刃には致死の毒が塗られている。
24. **凄腕の刺客 (enemy_assassin_master / Lv15)**: 数多の要人を沈めてきた熟練の暗殺者。気配を絶ち、致命の一撃を放つ。
25. **影の頭目 (enemy_assassin_boss / Boss Lv22)**: 暗殺ギルドを統べる謎の人物。姿を捉えることすら困難な、闇夜の死神。

#### ③ 国家・地域固有の魔物（16種 / 各国4種）
各国家圏（首都周辺や特定地形）にのみ出現する独自のエネミー。
26. **聖騎士の亡霊 (enemy_roland_ghost_knight / ローラン Lv10)**: 過去の聖戦で散った騎士の怨霊。ボロボロの甲冑を纏い、今も教えを守ろうと彷徨う。
27. **ガーゴイル (enemy_roland_gargoyle / ローラン Lv12)**: 大聖堂など古い建築物に潜む石像の怪物。侵入者を石の羽ばたきで強襲する。
28. **異端の魔女 (enemy_roland_witch / ローラン Lv15)**: 迫害の末に深い森に逃げ込み、禁忌の術に手を出した女。復讐の呪詛を撒き散らす。
29. **堕天使 (enemy_roland_fallen_angel / ローラン Boss Lv25)**: 神に反逆し地に落とされた美しき天使。黒い翼を広げ、神聖と冒涜が入り混じる裁きを下す。
30. **デザートスコーピオン (enemy_markand_scorpion / マルカンド Lv8)**: 砂漠に住む巨大な蠍。硬い甲殻と、猛毒を持つ尾の針が特徴。
31. **サンドワーム (enemy_markand_sand_worm / マルカンド Lv14)**: 砂の中を泳ぐように移動する巨大なミミズ型の怪物。振動を感知して獲物を丸呑みにする。
32. **砂漠の魔人 (enemy_markand_djinn / マルカンド Lv18)**: 古代遺跡のランプから解き放たれた炎の魔神。高熱の砂嵐を操る。
33. **デザートドラゴン (enemy_markand_desert_dragon / マルカンド Boss Lv30)**: 砂漠帯の生態系の頂点に君臨する茶褐色の竜。すべてを干上がらせる灼熱の息を吐く。
34. **鬼火 (enemy_yato_onibi / 夜刀国 Lv6)**: 古戦場などに浮かぶ青白い火の玉。生者の魂を引こうと、ゆらゆらと近づいてくる。
35. **からかさ小僧 (enemy_yato_karakasa / 夜刀国 Lv10)**: 古い和傘が付喪神となった妖怪。一つ目で不気味に笑い、突進してくる。
36. **からす天狗 (enemy_yato_tengu / 夜刀国 Lv16)**: 深山に棲む半人半鳥の妖怪。錫杖と太刀を扱い、風を操る武芸の達人。
37. **赤鬼 (enemy_yato_akaoni / 夜刀国 Boss Lv24)**: 筋骨隆々の真っ赤な体を持つ大鬼。見上げるほどの金砕棒を振り回し、山を砕く怪力を誇る。
38. **キョンシー (enemy_karyu_jiangshi / 華龍神朝 Lv9)**: 額に呪符を貼られた青白い死体。両腕を前に突き出し、跳ねるように距離を詰めて生気を吸い取る。
39. **妖狐 (enemy_karyu_fox / 華龍神朝 Lv15)**: 人を化かす狡猾な狐の妖怪。美しい女の姿で近づき、強力な妖術で獲物を仕留める。
40. **兵馬俑 (enemy_karyu_terracotta / 華龍神朝 Lv18)**: 古代の皇帝を守るため造られた土人形の兵士。決して崩れぬ陣形と岩のように硬い守りを誇る。
41. **麒麟 (enemy_karyu_kirin / 華龍神朝 Boss Lv28)**: 瑞獣とされる伝説の神獣だが、大地が荒れると凶暴化する。雷を纏った神聖な蹄で邪悪を蹴散らす。

#### ④ 賞金稼ぎ / バウンティハンター（9種）
プレイヤーの「名声（Reputation）」が大きくマイナス（例：-100以下）になった際にランダムエンカウントで強襲してくるエリートNPC。
42. **新米ハンター (enemy_bounty_hunter_new / Lv10)**: 賞金首を狩って名を上げようと意気込む若者。実力は伴っていないが血気盛ん。
43. **賞金稼ぎの剣士 (enemy_bounty_hunter_sword / Lv12)**: 金のために剣を振るうプロの傭兵。的確に急所を突いてくる。
44. **賞金稼ぎの狩人 (enemy_bounty_hunter_archer / Lv9)**: 獲物を遠方から仕留めるスナイパー。罠や毒矢を用いた搦手も得意とする。
45. **ベテランハンター (enemy_bounty_hunter_vet / Lv25)**: 数多の賞金首を狩ってきた百戦錬磨の男。傷だらけの甲冑は彼の戦歴を物語る。
46. **魔術狩り (enemy_bounty_mage_hunter / Lv20)**: 魔法や異端の術を使う者を狩ることに執念を燃やす異能の殺し屋。魔法耐性が異常に高い。
47. **重装の処刑人 (enemy_bounty_executioner / Lv40)**: 全身を分厚い鋼で覆った王国の処刑人。巨大な処刑斧で対象を両断する。
48. **王国公認の凶刃 (enemy_bounty_royal_blade / Lv60)**: 国家からお墨付きを得た公認の殺し屋。一切の感情を持たず、任務のみを完遂する冷徹な機械。
49. **伝説の傭兵 (enemy_bounty_legend / Boss Lv90)**: 裏社会でその名を知らぬ者はいない生ける伝説。もはや金ではなく「強き獲物」を求めている。
50. **静寂の死神 (enemy_bounty_reaper / Boss Lv75)**: 音もなく現れ、音もなく命を刈り取る正体不明の暗殺者。姿を見た者は、次の瞬間に己の死を悟る。

---

### 1-3. 投入用CSVフォーマットとサンプル

**`data/enemies.csv` (抜粋)**
```csv
id,slug,name,hp,atk,def,exp,gold,drop_item_id,spawn_type
1001,enemy_slime_blue,ブルースライム,20,3,1,5,10,,random
1015,enemy_lich,リッチ,300,45,20,500,800,,random
1019,enemy_bandit_boss,盗賊団の頭領,150,25,10,150,500,216,quest_only
1048,enemy_bounty_legend,伝説の傭兵,800,80,40,2000,0,,bounty
```

**`data/enemy_actions.csv` (抜粋)**
*JSONBを構築するための関連テーブルCSV*
```csv
id,enemy_slug,skill_slug,prob,condition_type,condition_value
1,enemy_slime_blue,skill_tackle,100,,
2,enemy_lich,skill_drain_vit,30,turn_mod,3
3,enemy_lich,skill_dark_flare,70,,
```

**`data/enemy_skills.csv` (抜粋)**
```csv
id,slug,name,effect_type,value,description
2001,skill_tackle,体当たり,damage,10,敵に物理ダメージを与える
2002,skill_drain_vit,生命吸収,drain_vit,1,対象の寿命（Vitality）を直接奪う
2003,skill_heal_self,自己再生,heal,50,自身のHPを回復する
```

---

## 🔴 STEP 2: バトルバランス・チート耐性の監査 (Security-Expert)

### 2-1. 決定論的バトルの「詰み（無限ループ）」防止検証

**【脅威モデル】**
乱数がないため、敵の防御力（def）がプレイヤーの最大火力を上回る場合、ダメージが常に1または0になり、実質倒せなくなります。また、敵が「毎ターン50回復する」行動を持っていると、削りきれずに30ターン制限（強制敗北）を迎える「バグ的な詰み」が発生します。

**【監査結果と対策】**
*   **防御力の限界設定**:
    敵の `def` は、同レベル帯プレイヤーの「基礎攻撃力＋標準的な武器攻撃力」の80%以下に設計する必要があります。`def` が高すぎるボス（例: 砂漠ワームや重装の処刑人）については、代わりに `hp` をメガ盛りする方針（HPスポンジ化）に統一します。
*   **回復行動のクールダウン / 回数制限**:
    「HP30%以下で自己再生（prob:100）」のような無限ループ行動は禁止とします。行動パターンとして `condition_type: "once_per_battle"` や `condition_type: "turn_mod:5"`（5ターンに1回のみ）といった制約をエンジン側に実装し、回復を撃つターンと攻撃するターンの「確実な隙」を作ります。

### 2-2. 寿命吸収（drain_vit）と名声ペナルティの検証

**【脅威モデル】**
寿命（Vitality）は本作の根幹リソースであり、アンデッドや闇術師が持つ `drain_vit` 効果が過剰に発動した場合、プレイヤーのセーブデータが実質的に破壊（強制引退）される危険があります。また、賞金稼ぎ（Bounty）に負けた際の「所持金50%没収」が機能しない場合、名声を捨てるプレイが最適解化します。

**【システム監査と対策】**
*   **drain_vitのセーフティキャップ**:
    `skill_drain_vit` は 1ターンに最大でも **「1削るのみ」** とし、かつ `enemy_actions` の確率を最大20%に抑えるか、「3の倍数ターンに確実に1度だけ放つ」仕様とします。一度の戦闘で奪われるVitalityの理論上の最大値を3〜5に留めます。
*   **賞金稼ぎバトルの「強制没収」フラグ**:
    `enemies.spawn_type = 'bounty'` の敵との戦闘敗北時について。
    `/api/battle/action` 等のサーバーサイドエンジンで敗北（`status = 'defeat'`）が確定した際、敵の `spawn_type` を参照し、`bounty` であればハードコードされたペナルティロジック（`gold_lost = Math.floor(player.gold / 2)`）を実行するよう、バトルエンジンの報酬・ペナルティ清算フェーズにフック（Hook）を設ける必要があります。

---

## 🔵 STEP 3: UI/UX追加実装提案 (UIUX-Expert)

### 3-1. マルチエネミー描画のUI検証（Tailwind）

モバイル（390x844）の狭い画面上部に、最大6体のエネミーを破綻なく並べるためのレイアウトアプローチです。

**【Tailwind Layout アプローチ】**
```tsx
// BattleView内の EnemyArea コンポーネント想定
<div className="w-full min-h-[160px] p-2 flex flex-col justify-end">
  {/* 上段 (後列: 3体) */}
  <div className="flex justify-center gap-2 mb-[-10px] z-0 opacity-90 scale-90">
    {enemies.slice(3, 6).map(enemy => <EnemySprite key={enemy.id} enemy={enemy} />)}
  </div>
  {/* 下段 (前列: 3体) */}
  <div className="flex justify-center gap-3 z-10 w-full px-2">
    {enemies.slice(0, 3).map(enemy => <EnemySprite key={enemy.id} enemy={enemy} />)}
  </div>
</div>
```
*   **解説**: 単純な `grid-cols-3` だとサイズが小さくなりすぎるため、後列（`slice(3,6)`）を少しスケールダウン（`scale-90`）させ、ネガティブマージン（`mb-[-10px]`）で前列（`slice(0,3)`）の背後に回り込むような疑似3D（重なり）レイアウトを採用します。これにより、個々のスプライトのサイズを維持したまま6体を収めます。

### 3-2. 脅威度（ボス・賞金稼ぎ）の視覚的フィードバック

絶望感や緊張感を与えるため、通常のエンカウントとは異なる専用のUI演出を提案します。

**【提案1: ボスエンカウント時の画面エッジ明滅】**
ボスまたは賞金稼ぎが出現する場合、`BattleView` 全体のコンテナに赤黒いインナーシャドウを追加し、鼓動のように明滅させます。

```tsx
// BattleView.tsx のラッパー要素のクラス
`relative w-full h-full flex flex-col ${isBossEncounter ? 'shadow-[inset_0_0_80px_rgba(220,38,38,0.2)] animate-pulse-slow' : ''}`
```

**【提案2: 賞金稼ぎ専用「WANTED」エフェクト】**
賞金稼ぎ（`spawn_type === 'bounty'`）が現れた際、敵の頭上またはステータスバー付近に、警告用の専用バッジを表示します。

```tsx
{enemy.spawn_type === 'bounty' && (
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500 text-red-500 text-[8px] font-black px-1.5 py-0.5 whitespace-nowrap z-20 animate-glitch skew-x-[-10deg]">
        BOUNTY HUNTER
    </div>
)}
```
*   **解説**: プレイヤーに「これは通常の雑魚ではなく、名声ペナルティによるペナルティバトルである」ことを強烈に視認させ、逃走や全力を出すべきという判断を促します。
