const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function run() {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    
    // 1. Delete from Supabase
    console.log('Deleting from Supabase...');
    const { data, error } = await supabase.from('officers').delete().eq('category', 'Outros');
    if (error) {
        console.error('Error deleting from supabase:', error);
    } else {
        console.log('Successfully deleted officers with category "Outros" from Supabase.');
    }

    // 2. Remove from data.ts
    console.log('Removing from data.ts...');
    const content = fs.readFileSync('data.ts', 'utf8');
    
    // The officers array is exported as OFFICER_DATA. We can do a string manipulation or just write a regex.
    // A regex to match { ... category: 'Outros' ... }, 
    // This is tricky because the objects span a single line. 
    // Wait, let's look at data.ts line 220. They are single line objects:
    // { id: 'out-...', category: 'Outros', ... },
    
    const lines = content.split('\n');
    const newLines = lines.filter(line => !line.includes("category: 'Outros'"));
    
    fs.writeFileSync('data.ts', newLines.join('\n'));
    console.log('Successfully removed "Outros" from data.ts');
}

run();
