# Wirth-Dawn Item Master Specification (v16.5) & Security/UX Audit

本ドキュメントは、「Code: Wirth-Dawn」の経済システムおよびゲーム体験の基盤となるアイテムマスタ（itemsテーブル）全60種の定義、およびそれに伴うセキュリティ監査検証とUI/UX追加実装提案を統合したものです。

---

## 🟢 STEP 1: データ構造と25種リストの作成 (Logic-Expert)

### 1-1. アイテムマスタ (items) カラム定義

アイテムマスタはCSVインポート可能な形式とし、以下のカラムを持ちます。

*   `slug` (string): 一意な識別子（例: `item_potion`）
*   `name` (string): アイテムの日本語名
*   `type` (enum): `consumable`（消費）, `trade_good`（交易品）, `key_item`（貴重品）
*   `base_price` (integer): 基本価格
*   `nation_tags` (array): `['loc_all']` または `['loc_roland']` などの入手制限タグ
*   `min_prosperity` (integer): ショップに並ぶ最低繁栄度（通常は `2` や `3`、闇市は `1` にフィルタされるか `is_black_market=true` で制御）
*   `is_black_market` (boolean): 繁栄度1の崩壊拠点（闇市）限定かどうか
*   `effect_data` (JSONB): バトルやフィールドでの効果。必ず `use_timing` キーを含む。
    - `use_timing`: `'battle'` / `'field'` / `'passive'`
    - HP回復: `heal` (固定値), `heal_hp` (固定値alias), `heal_pct` (割合 0.0〜1.0), `heal_full` (全回復)
    - バフ/デバフ: `effect_id` (効果ID), `effect_duration` (持続ターン), `target` (`'enemy'` or 省略=自身)
    - 状態異常解除: `remove_effect` (解除する効果ID)
    - 逃走: `escape: true`
    - フィールド専用: `heal_pct` (HP割合回復), `vit_restore` (Vit回復量 ※竜血のみ)
    - 攻撃アイテム: `damage` (単体固定ダメージ), `aoe_damage` (全体固定ダメージ)
    - 例: `{"use_timing": "battle", "heal": 150}` / `{"use_timing": "battle", "damage": 50}` / `{"use_timing": "battle", "aoe_damage": 80}`
*   `image_url` (string): アイコン画像URL (任意)
*   `description` (string): 説明文

### 1-2. 全57種アイテム設計・配分リスト（ボス素材・武具拡張含む）

#### ① 汎用消費アイテム（6種 / 各都市販売 / 安価）
0. `item_potion_s` (傷薬 S / consumable / 20G): effect_data: `{use_timing: 'battle', heal: 50}`. 小回復。最もポピュラーな傷薬の最小版。
1. `item_potion` (中和薬 / consumable / 50G): effect_data: `{use_timing: 'battle', heal: 150}`. 薬草の緑色が残る安価な回復液。泥水よりはマシな味がする。
2. `item_high_potion` (上級中和薬 / consumable / 250G): 澄んだ青色をした上質な霊薬。致命傷でなければ瞬時に塞ぐ。
3. `item_antidote` (解毒草 / consumable / 30G): 強烈な苦味を持つ薬草。噛み砕くことで血中の毒素を中和する。
4. `item_holy_water` (聖水 / consumable / 100G): 教会で清められた水。穢れや呪いを払い、精神を落ち着かせる。
5. `item_tent` (簡易テント / consumable / 300G): effect_data: `{use_timing: 'field', heal_pct: 0.5}`. 野営しながらHPを50%回復する。宿屋が利用できない（名声低下等）プレイヤーのフィールド唯一のHP回復手段。

#### ② 国家限定消費アイテム（8種 / 各国首都限定 / 中〜高価）
*   **聖帝国ローラン限定:**
    6. `item_roland_blessing` (大聖堂の祝福 / consumable / 1000G): 聖教の司祭が祈りを込めた護符。使用者の肉体を光で包み強化する。
    7. `item_roland_elixir` (天使の涙 / consumable / 3000G): 虹色に輝く奇跡のしずく。失われた魂を引き戻し、死の淵から蘇らせる。
