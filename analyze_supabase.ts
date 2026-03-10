
import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env') });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyze() {
    const { data: officers, error } = await supabase.from('officers').select('*');
    if (error) { console.error(error); return; }

    console.log('Total in Supabase:', officers.length);

    const nameGroups = new Map();
    for (const off of officers) {
        const name = off.name.trim().toUpperCase();
        if (!nameGroups.has(name)) nameGroups.set(name, []);
        nameGroups.get(name).push(off);
    }

    console.log('Unique names in Supabase:', nameGroups.size);

    let duplicatesCount = 0;
    for (const [name, group] of nameGroups.entries()) {
        if (group.length > 1) {
            console.log(`DUPLICATE NAME: "${name}" (${group.length} entries)`);
            group.forEach(o => {
                console.log(`  - ID: ${o.id}, MAT: ${o.matricula}, UNIT: ${o.unit}, ROLE: ${o.role}`);
            });
            duplicatesCount += (group.length - 1);
        }
    }
    console.log('Total entries that would be removed by name-only dedupe:', duplicatesCount);
}

analyze();
