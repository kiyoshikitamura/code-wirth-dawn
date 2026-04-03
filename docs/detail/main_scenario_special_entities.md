# メインシナリオ専用エネミー＆同行NPC 実装定義・監査レポート

## 🟢 STEP 1: 【Logic-Expert】専用エネミーと同行NPCのパラメータ設計

シナリオの劇的な展開を支えるため、通常のランダムエンカウントには出現しない「シナリオ専用」のユニットを定義します。

### 1-1. シナリオ専用エネミー (代表例)

乱入防止のため、必ず `spawn_type: 'quest_only'` を指定。
終盤ボスにおける「ダメージ1固定」の進行不能を避けるため、防御力（def）はプレイヤー想定到達レベルの適正値に留め、**HPを極端に高く設定（HPスポンジ化）**します。

| ID | slug | name | hp | atk | def | spawn_type | 行動パターン (action_pattern JSONB) |
|---|---|---|---|---|---|---|---|
| 2101 | `enemy_boss_ep5_squad` | 帝国精鋭部隊 | 500 | 45 | 10 | `quest_only` | `{"actions": [{"skill_id": 1001, "weight": 70}, {"skill_id": 2045, "turn_mod": 3, "weight": 100}]}`<br>※第5話用。3ターンごとに防御無視攻撃を放つ。 |
| 2102 | `enemy_boss_ep10_dragon` | 神代の守護竜 | 3500 | 80 | 18 | `quest_only` | `{"actions": [{"skill_id": 1030, "weight": 60}, {"skill_id": 2011, "hp_under": 50, "weight": 80}]}`<br>※第10話用。HP50%以下で強力な全体ブレス（スキル）を解禁。 |
| 2103 | `enemy_boss_ep20_god` | 主神 | 9999 | 150 | 25 | `quest_only` | `{"actions": [{"skill_id": 1099, "weight": 50}, {"skill_id": 2088, "turn_mod": 5, "weight": 100}, {"skill_id": 2099, "hp_under": 20, "weight": 100}]}`<br>※最終ボス。DEF25（軽減上限）留め。5ターンごとの大粛清攻撃と、瀕死時の発狂モード。 |

### 1-2. 同行NPC (特殊データ・代表例)

シナリオノードで一時的に加入するキャラ。行動の確実性を担保するため、持ち込むカード（`inject_card_ids`）には消耗品（consumable）を含めず、**強力な専用スキル（skill）のみ**で構成します。AIグレードは `smart` 固定とします。

| ID | slug | name | job | HP | DEF | inject_card_ids | 特徴・役割 |
|---|---|---|---|---|---|---|---|
| 4101 | `npc_guest_gawain` | 歴戦の小隊長ガウェイン | Knight | 400 | 25 | `2004\|2005` | 第1部（1〜5話）の同行者。高頻度で挑発（2005）と聖なる障壁（2004）を使用し、主人公を死守する壁役。 |
| 4102 | `npc_guest_volg` | 不死の傭兵王ヴォルグ | Mercenary | 800 | 15 | `1010\|1030\|2015` | 第13話等での同行者。連撃（1030）や防御無視（2015）など、プレイヤーを凌駕する超絶火力で場を制圧する。 |
| 4103 | `npc_guest_shadow` | 先代の英霊 | Adventurer | 600 | 20 | `1001\|2001\|2004` | 継承編（第16話〜）の同行者。攻防回復のバランスが良い万能サポーター。 |

---

## 🔴 STEP 2: 【Security-Expert】バトルロックと寿命システム破壊の監査

提示されたパラメータおよびシナリオ特有のアクションに対し、致命的な脆弱性の排除監査を実施しました。

### 2-1. 30ターン制限による強制敗北（詰み）の検証
**【監査要件】** 「30ターン経過で全ロスト判定」となるコア仕様に対し、ボスが「無限回復」や「高頻度スタン」を連発し、理論上絶対に30ターン以内に削りきれないソフトロックが発生しないか。
**【監査結果と対策】**
*   **回復の禁止と制限**: スポンジ化（HP9999など）したボス（主神など）には、割合回復（HP%回復）のスキル枠を**一切持たせない**よう `enemy_skills` 側でバリデーションを設けます。
*   **スタンの耐性タイマー**: ボスがプレイヤーをスタンさせるスキル（上記 `skill_id: 2088` 等）について、「連続でスタンを付与できない（スタン耐性1ターンの強制付与）」ロジックをBFF（バトルコントローラー）側に組み込むことで、一方的なハメ殺しによる30ターン・タイムオーバーを防ぎます。
*   **結論**: HPスポンジ化と適正DEF（25以下）の組み合わせにより、プレイヤーのDPSが確実に蓄積されるため、ロック状態（詰み）は回避されます。

