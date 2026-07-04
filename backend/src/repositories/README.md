# repositories/

Camada de acesso a dados (Supabase). Regra do projeto: services **nunca**
acessam o banco diretamente — sempre através de um repositório desta pasta,
para que a troca da implementação de dados não afete a regra de negócio.

O client fica em `src/config/supabase.js` (chave secreta, uso exclusivo do
servidor) e **só os repositórios** podem importá-lo.
