import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/app-error.js';

// Nunca incluir password_hash aqui — só o login o lê, via findByEmail.
const PUBLIC_COLUMNS = 'id, name, email, phone, role, created_at';

// Retorna a linha completa (com password_hash) — uso interno do auth.service.
export async function findByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
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

export async function create({ name, email, phone, passwordHash, role }) {
  const { data, error } = await supabase
    .from('users')
    .insert({ name, email, phone, password_hash: passwordHash, role })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'E-mail já cadastrado.');
    }
    throw new Error(`Criação de usuário falhou: ${error.message}`);
  }

  return data;
}
