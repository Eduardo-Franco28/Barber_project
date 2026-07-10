# Guia de operação — Bryan Barbearia

Como cadastrar uma **nova barbearia**, adicionar um **novo barbeiro** e como
fazer isso valer **em produção** (no site que está no ar).

> Escrito pra você seguir passo a passo, mesmo sem ser técnico. Comandos são
> rodados no terminal, dentro da pasta `backend`.

---

## 0. Conceitos rápidos (leia antes)

- **Dois bancos separados.** Existe o banco de **teste** (staging) e o de
  **produção** (o que o site no ar usa). São independentes: o que você cria num
  **não** aparece no outro.
- **Os scripts mexem no banco pra onde o `backend/.env` estiver apontando.**
  Se o `.env` aponta pra staging, você cria em staging. Se aponta pra produção,
  cria em produção. É só isso que muda.
- **Cada barbearia tem um link próprio:** `.../b/<slug>`. O *slug* é o apelido
  da barbearia no link (ex.: `barbearia-do-ze`). O dono e os clientes entram
  por esse link.
- **Nunca comite o `.env`** (ele tem segredos). Ele já está no `.gitignore`.

---

## 1. Cadastrar uma nova barbearia

Cria a barbearia **+ o dono** dela (com horário e configuração padrão).

Na pasta `backend`, rode:

```bash
node scripts/create-barbershop.js "Nome da Barbearia" "slug" "Nome do Dono" email senha telefone
```

Exemplo:

```bash
node scripts/create-barbershop.js "Barbearia do Zé" "barbearia-do-ze" "Zé" ze@email.com Senha123 11999998888
```

O que acontece:
- Cria a barbearia com o link `/b/barbearia-do-ze`.
- Cria o **dono** (papel `owner`) com esse e-mail/senha — ele já entra e
  gerencia tudo.
- Já deixa horário padrão (seg–sáb, 09h–19h; domingo fechado) e o intervalo
  padrão de 50 min. O dono ajusta depois no painel.

Regras do **slug**: só letras minúsculas, números e hífen (ex.:
`barbearia-do-ze`, `barber-centro`). Se você não passar um slug válido, o
sistema gera um a partir do nome.

**Como o dono entra:** abre `.../b/barbearia-do-ze`, faz login com o e-mail e a
senha acima, e cai no painel. Lá ele cadastra os **serviços** (corte, barba,
preços, duração), ajusta horários, bloqueios etc.

---

## 2. Cadastrar um novo barbeiro numa barbearia existente

Adiciona um barbeiro (papel `barber`) numa barbearia que **já existe**, pelo
slug dela. O barbeiro entra pelo mesmo link e gerencia a **própria** agenda e
os **próprios** serviços.

Na pasta `backend`, rode:

```bash
node scripts/add-barber.js "slug-da-barbearia" "Nome do Barbeiro" email senha telefone
```

Exemplo:

```bash
node scripts/add-barber.js "barbearia-do-ze" "Carlos" carlos@email.com Senha123 11999997777
```

O que acontece:
- Cria o barbeiro dentro da **Barbearia do Zé**.
- Já deixa horário e intervalo padrão (ele ajusta no painel).
- **Não cria serviços** — o próprio barbeiro entra e cadastra os dele.

**Depois de criar:** o barbeiro abre `.../b/barbearia-do-ze`, faz login com o
e-mail/senha, e cadastra os serviços dele.

**Como fica pro cliente:** quando a barbearia tem **2 ou mais** barbeiros, o
cliente vê um passo **"Escolha o barbeiro"** na hora de marcar, e ao escolher
um, aparecem **os serviços daquele barbeiro**. Com **um só** barbeiro, esse
passo nem aparece — ele já vem escolhido.

---

## 3. Fazer tudo isso valer em PRODUÇÃO (site no ar)

Há duas coisas diferentes aqui: **atualizar o código** e **criar dados
(barbearia/barbeiro) no banco de produção**.

### 3.1. Atualizar o CÓDIGO em produção

O deploy é **automático**: assim que você faz `git push` pra branch `main` no
GitHub, o **Render** (back-end) e a **Vercel** (front-end) reconstroem e
sobem sozinhos. Você não precisa apertar nada.

```bash
git add -A
git commit -m "sua mensagem"
git push
```

Espere alguns minutos e o site no ar já está com a nova versão.

> ⚠️ **Confira as variáveis de ambiente no Render/Vercel** antes de confiar no
> deploy. Elas moram no painel de cada serviço (não no código). Veja o
> `DEPLOY.md` para a lista.

### 3.2. A virada única do multi-barbearia (migrações 0004 e 0005)