*   **華龍神朝限定:**
    8. `item_karyu_tea` (龍井茶 / consumable / 800G): 霊山の茶葉を丁寧に焙煎した名茶。一口で枯渇した魔力が泉のように湧く。
    9. `item_karyu_charm` (護法符 / consumable / 1200G): 複雑な朱墨で描かれた道教の札。周囲の空気を歪め、敵の刃を滑らせる。
*   **夜刀神国限定:**
    10. `item_yato_poison` (毒塗りの粉 / consumable / 800G): 暗部が用いる痺れ薬。武器に擦り込むことで継続的な毒牙を付与する。
    11. `item_yato_smoke` (煙玉 / consumable / 600G): 地面に叩きつけると視界を奪うほどの濃煙を噴き出し、確実な逃走を担保する。
*   **砂塵王国マルカンド限定:**
    12. `item_oasis_water` (霊泉の水 / consumable / 1000G): 幻のオアシスで汲まれた水。失明を癒やし、傷口をゆっくりと塞ぎ続ける。
    13. `item_desert_spice` (熱砂の香辛料 / consumable / 900G): 嗅ぐだけで血が沸き立つ赤い粉。使用者は理性を失う代わりに圧倒的な暴力を得る。

#### ③ 交易品（5種 / ドロップ・報酬専用 / 使用不可・売却専用）
14. `item_trade_iron` (良質な鉄鉱石 / trade_good / 100G): 鈍く光る鉄の塊。どこでも需要があるため、手堅い資金源となる。
15. `item_trade_silk` (煌びやかな絹織物 / trade_good / 300G): なめらかな手触りの名産品。貴族たちがこぞって買い求める。
16. `item_trade_gem` (古代遺跡の宝石 / trade_good / 1000G): 遥か昔に滅びた文明の意匠が残る宝石。歴史的価値が非常に高い。
17. `item_trade_dragon` (飛竜の鱗 / trade_good / 5000G): 鋼以上の硬度を誇る竜の素材。最高の防具を作るための幻の逸品。
18. `item_trade_mithril` (ミスリル鋼 / trade_good / 10000G): 魔力を通す白銀の金属。その美しさと軽さから、天文学的な値で取引される。

#### ④ 特殊アイテム（4種 / 首都通行許可証 / 永続または365日 / 20,000G）
19. `item_pass_roland` (聖帝国通行許可証 / key_item / 20000G): 教皇の印璽が押された羊皮紙。重厚な門を抜ける権利を証明する。
20. `item_pass_karyu` (神朝通行許可証 / key_item / 20000G): 翡翠で象られた身分証。これを持たぬ者の入城は厳しく罰せられる。
21. `item_pass_yato` (夜刀秘密通行符 / key_item / 20000G): 血判と複雑な呪符が記された木札。怪しげな関所を無言で通るための鍵。
22. `item_pass_markand` (熱砂の隊商証 / key_item / 20000G): 金糸で刺繍された布証。王都の衛兵だけでなく、砂漠の盗賊からも一目を置かれる。

#### ⑤ 闇市専用アイテム（3種 / 崩壊拠点限定 / 極めて高価）
23. `item_black_market_elixir` (禁術の秘薬 / consumable / 50000G): どろりとした赤黒い液体。完全回復と引き換えに、何か大切なものを失う気がする。
24. `item_launder_scroll` (帳簿の改竄 / key_item / 100000G): 各国の手配書を白紙に戻す禁忌の契約。莫大な金と引き換えに、過去の悪名を闇に葬る。
25. `item_dark_matter` (謎の黒鉱石 / trade_good / 30000G): 触れると不快な脈動を感じる、出所不明の禍々しい石。特定の愛好家が常軌を逸した額で買い取るという。

