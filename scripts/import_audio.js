const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Setup ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

const RAW_BASE_DIR = path.join(__dirname, '../_raw_audio');
const PUBLIC_BASE_DIR = path.join(__dirname, '../public/audio');

const audioTypes = ['bgm', 'se'];

async function importAudioFiles() {
  console.log('Starting audio import and conversion process...\n');

  for (const type of audioTypes) {
    const rawDir = path.join(RAW_BASE_DIR, type);
    const pubDir = path.join(PUBLIC_BASE_DIR, type);

    if (!fs.existsSync(rawDir)) {
      console.warn(`Directory not found: ${rawDir}, skipping...`);
      continue;
    }
    if (!fs.existsSync(pubDir)) {
      fs.mkdirSync(pubDir, { recursive: true });
    }

    const files = fs.readdirSync(rawDir).filter(f => {
      const ext = path.extname(f).toLowerCase();
      // Support common audio formats
      return ['.mp3', '.wav', '.m4a', '.aac', '.ogg'].includes(ext);
    });

    if (files.length === 0) {
      console.log(`No raw audio files found in ${type} directory.`);
      continue;
    }

    console.log(`Found ${files.length} files in ${type} directory.`);

    for (const file of files) {
      const inputPath = path.join(rawDir, file);
      // Force the output to have exactly .ogg extension
      const baseName = path.basename(file, path.extname(file));
      const outputPath = path.join(pubDir, `${baseName}.ogg`);

      console.log(`- Converting [${file}] -> [${baseName}.ogg] ...`);

      try {
        await new Promise((resolve, reject) => {
          let cmd = ffmpeg(inputPath)
            .toFormat('ogg')
            .audioCodec('libvorbis')
            // Add a default audio quality setting (4 is standard)
            .addOption('-q:a', '4');

          // AIがSEを30秒などの曲にしてしまうのを防ぐため、SEは強制的に冒頭5秒でカット（4秒目からフェードアウト）
          if (type === 'se') {
            cmd = cmd.duration(5.0).audioFilters('afade=t=out:st=4:d=1');
          }

          cmd.on('end', () => {
              console.log(`    ✅ Success: ${baseName}.ogg`);
              resolve();
            })
            .on('error', (err) => {
              console.error(`    ❌ Error converting ${file}:`, err.message);
              reject(err);
            })
            .save(outputPath);
        });
      } catch (err) {
        // Error logged in promise
      }
    }
  }

  console.log('\nAll conversion processes are completed!');
}

importAudioFiles();
