import fs from 'fs';
import path from 'path';

// 事前に以下のコマンドで必要なパッケージをインストールしてください：
// npm install @google/genai dotenv

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// ESモジュール環境での __dirname 代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.local を優先ロード（Next.js環境の標準）
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('[ERROR] .env ファイルに GEMINI_API_KEY が設定されていません。');
  process.exit(1);
}

// SDKの初期化
const ai = new GoogleGenAI({ apiKey: API_KEY });

// パス設定
const MD_PATH = path.resolve(__dirname, '../docs/detail/enemy_flavor_specification.md');
const OUT_DIR = path.resolve(__dirname, '../public/images/enemies');
const OVERWRITE_ALL = true; // true: 既存の画像を上書き生成する

// スリープ用ヘルパー関数
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * MD仕様書からエネミーの slug と motif を抽出する
 */
function parseEnemiesFromMarkdown() {
  const content = fs.readFileSync(MD_PATH, 'utf-8');
  const lines = content.split('\n');
  const enemies = [];

  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue;
    if (line.includes('キャラクタ名') || line.includes('---')) continue;

    const columns = line.split('|').map((col) => col.trim()).filter(Boolean);
    
    // バッククォートで囲まれた slug（enemy_xxx または boss_xxx）を探す
    const slugCol = columns.find(c => c.startsWith('`') && c.endsWith('`') && (c.includes('enemy_') || c.includes('boss_')));
    if (!slugCol) continue;

    const slug = slugCol.replace(/`/g, '');
    const motif = columns[columns.length - 1]; // Visual Motif は必ず最後のカラム

    enemies.push({ slug, motif });
  }

  return enemies;
}

/**
 * 1体の画像を生成する
 */
async function generateImage(slug, motif) {
  const outPath = path.join(OUT_DIR, `${slug}.png`);

  if (!OVERWRITE_ALL && fs.existsSync(outPath)) {
    console.log(`[SKIP] ${slug}.png は既に存在します。（スキップ）`);
    return true;
  }

  // 確定した王道JRPGテイストの調整版プロンプト
  const prompt = `A 2D classic JRPG anime style character portrait. Visual Motif: ${motif}. The character is drawn in a full-body pose. The background shows an environment perfectly suited for this creature to live in. There is absolutely no text or typography anywhere in the image. High-quality JRPG anime cell shading, classic royal high-fantasy aesthetic. Avoid excessively grimdark themes, keep a balanced and vibrant RPG look.`;

  console.log(`[GENERATE] 要求送信: ${slug}...`);
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1', // スクエア画像
      }
    });

    const base64Image = response.generatedImages[0].image.imageBytes;
    fs.writeFileSync(outPath, Buffer.from(base64Image, 'base64'));
    console.log(`[OK]   保存完了: ${slug}.png`);
    return true;

  } catch (err) {
    console.error(`[FAIL] 生成失敗: ${slug} -> ${err.message}`);
    return false;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('=== エネミー画像一括生成バッチ開始 ===');
  
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const enemies = parseEnemiesFromMarkdown();
  console.log(`仕様書から ${enemies.length} 体のエネミーを検出しました。`);

  let successCount = 0;

  for (let i = 0; i < enemies.length; i++) {
    const { slug, motif } = enemies[i];
    console.log(`\n[${i + 1}/${enemies.length}] ターゲット: ${slug}`);

    let isSuccess = false;
    let retries = 3;

    while (!isSuccess && retries > 0) {
      isSuccess = await generateImage(slug, motif);

      if (!isSuccess) {
        retries--;
        if (retries > 0) {
          console.log(`[RETRY] サーバー混雑またはエラー。15秒待機後リトライします (残りリトライ回数: ${retries})`);
          await sleep(15000); // エラー時はバックオフで15秒待機
        } else {
          console.error(`[GIVEUP] ${slug} の生成をスキップします。`);
        }
      }
    }

    if (isSuccess) {
      successCount++;
    }

    // レートリミット回避のため、正常時も定期的にスリープを挟む
    await sleep(4000); 
  }

  console.log(`\n=== バッチ処理完了 ===`);
  console.log(`成功: ${successCount} / ${enemies.length} 体`);
}

main().catch(console.error);
