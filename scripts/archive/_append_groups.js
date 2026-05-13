const fs = require('fs');
const csv = fs.readFileSync('src/data/csv/enemy_groups.csv', 'utf8')
  .replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd();

const newGroups = [
  '120,grp_jade_snake_guard,enemy_jade_snake_infant|enemy_jade_snake_infant',
  '130,grp_yokai_mountain,enemy_yato_tengu|enemy_yato_akaoni|enemy_yato_onibi',
  '420,grp_mar_bandit_raid,enemy_bandit_thug|enemy_bandit_thug|enemy_bandit_archer|enemy_bandit_archer',
  '421,grp_mar_desert_beast,enemy_markand_sand_worm|enemy_markand_scorpion|enemy_markand_scorpion',
  '422,grp_mar_scorpion_swarm,enemy_markand_scorpion|enemy_markand_scorpion|enemy_markand_scorpion',
  '423,grp_mar_fugitive_guard,enemy_bandit_thug|enemy_bandit_thug|enemy_bandit_guard',
  '424,grp_mar_fugitive_elite,enemy_bandit_guard|enemy_bandit_guard|enemy_bandit_archer',
  '425,grp_mar_worm_swarm,enemy_markand_sand_worm|enemy_markand_scorpion|enemy_markand_scorpion',
  '426,grp_mar_great_worm,enemy_markand_sand_worm|enemy_markand_sand_worm',
  '427,grp_mar_auction_thief,enemy_bandit_thug|enemy_bandit_thug|enemy_bandit_thug',
  '428,grp_mar_auction_assassin,enemy_assassin_trainee|enemy_assassin_trainee|enemy_bandit_guard',
  '429,grp_mar_militia,enemy_bandit_guard|enemy_bandit_guard|enemy_bandit_archer',
  '430,grp_yat_yokai_pack,enemy_yato_karakasa|enemy_yato_karakasa|enemy_yato_onibi|enemy_yato_onibi',
  '431,grp_yat_akaoni_boss,enemy_yato_akaoni|enemy_yato_onibi',
  '432,grp_yat_ninja_spy,enemy_yato_ninja|enemy_yato_spy|enemy_yato_ninja',
  '433,grp_yat_ronin_wave,enemy_yato_ronin|enemy_yato_ronin|enemy_yato_ronin',
  '434,grp_yat_ronin_leader,enemy_yato_ronin_leader|enemy_yato_ronin',
  '435,grp_yat_onryo,enemy_yato_onryo|enemy_yato_onryo',
  '440,grp_har_jiangshi_pack,enemy_karyu_jiangshi|enemy_karyu_jiangshi|enemy_karyu_jiangshi',
  '441,grp_har_jiangshi_elite,enemy_karyu_jiangshi_old|enemy_karyu_jiangshi|enemy_karyu_jiangshi',
  '442,grp_har_guardian_beast,enemy_karyu_guardian_beast',
  '443,grp_har_rebel_farmer,enemy_karyu_rebel_farmer|enemy_karyu_rebel_farmer|enemy_karyu_rebel_farmer',
  '444,grp_har_rebel_leader,enemy_karyu_rebel_leader|enemy_karyu_rebel_farmer|enemy_karyu_rebel_farmer',
  '445,grp_har_assassin_wave1,enemy_karyu_assassin|enemy_karyu_assassin',
  '446,grp_har_assassin_elite,enemy_karyu_assassin_elite|enemy_karyu_assassin|enemy_karyu_assassin',
  '447,grp_har_pirate_deck,enemy_karyu_pirate|enemy_karyu_pirate|enemy_karyu_pirate',
  '448,grp_har_pirate_captain,enemy_karyu_pirate_captain|enemy_karyu_pirate',
  '450,grp_yat_mansion_ghost,enemy_yato_onryo|enemy_yato_kagemon|enemy_yato_onibi',
  '451,grp_yat_mansion_boss,enemy_yato_onryo|enemy_yato_onryo|enemy_yato_kagemon',
  '452,grp_har_foxwed_guard,enemy_karyu_fox|enemy_karyu_fox|enemy_karyu_jiangshi',
  '453,grp_har_foxwed_bride,enemy_karyu_fox_bride|enemy_karyu_fox',
  '460,grp_rep_mutant_guard,enemy_mutant_chimera|enemy_mutant_chimera',
  '9061,grp_boss_crusader,boss_fallen_crusader',
  '9062,grp_boss_sand_king,boss_sand_king',
  '9063,grp_boss_oni_general,boss_oni_general',
  '9064,grp_boss_jade_serpent,boss_jade_serpent',
  '9065,grp_boss_heretic_sage,boss_heretic_sage',
  '9066,grp_boss_war_djinn,boss_war_djinn',
  '9067,grp_boss_nine_tails,boss_nine_tails',
  '9111,grp_boss_mutant,boss_mutant_chimera',
  '9112,grp_boss_bandit_king,boss_bandit_king',
  '9113,grp_boss_cursed_ronin,boss_cursed_ronin',
  '9114,grp_boss_false_sage,boss_false_sage',
];

const result = csv + '\n' + newGroups.join('\n') + '\n';
fs.writeFileSync('src/data/csv/enemy_groups.csv', result, 'utf8');
console.log('Done. Total lines:', result.split('\n').length);