#### ⑥ 第6カテゴリ：ボスドロップ素材・証明書 (非売品 / `material`, `key_item`等)
強敵ボスの討伐を果たした証明。インベントリに所持していることで特殊クエスト（スポットシナリオ）の出現トリガー等となる。
*   `item_relic_bone`, `item_desert_worm_meat`, `item_red_ogre_horn`, `item_thunder_fur`, `item_griffon_feather`: (拠点周辺クエスト等の中ボス素材)
*   `item_treant_core`, `item_demon_heart`, `item_angel_record`, `item_kirin_horn`, `item_omega_part`, `item_kraken_proof`: (特殊フラグ強敵ボスの素材・証明)
*   `item_dragon_blood` (竜血 / consumable / 8000G): ゲーム内 **唯一** のVitality回復手段（+3）。闇市経由でのみ入手可能。Vitalityの減少は原則不可逆であり、この超高額アイテムだけが例外。

#### ⑦ 第7カテゴリ：ボスドロップ限定武具 (非売品 / `equipment`)
ショップでは手に入らない非常に強力なステータス上昇補正を持つ武具。インベントリ内で装備指定するだけで純粋なステータス強化をもたらす。
*   `item_white_robe` (極白の法衣 / armor): 異端の大司教の遺品。強力な防御バフ。
*   `item_thief_blade` (義賊の刀 / weapon): 攻撃力15の大幅上昇。
*   `item_pirate_hat` (大海賊の帽子 / accessory): HP補正+20。
*   `item_mino_axe` (大斧 / weapon): 攻撃力20の極大上昇。

#### ⑧ 汎用クエスト報酬・素材（3種 / クエスト報酬・フィールド入手）
26. `item_bear_pelt` (獣の毛皮 / trade_good / 200G): 凶暴な大熊から剥いだ分厚い毛皮。防寒具や鎧の裏地として重宝され、革細工師が高値で買い取る。
27. `item_supply_box` (物資ボックス / trade_good / 1000G): 廃墟の金庫から回収した物資の包み。中身はギルドの管理下にあるはずだが、闇市ならそれなりの値がつく。
28. `item_healing_herb` (癒やし草 / consumable / 30G): 野原や森の外れに群生する薬草。傷口に当てれば止血程度の効果がある。大量に煎じれば薬にもなる。

> **※補足**: 実データ稼働に伴い追加された「基本消費アイテムのバリエーション（松明、解毒剤等）」や「上記ボス関連素材・武具」を含め、計60種のアクティブなアイテムを**すべて公式正史**として承認する。

> **v2.9.2 更新 (2026-04-17)**:
> - `item_tent` を Vit回復 → **HP50%回復**(フィールド専用) に再設計。Vit回復は竜血(`item_dragon_blood`)のみに限定。
> - `item/use/route.ts` にフィールドアイテムのサーバー側効果適用を実装 (`heal`, `heal_pct`, `heal_full`, `vit_restore`)。
> - 敵ドロップアイテム修正：欠落3件の新規アイテム追加、スキルドロップ5件を消耗品に変更。
> - 未実装バトルアイテム4種の効果実装:
>   - `item_whetstone`(砥石): ATK×1.5 バフ 3ターン (既存atk_upエンジン利用)
>   - `item_holy_water`(聖水): 単体50ダメージ (新規`damage`ハンドラ)
>   - `item_oil_pot`(火炎瓶): 単体30ダメージ + 炎上持続DoT 2T (damage + poison流用)
>   - `item_bomb_large`(大型爆弾): 全体80ダメージ (新規`aoe_damage`ハンドラ)
> - `battleSlice.ts` に `damage`(単体ダメージ) と `aoe_damage`(全体ダメージ) ハンドラを追加。
> - DB上のアイテム総数: 119件 → 123件（新規ドロップ4種追加）。

