import fs from 'fs';
import path from 'path';

const csvPath = path.join(process.cwd(), 'src', 'data', 'csv', 'quests.csv');
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n');

const newLines = lines.map((line, index) => {
    if (!line.trim()) return line;
    if (index === 0) return line; // Header already fixed

    // Split by comma, but respect quoted strings if any (simple split for now as no commas in fields expected based on view)
    // Actually, descriptions might have commas? The view showed clean CSV.
    // Let's check line 2: 5001,qst_rat_hunt,地下倉庫のネズミ退治,1,1,1,any... -> wait, I already updated line 2 in previous step?
    // The previous tool call output showed:
    // +id,slug,title,rec_level,difficulty...
    // +5001,qst_rat_hunt,地下倉庫のネズミ退治,1,1,1,any...
    // So line 2 IS fixed. I need to fix from line 3 onwards.

    // Line structure: id,slug,title,difficulty,time...
    // Need to insert rec_level (equal to difficulty) at index 3.

    const parts = line.split(',');
    // Original has 8 parts (split by comma might be risky if descriptions have commas, but they don't seem to based on file review).
    // New has 9 parts.

    // If we have > 8 parts and index 3 is a number, assume updated?
    // Safer: check if we just updated the header?
    // The header check in line 10 skips line 0.

    // Logic: If parts.length === 8, insert.
    if (parts.length === 8) {
        const difficulty = parts[3];
        parts.splice(3, 0, difficulty); // rec_level = difficulty
        return parts.join(',');
    }
    return line; // Already updated or malformed
});

fs.writeFileSync(csvPath, newLines.join('\n'));
console.log('CSV Updated');
