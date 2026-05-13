const { execSync } = require('child_process');
const fs = require('fs');

// Get the file content from the known-good commit
const content = execSync('git show c56d4aa:src/data/csv/quests_special.csv', { encoding: 'utf-8' });
fs.writeFileSync('src/data/csv/quests_special.csv', content, 'utf-8');
console.log('Restored. Lines:', content.split('\n').length);
console.log('First 3 lines:');
content.split('\n').slice(0, 3).forEach(l => console.log(l));
