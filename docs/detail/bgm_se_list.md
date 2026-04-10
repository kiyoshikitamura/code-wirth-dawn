# BGM / SE リスト — Wirth Dawn

**対象ファイル**: `src/lib/soundManager.ts`  
**音声ファイル格納先**: `public/audio/bgm/` および `public/audio/se/`  
**フォーマット**: OGG Vorbis（`.ogg`）

---

## BGM 一覧

BGMは HTMLAudioElement でループ再生され、シーン切り替え時にフェードアウト/フェードイン（約800ms）を行う。

| キー | ファイル名 | 使用画面・条件 |
|---|---|---|
| `bgm_title` | `bgm_title.ogg` | タイトル画面 |
| `bgm_field` | `bgm_field.ogg` | ワールドマップ（常時） |
| `bgm_battle` | `bgm_battle.ogg` | バトル画面（全バトル共通） |
| `bgm_quest_calm` | `bgm_quest_calm.ogg` | クエスト画面（穏やかシーン） |
| `bgm_quest_tense` | `bgm_quest_tense.ogg` | クエスト画面（緊張シーン） |

### 拠点 BGM

拠点では `controlling_nation`（支配国）と `prosperity_level`（繁栄度）に応じて動的切り替えを行う。  
判定ロジック: `src/lib/getBgmKey.ts`

| キー | ファイル名 | 再生条件 |
|---|---|---|
| `bgm_inn` | `bgm_inn.ogg` | 拠点デフォルト（支配国なし／「名もなき旅人の拠所」など） |
| `bgm_roland` | `bgm_roland.ogg` | 支配国 = `roland`、かつ繁栄度 ≥ 2 |
| `bgm_markand` | `bgm_markand.ogg` | 支配国 = `markand`、かつ繁栄度 ≥ 2 |
| `bgm_yato` | `bgm_yato.ogg` | 支配国 = `yato`、かつ繁栄度 ≥ 2 |
| `bgm_karyu` | `bgm_karyu.ogg` | 支配国 = `karyu`、かつ繁栄度 ≥ 2 |
| `bgm_collapse` | `bgm_collapse.ogg` | **繁栄度 = 1（崩壊）時に国家BGMより優先して再生** |

> **優先順位**: 崩壊BGM > 国家BGM > デフォルトBGM（`bgm_inn`）

---

## SE 一覧

SEは Web Audio API（バッファキャッシュ方式）で多重再生対応している。

### UI 操作系

| キー | ファイル名 | 再生タイミング |
|---|---|---|
| `se_click` | `se_click.ogg` | UI汎用ボタンクリック |
| `se_modal_open` | `se_modal_open.ogg` | モーダルを開く |
| `se_cancel` | `se_cancel.ogg` | キャンセル操作 |

### ワールドマップ系

| キー | ファイル名 | 再生タイミング | ステータス |
|---|---|---|---|
| `se_travel` | `se_travel.ogg` | 拠点（Inn）からワールドマップへ遷移する際（人間の足音） | ✅ 準備済み |
| `se_enter_location` | `se_enter_location.ogg` | ワールドマップから拠点（Inn）へ入る際（人間の足音） | ⏳ **未準備** |
| `se_travel_horse` | `se_travel_horse.ogg` | 拠点間を移動する際の旅路演出（馬・馬車の足音） | ⏳ **未準備** |
| `se_encounter` | `se_encounter.ogg` | 移動中に敵エンカウント発生時（警告・遭遇音） | ⏳ **未準備** |

### 拠点施設 入場系

| キー | ファイル名 | 再生タイミング |
|---|---|---|
| `se_enter_inn` | `se_enter_inn.ogg` | 宿屋/酒場に入る（NPCダイアログ開幕時） |
| `se_enter_guild` | `se_enter_guild.ogg` | ギルドに入る（NPCダイアログ開幕時） |
| `se_enter_shop` | `se_enter_shop.ogg` | 道具屋に入る（NPCダイアログ開幕時） |
| `se_enter_temple` | `se_enter_temple.ogg` | 神殿に入る（NPCダイアログ開幕時） |

### クエスト系

| キー | ファイル名 | 再生タイミング |
|---|---|---|
| `se_quest_accept` | `se_quest_accept.ogg` | クエスト受注時 |
| `se_quest_success` | `se_quest_success.ogg` | クエスト成功（完了画面） |
| `se_quest_fail` | `se_quest_fail.ogg` | クエスト失敗時 |

### バトル系

カードの `animation_type` フィールドと `CARD_EFFECT_SE_MAP`（`soundManager.ts`）で自動マッピングされる。

| キー | ファイル名 | 再生タイミング / カード効果タイプ |
|---|---|---|
| `se_attack` | `se_attack.ogg` | 通常攻撃カード使用時（`attack`） |
| `se_magic` | `se_magic.ogg` | AoEスキル・魔法カード使用時（`aoe_attack`） |
| `se_heal` | `se_heal.ogg` | 回復カード使用時（`heal`） |
| `se_buff` | `se_buff.ogg` | バフカード使用時（`buff_self` / `buff_party` / `support_activate`） |
| `se_debuff` | `se_debuff.ogg` | デバフカード使用時（`debuff_enemy`） |
| `se_taunt` | `se_taunt.ogg` | 挑発カード使用時（`taunt`） |
| `se_escape` | `se_escape.ogg` | 逃走カード / 撤退コマンド使用時（`escape`） |
| `se_hit` | `se_hit.ogg` | プレイヤー被弾時 |
| `se_battle_win` | `se_battle_win.ogg` | バトル勝利時 |
| `se_battle_lose` | `se_battle_lose.ogg` | バトル敗北時 |

### その他

| キー | ファイル名 | 再生タイミング |
|---|---|---|
| `se_item_get` | `se_item_get.ogg` | アイテム・報酬入手時 |
| `se_prayer` | `se_prayer.ogg` | 礼拝堂で祈祷実行時 |
| `se_level_up` | `se_level_up.ogg` | キャラクターレベルアップ時 |

---

## ファイル準備状況まとめ

| ステータス | 件数 | 内容 |
|---|---|---|
| ✅ 準備済み（実装済み） | 25 | 上記テーブルで ✅ 記載なしのもの全て |
| ⏳ **未準備（要手配）** | **3** | `se_enter_location.ogg` / `se_travel_horse.ogg` / `se_encounter.ogg` |

### ⏳ 未準備ファイル チェックリスト

- [ ] `public/audio/se/se_enter_location.ogg` — 人間の足音（拠点到着時）
- [ ] `public/audio/se/se_travel_horse.ogg` — 馬・馬車の移動音（拠点間旅路）
- [ ] `public/audio/se/se_encounter.ogg` — エンカウント発生音（警告・遭遇音）

> **NOTE**: 未準備ファイルは `console.warn` で静かに失敗するため、ゲームの動作には影響しない。準備ができ次第、上記パスにファイルを配置すれば即座に反映される。

---

## 実装参照先

| ファイル | 役割 |
|---|---|
| `src/lib/soundManager.ts` | BGM/SEの登録・再生エンジン（シングルトン） |
| `src/lib/getBgmKey.ts` | 拠点状態（支配国・繁栄度）からBGMキーを決定するユーティリティ |
| `src/hooks/useBgm.ts` | ReactコンポーネントからBGMを制御するカスタムフック |
| `src/app/inn/page.tsx` | 拠点BGM動的切り替え・施設入場SE・マップ遷移SE |
| `src/app/world-map/page.tsx` | ワールドマップBGM・拠点入場SE・馬移動SE・エンカウントSE |
| `src/components/battle/BattleView.tsx` | バトルSE（カードエフェクト連動） |
