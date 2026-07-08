import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/app-error.js';

// Nunca incluir password_hash aqui — só o login o lê, via findByEmailInShop.
const PUBLIC_COLUMNS = 'id, name, email, phone, role, barbershop_id, created_at';

// Login é POR BARBEARIA: o e-mail é único dentro da barbearia (a mesma pessoa
// pode ter conta em barbearias diferentes). Retorna a linha completa (com
// password_hash) — uso interno do auth.service.
export async function findByEmailInShop(barbershopId, email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw new Error(`Busca de usuário por e-mail falhou: ${error.message}`);
  }

  return data;
}

export async function findById(id) {
  const { data, error } = await supabase
    .from('users')
    .select(PUBLIC_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Busca de usuário por id falhou: ${error.message}`);
  }

  return data;
}

// O barbeiro "dono" é o primeiro criado (created_at asc) — determinístico no
// MVP e pronto para virar parâmetro quando houver multi-barbeiro.
// DEPRECIADO no multi-tenant (mistura barbearias) — só ainda usado por
// excel/notifications até serem reescritos (etapas 3b/7).
export async function findBarber() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone')
    .eq('role', 'barber')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(`Busca do barbeiro falhou: ${error.message}`);
  }

  return data[0] ?? null;
}

// Barbeiros de uma barbearia (dono + barbeiros) — para o cliente escolher.
export async function findBarbersInShop(barbershopId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .eq('barbershop_id', barbershopId)
    .in('role', ['owner', 'barber'])
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Listagem de barbeiros falhou: ${error.message}`);
  }

  return data;
}

// Confirma que um barbeiro pertence à barbearia (isolamento).
export async function findBarberInShop(barbershopId, barberId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone')
    .eq('barbershop_id', barbershopId)
    .eq('id', barberId)
    .in('role', ['owner', 'barber'])
    .maybeSingle();

  if (error) {
    throw new Error(`Busca de barbeiro falhou: ${error.message}`);
  }

  return data;
}

// Só o fluxo de troca de senha lê o hash por id.
export async function findByIdWithPassword(id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, password_hash')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Busca de usuário falhou: ${error.message}`);
  }

  return data;
}

export async function updateProfile(id, { name, phone }) {
  const { data, error } = await supabase
    .from('users')
    .update({ name, phone })
    .eq('id', id)
    .select(PUBLIC_COLUMNS);

  if (error) {
    throw new Error(`Atualização de perfil falhou: ${error.message}`);
  }

  return data[0] ?? null;
}

export async function updatePassword(id, passwordHash) {
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', id)
    .select('id');

  if (error) {
    throw new Error(`Atualização de senha falhou: ${error.message}`);
  }

  return data[0] ?? null;
}

export async function create({ barbershopId, name, email, phone, passwordHash, role }) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      barbershop_id: barbershopId,
      name,
      email,
      phone,
      password_hash: passwordHash,
      role,
    })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'Este e-mail já tem conta nesta barbearia.');
    }
    throw new Error(`Criação de usuário falhou: ${error.message}`);
  }

  return data;
}
