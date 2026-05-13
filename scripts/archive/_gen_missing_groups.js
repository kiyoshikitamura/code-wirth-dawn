// generate_missing_groups.js — 不足している43グループのCSV行を生成
// バトルノードのテキストとリージョン文脈から適切なメンバー構成を決定

const groups = [
  // ── 120,130: T3道中（高レベル地域敵） ──
  { id: 120, slug: 'grp_jade_snake_guard', members: 'enemy_jade_snake_infant|enemy_jade_snake_infant' },
  { id: 130, slug: 'grp_yokai_mountain', members: 'enemy_yato_tengu|enemy_yato_akaoni|enemy_yato_onibi' },

  // ── 420-429: Marcund地方クエスト道中 ──
  // 420: 7020 wave1「砂漠の盗賊団が商隊に襲いかかってきた」
  { id: 420, slug: 'grp_mar_bandit_raid', members: 'enemy_bandit_thug|enemy_bandit_thug|enemy_bandit_archer|enemy_bandit_archer' },
  // 421: 7020 wave2「砂漠の魔獣」+ 5202,5206,6107
  { id: 421, slug: 'grp_mar_desert_beast', members: 'enemy_markand_sand_worm|enemy_markand_scorpion|enemy_markand_scorpion' },
  // 422: 7021「蠍の群れ」+ 5102,5112
  { id: 422, slug: 'grp_mar_scorpion_swarm', members: 'enemy_markand_scorpion|enemy_markand_scorpion|enemy_markand_scorpion' },
  // 423: 7022 wave1「逃亡者の仲間たち」
  { id: 423, slug: 'grp_mar_fugitive_guard', members: 'enemy_bandit_thug|enemy_bandit_thug|enemy_bandit_guard' },
  // 424: 7022 wave2「集落の精鋭たち」
  { id: 424, slug: 'grp_mar_fugitive_elite', members: 'enemy_bandit_guard|enemy_bandit_guard|enemy_bandit_archer' },
  // 425: 7023 wave1「砂虫とサソリの群れ」
  { id: 425, slug: 'grp_mar_worm_swarm', members: 'enemy_markand_sand_worm|enemy_markand_scorpion|enemy_markand_scorpion' },
  // 426: 7023 wave2「大砂虫」
  { id: 426, slug: 'grp_mar_great_worm', members: 'enemy_markand_sand_worm|enemy_markand_sand_worm' },
  // 427: 7024 wave1「闇市を嗅ぎつけた盗賊ども」
  { id: 427, slug: 'grp_mar_auction_thief', members: 'enemy_bandit_thug|enemy_bandit_thug|enemy_bandit_thug' },
  // 428: 7024 wave2「暗殺者の精鋭部隊」
  { id: 428, slug: 'grp_mar_auction_assassin', members: 'enemy_assassin_trainee|enemy_assassin_trainee|enemy_bandit_guard' },
  // 429: 7025「見張り兵に正体を見抜かれた」
  { id: 429, slug: 'grp_mar_militia', members: 'enemy_bandit_guard|enemy_bandit_guard|enemy_bandit_archer' },

  // ── 430-435: Yato地方クエスト道中 ──
  // 430: 7030 battle_01「からかさ小僧と鬼火の群れ」+ 5113,7032
  { id: 430, slug: 'grp_yat_yokai_pack', members: 'enemy_yato_karakasa|enemy_yato_karakasa|enemy_yato_onibi|enemy_yato_onibi' },
  // 431: 7030 battle_02「巨躯の赤鬼」+ 7032
  { id: 431, slug: 'grp_yat_akaoni_boss', members: 'enemy_yato_akaoni|enemy_yato_onibi' },
  // 432: 7031「他国の間者と抜け忍」
  { id: 432, slug: 'grp_yat_ninja_spy', members: 'enemy_yato_ninja|enemy_yato_spy|enemy_yato_ninja' },
  // 433: 7033 wave1「食い詰め浪人たち」+ 5103「浪人3人」
  { id: 433, slug: 'grp_yat_ronin_wave', members: 'enemy_yato_ronin|enemy_yato_ronin|enemy_yato_ronin' },
  // 434: 7033「浪人の頭目」
  { id: 434, slug: 'grp_yat_ronin_leader', members: 'enemy_yato_ronin_leader|enemy_yato_ronin' },
  // 435: 7034「無念の死を遂げた怨霊」
  { id: 435, slug: 'grp_yat_onryo', members: 'enemy_yato_onryo|enemy_yato_onryo' },

  // ── 440-448: Haryu地方クエスト道中 ──
  // 440: 7040 battle_01「キョンシーの群れ」+ 5114
  { id: 440, slug: 'grp_har_jiangshi_pack', members: 'enemy_karyu_jiangshi|enemy_karyu_jiangshi|enemy_karyu_jiangshi' },
  // 441: 7040 battle_02「古の太守とその近衛」
  { id: 441, slug: 'grp_har_jiangshi_elite', members: 'enemy_karyu_jiangshi_old|enemy_karyu_jiangshi|enemy_karyu_jiangshi' },
  // 442: 7041「霊草の守護獣」
  { id: 442, slug: 'grp_har_guardian_beast', members: 'enemy_karyu_guardian_beast' },
  // 443: 7042 battle_01「飢えた農民たち」+ 5114
  { id: 443, slug: 'grp_har_rebel_farmer', members: 'enemy_karyu_rebel_farmer|enemy_karyu_rebel_farmer|enemy_karyu_rebel_farmer' },
  // 444: 7042 battle_02「首謀者」
  { id: 444, slug: 'grp_har_rebel_leader', members: 'enemy_karyu_rebel_leader|enemy_karyu_rebel_farmer|enemy_karyu_rebel_farmer' },
  // 445: 7043 battle_01「暗殺者の第1波」
  { id: 445, slug: 'grp_har_assassin_wave1', members: 'enemy_karyu_assassin|enemy_karyu_assassin' },
  // 446: 7043 battle_02「精鋭の刺客部隊」
  { id: 446, slug: 'grp_har_assassin_elite', members: 'enemy_karyu_assassin_elite|enemy_karyu_assassin|enemy_karyu_assassin' },
  // 447: 7044 battle_01「水賊たち」
  { id: 447, slug: 'grp_har_pirate_deck', members: 'enemy_karyu_pirate|enemy_karyu_pirate|enemy_karyu_pirate' },
  // 448: 7044 battle_02「水賊の頭目 黒鰐」
  { id: 448, slug: 'grp_har_pirate_captain', members: 'enemy_karyu_pirate_captain|enemy_karyu_pirate' },

  // ── 450-453: 高難度Yato/Haryu ──
  // 450: 7035 battle_01（呪われた武家屋敷）
  { id: 450, slug: 'grp_yat_mansion_ghost', members: 'enemy_yato_onryo|enemy_yato_kagemon|enemy_yato_onibi' },
  // 451: 7035 battle_02（武家屋敷ボス）
  { id: 451, slug: 'grp_yat_mansion_boss', members: 'enemy_yato_onryo|enemy_yato_onryo|enemy_yato_kagemon' },
  // 452: 7045 battle_01（妖狐の嫁入り）
  { id: 452, slug: 'grp_har_foxwed_guard', members: 'enemy_karyu_fox|enemy_karyu_fox|enemy_karyu_jiangshi' },
  // 453: 7045 battle_02（妖狐の嫁入りボス）
  { id: 453, slug: 'grp_har_foxwed_bride', members: 'enemy_karyu_fox_bride|enemy_karyu_fox' },

  // ── 460: T2固有 ──
  // 460: 5111「失敗作キメラ」
  { id: 460, slug: 'grp_rep_mutant_guard', members: 'enemy_mutant_chimera|enemy_mutant_chimera' },

  // ── 9061-9067: T3ボスグループ ──
  { id: 9061, slug: 'grp_boss_crusader', members: 'boss_fallen_crusader' },
  { id: 9062, slug: 'grp_boss_sand_king', members: 'boss_sand_king' },
  { id: 9063, slug: 'grp_boss_oni_general', members: 'boss_oni_general' },
  { id: 9064, slug: 'grp_boss_jade_serpent', members: 'boss_jade_serpent' },
  { id: 9065, slug: 'grp_boss_heretic_sage', members: 'boss_heretic_sage' },
  { id: 9066, slug: 'grp_boss_war_djinn', members: 'boss_war_djinn' },
  { id: 9067, slug: 'grp_boss_nine_tails', members: 'boss_nine_tails' },

  // ── 9111-9114: T2ボスグループ ──
  { id: 9111, slug: 'grp_boss_mutant', members: 'boss_mutant_chimera' },
  { id: 9112, slug: 'grp_boss_bandit_king', members: 'boss_bandit_king' },
  { id: 9113, slug: 'grp_boss_cursed_ronin', members: 'boss_cursed_ronin' },
  { id: 9114, slug: 'grp_boss_false_sage', members: 'boss_false_sage' },
];

// Output CSV lines
const lines = groups.map(g => `${g.id},${g.slug},${g.members}`);
console.log(lines.join('\n'));
console.log('\n--- Total:', groups.length, 'groups ---');
