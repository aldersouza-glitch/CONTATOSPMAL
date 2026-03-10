/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { Officer } from '../types';

const supabaseUrl = (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL) ? process.env.VITE_SUPABASE_URL : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY) ? process.env.VITE_SUPABASE_ANON_KEY : import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getOfficers() {
  const { data, error } = await supabase
    .from('officers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Officer[];
}

export function subscribeToOfficers(callback: (payload: any) => void) {
  return supabase
    .channel('officers-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'officers'
      },
      (payload) => callback(payload)
    )
    .subscribe();
}
export async function upsertOfficer(officer: Omit<Officer, 'updated_at'>) {
  // Tenta sincronizar pelo ID ou Matricula se existir
  const { data, error } = await supabase
    .from('officers')
    .upsert([officer], { onConflict: 'id' })
    .select();

  if (error) throw error;
  return data;
}

export async function deleteOfficer(id: string) {
  const { error } = await supabase
    .from('officers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
