const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const csvDir = path.join(__dirname, '..', 'src', 'data', 'csv');

function checkFileExists(relPath) {
  // Remove leading slash if any
  const cleanPath = relPath.startsWith('/') ? relPath.substring(1) : relPath;
  const fullPath = path.join(publicDir, cleanPath);
  return fs.existsSync(fullPath);
}

function scanCsvForAssets(filePath) {
  if (!fs.existsSync(filePath)) return { images: [], audio: [] };
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const images = [];
  const audio = [];

  // Match /images/... or /textures/... or anything ending in .png/.svg/.ogg
  const imageRegex = /(\/(images|textures)\/[a-zA-Z0-9_\-\/]+\.(png|svg|jpg|jpeg))/g;
  const oggRegex = /([a-zA-Z0-9_\-]+\.ogg)/g;

  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }

  while ((match = oggRegex.exec(content)) !== null) {
    audio.push(match[1]);
  }

  // Also match BGM/SE keys like bgm_roland, se_click, etc.
  const bgmSeRegex = /\b(bgm_[a-zA-Z0-9_]+|se_[a-zA-Z0-9_]+)\b/g;
  while ((match = bgmSeRegex.exec(content)) !== null) {
    const key = match[1];
    if (key.startsWith('bgm_')) {
      audio.push(`bgm/${key}.ogg`);
    } else if (key.startsWith('se_')) {
      audio.push(`se/${key}.ogg`);
    }
  }

  return { images, audio };
}

function scanScenarioDirectory(dirPath) {
  const images = [];
  const audio = [];
  
  if (!fs.existsSync(dirPath)) return { images, audio };

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile() && file.endsWith('.csv')) {
      const res = scanCsvForAssets(filePath);
      images.push(...res.images);
      audio.push(...res.audio);
    }
  }

  return { images, audio };
}

function main() {
  let allImages = new Set();
  let allAudio = new Set();

  // 1. Scan master CSV files
  const masterCsvs = [
    'cards.csv', 'enemies.csv', 'enemy_actions.csv', 'enemy_groups.csv',
    'enemy_skills.csv', 'items.csv', 'locations.csv', 'npcs.csv',
    'quests.csv', 'quests_normal.csv', 'quests_special.csv', 'skills.csv'
  ];

  masterCsvs.forEach(file => {
    const res = scanCsvForAssets(path.join(csvDir, file));
    res.images.forEach(img => allImages.add(img));
    res.audio.forEach(aud => allAudio.add(aud));
  });

  // 2. Scan scenarios
  const scenarioRes = scanScenarioDirectory(path.join(csvDir, 'scenarios'));
  scenarioRes.images.forEach(img => allImages.add(img));
  scenarioRes.audio.forEach(aud => allAudio.add(aud));

  // 3. Scan codebase for hardcoded sound references (specifically soundManager.ts)
  const soundManagerPath = path.join(__dirname, '..', 'src', 'lib', 'soundManager.ts');
  if (fs.existsSync(soundManagerPath)) {
    const content = fs.readFileSync(soundManagerPath, 'utf-8');
    const bgmSeRegex = /\b(bgm_[a-zA-Z0-9_]+|se_[a-zA-Z0-9_]+)\b/g;
    let match;
    while ((match = bgmSeRegex.exec(content)) !== null) {
      const key = match[1];
      if (key.startsWith('bgm_')) {
        allAudio.add(`bgm/${key}.ogg`);
      } else if (key.startsWith('se_')) {
        allAudio.add(`se/${key}.ogg`);
      }
    }
  }

  // 4. Hardcoded specifications from bgm_se_list.md
  const bgmSeList = [
    'bgm/bgm_title.ogg', 'bgm/bgm_field.ogg', 'bgm/bgm_battle.ogg',
    'bgm/bgm_battle_strong.ogg', 'bgm/bgm_battle_boss.ogg',
    'bgm/bgm_quest_calm.ogg', 'bgm/bgm_quest_tense.ogg',
    'bgm/bgm_quest_crisis.ogg', 'bgm/bgm_quest_mystery.ogg',
    'bgm/bgm_inn.ogg', 'bgm/bgm_roland.ogg', 'bgm/bgm_markand.ogg',
    'bgm/bgm_yato.ogg', 'bgm/bgm_karyu.ogg', 'bgm/bgm_collapse.ogg',
    'se/se_click.ogg', 'se/se_modal_open.ogg', 'se/se_cancel.ogg',
    'se/se_travel.ogg', 'se/se_enter_location.ogg', 'se/se_travel_horse.ogg',
    'se/se_encounter.ogg', 'se/se_enter_inn.ogg', 'se/se_enter_guild.ogg',
    'se/se_enter_shop.ogg', 'se/se_enter_temple.ogg', 'se/se_quest_accept.ogg',
    'se/se_quest_success.ogg', 'se/se_quest_fail.ogg', 'se/se_attack.ogg',
    'se/se_magic.ogg', 'se/se_heal.ogg', 'se/se_buff.ogg', 'se/se_debuff.ogg',
    'se/se_taunt.ogg', 'se/se_escape.ogg', 'se/se_hit.ogg', 'se/se_battle_win.ogg',
    'se/se_battle_lose.ogg', 'se/se_item_get.ogg', 'se/se_prayer.ogg',
    'se/se_level_up.ogg'
  ];
  bgmSeList.forEach(aud => allAudio.add(aud));

  console.log(`Scanned ${allImages.size} unique image references.`);
  console.log(`Scanned ${allAudio.size} unique audio references.`);

  // Verify images
  const missingImages = [];
  allImages.forEach(img => {
    if (!checkFileExists(img)) {
      missingImages.push(img);
    }
  });

  // Verify audio
  const missingAudio = [];
  allAudio.forEach(aud => {
    // Normalise name (e.g. if it is bgm_title.ogg, check in audio/bgm/bgm_title.ogg)
    let checkPath = aud;
    if (!aud.startsWith('bgm/') && !aud.startsWith('se/')) {
      if (aud.startsWith('bgm_')) {
        checkPath = `audio/bgm/${aud}`;
      } else if (aud.startsWith('se_')) {
        checkPath = `audio/se/${aud}`;
      } else {
        checkPath = `audio/${aud}`;
      }
    } else {
      checkPath = `audio/${aud}`;
    }

    if (!checkFileExists(checkPath)) {
      missingAudio.push(aud);
    }
  });

  // Append results to audit_output.txt
  let output = fs.readFileSync('audit_output.txt', 'utf-8');
  output += '\n=== ASSET AUDIT REPORT ===\n\n';
  
  output += `--- Missing Image Assets (${missingImages.length}) ---\n`;
  if (missingImages.length > 0) {
    missingImages.sort().forEach(img => output += `- ${img}\n`);
  } else {
    output += `None\n`;
  }
  output += '\n';

  output += `--- Missing Audio Assets (${missingAudio.length}) ---\n`;
  if (missingAudio.length > 0) {
    missingAudio.sort().forEach(aud => output += `- ${aud}\n`);
  } else {
    output += `None\n`;
  }
  output += '\n';

  fs.writeFileSync('audit_output.txt', output);
  console.log('Asset audit appended to audit_output.txt');
}

main();
