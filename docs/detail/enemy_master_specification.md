# Wirth-Dawn Enemy Master Specification (v16.4) & Security/UX Audit

本ドキュメントは、「Code: Wirth-Dawn」のワールドマップおよび汎用クエストで登場する全**101種**のエネミー（enemies）および敵スキル（enemy_skills）の定義、ならびにバトルの致命的な脆弱性監査およびUI/UXの追加実装案を統合したものです。

> **v2.9.4b (2026-04-26) 変更点 — 汎用クエスト用エネミー追加:**
> - **新規エネミー2種追加**: `enemy_mob`（飢えた市民 / Lv2 / quest_only）、`enemy_giant_rat`（巨大ネズミ / Lv2 / random）。
> - **新規敵グループ10種追加**: 汎用クエスト7001-7008用の多様なグループ構成（ID:112-121）。同一グループ使い回しを解消。
> - エネミー総数: 99種 → **101種**。

> **v2.9.3g (2026-04-18) 変更点 — エネミーバランス修正:**
> - **敵ATK反映**: `battleSlice.ts` のダメージ計算で `baseAtk = enemy.atk || (level*3+5)` に変更。CSV/DBの `atk` 値が戦闘ダメージに直接反映されるようになった。
> - **Levelカラム追加**: `enemies` テーブルに `level` カラムを追加。全76種に仕様書準拠のレベルを設定。
> - **クエスト/マップ修正**: enemy spawn時に `e.level` と `e.atk` をDBから取得しバトルに渡すよう修正（旧: `HP/10` でlevel計算、atk未送信）。
> - **6000番台ボス報酬減額**: Gold/EXPを×0.20〜0.30に減額（例: 骸骨狂王 2000G→500G）。同HP帯の通常ボスと報酬水準を統一。
> - **6000番台ボスLevel設定**: Lv15〜32を新規設定。

> **v2.9.3h (2026-04-18) 変更点 — 敵スキル拡張:**
> - **状態異常付与の実装**: `battleSlice.ts` に `damage_poison`/`damage_blind`/`damage_bleed`/`damage_stun`/`buff_self_atk`/`debuff_atk_down`/`debuff_def_down` の7種のeffect_typeを追加。敵がプレイヤーに毒・目潰し・出血・スタン・DEF DOWNを付与可能に。
> - **DEF DOWN状態異常**: `statusEffects.ts` に `def_down` を追加（DEF半減）。プレイヤーダメージ計算に `getDefDownMod` を適用。
> - **毒針修正**: `skill_poison_attack` の `effect_type` を `damage` → `damage_poison` に変更。毒が実際に付与されるように。
> - **新規敵スキル12種追加**: 毒の息, 雷撃, 砂塵, 裂傷の爪, 魅惑の歌, 石化の視線, 魂抜き, 強力再生, 雄叫び, 呪詛, 鎧砕き。
> - **6000番台ボス全20体にアクションパターン設定**: 各ボス3〜4種の行動パターン（条件付き回復・必殺技・デバフ等）。

> **v2.9.3i (2026-04-19) 変更点 — エネミー多様化 & DB最終反映:**
> - **強打/強攻撃の倍率修正**: value 2→1.5 に下方修正。ダークフレア/ホーリーレイ(×2)との差別化。
> - **通常エネミー全種の行動パターン多様化**: 単スキル100%の敵を解消。全敵が2〜4種のスキルを持つように。
> - **DEFカラム追加**: `enemies` テーブルに `def` カラムを追加し全76種に設定。
> - **enemy_skills CHECK制約更新**: 新effect_type（`damage_poison`等11種）をDB CHECK制約に追加。
> - **レガシーコード修正**: debug/battle-test の HP/10 レベル計算を DB level 優先に修正、ATKフィールド追伝。
> - **マイグレーションSQL**: `20260419000001_enemy_skill_expansion.sql` にスキル/パターン/DEF一括反映。

