const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'src', 'data', 'csv', 'enemy_actions.csv');

// Last ID was 2086. We'll start from 2101.
let startId = 2101;

const newActions = [
    // 6101: 忘却の五英霊
    ['enemy_spot_protos', 'skill_heavy_blow', 40, '', ''],
    ['enemy_spot_protos', 'skill_shield_bash', 30, '', ''],
    ['enemy_spot_eluka', 'skill_holy_ray', 40, '', ''],
    ['enemy_spot_eluka', 'skill_heal_self', 100, 'turn_mod', '4'],
    ['enemy_spot_baram', 'skill_dark_flare', 40, '', ''],
    ['enemy_spot_baram', 'skill_curse', 100, 'turn_mod', '3'],
    ['enemy_spot_shirasu', 'skill_counter_stance', 100, 'turn_mod', '4'],
    ['enemy_spot_shirasu', 'skill_armor_break', 100, 'turn_mod', '3'],
    ['enemy_spot_shirasu', 'skill_heavy_blow', 40, '', ''],
    ['enemy_spot_lyra', 'skill_arrow', 50, '', ''],
    ['enemy_spot_lyra', 'skill_poison_attack', 40, '', ''],
    ['enemy_spot_alvin', 'skill_defense_pierce', 30, '', ''],
    ['enemy_spot_alvin', 'skill_boss_nuke', 100, 'turn_mod', '5'],
    ['enemy_spot_alvin', 'skill_enrage', 100, 'hp_under', '50'],
    ['enemy_spot_alvin', 'skill_heavy_blow', 40, '', ''],

    // 6102: 百鬼夜行
    ['enemy_spot_wani', 'skill_tackle', 40, '', ''],
    ['enemy_spot_wani', 'skill_claw_rend', 40, '', ''],
    ['enemy_spot_tori', 'skill_poison_breath', 30, '', ''],
    ['enemy_spot_tori', 'skill_charm', 30, '', ''],
    ['enemy_spot_tori', 'skill_assassinate', 100, 'turn_mod', '4'],
    ['enemy_spot_kuruma', 'skill_heavy_blow', 40, '', ''],
    ['enemy_spot_kuruma', 'skill_sand_blind', 40, '', ''],
    ['enemy_spot_shuten', 'skill_katana_slash', 40, '', ''],
    ['enemy_spot_shuten', 'skill_war_cry', 100, 'turn_mod', '4'],
    ['enemy_spot_shuten', 'skill_berserk_rage', 100, 'hp_under', '25'],

    // 6103: 四神の試練
    ['enemy_spot_seiryu', 'skill_thunder_strike', 30, '', ''],
    ['enemy_spot_seiryu', 'skill_dragon_breath', 30, '', ''],
    ['enemy_spot_seiryu', 'skill_boss_nuke', 100, 'turn_mod', '4'],
    ['enemy_spot_byakko', 'skill_bounty_combo', 40, '', ''],
    ['enemy_spot_byakko', 'skill_claw_rend', 30, '', ''],
    ['enemy_spot_byakko', 'skill_enrage', 100, 'hp_under', '50'],
    ['enemy_spot_suzaku', 'skill_fireball', 50, '', ''],
    ['enemy_spot_suzaku', 'skill_regenerate', 100, 'turn_mod', '3'],
    ['enemy_spot_genbu', 'skill_shield_bash', 40, '', ''],
    ['enemy_spot_genbu', 'skill_armor_break', 100, 'turn_mod', '3'],
    ['enemy_spot_genbu', 'skill_heavy_blow', 40, '', ''],
    ['enemy_spot_kami', 'skill_god_purge', 100, 'turn_mod', '4'],
    ['enemy_spot_kami', 'skill_holy_ray', 40, '', ''],
    ['enemy_spot_kami', 'skill_god_enrage', 100, 'hp_under', '25'],

    // 6104: 忘れられた王
    ['enemy_spot_light_guard', 'skill_holy_ray', 40, '', ''],
    ['enemy_spot_light_guard', 'skill_heavy_blow', 40, '', ''],
    ['enemy_spot_sand_golem', 'skill_sand_breath', 40, '', ''],
    ['enemy_spot_sand_golem', 'skill_sand_blind', 30, '', ''],
    ['enemy_spot_nameless_king', 'skill_assassinate', 30, '', ''],
    ['enemy_spot_nameless_king', 'skill_death_sentence', 100, 'turn_mod', '3'],
    ['enemy_spot_nameless_king', 'skill_life_steal', 40, '', ''],
    ['enemy_spot_nameless_king', 'skill_enrage', 100, 'hp_under', '40']
];

let appendContent = '';
for (const action of newActions) {
    appendContent += `${startId},${action[0]},${action[1]},${action[2]},${action[3]},${action[4]}\n`;
    startId++;
}

fs.appendFileSync(csvPath, appendContent);
console.log("Appended actions for spot bosses!");
