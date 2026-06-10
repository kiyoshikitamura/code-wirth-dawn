const fs = require('fs');
const { parse } = require('csv-parse/sync');
const csv = fs.readFileSync('src/data/csv/quests_special.csv', 'utf8');
try {
  const records = parse(csv, { columns: true, skip_empty_lines: true, relax_column_count: true });
  console.log('Total parsed records:', records.length);
  for (let i = 0; i < records.length; i++) {
    console.log(i + ': ' + records[i].id + ' - ' + records[i].slug + ' - ' + records[i].title);
  }
} catch (e) {
  console.error(e);
}
