/**
 * Auto-split long text nodes in scenario CSVs.
 * 
 * Strategy:
 * 1. Find all NODE rows with text > threshold
 * 2. Split at \\n if present (already a natural break)
 * 3. Split at 。 (sentence boundary) if no \\n
 * 4. Create continuation nodes with _b, _c suffixes
 * 5. Chain next_node correctly
 * 6. Preserve bg, bgm, speaker params
 * 
 * Usage: node scripts/auto_split_text.js [--dry-run] [--threshold 45] [--exclude-prefix 8]
 */
const fs = require('fs');
const path = require('path');
const csvLib = require('./lib/csv-parser');

const args = process.argv.slice(2);
let threshold = 45;
let dryRun = args.includes('--dry-run');
const excludePrefixes = ['8'];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--threshold' && args[i+1]) { threshold = parseInt(args[i+1]); i++; }
  if (args[i] === '--exclude-prefix' && args[i+1]) { excludePrefixes.push(args[i+1]); i++; }
}

const scenarioDir = path.join(__dirname, '..', 'src', 'data', 'csv', 'scenarios');
const files = csvLib.getScenarioFiles({ excludePrefixes });

const skipTypes = new Set(['battle','choice','guest_join','leave','check_delivery',
  'random_branch','reward','hp_damage']);

let totalSplits = 0;
let totalFiles = 0;

/**
 * Split a long text into chunks of <= threshold characters.
 * Priority: split at \\n, then at 。, then at 、, then force.
 */
function splitText(text, maxLen) {
  const parts = [];
  let remaining = text;

  while ([...remaining].length > maxLen) {
    // Try splitting at \\n first
    const nlIdx = remaining.indexOf('\\n');
    if (nlIdx > 0 && nlIdx <= maxLen * 2) { // \\n is 2 chars
      const actualCharIdx = remaining.indexOf('\\n');
      parts.push(remaining.substring(0, actualCharIdx));
      remaining = remaining.substring(actualCharIdx + 2); // skip \\n
      continue;
    }

    // Try splitting at 。within threshold range
    let splitAt = -1;
    const chars = [...remaining];
    for (let i = Math.min(maxLen, chars.length - 1); i >= Math.floor(maxLen * 0.5); i--) {
      if (chars[i] === '。') { splitAt = i + 1; break; }
    }

    // Try splitting at 、
    if (splitAt === -1) {
      for (let i = Math.min(maxLen, chars.length - 1); i >= Math.floor(maxLen * 0.5); i--) {
        if (chars[i] === '、') { splitAt = i + 1; break; }
      }
    }

    // Try splitting at 」or ）
    if (splitAt === -1) {
      for (let i = Math.min(maxLen, chars.length - 1); i >= Math.floor(maxLen * 0.5); i--) {
        if (chars[i] === '」' || chars[i] === '）') { splitAt = i + 1; break; }
      }
    }

    // Force split at threshold
    if (splitAt === -1) {
      splitAt = maxLen;
    }

    // Convert char index to string index
    const byteSlice = chars.slice(0, splitAt).join('');
    parts.push(byteSlice);
    remaining = chars.slice(splitAt).join('');
  }

  if (remaining.trim()) parts.push(remaining);
  return parts.filter(p => p.trim());
}

/**
 * Generate a continuation node ID.
 */
function contNodeId(baseId, idx) {
  const suffixes = ['_b', '_c', '_d', '_e'];
  return baseId + (suffixes[idx] || '_' + (idx + 2));
}

/**
 * Rebuild a quoted CSV field for text_label.
 */
function quoteCSV(text) {
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

for (const filename of files) {
  const filePath = path.join(scenarioDir, filename);
  const raw = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');
  const header = lines[0];
  const newLines = [header];
  let fileSplits = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = csvLib.parseCSVLine(line);
    const rowType = cols[0];
    const nodeId = cols[1];
    const textLabel = cols[2] || '';
    const params = cols[3] || '';
    const nextNode = cols[4] || '';

    if (rowType !== 'NODE') {
      newLines.push(line);
      continue;
    }

    // Parse type
    let nodeType = 'text';
    let parsedParams = null;
    try { parsedParams = JSON.parse(params); nodeType = parsedParams.type || 'text'; } catch(e) {}

    if (skipTypes.has(nodeType) || !textLabel || [...textLabel].length <= threshold) {
      newLines.push(line);
      continue;
    }

    // Split the text
    const parts = splitText(textLabel, threshold);
    if (parts.length <= 1) {
      newLines.push(line);
      continue;
    }

    fileSplits += parts.length - 1;

    // Generate continuation nodes
    for (let p = 0; p < parts.length; p++) {
      const isLast = p === parts.length - 1;
      const curId = p === 0 ? nodeId : contNodeId(nodeId, p - 1);
      const curNext = isLast ? nextNode : contNodeId(nodeId, p === 0 ? 0 : p);
      const curText = parts[p];

      // Build params JSON - reuse bg, bgm, speaker for continuations
      let curParams = params;
      if (p > 0 && parsedParams) {
        // Continuation nodes inherit bg, bgm, speaker, type
        const contP = { type: parsedParams.type || 'text' };
        if (parsedParams.bg) contP.bg = parsedParams.bg;
        if (parsedParams.bgm) contP.bgm = parsedParams.bgm;
        if (parsedParams.speaker_name) contP.speaker_name = parsedParams.speaker_name;
        curParams = JSON.stringify(contP).replace(/"/g, '""');
        curParams = '"' + curParams + '"';
      }

      // Rebuild the CSV line
      const quotedText = quoteCSV(curText);
      // For first node, use original params formatting
      if (p === 0) {
        // Reconstruct: NODE,nodeId,"text","params",nextNode
        const origParamField = line.split(',').length > 3 ? '' : '';
        // Re-parse original line to get proper param field
        const newLine = 'NODE,' + curId + ',' + quotedText + ',' +
          (params.includes('"') ? '"' + params.replace(/"/g, '""') + '"' : params) + ',' + curNext;
        // Actually, let's reconstruct from the original line but swap text and next
        // Safest: use cols approach
        const rebuiltCols = [rowType, curId, quotedText];
        // Params: need to re-quote properly
        if (cols[3]) {
          const pStr = JSON.stringify(parsedParams).replace(/"/g, '""');
          rebuiltCols.push('"' + pStr + '"');
        } else {
          rebuiltCols.push('');
        }
        rebuiltCols.push(curNext);
        newLines.push(rebuiltCols.join(','));
      } else {
        const rebuiltCols = ['NODE', curId, quotedText, curParams, curNext];
        newLines.push(rebuiltCols.join(','));
      }
    }
  }

  if (fileSplits > 0) {
    totalSplits += fileSplits;
    totalFiles++;
    if (dryRun) {
      console.log('[DRY] ' + filename + ': ' + fileSplits + ' splits');
    } else {
      fs.writeFileSync(filePath, newLines.join('\n') + '\n', 'utf8');
      console.log('[DONE] ' + filename + ': ' + fileSplits + ' splits');
    }
  }
}

console.log('\nTotal: ' + totalSplits + ' new nodes across ' + totalFiles + ' files');
if (dryRun) console.log('(dry run — no files modified)');