> **v2.9.3j (2026-04-19) 変更点 — 味方回復スキル修正:**
> - **パーティメンバーへの回復実装**: `battleSlice.ts` の `case 'heal'` を拡張。`target_type: 'single_ally'` 時にパーティメンバーの `durability` を回復する分岐を追加。`target_type: 'all_allies'` 時にプレイヤー + 全パーティメンバーを一括回復する分岐を追加。
> - **ヒール対象選択UI**: `BattleView.tsx` に `healTargetMode` を追加。`single_ally` ヒールカード使用時、プレイヤーとパーティメンバーの一覧（HPバー付き）を表示し、タップで対象を決定。
> - **party_members slug制約修正**: `UNIQUE(slug)` をテーブル全体から削除し、`owner_id IS NULL` のみの部分一意インデックスに変更。同一NPC傭兵の複数ユーザー雇用を可能に。

> **v2.9.3k (2026-04-19) 変更点 — NPC AIスキル使用ロジック修正:**
> - **攻撃カードフィルター修正**: `npcAI.ts` の `attackCards` フィルターで、`target_type` が敵対象の Defense/Support カード（シールドバッシュ等）を攻撃候補に含めるように修正。従来は `type=Defense/Support` を一律除外していた。
> - **バフ認識拡張**: `tryRoleBasedBuff` で `atk_up_fatal`/`morale_up`/`berserk` をATK UP系、`def_up_heavy`/`invulnerable`/`absolute_def`/`counter` をDEF UP系として認識。Guardianの `taunt` も使用対象に追加。ロール不問の一般バフ使用フォールバックも追加。
> - **敵デバフカード使用パス追加**: `tryDebuffEnemy` 関数を新設。`stun`/`bind`/`blind`/`atk_down`/`freeze`/`poison`/`curse` の敵対象カードをバフフェーズ後・攻撃フェーズ前に使用。
> - **battleSlice同期**: `isSelfBuff` リストを14種に拡張。`debuff` アクションのダメージ処理（HP減算）を追加。

> **v2.9.3l (2026-04-19) 変更点 — デバフ成功率システム:**
> - **成功率テーブル導入**: `statusEffects.ts` に `DEBUFF_SUCCESS_RATES` と `rollDebuffSuccess()` を追加。全デバフにeffect_idごとの発動確率を設定。
> - **成功率**: スタン/拘束 40%、凍結 45%、目潰し/恐怖 50%、ATK DOWN/DEF DOWN 60%、軽微目潰し 65%、毒/出血 70%、軽微出血 80%。バフ系は常に100%。
> - **3箇所の適用**: ①プレイヤーカード→敵 ②NPC AI→敵 ③敵攻撃→プレイヤー の全デバフ付与ポイントに確率判定を追加。
> - **レジスト演出**: 失敗時「〜に抵抗した！」「〜に耐え抜いた！」等のログメッセージを表示。
> - **StatusEffectId拡張**: `freeze`（凍結）、`curse`（呪い）を型定義・名前マップに追加。

