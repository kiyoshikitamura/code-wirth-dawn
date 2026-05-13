/**
 * Shared CSV Parser — Wirth-Dawn Scripts
 * 
 * Provides reusable CSV/data parsing utilities for all scripts.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'src', 'data', 'csv');

/**
 * Parse a single CSV line handling quoted fields and escaped quotes.
 */
function parseCSVLine(line) {
  const cols = [];
  let cur = '', inQuote = false;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (c === '"') {
      if (inQuote && j + 1 < line.length && line[j + 1] === '"') {
        cur += '"'; j++;
      } else {
        inQuote = !inQuote;
      }
      continue;
    }
    if (c === ',' && !inQuote) { cols.push(cur); cur = ''; continue; }
    cur += c;
  }
  cols.push(cur);
  return cols;
}

/**
 * Parse a CSV file into an array of objects keyed by header columns.
 * @param {string} filePath - Absolute or relative path to CSV file
 * @returns {Array<Object>} Array of row objects
 */
function parseCSV(filePath) {
  const csv = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const lines = csv.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const cols = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (cols[i] || '').trim(); });
    return obj;
  });
}

/**
 * Get all enemies from enemies.csv.
 */
function getEnemies() {
  return parseCSV(path.join(DATA_DIR, 'enemies.csv'));
}

/**
 * Get all enemy actions from enemy_actions.csv.
 */
function getEnemyActions() {
  return parseCSV(path.join(DATA_DIR, 'enemy_actions.csv'));
}

/**
 * Get all enemy groups from enemy_groups.csv.
 */
function getEnemyGroups() {
  return parseCSV(path.join(DATA_DIR, 'enemy_groups.csv'));
}

/**
 * Get all enemy skills from enemy_skills.csv.
 */
function getEnemySkills() {
  return parseCSV(path.join(DATA_DIR, 'enemy_skills.csv'));
}

/**
 * Get all scenario CSV files, optionally filtering by prefix.
 * @param {Object} opts - { excludePrefixes: string[] }
 * @returns {string[]} Array of filenames
 */
function getScenarioFiles(opts = {}) {
  const dir = path.join(DATA_DIR, 'scenarios');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));
  if (opts.excludePrefixes && opts.excludePrefixes.length > 0) {
    return files.filter(f => !opts.excludePrefixes.some(p => f.startsWith(p)));
  }
  return files;
}

/**
 * Parse a scenario CSV file into structured nodes.
 * @param {string} filename - Scenario CSV filename
 * @returns {Array<Object>} Array of node objects with { rowType, nodeId, textLabel, params, nextNode, parsedParams }
 */
function parseScenarioCSV(filename) {
  const dir = path.join(DATA_DIR, 'scenarios');
  const csv = fs.readFileSync(path.join(dir, filename), 'utf8').replace(/\r\n/g, '\n');
  const lines = csv.split('\n');
  const nodes = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    const node = {
      rowType: cols[0] || '',
      nodeId: cols[1] || '',
      textLabel: cols[2] || '',
      params: cols[3] || '',
      nextNode: cols[4] || '',
      parsedParams: null
    };
    try { node.parsedParams = JSON.parse(node.params); } catch(e) {}
    nodes.push(node);
  }
  return nodes;
}

/**
 * Append rows to a CSV file.
 */
function appendCSV(filePath, lines) {
  const existing = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n').trimEnd();
  fs.writeFileSync(filePath, existing + '\n' + lines.join('\n') + '\n', 'utf8');
}

/**
 * Read assets.ts and extract all registered background keys.
 */
function getAssetKeys() {
  const assetsPath = path.join(__dirname, '..', '..', 'src', 'config', 'assets.ts');
  const content = fs.readFileSync(assetsPath, 'utf8');
  const keys = new Set();
  const matches = content.matchAll(/['"]?(bg_[a-z0-9_]+)['"]?\s*[:\]]/g);
  for (const m of matches) keys.add(m[1]);
  return keys;
}

module.exports = {
  parseCSVLine,
  parseCSV,
  getEnemies,
  getEnemyActions,
  getEnemyGroups,
  getEnemySkills,
  getScenarioFiles,
  parseScenarioCSV,
  appendCSV,
  getAssetKeys,
  DATA_DIR
};