### 2-2. `drain_vit` (寿命吸収) の厳格なキャップ確認
**【監査要件】** 敵の特定のスキル（主神の呪い等）が、プレイヤーの寿命（Vitality）を理不尽に削り、セーブデータを意図せず破壊しないか。
**【監査結果と対策】**
*   **1ターン1ダメージの絶対遵守**: `BattleState` 更新ロジックにおける `vitDamageTakenThisTurn` 変数をフックとし、いかなる多段攻撃やデバフ効果であろうと、「1ターン中に減少するVitalityは最大1まで」とするセーフティキャップの実装を確約します。
*   **上限付き発動**: ボスのAction Patternにおいて、`drain_vit` を伴うスキルは `turn_mod: 5` などのクールダウンを必須化。これにより、最長30ターン戦い抜いても、最大Vitality喪失は「6」に収まり、一戦でキャラクターが老衰死するリスクを排除します。
*   **結論**: セーブデータ（キャラクターロスト）の理不尽な破壊は防がれます。

---

## 🔵 STEP 3: 【UIUX-Expert】SPA環境での会話・バトル演出提案

モバイルSPA環境（390x844px基準）におけるシナリオの没入感と、ボス戦の脅威度を高めるUI演出を定義します。

### 3-1. 重要NPCの会話レイアウト（立ち絵演出）
シナリオの `flow_nodes` 内に `speaker_image_url` が存在する場合、テキストボックスの横にキャラクターアイコンを滑らかに表示させます。

**【Tailwind実装案】**
```tsx
{/* Dialog Box Container */}
<div className="flex items-start space-x-3 p-4 bg-black/80 border border-gray-700 rounded-lg shadow-2xl">
  
  {/* Speaker Image (Conditional Render) */}
  {node.params.speaker_image_url && (
    <div className="flex-shrink-0 animate-in fade-in zoom-in-95 duration-300">
      <img
        src={node.params.speaker_image_url}
        alt="Speaker"
        className="w-[120px] h-[120px] object-cover rounded-md border-2 border-slate-500 shadow-inner"
      />
    </div>
  )}

  {/* Text Content */}
  <div className="flex-1 text-slate-200 leading-relaxed font-serif text-sm md:text-base">
    {node.text_label}
  </div>
</div>
```

### 3-2. ボスエンカウント時の脅威表現
神代の守護竜や主神など、シナリオ専用の強力なボスとのバトル時のみ、UI全体に「赤黒いインナーシャドウ」と「ゆっくりとした明滅（Pulse）」効果を適用し、通常のバトルとは異なる絶望感・プレッシャーを演出します。

**【Tailwind実装案】**
API（またはシナリオの `params.is_boss_battle` フラグ等）からボス判定を受け取った場合、コンテナに以下のクラスを付与します。

```tsx
<div className={`
  w-full h-full min-h-screen relative flex flex-col 
  transition-colors duration-1000
  ${isBossBattle 
    ? 'bg-red-950/20 shadow-[inset_0_0_100px_rgba(153,27,27,0.5)] animate-pulse-slow' 
    : 'bg-slate-900'}
`}>
  {/* カスタムPulse定義 (tailwind.config.js に追加想定)
      animation: { 'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }
  */}
  
  {/* ... バトルUIコンポーネント ... */}
  {isBossBattle && (
    <div className="absolute top-0 w-full text-center py-1 bg-gradient-to-r from-transparent via-red-900/80 to-transparent">
      <span className="text-red-200 text-xs font-bold tracking-widest uppercase">WARNING: DIVINE THREAT TIER</span>
    </div>
  )}
</div>
```
これにより、画面の端部が常に赤黒く蠢き、プレイヤーの緊張感を視覚的に煽ります。