> **v2.9.3m (2026-04-20) 変更点 — 道具屋ポップアップ表示修正:**
> - **`getEffectList` 拡張**: `damage`, `aoe_damage`, `escape`, `remove_effect`, `heal_full`/`heal_all`, `heal_pct`, `vit_restore`, `hp_bonus`, `use_timing`, `ap_cost`, `deck_cost` を認識。effectIdLabelを24種に拡大。負のDEF bonusも正しく表示。
> - **`formatEffectData` 拡張**: description優先を維持しつつ、description未設定時に全effect_dataキーを網羅的にパースして概要テキストを生成。
> - **power:0 抑制**: `power > 0` のみ表示し、サポート/防御スキルの「威力 0」表示を解消。
> - **スキル表示整理**: `cost_type`/`cost_val` → `ap_cost`/`deck_cost` に変更。Shop APIがカードの `ap_cost` とスキルの `deck_cost` をeffect_dataに含めるよう修正。
> - **effect表示ラベル化**: `effect` フィールドの生値（`buff_all` 等）を日本語ラベル（「全体バフ」等）に変換する11種のマップを追加。
> - **消耗品バフ処理**: `useBattleItem` に `atk_bonus`/`def_bonus` を持つ消耗品（大聖堂の祝福等）の一時バフ適用ロジックを追加。
> - **装備品description修正(8件)**: 砂漠の外套、青龍偃月刀、鉄の爪、冒険者の靴、幸運のコイン、ヌンチャク、盗賊の七つ道具、旅人のリュック — 未実装効果（回避率、クリティカル、ドロップ率等）の参照を実際のステータスボーナスに修正。
> - **消耗品データ修正(10件)**: 火炎瓶、煙玉、強い酒、中和薬、上級中和薬、護法符、竜血、大聖堂の祝福、天使の涙、龍井茶。
> - **ショップ除外**: 効果未実装フレーバーアイテム8種（携帯保存食、松明、宝の地図(偽)、応急修理キット、反魂香、王家の勅令書、魔導書:転移、詳細な世界地図）と竜血をショップから除外。
> - **MP回復表示削除**: MP未実装のため `mp_heal` の表示を `getEffectList` から除去。龍井茶の `mp_heal`/`mp_restore` も除去。

> **v2.9.3n (2026-04-20) 変更点 — 消耗品リバランス + 新機能:**
> - **炎上(burn)ステータス追加**: `StatusEffectId` に `burn` を新設。毒と同じDoT (MaxHP×5%/T) だが表示は「炎上」「炎に包まれている」。
> - **逃走確率化**: `escape_chance` (0.0〜1.0) を `useBattleItem` に追加。煙玉を70%成功率に、忍玉は100%維持。失敗時もアイテム消費。
> - **自己スタン**: `stun_self_chance` / `stun_self_duration` を追加。強い酒で50%確率の1Tスタン。
> - **DEFペナルティ**: `def_penalty` を `useBattleItem` で `def_down` エフェクトとして適用。熱砂の香辛料のATK UP代償。
> - **複数バフ**: `extra_effects` 配列を `useBattleItem` で処理。禁術の秘薬が regen(5T) + atk_up(10T) を同時付与。
> - **名声リセット**: `/api/item/use` に `reputation_reset` 処理を追加。帳簿の改竄で全reputationsレコードを削除。
> - **スキルdescription**: Shop APIの `cards` selectに `description` を追加。スキルポップアップにカードの説明文が表示されるように。
> - **価格リバランス(14件)**: 聖水(dmg30)、火炎瓶(dmg20/burn)、煙玉(70%)、強い酒(50G/HP50/スタン)、高級傷薬(200G/HP100)、最高級傷薬(300G/HP200)、龍井茶(500G/毒解除)、忍玉(名称変更)、熱砂の香辛料(8T/DEF DOWN)、天狗の羽団扇(4T/atk_bonus除去)、禁術の秘薬(10000G/複合効果)、帳簿の改竄(field使用)、竜血(50000G)、簡易テント(300G統一)。
> - **マイグレーション**: `20260420000002_consumable_rebalance.sql`

> **v2.9.4a (2026-04-25) 変更点 — エネミーATK/スキル大幅リバランス:**
> - **T1-T2雑魚ATK上方修正（×1.5〜2倍）**: ブルースライム 5→10, ゴブリン 8→14, スケルトン 15→22, ゾンビ 20→30 等。序盤から「回復が必要」と感じる被ダメージ量に調整。
> - **T5旧ボスATK上方修正（×3〜6倍）**: 骸骨狂王 10→55, エント長 8→45, 腐敗枢機卿 10→60, バフォメット 22→85, デザートドラゴン 30→100 等。ボスとしての脅威感を確保。
> - **スキル倍率修正**: 強打 1.5→2, 火の玉 1→1.5, 咆哮 1→1.5, 矢 1→1.3, 砂ブレス 1→1.3, 裂傷の爪 1→1.3, 毒針 1→1.2, 石化の視線 2→2.5。1倍率スキルの多さを解消。
> - **boss_nuke倍率修正 50→6**: ATK上方修正との整合。旧ATK10×50=500が新ATK55×6=330に。即死回避しつつ重い一撃として成立。
> - **新規エネミースキル8種追加（計43種）**: 激昂(2.5x/HP条件), 狂暴化(4x/HP条件), 連続攻撃(0.6x), 全体攻撃(1.5x), シールドバッシュ(1.5x/スタン), 死の宣告(DEF DOWN 3T), 反撃の構え(ATK UP 5T), 命の収奪(VIT吸収2x)。
> - **T5ボスアクションパターン全面改修**: 未定義スキル(`skill_attack`/`skill_heavy_attack`)を排除。HP条件トリガー(enrage/berserk_rage)で後半の戦闘が激化する設計に。DEF DOWN/ATK UPローテーションを追加。