> **v2.9.3 更新 (2026-04-17) — 装備品バランス調整**:
> - 既存装備10件のステータス修正:
>   - `item_merchant_bag`(商人の鞄): HP+5→HP+15,ATK+2（旅リュックとの差別化）
>   - `item_lucky_coin`(幸運のコイン): ATK+2→ATK+4,HP+5
>   - `item_golden_dice`(黄金のサイコロ): ATK+3→ATK+5,DEF+2
>   - `gear_merchant_abacus`(商人のそろばん): ATK+3→ATK+7
>   - `gear_cursed_mask`(呪いの仮面): ATK+8→ATK+8,DEF-3（デメリット追加）
>   - `tool_lockpick`(盗賊の七つ道具): ステなし→DEF+1
>   - `item_tea_set`(茶器セット): DEF+2→DEF+3,HP+3
>   - `gear_dragon_spear`(青龍偃月刀): ATK+14→ATK+12（ナーフ）
>   - `gear_archmage_staff`(大賢者の杖): ATK+12→ATK+12,HP+10（バフ）
> - 新規武器5種: ショートソード(ATK+3), 鉄の剣(ATK+6), バスタードソード(ATK+9), シミター(ATK+6), 魔人の曲刃(ATK+11)
> - 新規防具12種: 革鎧(DEF+2), 鎖帷子(DEF+5), 板金鎧(DEF+8), 聖職者の祭服(DEF+5,HP+5), 聖騎士の全身鎧(DEF+14), 砂防の革甲(DEF+3,HP+5), 王宮の絹衣(DEF+7,HP+8), 忍装束(DEF+3), 鬼武者の鎧(DEF+13), 僧衣(DEF+3), 道着(DEF+6), 龍鱗の鎧(DEF+11)
> - 装備品総数: 37種 → **54種**。各国家の武器・防具を均等化（武器3種/防具3種ずつ）。
> - items.csv をDB同期済み（全140件）。

> **v2.9.3b 更新 (2026-04-17) — スキル vs アイテム価格バランス調整**:
> - ダメージ計算式 `FinalDmg = (UserATK + CardPower) × AtkMod - TargetDEF` に基づく装備/スキル/消耗品の価格整合性監査。
> - 砥石: 100G → **250G**（ATK UPスキルとの価格差緩和）
> - 奥義書:命削り: 8,000G → **5,000G**（Vitリスク考慮で減額）
> - 禁書:死体操作: 8,000G → **5,000G**（ニッチスキルの価格適正化）
> - 秘伝:点穴: 5,000G → **3,500G**（即死+麻痺+Vitコスト考慮）
> - 奥義:獅子吼: 3,000G → **2,500G**（同価格帯装備との調整）
> - 武器「鉄の剣」→ **「鍛鉄の剣」** に改名（教本:鉄の剣との名称衝突回避）

> **v2.9.3c 更新 (2026-04-17) — 酒場NPC出現ロジック修正**:
> - `gossip/route.ts` のタブ④「酒場」NPCリスト表示を改修。
> - 表示上限: **3件 → 5件** に拡大。
> - **Free NPC 1枠保証**: 国籍NPC 8-10体に埋もれて Free NPC が出現しにくかった問題を解消。Free候補からランダム1件を確定枠とし、残り4枠を国籍NPC+他候補からランダム選出。
> - **ゲストNPC対応**: `npc_guest_*` slugのNPCもフィルタ対象に追加（以前は国籍NPC+Freeのみ）。
> - フィルタ上限を 10件 → **15件** に拡大（候補プールの充実化）。

