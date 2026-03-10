import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { OFFICER_DATA } from './data';

console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

async function migrate() {
    const { supabase } = await import('./lib/supabase');
    console.log('Iniciando migração...');

    // Limpa a tabela antes de inserir para remover lixo
    console.log('Limpando tabela para evitar duplicatas antigas...');
    const { error: deleteError } = await supabase.from('officers').delete().neq('id', 'void-id-to-delete-all');
    if (deleteError) console.error('Erro ao limpar:', deleteError);

    const { data, error } = await supabase
        .from('officers')
        .upsert(OFFICER_DATA.map(officer => ({
            id: officer.id,
            category: officer.category,
            unit: officer.unit,
            rank: officer.rank,
            matricula: officer.matricula,
            name: officer.name,
            role: officer.role,
            contact: officer.contact
        })), { onConflict: 'id' });

    if (error) {
        console.error('Erro na migração:', error);
    } else {
        console.log('Migração concluída com sucesso!');
    }
}

// Executa a migração
migrate();
