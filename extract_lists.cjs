const fs = require('fs');
const content = fs.readFileSync('data.ts', 'utf8');
const units = [...new Set(content.match(/unit: '([^']+)'/g).map(m => m.match(/'([^']+)'/)[1]))].sort();
const roles = [...new Set(content.match(/role: '([^']+)'/g).map(m => m.match(/'([^']+)'/)[1]))].sort();
console.log('UNITS:', JSON.stringify(units));
console.log('ROLES:', JSON.stringify(roles));
