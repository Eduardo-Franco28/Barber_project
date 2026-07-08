import { supabase } from '../config/supabase.js';

const COLUMNS = 'id, barber_id, name, duration_minutes, price, active, created_at';

// Health check — só confirma conectividade (conta serviços de todas as lojas).
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

// Serviços são POR BARBEIRO. Gestão (barbeiro vê os seus, inclusive inativos).
export async function findAllByBarber(barberId) {
  const { data, error } = await supabase
    .from('services')
    .select(COLUMNS)
    .eq('barber_id', barberId)
    .order('name');

  if (error) {
    throw new Error(`Listagem de serviços falhou: ${error.message}`);
  }

  return data;
}

// Cliente vê só os ativos de um barbeiro.
export async function findActiveByBarber(barberId) {
  const { data, error } = await supabase
    .from('services')
    .select(COLUMNS)
    .eq('barber_id', barberId)
    .eq('active', true)
    .order('name');

  if (error) {
    throw new Error(`Listagem de serviços ativos falhou: ${error.message}`);
  }

  return data;
}

// Valida que os serviços escolhidos são DAQUELE barbeiro e estão ativos
// (usado na disponibilidade/agendamento — etapa 3b).
export async function findActiveByIdsForBarber(barberId, ids) {
  const { data, error } = await supabase
    .from('services')
    .select(COLUMNS)
    .eq('barber_id', barberId)
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

// Atualiza só se o serviço for DO PRÓPRIO barbeiro (barber_id). Retorna null
// se não existir ou não for dele.
export async function update(id, barberId, fields) {
  const { data, error } = await supabase
    .from('services')
    .update(fields)
    .eq('id', id)
    .eq('barber_id', barberId)
    .select(COLUMNS);

  if (error) {
    throw new Error(`Atualização de serviço falhou: ${error.message}`);
  }

  return data[0] ?? null;
}
