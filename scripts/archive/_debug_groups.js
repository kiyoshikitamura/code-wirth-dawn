const fs = require('fs');
const csvs = ['5111_qst_rep_mutant.csv','5201_qst_rep_crusader.csv','5103_qst_rep_toll_bandit.csv'];
for(const f of csvs) {
  const csv = fs.readFileSync('src/data/csv/scenarios/'+f,'utf8');
  const norm = csv.replace(/""/g,'"');
  const battles = norm.split('\n').filter(l=>l.includes('"type":"battle"'));
  for(const b of battles) {
    const gm = b.match(/"enemy_group_id"\s*:\s*(\d+)/);
    console.log(f, 'group:', gm?gm[1]:'NOT FOUND');
  }
}
