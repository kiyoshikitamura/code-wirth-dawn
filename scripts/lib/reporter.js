/**
 * Shared Reporter — Wirth-Dawn Scripts
 * 
 * Provides structured output (console, JSON, markdown) for audit results.
 */

/**
 * Print a summary table to console.
 * @param {string} title
 * @param {Object} summary - key-value pairs
 */
function printSummary(title, summary) {
  console.log('\n=== ' + title + ' ===');
  for (const [key, val] of Object.entries(summary)) {
    console.log('  ' + key + ': ' + val);
  }
}

/**
 * Print a list of items with a header.
 */
function printList(title, items, formatter) {
  console.log('\n=== ' + title + ' ===');
  items.forEach((item, i) => {
    console.log('  ' + (formatter ? formatter(item, i) : item));
  });
}

/**
 * Print a grouped count table.
 */
function printGroupedCounts(title, items, keyFn) {
  const groups = {};
  items.forEach(item => {
    const key = keyFn(item);
    groups[key] = (groups[key] || 0) + 1;
  });
  console.log('\n=== ' + title + ' ===');
  Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .forEach(function(e) { console.log('  ' + e[1] + ': ' + e[0]); });
  return groups;
}

/**
 * Generate a markdown report string.
 */
function toMarkdown(title, sections) {
  let md = '# ' + title + '\n\n';
  for (const section of sections) {
    md += '## ' + section.title + '\n\n';
    if (section.table) {
      const headers = Object.keys(section.table[0] || {});
      md += '| ' + headers.join(' | ') + ' |\n';
      md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
      section.table.forEach(row => {
        md += '| ' + headers.map(h => String(row[h] || '')).join(' | ') + ' |\n';
      });
    }
    if (section.text) md += section.text + '\n';
    md += '\n';
  }
  return md;
}

module.exports = {
  printSummary,
  printList,
  printGroupedCounts,
  toMarkdown
};