---

## 🟢 STEP 1: データ構造と50種リストの作成 (Logic-Expert)

### 1-1. エンカウント仕様とテーブル定義

エネミーの出現傾向や強さを管理するため、`enemies` テーブルと `enemy_skills` テーブルを定義します。

**【enemies テーブル】**
*   `id` (BIGINT): 一意な識別子
*   `slug` (TEXT): 内部ID (例: `enemy_slime_blue`)
*   `name` (TEXT): 表示名（※UIでの改行・見切れを防ぐため、**全角10文字以内**を厳守すること）
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

#### ② 人型の敵・野盗・妖魔（11種）
主にゴールドや交易品を落とす資金源となる敵。治安の悪い地域・暗がりに出現。
16. **チンピラ (enemy_bandit_thug / Lv2)**: 街の裏路地や街道沿いにたむろするゴロツキ。金品を狙って襲いかかってくる。
17. **野盗の射手 (enemy_bandit_archer / Lv4)**: くすねた弓を扱う野盗。物陰から旅人を狙い、確実に弱らせる。
18. **野盗の用心棒 (enemy_bandit_guard / Lv6)**: 金で雇われた腕利きの荒くれ者。返り血を浴びた大剣を軽々と振るう。
19. **盗賊団の頭領 (enemy_bandit_boss / Boss Lv12)**: 荒くれ者たちを束ねる冷酷なリーダー。実力は本物で、一切の容赦がない。
20. **狂信者 (enemy_cultist / Lv5)**: 邪神を崇拝する狂気の信徒。己の命を顧みず、ただ教義のために戦う。
21. **邪教の司祭 (enemy_cult_priest / Lv9)**: 闇の儀式を取り仕切る妖しき司祭。おぞましい魔法で精神と肉体を蝕む。
22. **教団の執行者 (enemy_cult_exec / Lv14)**: 異端者を狩る教団の暗殺兵。重装甲と恐れを知らぬ猛攻で対象を排除する。
23. **サキュバス (enemy_succubus / Lv12)**: 悪魔の血を引く妖艶な魔物。甘い言葉と妖しい歌声で冒険者の精気を侵食し、魂を喰らう。
24. **見習い暗殺者 (enemy_assassin_trainee / Lv8)**: 闇ギルドで訓練中の若い刺客。未熟とはいえ、その刃には致死の毒が塗られている。
25. **凄腕の刺客 (enemy_assassin_master / Lv15)**: 数多の要人を沈めてきた熟練の暗殺者。気配を絶ち、致命の一撃を放つ。
26. **影の頭目 (enemy_assassin_boss / Boss Lv22)**: 暗殺ギルドを統べる謎の人物。姿を捉えることすら困難な、闇夜の死神。
27. **飢えた市民 (enemy_mob / Lv2 / quest_only)**: 飢饉や重税に耐えかね、棒切れや鎌を手に暴動を起こした哀れな民衆。戦闘力は低いが、集団の怒りは侮れない。
28. **巨大ネズミ (enemy_giant_rat / Lv2)**: 地下水路や廃墟に棲みつき、犬ほどに育った害獣。鋭い前歯で食いつき、毒を撒き散らす不衛生な厄介者。
29. **ネズミの女王 (enemy_giant_rat_alpha / Lv5 / quest_only)**: 巨大ネズミの群れを統べる雌の大個体。異常に発達した牙と、腹に無数の子を抱えた不気味な姿。巣に近づく者を執拗に攻撃する。

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

