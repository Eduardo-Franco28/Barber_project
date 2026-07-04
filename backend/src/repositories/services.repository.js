import { supabase } from '../config/supabase.js';

const COLUMNS = 'id, name, duration_minutes, price, active, created_at';

// GET de verdade (sem head): respostas HEAD sem corpo já mascararam um erro
// de URL do Supabase retornando "sucesso" com count nulo.
export async function countAll() {
  const { count, error } = await supabase
    .from('services')
    .select('id', { count: 'exact' })
    .limit(1);

  if (error) {
    throw new Error(`Consulta a services falhou: ${error.message}`);
  }
  if (count === null) {
    throw new Error('Consulta a services não retornou contagem — resposta inesperada do banco.');
  }

  return count;
}

export async function findAll() {
  const { data, error } = await supabase.from('services').select(COLUMNS).order('name');

  if (error) {
    throw new Error(`Listagem de serviços falhou: ${error.message}`);
  }

  return data;
}

export async function findActive() {
  const { data, error } = await supabase
    .from('services')
    .select(COLUMNS)
    .eq('active', true)
    .order('name');

  if (error) {
    throw new Error(`Listagem de serviços ativos falhou: ${error.message}`);
  }

  return data;
}

export async function findActiveByIds(ids) {
  const { data, error } = await supabase
    .from('services')
    .select(COLUMNS)
    .in('id', ids)
    .eq('active', true);

  if (error) {
    throw new Error(`Busca de serviços por id falhou: ${error.message}`);
  }

  return data;
}

export async function create(fields) {
  const { data, error } = await supabase.from('services').insert(fields).select(COLUMNS).single();

  if (error) {
    throw new Error(`Criação de serviço falhou: ${error.message}`);
  }

  return data;
}

// Retorna a linha atualizada, ou null se o id não existir.
export async function update(id, fields) {
  const { data, error } = await supabase
    .from('services')
    .update(fields)
    .eq('id', id)
    .select(COLUMNS);

  if (error) {
    throw new Error(`Atualização de serviço falhou: ${error.message}`);
  }

  return data[0] ?? null;
}
