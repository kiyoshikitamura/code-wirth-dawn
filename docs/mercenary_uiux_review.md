# UI/UX レビューレポート ＆ 追加実装提案

本レポートは、Logic-Expertが構成した「初期傭兵50体仕様書」に対するUIUX-Expert視点からの検証と、ダークファンタジー世界観に合致させるための追加実装の提案です。

---

## 1. UI表示の妥当性レビュー

✅ **名前の文字数制限とレイアウト (検証: OK)**
- `TavernModal` やバトル時のメンバーUI（`BattleView`下部など）において、モバイル（390x844）基準での文字溢れを防ぐため、**「名前は12文字以内」** というLogic-Expertの指針は非常に妥当です。
- クラス名（`job_class`）もカード上に重なって表示されるため、10文字程度に収めるのがベストプラクティスです。サンプルの「不死の傭兵王 ヴォルグ」などは範囲内に綺麗に収まります。

✅ **フレーバーテキストの表示 (検証: OK)**
- 酒場UIで傭兵をタップした際の詳細パネルにおいて、**「テキスト60文字以内」** の制限は、`line-clamp-3` などのTailwindクラスで安全に収まる分量です。文字サイズ `text-xs`〜`text-sm` と組み合わせることで、スクロール不要で読み切れる最適なUXとなります。

✅ **世界観・カラー指定の整合性 (検証: OK)**
- サンプルとして提示されたビジュアル指定のテーマカラー（白銀、赤、暗金など）は、ベース画面である `bg-slate-950` やアクセントの `text-amber-500` と強い親和性を持ちます。特に暗金や漆黒の指定は、本作の重厚な雰囲気を引き立てる素晴らしい指定です。

---

## 2. 追加実装の提案（必須要件に対するソリューション）

### ① 英雄クラス（Lv20〜30）の特別演出実装案
酒場に並んだカードリストの中で、高額かつ強力なフリーランスや英雄が一目でわかるよう、**以下のTailwindユーティリティを用いたUI特別枠の実装を提案します。**

**【コンポーネント実装案のハイライト】**
```tsx
// TavernModal.tsx または MercenaryCard.tsx のレンダリング部
const isHeroic = mercenary.level >= 20;

<div className={`
    relative overflow-hidden rounded-lg transition-all duration-300
    ${isHeroic 
        ? 'ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] bg-gradient-to-b from-slate-900 to-amber-950/30' 
        : 'border border-slate-700 bg-slate-800 hover:border-slate-500'
    }
`}>
    
    {/* 英雄用バッジ */}
    {isHeroic && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-600 to-yellow-400 text-[10px] font-bold text-slate-950 px-2 py-0.5 rounded-bl-lg z-10 shadow-md flex items-center gap-1">
            <Sparkles size={10} /> HERO
        </div>
    )}

    {/* 微細なパーティクルエフェクト（背景アニメーション） */}
    {isHeroic && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-30">
            <div className="w-full h-[200%] bg-[url('/textures/dust-particles.png')] animate-[slide_10s_linear_infinite] opacity-50"></div>
        </div>
    )}
    
    {/* Avatar & Info */}
    {/* ... */}
</div>
```
- **効果**: 通常のSlate枠に対して、強烈なAmber（金）のリングとシャドウ、専用バッジが付き、プレイヤーの目を即座に惹きつけます。「これを雇うためにゴールドを貯めよう」という強いモチベーションを生み出します。

### ② フリーランスの出現ロジック（API拡張案）
現在、酒場に並ぶ傭兵は `GET /api/party/list` において `location_id`（現在の滞在拠点）に紐づくデータを出力する想定ですが、「フリーランス（中立拠点の英雄）」が各首都をランダムに放浪する仕様を実現するには、以下の**API拡張**が必要です。

**【提案するAPIロジック拡張】**
1. **ランダムシード（乱数生成）の導入**:
   毎日（または数時間おきに）フリーランスが出現する拠点が変更されるよう、現実の日付（`Date.now() / 86400000`）をシードとした乱数で、フリーランス配列をモジュロ計算し、現在の `location_id` と一致したキャラのみをレスポンスに含める。
2. **フリーランステーブルのフラグ化**:
   マスターデータの段階で `faction = 'Neutral'` かつ `is_freelance = true` のフラグを持たせます。
   `GET /api/party/list` 側で以下のような処理を挟みます：
   ```typescript
   // 擬似コード
   const seed = Math.floor(Date.now() / 86400000); // 1日ごとに変化
   const allFreelances = await getAllFreelanceMercenaries();
   const todayFreelance = allFreelances[seed % allFreelances.length]; 
   
   // もし本日のフリーランスの割当ロケーションが現在の currentLocationId と一致する、
   // または「全ての首都に低確率で出現する」ならレスポンス配列に unshift() で追加
   ```
3. **UI連携のメリット検証**:
   この機能により、プレイヤーは**「昨日はアーカディアにいた不死の傭兵王が、今日はイスハークにいるかもしれない」**といった情報を噂話（Rumors API）などで得て、通行許可証が必要な国境を越えるための強烈な動機を得ることができ、世界観がよりダイナミックになります。
