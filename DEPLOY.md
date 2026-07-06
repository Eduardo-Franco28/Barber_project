# Deploy — Bryan Barbearia (Vercel + Render)

Arquitetura hospedada:

- **Front-end (React/Vite)** → **Vercel** (grátis)
- **Back-end (Express)** → **Render** (Web Service)
- **Banco** → **Supabase** (já hospedado; nada muda)

> O código já está pronto para esse cenário cross-domain (CORS por variável de
> ambiente, cookie `SameSite=None` em produção, `trust proxy`, planilha gerada
> em memória sem depender de disco). Só falta preencher as variáveis.

---

## 0. Antes de tudo

1. **Suba o código para um repositório no GitHub** (Vercel e Render puxam de lá).
2. **Aplique a migration `0003_reminders.sql`** no Supabase (SQL Editor), se ainda
   não aplicou — necessária para o lembrete de WhatsApp.
3. Tenha em mãos, do painel do Supabase (**Settings → API**): a **Project URL** e a
   **chave secreta** (`sb_secret_...` ou `service_role`).

---

## 1. Back-end no Render

1. https://render.com → **New → Web Service** → conecte o repositório.
2. Configuração:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (veja os avisos do item 4).
3. **Environment Variables** (aba Environment):

   | Chave | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `SUPABASE_URL` | a Project URL do Supabase |
   | `SUPABASE_SECRET_KEY` | a chave secreta do Supabase |
   | `JWT_SECRET` | um segredo forte¹ |
   | `BARBERSHOP_TIMEZONE` | `America/Sao_Paulo` |
   | `EXCEL_MIRROR_ENABLED` | `false` (disco do Render é efêmero) |
   | `CORS_ORIGIN` | a URL do Vercel (preencha depois do passo 2) |
   | `EVOLUTION_API_URL/API_KEY/INSTANCE` | opcionais (WhatsApp) |

   ¹ Gere com: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

   > **Não** defina `PORT` — o Render injeta a dele e o app já a usa.
4. Deploy. A URL fica algo como `https://bryan-barbearia.onrender.com`.
   Teste: abra `…/health` → deve responder `{"status":"ok","database":"ok"}`.
5. Crie a conta do barbeiro uma vez: no Render, **Shell** (aba do serviço) e rode
   `node scripts/seed-barber.js "Nome" email senha telefone`.

---

## 2. Front-end na Vercel

1. https://vercel.com → **Add New → Project** → importe o repositório.
2. Configuração:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (detectado automaticamente)
   - Build/Output ficam no padrão (o `frontend/vercel.json` já cuida das rotas SPA).
3. **Environment Variable:**

   | Chave | Valor |
   |---|---|
   | `VITE_API_URL` | a URL do Render (ex.: `https://bryan-barbearia.onrender.com`) |

4. Deploy. A URL fica algo como `https://bryan.vercel.app`.

---

## 3. Ligar os dois

1. Volte ao Render → `CORS_ORIGIN` = a URL exata do Vercel (ex.:
   `https://bryan.vercel.app`, sem barra no fim) → **Save** (redeploya).
2. Abra o site do Vercel, faça login. Se entrar e a sessão persistir, está pronto.

---

## 4. Avisos importantes do plano grátis

- **Render Free "dorme"** após ~15 min sem uso e leva ~30–60s para acordar na
  primeira requisição (a manhã abre lenta). Enquanto dorme, **o job de lembrete
  (~2h antes) não roda** — a confirmação no ato do agendamento continua
  funcionando, mas o lembrete pode atrasar/pular. Para lembretes confiáveis,
  suba para o plano pago do Render (sempre ligado) ou dispare o job por um cron
  externo.
- **Cookies em iPhone/Safari:** com front e back em domínios diferentes
  (`vercel.app` × `onrender.com`), o cookie de sessão é "de terceiros". Chrome
  e Firefox aceitam; **o Safari/iOS pode bloquear** e não manter o login. Como a
  barbearia é muito mobile/iPhone, a solução robusta é um **domínio próprio**
  (~R$40/ano): aponte `app.seudominio.com` para o Vercel e `api.seudominio.com`
  para o Render. Aí o cookie vira "do mesmo site" e funciona em todos os
  navegadores — e você pode definir `COOKIE_SAMESITE=lax` no Render.
- A planilha: o barbeiro baixa a versão sempre atual pelo botão **"Baixar
  planilha"** no painel (aba Agenda). Um arquivo baixado é uma foto do momento;
  para ver mudanças, baixe de novo (ou use a própria agenda do app, que é ao
  vivo).
