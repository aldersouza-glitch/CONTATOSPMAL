const fs = require('fs');
const content = fs.readFileSync('data.ts', 'utf8');
const ranks = [...new Set(content.match(/rank: '([^']+)'/g).map(m => m.match(/'([^']+)'/)[1]))];
console.log('RANKS:', JSON.stringify(ranks));