#### ⑤ 後半シナリオ・特殊エネミー（9種）
後半のメインシナリオや特殊クエストで立ちはだかる強敵たち。
51. **不死の傭兵王 (enemy_boss_mercenary_king / Boss Lv25)**: 幾多の戦場を生き延びた伝説の傭兵が、死を拒む執念で蘇った姿。
52. **遺跡の守護者 (enemy_boss_ruin_guardian / Boss Lv35)**: 忘れ去られた古代文明が遺した防衛システム。黄金と石が混ざり合った無機質な巨像。
53. **天門の番人 (enemy_boss_gate_keeper / Boss Lv45)**: 天界への扉を守る巨大な番人。顔が複数ある異形の巨像。
54. **天使兵 (enemy_angel_soldier / Lv40)**: 神の軍勢の兵士。顔のない仮面と白い羽を持ち、感情を持たずに槍を振るう。
55. **大天使 (enemy_boss_archangel / Boss Lv48)**: 天使兵を率いる指揮官格。神々しいオーラを放ち、絶対的な法を執行する。
56. **システムの守護者 (enemy_boss_system_guard / Boss Lv55)**: 世界の理（システム）を守護するために生み出された存在。幾何学的な光の集合体。
57. **神竜 (enemy_boss_god_dragon / Boss Lv58)**: 全ての竜の祖とも言える神々しいドラゴン。純白の鱗に包まれ、星の光を吐き出す。
58. **白磁の使徒 (enemy_apostle_soldier / Lv15)**: 天界から降臨した神の尖兵。白磁のように滑らかな装甲と、感情を介さない仮面。
59. **熾天使 (enemy_seraphim / Lv17)**: 炎を掲げる上位の天使。六枚の翼を燃やしながら、異端者を容赦なく焼き尽くす。

#### ⑥ スポットシナリオ専用ボス（18種）— 6101-6104
各国家の最高難度スポットクエスト専用。`spawn_type: quest_only`。推奨Lv20（Hard）クエスト内で連戦する設計。

**聖王国ローラン（6101）— 6体:**
51. **墓所の守護者 (enemy_spot_protos / Lv18)**: 真の英雄墓所を守護するために造られた古代の自動兵器。中ボス。
52. **聖女エルーカ (enemy_spot_eluka / Lv20)**: 「慈愛の聖女」。病の身代わりとして幽閉され、怨念で蘇った。
53. **賢者バラム (enemy_spot_baram / Lv20)**: 「知恵の賢者」。禁術の知識を独占され処刑された大魔術師。
54. **盾のシラス (enemy_spot_shirasu / Lv20)**: 「盾の守護者」。王の身代わりに毒杯を仰いだ忠義の騎士。高DEF型。
55. **射手リラ (enemy_spot_lyra / Lv20)**: 「千里の射手」。口封じで暗殺された弓の名手。高ATK型。
56. **不滅の王アルヴィン (enemy_spot_alvin / Boss Lv25)**: 建国の父。最強の英霊。6101最終ボス。

**夜刀神国（6102）— 4体:**
57. **大鰐 (enemy_spot_wani / Lv20)**: 冥の門の第一の番人。「水底の覇者」。高HP型。
58. **以津真天 (enemy_spot_tori / Lv20)**: 冥の門の第二の番人。死の前兆を告げる凶鳥。毒付与型。
59. **朧車 (enemy_spot_kuruma / Lv22)**: 冥の門の第三の番人。炎を纏う怨念の牛車。炎上付与型。
60. **酒呑童子 (enemy_spot_shuten / Boss Lv25)**: 最強の番人。鬼に堕ちた伝説の武人。6102最終ボス。