> **v2.9.3d 更新 (2026-04-17) — ショップ陳列ロジック改修**:
> - `shop/route.ts` のGET処理を改修。カテゴリ別枠数制限付きランダム陳列に変更。
> - **カテゴリ別枠数制限**: 全品一括表示 → カテゴリ別ランダム抽選。
>   - 武器: **3点**
>   - 防具: **3点**
>   - アクセサリ: **3点**
>   - 消耗品: **5点**
>   - スキル: **5点**
>   - 通行許可証(キーアイテム): **1点**
>   - 交易品: **2点**
>   - クエスト専売品: 枠制限対象外（常時表示）
>   - **合計最大22点**（旧: 無制限）
> - ソート順:「武器 → 防具 → アクセサリ → スキル → 通行許可証 → 消耗品 → 交易品」
> - 既存の国家フィルタ・繁栄度フィルタ・闇市フィルタはそのまま維持。初心者割引はv2.9.3pで廃止。

> **v2.9.3e 更新 (2026-04-18) — 酒場/ショップ表示バグ修正**:
> - **酒場 Free NPC不出現バグ修正**: `npcShadows` にslugを保持し、Free判定を直接slugベースに変更。旧実装は `allNpcMercs` 経由のID lookupで型不一致により常にFree候補が空配列になっていた。
> - **ショップ ボスドロップ除外**: `item_white_robe`, `item_thief_blade`, `item_pirate_hat`, `item_mino_axe` の4件をショップ販売対象から明示的に除外。これらは `min_prosperity=1, nation_tags=null` のため既存フィルタを全て通過していた。

> **v2.9.3f 更新 (2026-04-18) — 酒場/噂話システム統一**:
> - **データソース統一**: 噂話モーダルの酒場タブを `ShadowService.findShadowsAtLocation` に委譲。gossip独自ロジックを撤廃し、`/api/tavern/list` と同一データを返すように統一。
> - **sessionStorageキャッシュ**: 噂話→酒場の遷移で同じNPCリストを引き継ぐクライアント側キャッシュ。「見渡す」ボタンでキャッシュクリア＆再取得。
> - **英霊除外**: `findShadowsAtLocation` から英霊(shadow_heroic)を除外。英霊は酒場の「影の記録」タブ専用に。
> - **ゲストNPC除外**: `npc_guest_*`（ガウェイン、ヴォルグ、英霊）を酒場候補から除外。ゲストNPCはシナリオ専用。
> - **API認証統一**: tavern/list, tavern/hire, tavern/my-heroic を全て `supabaseServer`(service role) に移行。`createAuthClient` の使用を撤廃。
> - **噂話タブUI改善**: 酒場タブを `SequentialCards` + `TypewriterCardWithNext`（1件ずつ「もっと聞く」で進捗）に変更。

---

## 🔴 STEP 2: セキュリティ・経済防衛と脆弱性チェック (Security-Expert)

### 2-1. 密輸（ゴールド増殖）エクスプロイトの検証

**【想定される脅威】**
「通常プレイでは赤字または微黒字だが、特定ルート（例: プロスペリティ1の崩壊拠点＝闇市で売却価格1.5倍の適用等）を使用すると、アイテムの売買ループだけで無限にゴールドを稼げてしまう」という脅威。

**【数学的検証】**
*   前提1: ショップの売却単価は `Math.floor(base_price / 2)` が基本だが、将来的に「闇市では売却価格が `base_price * 1.5` になる」という仕様・特能が入った場合。
*   前提2: 通常都市（Prosperity=5）での買値は `base_price * 1.0`。
*   取引: 10,000G（ミスリル鋼等の高額交易品や高額アイテム）を買い、崩壊都市に移動して15,000Gで売る。
*   利益: 5,000G。
*   移動コスト（gold_cost）: 拠点移動には日数（`accumulated_days`）と数百G〜数千Gの出費、またはランダムエンカウントによるAP・HP消費（敗北リスク）が伴う。

