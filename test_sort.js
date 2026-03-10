const ranks = {
  'CEL': 1, 'TC': 2, 'MAJ': 3, 'CAP': 4,
  '1º TEN': 5, '2º TEN': 6, 'ASP': 7,
  'ST': 8, '1º SGT': 9, '2º SGT': 10, '3º SGT': 11,
  'CB': 12, 'SD': 13
};

const officers = [
  { name: 'ADEILSON LINS DE CARVALHO', rank: 'MAJ', role: 'Chefe de Gabinete do Comandante Geral c/c Chefe da Assessoria do Comandante Geral' },
  { name: 'ANDRE LUIS SOUZA DE FIGUEIROA', rank: 'CAP', role: 'Subchefe de Gabinete do Comandante Geral' },
  { name: 'ARLAN SIQUEIRA DE BARROS', rank: 'TC', role: 'Chefe da SPP' },
  { name: 'DAVID DELEON LOPES DA SILVA', rank: 'MAJ', role: 'Chefe da SPO' },
  { name: 'PAULO AMORIM FEITOSA FILHO', rank: 'CEL', role: 'Comandante Geral' },
  { name: 'SANDRO RICARDO DOS SANTOS', rank: 'TC', role: 'Chefe do Núcleo de Qualidade de Vida' }
];

const getPriority = (officer) => {
  let priority = 1000;
  const rankPrio = ranks[officer.rank.toUpperCase().trim()] || 100;
  priority += rankPrio * 10;
  const role = (officer.role || '').toLowerCase();
  if (role.includes('geral')) priority -= 50; 
  if (role.includes('comandante') || role.includes('diretor') || role.includes('chefe')) priority -= 30;
  if (role.includes('subcomandante') || role.includes('subdiretor') || role.includes('subchefe')) priority -= 15;
  
  return priority;
};

const sorted = officers.sort((a,b) => {
  const pA = getPriority(a);
  const pB = getPriority(b);
  if (pA !== pB) return pA - pB;
  return a.name.localeCompare(b.name);
});

console.log(sorted.map(o => `${o.name} - ${o.rank} - ${getPriority(o)}`));
