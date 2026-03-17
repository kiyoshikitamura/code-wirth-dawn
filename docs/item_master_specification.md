# Wirth-Dawn Item Master Specification (v16.1) & Security/UX Audit

本ドキュメントは、「Code: Wirth-Dawn」の経済システムおよびゲーム体験の基盤となるアイテムマスタ（itemsテーブル）全25種の定義、およびそれに伴うセキュリティ監査検証とUI/UX追加実装提案を統合したものです。

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
*   `effect_data` (JSONB): バトルやフィールドでの効果（例: `{"heal_hp": 50}`, `{"buff": "atk_up"}`）
*   `image_url` (string): アイコン画像URL (任意)
*   `description` (string): 説明文

### 1-2. 25種アイテム設計・配分リスト

#### ① 汎用消費アイテム（5種 / 各都市販売 / 安価）
1. `item_potion` (中和薬 / consumable / 50G): 薬草の緑色が残る安価な回復液。泥水よりはマシな味がする。
2. `item_high_potion` (上級中和薬 / consumable / 250G): 澄んだ青色をした上質な霊薬。致命傷でなければ瞬時に塞ぐ。
3. `item_antidote` (解毒草 / consumable / 30G): 強烈な苦味を持つ薬草。噛み砕くことで血中の毒素を中和する。
4. `item_holy_water` (聖水 / consumable / 100G): 教会で清められた水。穢れや呪いを払い、精神を落ち着かせる。
5. `item_tent` (野営キット / consumable / 500G): 防水の布と簡素な調理器具のセット。厳しい路銀での休息を支える（フィールド専用）。

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