O banco de **produção** ainda está no formato antigo (uma barbearia só). Antes
de o sistema multi-barbearia funcionar no ar, é preciso rodar **uma vez** as
migrações que faltam no banco de produção:

1. Entre no painel do **Supabase de produção**.
2. Abra **SQL Editor**.
3. Cole e execute o conteúdo de `backend/db/migrations/0004_multi_tenant.sql`.
4. Cole e execute o conteúdo de `backend/db/migrations/0005_whatsapp_instance.sql`.

A 0004 adiciona a tabela de barbearias e prepara as demais; a 0005 adiciona o
número de WhatsApp por barbearia. É feito **só uma vez**. (No banco de teste já
foi feito.)

### 3.3. Criar uma barbearia/barbeiro DIRETO em produção

O Render (plano free) não te dá um terminal no servidor. O jeito é rodar os
mesmos scripts da sua máquina, mas **apontando pro banco de produção**:

1. Abra `backend/.env`.
2. Troque **temporariamente** estas duas linhas pelos valores de **produção**
   (pegue no Supabase de produção → Project Settings → API):
   - `SUPABASE_URL=` → a *Project URL* pura (ex.: `https://xxxx.supabase.co`),
     **sem** `/rest/v1` no final.
   - `SUPABASE_SECRET_KEY=` → a chave secreta (**service_role**) de produção.
3. Rode o script normalmente:
   ```bash
   node scripts/create-barbershop.js "Nome" "slug" "Dono" email senha telefone
   # ou
   node scripts/add-barber.js "slug" "Barbeiro" email senha telefone
   ```
4. **IMPORTANTE:** ao terminar, **desfaça** a troca e volte o `.env` pros
   valores de teste. Assim você não mexe em produção sem querer no dia a dia.

> 💡 Dica pra não se confundir: mantenha um bloco comentado no `.env` com os
> valores de produção, e só descomente na hora de rodar em prod. Nunca comite
> esse arquivo.

---

## 4. Ativar as notificações no WhatsApp (Evolution API)

O app manda mensagem **só para o barbeiro** (o cliente vê tudo no app):

| Quando | Quem recebe |
|---|---|
| Novo agendamento | Barbeiro daquele agendamento |
| Cliente cancela | Barbeiro (o horário abriu de novo) |

Clientes **não** recebem WhatsApp, e **não há mais lembrete de 2h** — isso
reduz o volume e o risco de bloqueio do número.

**Cada barbearia envia pelo próprio número.** O servidor da Evolution é um só
(compartilhado); o número de cada barbearia é a "instância" dela, guardada no
banco. Você define a instância ao criar (`create-barbershop.js`, último arg) ou
depois: `node scripts/set-whatsapp-instance.js "slug" "nome-da-instancia"`.

**Enquanto a barbearia não tiver instância** (ou sem os `EVOLUTION_*`
preenchidos), o envio roda em **modo simulado**: aparece só no log e nada é
enviado. É o padrão pra desenvolver/testar.

**Pra ativar de verdade**, preencha no ambiente (no `.env` local, ou no painel
do Render) — **sem tocar no código**:

```
EVOLUTION_API_URL=https://sua-evolution.com   # servidor da Evolution (VPS)
EVOLUTION_API_KEY=sua-chave
EVOLUTION_INSTANCE=                            # deixe VAZIO: a instância vem da barbearia
```

Pra rodar a Evolution na sua máquina e testar antes de comprar servidor, siga o
`EVOLUTION-LOCAL.md`.

> ⚠️ Use um número de WhatsApp **dedicado** por barbearia (não o pessoal do
> barbeiro). A Evolution conecta como um "WhatsApp Web" automatizado, então há
> um risco (baixo, no volume de uma barbearia) de bloqueio. Um número por
> barbearia isola esse risco. Detalhes no `CLAUDE.md` › Notificações.
>
> ⚠️ Pra vender, a Evolution precisa rodar numa **VPS com URL pública** — não
> no seu PC (`localhost` só funciona na sua máquina). Um servidor atende todas
> as barbearias.

---

## 5. Resumo rápido (cola)

| O que quero | Comando (na pasta `backend`) |
|---|---|
| Nova barbearia | `node scripts/create-barbershop.js "Nome" "slug" "Dono" email senha telefone` |
| Novo barbeiro | `node scripts/add-barber.js "slug" "Barbeiro" email senha telefone` |
| Atualizar código no ar | `git add -A && git commit -m "..." && git push` |
| Criar em produção | apontar `SUPABASE_URL`/`SUPABASE_SECRET_KEY` do `.env` pra prod, rodar o script, **voltar o `.env`** |

**Sempre:** o dono/barbeiro entra pelo link `.../b/<slug>`, faz login e cadastra
os serviços dele no painel.
