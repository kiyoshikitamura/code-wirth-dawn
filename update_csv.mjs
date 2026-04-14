import fs from 'fs';
import path from 'path';

const cardImageMap = {
  'card_holy_smite': '/images/items/scroll_holy_smite.png',
  'card_assassinate': '/images/items/manual_assassination.png',
  'card_first_aid': '/images/items/skill_first_aid.png',
  'card_taunt': '/images/items/skill_provoke.png',
  'card_iron_body': '/images/items/skill_iron_skin.png',
  'card_meteor_strike': '/images/items/grimoire_fire.png',
  'card_heal': '/images/items/book_heal_s.png',
  'card_prayer': '/images/items/book_heal_s.png',
  'card_qigong_heal': '/images/items/skill_zen.png',
  'card_blessing': '/images/items/skill_meditation.png',
  'card_blood_drain': '/images/items/skill_cannibalism.png',
  'card_blood_rage': '/images/items/skill_berserk.png',
  'card_mad_frenzy': '/images/items/skill_berserk.png',
  'card_strike': '/images/items/skill_vital_strike.png',
  'card_holy_wall': '/images/items/skill_barrier_all.png',
  'card_guard': '/images/items/skill_barrier_all.png'
};

const cardsPath = 'src/data/csv/cards.csv';
const cardsText = fs.readFileSync(cardsPath, 'utf8');
const cardsLines = cardsText.trim().split('\n');

const newCardsLines = [];
cardsLines.forEach((line, idx) => {
  if (idx === 0) {
    if(!line.includes('image_url')) {
      newCardsLines.push(line.trim() + ',image_url');
    } else {
      newCardsLines.push(line.trim());
    }
  } else {
    const cols = line.split(',');
    const slug = cols[1];
    let img = cardImageMap[slug] || '';
    if (cols.length > 10) {
      cols[10] = img;
      newCardsLines.push(cols.join(',').trim());
    } else {
      newCardsLines.push(line.trim() + ',' + img);
    }
  }
});
fs.writeFileSync(cardsPath, newCardsLines.join('\n'));
console.log('Updated cards.csv');

const skillsPath = 'src/data/csv/skills.csv';
const skillsText = fs.readFileSync(skillsPath, 'utf8');
const skillsLines = skillsText.trim().split('\n');

const newSkillsLines = [];
skillsLines.forEach((line, idx) => {
  if (idx === 0) {
    newSkillsLines.push(line.trim());
  } else {
    // Note: line format could have quotes, but this CSV is flat
    const cols = line.split(',');
    const card_id = cols[3];
    let mappedImg = '';
    const matchingCardLine = newCardsLines.find(cl => cl.startsWith(card_id + ','));
    if (matchingCardLine) {
        const cardCols = matchingCardLine.split(',');
        mappedImg = cardCols[10] || '';
    }
    cols[9] = mappedImg;
    newSkillsLines.push(cols.join(',').trim());
  }
});
fs.writeFileSync(skillsPath, newSkillsLines.join('\n'));
console.log('Updated skills.csv');
