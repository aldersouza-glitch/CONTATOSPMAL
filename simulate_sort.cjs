const fs = require('fs');

const content = fs.readFileSync('data.ts', 'utf8');

// extract officer objects simply using regex (ugly but quick just to see)
// Better yet: just compile the app logic or copy it.
const RANK_PRIORITY = {
      'CEL': 1, 'TC': 2, 'MAJ': 3, 'CAP': 4,
      '1º TEN': 5, '2º TEN': 6, 'ASP': 7,
      'ST': 8, '1º SGT': 9, '2º SGT': 10, '3º SGT': 11,
      'CB': 12, 'SD': 13
    };

    const getOfficerPriority = (officer) => {
      let priority = 10000;
      
      const rankKey = (officer.rank || '').toUpperCase().trim();
      const rankPrio = RANK_PRIORITY[rankKey] || 100;
      priority += rankPrio * 100;

      const role = (officer.role || '').toLowerCase();
      
      if (role.includes('subcomandante') || role.includes('subdiretor') || role.includes('subchefe')) {
        priority -= 20;
      } else if (role.includes('comandante') || role.includes('diretor') || role.includes('chefe')) {
        priority -= 40;
      }

      if (role.includes('geral')) {
        priority -= 10;
      }

      return priority;
    };


// let's extract raw JSON using regex
const rawObjects = content.match(/{[^}]+}/g);
const officers = rawObjects.map(str => {
    try {
        const nameMatch = str.match(/name:\s*'([^']+)'/);
        const rankMatch = str.match(/rank:\s*'([^']+)'/);
        const roleMatch = str.match(/role:\s*'([^']+)'/);
        const unitMatch = str.match(/unit:\s*'([^']+)'/);
        const catMatch = str.match(/category:\s*'([^']+)'/);
        if (nameMatch && rankMatch) {
            return {
                name: nameMatch[1],
                rank: rankMatch[1],
                role: roleMatch ? roleMatch[1] : '',
                unit: unitMatch ? unitMatch[1] : '',
                category: catMatch ? catMatch[1] : ''
            }
        }
    } catch(e) {}
    return null;
}).filter(o => o);

const cats = [...new Set(officers.map(o => o.category))];
for (const cat of cats) {
    const catOfficers = officers.filter(o => o.category === cat);
    catOfficers.sort((a,b) => {
        const p1 = getOfficerPriority(a);
        const p2 = getOfficerPriority(b);
        if (p1 !== p2) return p1 - p2;
        return a.name.localeCompare(b.name);
    });
    
    // Check if any TC comes before CEL
    let sawCel = false;
    let rankPlacements = [];
    console.log(`--- ${cat} ---`);
    for (const o of catOfficers) {
        console.log(`${o.rank.padEnd(6)} | ${o.name.padEnd(40)} | ${o.role} | Priority: ${getOfficerPriority(o)}`);
    }
}