**【監査結果・対策】**
**安全（制限つき）**: 利益が出る「交易（密輸）」自体は正規のゲームループとして容認可能ですが、これが「1クリックでノーリスク無限ループ」になることは防ぐ必要があります。
*   **対策:** 
    1. 拠点間移動には必ず「時間経過（Days）」または「AP/HPの消耗・ランダム戦闘」を伴わせる。
    2. インベントリの「アイテム所持上限（または重量制限）」を設ける（例えば交易品はスタック数上限を99個に縛る等）。
    3. ショップの「在庫（Stock）の概念」を導入するか、一日に買える上限をハードコードする。

### 2-2. APIおよびデータベース監査（レースコンディション対策）

**【想定される脅威】**
許可証購入や名声ロンダリングを行う際、ブラウザから連打したり、複数タブで同時にリクエスト（`POST /api/shop`）を送ることで、ゴールドの消費を1回分で済ませながら複数回分の処理を通してしまう「TOCTOU（Time of Check to Time of Use）」脆弱性。

**【現在の実装と脆弱性指摘】**
現在、`route.ts` 内で `profile.gold < finalPrice` をチェックし、直後に `supabaseService.rpc('increment_gold')` を実行しています。ただし、`user_profiles.pass_expires_at` のJSONB更新は別クエリで行われています。もしこの2つの間に別リクエストが重なると、JSONBのキーが上書き喪失（Lost Update）するか、所持金がマイナスに達する可能性があります（Postgresで制約がない限り）。

**【監査結果・対策】**
*   **対策1（データベース制約）:** `user_profiles.gold` カラムに対して `CHECK (gold >= 0)` の制約を強固に設ける。これにより、二重消費による引き出しはDBレベルでエラートランザクションとして弾かれます。
*   **対策2（RPCへのロジック統合）:** 許可証の購入（JSONBの特定キー更新とゴールド減算）や名声ロンダリング（全拠点Reputationのゼロ化とゴールド減算）は、サーバーレス環境（Edge Functions / Next.js API）での複数クエリ分離を避け、**PostgreSQLのストアド関数（RPC）内に単一トランザクションとして統合**する。例えば `buy_capital_pass(p_user_id, p_nation_slug, p_price, p_expiry_days)` のように設計すべきです。

---

## 🔵 STEP 3: UI/UX追加実装提案 (UIUX-Expert)

### 3-1. 通行許可証の期限通知UI

許可証の有効期限（標準365日想定）が切れる直前（残り30日以下）に、宿屋や拠点トップ画面で警告を出すUIの実装案です。

**【提案コンポーネント: ExpiringPassWarning】**
```tsx
import { AlertTriangle } from 'lucide-react';

// 残り三十日以下の許可証を抽出して警告するバナー
export function ExpiringPassWarning({ expiringPasses }: { expiringPasses: string[] }) {
    if (!expiringPasses || expiringPasses.length === 0) return null;
    
    return (
        <div className="mx-4 my-2 px-4 py-3 bg-orange-950/40 border border-orange-500/50 rounded-lg shadow-lg flex items-center justify-between animate-pulse-slow">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-900/50 rounded-full">
                    <AlertTriangle className="text-orange-400" size={20} />
                </div>
                <div>
                    <div className="text-orange-100 font-bold text-sm">通行許可証の期限が迫っています</div>
                    <div className="text-orange-400 text-xs mt-0.5">
                        {expiringPasses.join('、')} の許可証が残り30日未満です。
                    </div>
                </div>
            </div>
            <button className="text-xs bg-orange-900 hover:bg-orange-800 text-orange-200 px-3 py-1.5 rounded transition-colors whitespace-nowrap border border-orange-700">
                更新する
            </button>
        </div>
    );
}
```
*   **ポイント:** 赤（致命傷や敵意）と混同しないよう、オレンジ（警告・注意）を用いています。

### 3-2. 闇市（Black Market）の専用演出

すでに `ShopModal.tsx` では `prosperity === 1` 時に専用の泥臭い・怪しいUI（`bg-red-950/20` や泥のオーバーレイ）が実装されていますが、さらに没入感を高めるための追加案です。

