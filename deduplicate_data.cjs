
const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'data.ts');
let content = fs.readFileSync(dataPath, 'utf8');

// Extraction
const match = content.match(/export const OFFICER_DATA: Officer\[\] = (\[[\s\S]*?\]);/);
if (!match) {
    console.error('Could not find OFFICER_DATA');
    process.exit(1);
}

const officersRaw = match[1];
const lines = officersRaw.split('\n');
const officers = [];

function normalize(str) {
    if (!str) return '';
    return str.replace(/\s+/g, ' ').trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .toUpperCase();
}

for (let line of lines) {
    if (line.trim().startsWith('{')) {
        try {
            // Very loose parser for the specific format in data.ts
            const getVal = (key) => {
                const m = line.match(new RegExp(key + ":\\s*'([^']*)'"));
                return m ? m[1] : '';
            };
            
            officers.push({
                id: getVal('id'),
                category: getVal('category'),
                unit: getVal('unit'),
                rank: getVal('rank'),
                matricula: getVal('matricula'),
                name: getVal('name'),
                role: getVal('role'),
                contact: getVal('contact')
            });
        } catch (e) {}
    }
}

console.log('Original count:', officers.length);

// Grouping by "Person Identity" (Matricula is best, then normalized Name)
const personGroups = new Map();

for (const off of officers) {
    const normName = normalize(off.name);
    const matricula = off.matricula.trim();
    
    // Identity key: use matricula if valid, otherwise normalized name
    // (Note: some matriculas are '---' or '.')
    let identityKey = (matricula && matricula.length > 3 && matricula !== '---') ? `MAT:${matricula}` : `NAME:${normName}`;
    
    if (!personGroups.has(identityKey)) {
        personGroups.set(identityKey, []);
    }
    personGroups.get(identityKey).push(off);
}

const finalOfficers = [];

for (const [key, group] of personGroups.entries()) {
    if (group.length === 1) {
        finalOfficers.push(group[0]);
        continue;
    }
    
    // More than one entry for this person. Select the best one.
    // Criteria: 
    // 1. Not in 'Outros' category if another exists.
    // 2. Role is not 'Oficial' if another exists.
    // 3. Has a contact number.
    
    let best = group[0];
    for (const cand of group) {
        const bestIsGeneric = best.category === 'Outros' || best.role === 'Oficial';
        const candIsGeneric = cand.category === 'Outros' || cand.role === 'Oficial';
        
        if (bestIsGeneric && !candIsGeneric) {
            best = cand;
        } else if (!bestIsGeneric && !candIsGeneric) {
            // Both are specific. Keep the one with more info or just the first one.
            if (!best.contact && cand.contact) best = cand;
        }
    }
    finalOfficers.push(best);
}

console.log('Final count:', finalOfficers.length);

// Sort by name for better UX
finalOfficers.sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)));

// Serialize
let newContent = `import { Officer } from './types';\n\nexport const OFFICER_DATA: Officer[] = [\n`;
finalOfficers.forEach((off) => {
    newContent += `  { id: '${off.id}', category: '${off.category}', unit: '${off.unit}', rank: '${off.rank}', matricula: '${off.matricula}', name: '${off.name.trim().toUpperCase()}', role: '${off.role}', contact: '${off.contact}' },\n`;
});
newContent += `];\n\n`;

const labelsMatch = content.match(/export const CATEGORY_LABELS: Record<string, string> = (\{[\s\S]*?\});/);
if (labelsMatch) {
    newContent += `export const CATEGORY_LABELS: Record<string, string> = ${labelsMatch[1]};\n`;
}

fs.writeFileSync(dataPath, newContent);
console.log('Data cleaned and saved.');

// Also update CSV
let csv = 'id,category,unit,rank,matricula,name,role,contact\n';
finalOfficers.forEach(off => {
    csv += `${off.id},${off.category},${off.unit},${off.rank},${off.matricula},${off.name.trim().toUpperCase()},${off.role},${off.contact}\n`;
});
fs.writeFileSync(path.join(process.cwd(), 'contatos_pmal.csv'), csv);
