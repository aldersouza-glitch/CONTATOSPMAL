const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function run() {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    
    console.log('Reading from data.ts...');
    const content = fs.readFileSync('data.ts', 'utf8');
    
    // Convert to objects
    const rawObjects = content.match(/{\s*id:[^}]+}/g);
    const officers = rawObjects.map(str => {
        try {
            const getStr = (key) => {
                const m = str.match(new RegExp(`${key}:\\s*'([^']+)'`));
                return m ? m[1] : '';
            };
            return {
                id: getStr('id'),
                category: getStr('category'),
                unit: getStr('unit'),
                rank: getStr('rank'),
                matricula: getStr('matricula'),
                name: getStr('name'),
                role: getStr('role'),
                contact: getStr('contact')
            }
        } catch(e) {}
        return null;
    }).filter(o => o);

    const outros = officers.filter(o => o.category === 'Outros');
    console.log(`Found ${outros.length} Outros officers in data.ts. Inserting into Supabase...`);
    
    if (outros.length > 0) {
        const { data, error } = await supabase.from('officers').upsert(outros);
        if (error) {
            console.error('Error inserting to supabase:', error);
        } else {
            console.log('Successfully upserted officers with category "Outros" to Supabase.');
        }
    } else {
        console.log('No Outros found in data.ts');
    }
}

run();