**華龍神朝（6103）— 5体:**
61. **青龍 (enemy_spot_seiryu / Lv22)**: 東の守護神。雷属性。スタン付与型。
62. **白虎 (enemy_spot_byakko / Lv22)**: 西の守護神。氷属性。DEF DOWN付与型。
63. **朱雀 (enemy_spot_suzaku / Lv22)**: 南の守護神。炎属性。炎上付与型。
64. **玄武 (enemy_spot_genbu / Lv22)**: 北の守護神。毒属性。高DEF・毒付与型。
65. **神 (enemy_spot_kami / Boss Lv28)**: 四神を作った超越存在。6103最終ボス。全属性攻撃。

**砂塵の王国マルカンド（6104）— 3体:**
66. **光の衛兵 (enemy_spot_light_guard / Lv18)**: 王墓の光の自動兵器。雑魚。
67. **砂のゴーレム (enemy_spot_sand_golem / Lv20)**: 砂が意思を持った守護者。再生能力持ち。
68. **無名王の影 (enemy_spot_nameless_king / Boss Lv25)**: 歴史から消された暴君。6104最終ボス。呪い付与型。

> [!NOTE]
> **ボスエネミーの画像（スプライト）に関する暫定仕様**
> 本作には上記51種の通常エネミー画像（`slug` に完全一致するpngファイル）が実装されています。
> クエスト専用ボス（`boss_` / `enemy_boss_*` / `enemy_spot_*` のslugを持つもの等）の画像は現在未実装であり、バトル時には画像が表示されない（フォールバック表示となる）仕様です。これらは将来的なアセット追加にて対応予定です。
> ボスエネミー全23種のフレーバーテキスト・Visual Motif は `enemy_flavor_specification.md` §⑤ に、スポット専用18種は §⑤-E に定義済みです。

---

### 1-3. 投入用CSVフォーマットとサンプル

**`data/enemies.csv` (抜粋 — v2.9.4a ATK修正後)**
```csv
id,slug,name,level,hp,atk,def,exp,gold,drop_item_id,spawn_type
1001,enemy_slime_blue,ブルースライム,1,20,10,1,3,10,,random
1034,enemy_lich,リッチ,20,300,78,10,200,500,,random
1104,enemy_bandit_boss,盗賊団の頭領,12,200,60,8,80,200,,quest_only
6001,boss_skeleton_king,骸骨狂王,15,500,55,10,150,500,,quest_only
6023,boss_desert_dragon,デザートドラゴン,32,1500,100,25,600,2000,,quest_only
1322,enemy_bounty_legend,伝説の傭兵,90,900,160,30,600,0,,bounty
1150,enemy_giant_rat_alpha,ネズミの女王,5,180,14,3,15,30,,quest_only
```

**`data/enemy_actions.csv` (抜粋 — v2.9.4a パターン改修後)**
*JSONBを構築するための関連テーブルCSV*
```csv
id,enemy_slug,skill_slug,prob,condition_type,condition_value
1,enemy_slime_blue,skill_tackle,100,,
37,enemy_lich,skill_dark_flare,50,,
38,enemy_lich,skill_soul_drain,10,turn_mod,3
1001,boss_skeleton_king,skill_heavy_blow,50,,
1003,boss_skeleton_king,skill_enrage,100,hp_under,50
1004,boss_skeleton_king,skill_boss_nuke,100,turn_mod,5
```

**`data/enemy_skills.csv` (抜粋 — v2.9.4a 倍率修正+新スキル後 / 計43種)**
```csv
id,slug,name,effect_type,value,description
2001,skill_tackle,体当たり,damage,1,敵に物理ダメージを与える
2002,skill_heavy_blow,強打,damage,2,敵に強力な物理ダメージを与える
2004,skill_fireball,火の玉,damage,1.5,敵に炎のダメージを与える
502,skill_boss_nuke,終焉の息吹,damage,6,防御を貫通しうる強烈な全体ダメージ
2033,skill_enrage,激昂,damage,2.5,HP50%以下で暴走する高威力攻撃
2040,skill_berserk_rage,狂暴化,damage,4,HP25%以下で発狂する超高威力攻撃
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
