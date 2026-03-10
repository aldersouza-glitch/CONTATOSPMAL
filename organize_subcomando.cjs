
const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'data.ts');
let content = fs.readFileSync(dataPath, 'utf8');

// List of people who should be in "Subcomando" based on the image
const subcomandoPeople = [
    { name: 'NEYVALDO JOSÉ AMORIM DA SILVA', role: 'SubComandante Geral', contact: '99942-6194' },
    { name: 'MARCELO FERREIRA LIMA VALOES', role: 'Chefe da Assessoria do Subcomandante Geral', contact: '98894-1958' },
    { name: 'LUCIANA LEITE SARMENTO', role: 'Chefe da Ouvidoria Geral', contact: '99341-0407' },
    { name: 'GERILO ALVES DE OLIVEIRA', role: 'Chefe da Ajudância Geral', contact: '99142-4292' },
    { name: 'IGOR SARMENTO FIRMINO', role: 'Subchefe da Assessoria do Subcomandante Geral', contact: '99953-3113' },
    { name: 'MARIANA CESAR GOIS CAETANO TOLEDO', role: 'Subchefe da Ajudância Geral c/c Chefe da Secretaria da Ajudância Geral', contact: '99610-6162' },
    { name: 'JOSE ANDERSON BOMFIM BARROS', role: 'Chefe da Seção de Atendimento ao Público da Ouvidoria Geral', contact: '999220496' },
    { name: 'EURICO CORREIA LEAL', role: 'Chefe da Seção de Serviço de Informações ao Cidadão da Ouvidoria Geral', contact: '98855-0898' }
];

// Extraction again for processing
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
            id: getVal('id'),
            category: getVal('category'),
            unit: getVal('unit'),
            rank: getVal('rank'),
            matricula: getVal('matricula'),
            name: getVal('name').trim().toUpperCase(),
            role: getVal('role'),
            contact: getVal('contact')
        });
    }
}

// Update categories and roles for the Subcomando group
for (let off of officers) {
    const sub = subcomandoPeople.find(p => p.name.toUpperCase() === off.name);
    if (sub) {
        off.category = 'Subcomando';
        off.unit = 'Subcomando Geral';
        off.role = sub.role;
        off.contact = sub.contact;
    }
}

// Re-serialize
let newDataStr = '[\n';
officers.forEach(off => {
    newDataStr += `  { id: '${off.id}', category: '${off.category}', unit: '${off.unit}', rank: '${off.rank}', matricula: '${off.matricula}', name: '${off.name}', role: '${off.role}', contact: '${off.contact}' },\n`;
});
newDataStr += ']';

const newContent = content.replace(/export const OFFICER_DATA: Officer\[\] = \[[\s\S]*?\];/, `export const OFFICER_DATA: Officer[] = ${newDataStr};`);
fs.writeFileSync(dataPath, newContent);
console.log('Organized Subcomando in data.ts');
