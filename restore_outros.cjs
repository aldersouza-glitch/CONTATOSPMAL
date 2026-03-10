const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { OFFICER_DATA } = require('./backup_data.js'); // We'll make a standalone JS file for import

async function run() {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    
    const outros = OFFICER_DATA.filter(o => o.category === 'Outros');
    console.log(`Found ${outros.length} Outros officers. Inserting back to Supabase...`);
    
    if (outros.length > 0) {
        const { data, error } = await supabase.from('officers').upsert(outros);
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Restored to Supabase!');
        }
    }
}

run();
