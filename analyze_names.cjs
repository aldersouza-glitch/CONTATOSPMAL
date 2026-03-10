
const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'data.ts');
let content = fs.readFileSync(dataPath, 'utf8');

const match = content.match(/export const OFFICER_DATA: Officer\[\] = (\[[\s\S]*?\]);/);
if (!match) process.exit(1);

const officersRaw = match[1];
const lines = officersRaw.split('\n');
const officers = [];

for (let line of lines) {
    if (line.trim().startsWith('{')) {
        const getVal = (key) => {
            const m = line.match(new RegExp(key + ":\\s*'([^']*)'"));
            return m ? m[1] : '';
        };
        officers.push({
            matricula: getVal('matricula'),
            name: getVal('name').trim().toUpperCase()
        });
    }
}

console.log('Total in data.ts:', officers.length);

const nameGroups = new Map();
for (const off of officers) {
    if (!nameGroups.has(off.name)) nameGroups.set(off.name, []);
    nameGroups.get(off.name).push(off.matricula);
}

let duplicateNamesCount = 0;
for (const [name, mats] of nameGroups.entries()) {
    const uniqueMats = new Set(mats.filter(m => m && m !== '---' && m !== '.'));
    if (uniqueMats.size > 1) {
        console.log(`DUAL IDENTITY: Name "${name}" has multiple matriculas: ${Array.from(uniqueMats).join(', ')}`);
        duplicateNamesCount++;
    } else if (mats.length > 1) {
        // Same name, same (or no) matricula
    }
}

console.log('Names with multiple identities:', duplicateNamesCount);

const uniqueNames = new Set(officers.map(o => o.name));
console.log('Total unique names:', uniqueNames.size);
