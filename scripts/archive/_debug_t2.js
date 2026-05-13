const fs = require('fs');
const files = fs.readdirSync('src/data/csv/scenarios').filter(f=>f.match(/^(5111|5112|5113|5114|5201|5202|5203)_/));
for(const f of files) {
  const csv = fs.readFileSync('src/data/csv/scenarios/'+f,'utf8').replace(/""/g,'"');
  const battles = csv.split('\n').filter(l=>l.includes('"type":"battle"'));
  const groups = battles.map(b=>{const gm=b.match(/"enemy_group_id"\s*:\s*(\d+)/);return gm?gm[1]:'?'});
  console.log(f, 'battles:', battles.length, 'groups:', groups.join(','));
}
