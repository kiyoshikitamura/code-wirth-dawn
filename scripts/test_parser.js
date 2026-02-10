
function parseParams(paramStr) {
    if (!paramStr) return {};
    const obj = {};
    if (paramStr.trim().startsWith('{')) {
        try { return JSON.parse(paramStr); } catch (e) { console.warn("Failed to parse param JSON:", paramStr); return {}; }
    }

    paramStr.split(',').forEach(pair => {
        const [k, v] = pair.split(':');
        if (k && v) {
            const key = k.trim();
            const val = v.trim();
            const num = Number(val);
            obj[key] = isNaN(num) ? val : num;
        }
    });
    return obj;
}

const input = "type:battle, enemy:goblin_squad, bg:battle_generic";
console.log("Input:", input);
console.log("Parsed:", parseParams(input));
