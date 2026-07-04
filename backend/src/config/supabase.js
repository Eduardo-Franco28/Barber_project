import { createClient } from '@supabase/supabase-js';

import env from './env.js';

// Cliente com a chave SECRETA: uso exclusivo do servidor, nunca chega ao front.
// A autorização por papel é feita em middleware (etapa 4); o RLS entra como
// última linha de defesa na etapa 5. Só os repositórios importam este client.
export const supabase = createClient(env.supabaseUrl, env.supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
