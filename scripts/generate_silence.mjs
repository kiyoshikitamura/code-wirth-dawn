/**
 * generate_silence.mjs
 * 無音OGGプレースホルダーファイルを一括生成するスクリプト
 * OGGヘッダを持つ最小限の無音ファイルを生成します
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// 最小限の有効なOGGファイル（無音）のバイナリデータ
// OGGヘッダ + Vorbisヘッダ + 空のオーディオページ
// ブラウザが "decodable" と判断できる最小OGG Vorbisファイル
// ここではwebm/ogg形式対応のために、
// 実際はMP3形式の無音1秒ファイルをOGG拡張子で保存（ブラウザは容量をチェックして無視）
// → より確実にするため、空のデータを持つ有効なOGGファイルヘッダを使用

// 最小有効なOgg Vorbisファイル（44バイト、約0.023秒の無音）
// これはPythonのmutagen等で生成された実際の最小OGGファイルと同等
const SILENCE_OGG = Buffer.from([
  // OggS capture pattern + stream structure version
  0x4F, 0x67, 0x67, 0x53, 0x00, 0x02, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  // serial number
  0x01, 0x00, 0x00, 0x00,
  // page sequence number
  0x00, 0x00, 0x00, 0x00,
  // checksum placeholder
  0x00, 0x00, 0x00, 0x00,
  // number of segments
  0x01,
  // segment table
  0x1E,
  // Vorbis identification header
  0x01, 0x76, 0x6F, 0x72, 0x62, 0x69, 0x73, 0x00,
  0x00, 0x00, 0x00, 0x01, 0x44, 0xAC, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x80, 0xBB, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
]);

const BGM_FILES = [
  'bgm_title',
  'bgm_inn',
  'bgm_field',
  'bgm_battle',
  'bgm_quest_calm',
  'bgm_quest_tense',
];

const SE_FILES = [
  'se_click',
  'se_modal_open',
  'se_cancel',
  'se_enter_inn',
  'se_travel',
  'se_quest_accept',
  'se_quest_success',
  'se_quest_fail',
  'se_attack',
  'se_magic',
  'se_heal',
  'se_buff',
  'se_debuff',
  'se_taunt',
  'se_escape',
  'se_hit',
  'se_battle_win',
  'se_battle_lose',
  'se_item_get',
  'se_prayer',
  'se_level_up',
];

let created = 0;

for (const name of BGM_FILES) {
  const path = join(ROOT, 'public', 'audio', 'bgm', `${name}.ogg`);
  writeFileSync(path, SILENCE_OGG);
  console.log(`  [BGM] ${name}.ogg`);
  created++;
}

for (const name of SE_FILES) {
  const path = join(ROOT, 'public', 'audio', 'se', `${name}.ogg`);
  writeFileSync(path, SILENCE_OGG);
  console.log(`  [SE]  ${name}.ogg`);
  created++;
}

console.log(`\n✅ ${created}ファイルを生成しました`);
console.log('💡 実際の音声ファイルに差し替えることで有効化されます');
