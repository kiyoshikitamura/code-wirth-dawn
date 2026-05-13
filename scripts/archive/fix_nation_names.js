const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'docs', 'quest');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
let count = 0;

for (const file of files) {
  const fp = path.join(dir, file);
  let c = fs.readFileSync(fp, 'utf-8');
  let changed = false;
  const orig = c;

  // 1. メタテーブル内の「ローラン聖帝国」→「ローランド聖王国」
  c = c.replace(/ローラン聖帝国/g, 'ローランド聖王国');

  // 2. 依頼主の「帝国軍」→「王国軍」（メタテーブル内のみ）
  c = c.replace(/(\| \*\*依頼主\*\* \| )帝国軍/g, '$1王国軍');

  // 3. 「火龍帝国」→「華龍国」
  c = c.replace(/火龍帝国/g, '華龍国');

  // 4. 出現拠点行の「華龍神朝」→「華龍国」
  c = c.replace(/(出現拠点.+)華龍神朝/g, '$1華龍国');

  // 5. 物語テキスト中の「聖帝国ローラン」→「聖王国ローランド」
  c = c.replace(/聖帝国ローラン([^ド])/g, '聖王国ローランド$1');
  c = c.replace(/聖帝国ローラン$/gm, '聖王国ローランド');

  // 6. 「聖王国ローラン」(ドなし) → 「聖王国ローランド」
  c = c.replace(/聖王国ローラン([^ド])/g, '聖王国ローランド$1');

  if (c !== orig) {
    fs.writeFileSync(fp, c, 'utf-8');
    console.log('FIXED: ' + file);
    count++;
  }
}
console.log('Total fixed: ' + count);
