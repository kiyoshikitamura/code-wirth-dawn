
import fs from 'fs';
import path from 'path';

const csvPath = path.join(process.cwd(), 'src', 'data', 'csv', 'items.csv');
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n');

const newLines = lines.map((line, index) => {
    if (!line.trim()) return line;
    if (index === 0) {
        // Header
        if (line.includes(',cost,')) return line;
        return line.replace(',_comment', ',cost,_comment');
    }

    // Data Row
    // Naive CSV split (assuming no commas in fields except comment which is last)
    // Actually comments have colons, not commas usually.
    // Spec shows: `3001,item_potion_s,伤药,consumable,100,1,any,,共通: 基本的な回復`
    // Wait, `,,` for linked_card_id.
    // Comment is last.
    // So split by comma, insert at index - 1 (before comment).

    // But wait, split might break if comment has comma.
    // So split by limit? No.
    // Find last comma index.
    const lastCommaIndex = line.lastIndexOf(',');
    if (lastCommaIndex === -1) return line;

    // Check if cost already exists?
    // Based on counting commas.
    // Header has: id,slug,name,type,base_price,min_prosperity,nation_tags,linked_card_id,_comment (9 fields)
    // New Header: ... linked_card_id,cost,_comment (10 fields)

    // Count commas: 8 commas originally.
    // If line has 9 commas, it might have cost.

    // Logic:
    const parts = line.split(',');
    // Rejoin except last part (comment)
    // Actually, safer to find `linked_card_id` column index.
    // It is index 7 (0-based).

    // Let's rely on regex replacement of the last comma if we assume comment is last field.
    // But verify.

    // Cost logic based on line content
    let cost = 0;
    if (line.includes('skill_card')) {
        cost = 2; // Default
        if (line.includes('rusty') || line.includes('錆び')) cost = 1;
        if (line.includes('forbidden') || line.includes('禁術')) cost = 8;
        if (line.includes('knight') || line.includes('騎士')) cost = 4;
        if (line.includes('holy_smite') || line.includes('聖なる一撃')) cost = 5;
        if (line.includes('merchant_bag') || line.includes('商人の鞄')) cost = 5;
        if (line.includes('magic_lamp') || line.includes('魔法のランプ')) cost = 5;
        if (line.includes('kusanagi') || line.includes('草薙')) cost = 5;
        if (line.includes('dim_mak') || line.includes('点穴')) cost = 5;
        if (line.includes('necromancy') || line.includes('死体操作')) cost = 1; // Basic?
        if (line.includes('vital_strike') || line.includes('命削り')) cost = 1;
    }

    // Insert cost before the last comma?
    // `...,linked_id,cost,comment`
    // Originally `...,linked_id,comment`

    // We can slice the string.
    const beforeComment = line.substring(0, lastCommaIndex);
    const comment = line.substring(lastCommaIndex); // includes comma

    return `${beforeComment},${cost}${comment}`;
});

fs.writeFileSync(csvPath, newLines.join('\n'), 'utf-8');
console.log('Updated items.csv with cost column.');
