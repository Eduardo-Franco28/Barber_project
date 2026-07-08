import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/app-error.js';

const COLUMNS = 'id, name, slug, active, created_at';

export async function findBySlug(slug) {
  const { data, error } = await supabase
    .from('barbershops')
    .select(COLUMNS)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Busca de barbearia por slug falhou: ${error.message}`);
  }

  return data;
}

export async function findById(id) {
  const { data, error } = await supabase
    .from('barbershops')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Busca de barbearia falhou: ${error.message}`);
  }

  return data;
}

export async function create({ name, slug }) {
  const { data, error } = await supabase
    .from('barbershops')
    .insert({ name, slug })
    .select(COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'Já existe uma barbearia com esse link (slug).');
    }
    throw new Error(`Criação de barbearia falhou: ${error.message}`);
  }

  return data;
}
