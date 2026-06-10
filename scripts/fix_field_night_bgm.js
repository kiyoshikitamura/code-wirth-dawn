const fs = require('fs');
const path = require('path');

const targets = [
  // CSV files
  'src/data/csv/scenarios/7030_qst_yat_yokai.csv',
  'src/data/csv/scenarios/7031_qst_yat_ninja.csv',
  'src/data/csv/scenarios/7033_qst_yat_ronin.csv',
  'src/data/csv/scenarios/7043_qst_har_official.csv',
  'src/data/csv/scenarios/7044_qst_har_pirate.csv',
  // Quest markdown documentation
  'docs/quest/quest_7030_yokai.md',
  'docs/quest/quest_7031_ninja.md',
  'docs/quest/quest_7033_ronin.md',
  'docs/quest/quest_7043_official.md',
  'docs/quest/quest_7044_pirate.md'
];

function main() {
  targets.forEach(relPath => {
    const fullPath = path.join(__dirname, '..', relPath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('bgm_field_night')) {
        console.log(`Fixing BGM reference in: ${relPath}`);
        // Replace globally
        content = content.replace(/bgm_field_night/g, 'bgm_quest_mystery');
        fs.writeFileSync(fullPath, content, 'utf-8');
      } else {
        console.log(`No reference found in: ${relPath}`);
      }
    } else {
      console.warn(`File not found: ${relPath}`);
    }
  });
  console.log('BGM references replacement completed.');
}

main();
