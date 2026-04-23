const fs = require('fs');
const sql = fs.readFileSync('sql/sync_scenario_script_data.sql', 'utf-8');
const line = sql.split('\n').find(l => l.includes('WHERE id = 6001'));
const m = line.match(/script_data = '(.+?)'::jsonb/);
const j = JSON.parse(m[1].replace(/''/g, "'"));
console.log('battle node:', JSON.stringify(j.nodes.battle, null, 2));
console.log('\nHas "next" key?', 'next' in j.nodes.battle);
console.log('battle_success_next:', j.nodes.battle.battle_success_next);
console.log('choices:', JSON.stringify(j.nodes.battle.choices));