**【追加・改善提案】**
1. **テキストのグリッチエフェクト**: 
    怪しさを強調するため、Tailwindに `animate-glitch` や `skew` を使った微細な文字ブレを追加。
2. **アンビエントサウンドの制御**:
    闇市のタブを開いた際、通常のショップBGM（または賑やかなSE）から、「心音」や「低音のドローン音（ゴーー…）」といった不穏なSEに切り替えるオーディオ管理（Audio Context）連携。
3. **ホバー時のレッドオーラ**:
    危ないアイテム（禁術の秘薬など）にマウスを乗せた際、`group-hover:drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]` を用いて、プレイヤーに「触れてはいけないもの」を操作している感覚を与える。

**【Tailwind拡張案 (tailwind.config.ts)】**
```typescript
theme: {
  extend: {
    animation: {
      'glitch-text': 'glitch 2s linear infinite',
      'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    // ...
  }
}
```
これらの演出を組み込むことで、世界観（ダークファンタジー）の厚みが一層増します。

---

## 🔄 バトルエンジンv3.0との整合性 (2026-04-11更新)

### スキルアイテムの `description` フィールドについて

スキルアイテム（`is_skill: true`）の `description` は、連携する `cards` テーブルの `description` カラムを参照して表示します。バトルエンジンv3.0の実装に合わせ、全60カードの説明文を更新しています。

**更新が必要なSQLファイル**: `update_card_descriptions.sql`

### 主なスキル効果の変更点

| スキル名 | 旧説明（v2.x） | 新説明（v3.0） |
|---|---|---|
| 防御 (`card_guard`) | 「防御力を一時上昇」 | 「2ターンの間、受けるダメージを**10**軽減」 |
| 聖壁 (`card_holy_wall`) | 「パーティを守る防御バフ」 | 「2ターンの間、受けるダメージを**20**軽減（全体）」 |
| 鉄布衫 (`card_iron_body`) | 「防御力を大幅上昇」 | 「3ターンの間、受けるダメージを**30**軽減」 |
| ツバメ返し (`card_swallow_rev`) | 「敵の攻撃を反射するカウンター」 | 「神速の一撃で**50**の大ダメージ**（高威力攻撃）**」 |
| 斬撃 (`card_slash`) | 「軽微な出血付与」 | 「出血（軽微）: カード使用ごとに**+1**ダメージ」 |
| 砂塵の目眩まし (`card_sandstorm`) | 「敵の視界を奪う」 | 「2ターンの間、敵全体の攻撃を**50%**でミスさせる」 |
| 龍の咆哮 (`card_dragon_roar`) | 「敵ATKダウン」 | 「2ターンの間、敵全体のATKを**30%**ダウン」 |
| 即死攻撃 (`card_death_strike`) | 「即死効果」 | 「**30%**の確率で即死。失敗時は通常攻撃」 |

### 変更履歴

| バージョン | 日付 | 主な変更内容 |
|---|---|---|
| v16.0 | 2026-03 | 初版：57種アイテム定義 |
| v16.1 | 2026-04 | ボス素材・武具拡張追加 |
| v16.2 | 2026-04-11 | バトルエンジンv3.0対応：スキル説明文更新・ツバメ返し仕様変更反映 |
| **v16.3** | **2026-04-13** | **effect_data key仕様を明確化（heal/heal_pct/heal_full/escape等）・item_potion_s heal:50 追加・バトルアイテムログ仕様追加** |
| **v16.4** | **2026-04-22** | **メインシナリオ限定装備4種追加（ID 501-504: ガウェインの小手/竜牙の剣/英霊の鎖帷子/蒼暁の剣）。ショップ除外リストに追加。装備品総数: 54種 → 58種** |
| **v16.5** | **2026-04-26** | **汎用クエスト報酬3種追加（ID 3001-3003: 獣の毛皮/物資ボックス/癒やし草）。アイテム総数: 57種 → 60種** |
