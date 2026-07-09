# Receita de bolo — testar o WhatsApp com a Evolution API (local)

Objetivo: rodar a Evolution API no seu PC, conectar um WhatsApp e ver as
mensagens do app chegando **de verdade** no celular quando cria/cancela um
agendamento.

Tempo: ~20 min na primeira vez.

O que você vai precisar:
- **Docker Desktop** instalado e **aberto** (o bichinho da baleia rodando).
- Um **número de WhatsApp reserva** (não o seu pessoal) — ver aviso no fim.
- Um segundo número (pode ser o seu) pra **receber** a mensagem de teste.

---

## Passo 1 — Definir sua chave secreta

Abra o arquivo `evolution/docker-compose.yml` e troque esta linha por uma chave
sua (pode ser qualquer texto secreto, ex.: `minha-chave-123abc`):

```
AUTHENTICATION_API_KEY: troque-esta-chave-por-uma-secreta
```

Guarde essa chave — você vai usá-la mais pra frente.

---

## Passo 2 — Subir a Evolution

Abra o terminal **dentro da pasta `evolution`** e rode:

```bash
docker compose up -d
```

Na primeira vez ele baixa umas imagens (demora alguns minutos). Quando terminar,
confira se subiu:

```bash
docker compose ps
```

Os três (evolution_api, evolution_postgres, evolution_redis) devem aparecer como
"running/up".

Teste no navegador: abra **http://localhost:8080** — deve aparecer um textinho
JSON da Evolution (algo como "Welcome to the Evolution API"). Se apareceu, tá no ar.

---

## Passo 3 — Criar a instância e conectar o WhatsApp

A "instância" é a conexão com um número de WhatsApp. O jeito mais fácil é pela
telinha de gerenciamento:

1. Abra **http://localhost:8080/manager** no navegador.
2. Ele pede a **API Key** — cole a chave que você definiu no Passo 1.
3. Clique em **criar instância** (Instance / Create), dê um nome pra ela, por
   exemplo `barbearia`. Anote esse nome.
4. Vai aparecer um **QR code** na tela.
5. No celular do **número reserva**: abra o WhatsApp → **Aparelhos conectados**
   → **Conectar um aparelho** → aponte pro QR code da tela.
6. Quando conectar, o status da instância vira **open / conectado**.

> Se o QR sumir antes de você ler, é só clicar pra gerar de novo (ele expira
> rápido, uns 30–60s).

---

## Passo 4 — Testar a Evolution sozinha (antes do app)

Só pra confirmar que a Evolution está enviando. No terminal, troque
`SUA_CHAVE`, `barbearia` (se usou outro nome) e o número de destino
(55 + DDD + número, tudo junto):

```bash
curl -X POST http://localhost:8080/message/sendText/barbearia ^
  -H "apikey: SUA_CHAVE" ^
  -H "Content-Type: application/json" ^
  -d "{\"number\":\"5511999999999\",\"text\":\"Teste da Evolution\"}"
```

> No **PowerShell**, use este formato (o `^` acima é do Prompt de Comando):
> ```powershell
> curl.exe -X POST http://localhost:8080/message/sendText/barbearia `
>   -H "apikey: SUA_CHAVE" -H "Content-Type: application/json" `
>   -d '{\"number\":\"5511999999999\",\"text\":\"Teste da Evolution\"}'
> ```

Se a mensagem "Teste da Evolution" chegou no WhatsApp de destino, **a Evolution
está 100%**. Agora é só plugar no app.

---

## Passo 5 — Conectar o app na Evolution

Abra o `backend/.env` e preencha as 3 linhas (elas já existem, estão vazias):

```
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=SUA_CHAVE
EVOLUTION_INSTANCE=barbearia
```

(Use a mesma chave do Passo 1 e o mesmo nome de instância do Passo 3.)

**Reinicie o backend** (pare o `node src/server.js` e rode de novo). No boot,
ele deixa de estar em "modo simulado" e passa a enviar de verdade.

---

## Passo 6 — Testar ponta a ponta pelo app

1. Garanta que a conta que vai **receber** tem um WhatsApp **real** cadastrado.
   Ex.: no perfil do cliente e/ou do barbeiro, coloque o número (DDD + número; o
   app já põe o 55 na frente).
2. Faça um **agendamento** no app → o barbeiro recebe "novo agendamento" e o
   cliente recebe a confirmação.
3. **Cancele** esse agendamento → chega a mensagem de cancelamento.

Deu certo? Então o fluxo de WhatsApp está funcionando de verdade. 🎯

---

## Comandos úteis do dia a dia

```bash
docker compose logs -f evolution-api   # ver o que a Evolution está fazendo
docker compose stop                    # pausar (sem apagar nada)
docker compose up -d                   # ligar de novo
docker compose down                    # desligar e remover os containers
```

O WhatsApp conectado e os dados ficam salvos nos volumes do Docker, então parar
e ligar de novo **não** desconecta o número.

---

## Se der problema

- **`docker: command not found` ou "cannot connect to the Docker daemon"** → o
  Docker Desktop não está aberto/rodando. Abra o Docker Desktop, espere o ícone
  ficar estável e tente de novo.
- **Porta 8080 ocupada** → algum outro programa está usando a 8080. Feche-o, ou
  troque no compose `"8080:8080"` por `"8081:8080"` e use 8081 em tudo.
- **Erro por causa de nome de variável/imagem** (a Evolution muda entre
  versões) → me manda a saída de `docker compose logs evolution-api` que eu
  ajusto o compose.
- **A mensagem não chega** → confira: número no formato certo (55+DDD+número),
  instância "open" no manager, e que o `.env` tem as 3 variáveis + backend
  reiniciado.

---

## ⚠️ Aviso do número (importante)

Use um **número dedicado**, não o seu pessoal, e de preferência **aquecido**
(use ele como WhatsApp normal por alguns dias antes de automatizar). Como as
mensagens são só pra quem marcou horário (confirmação/cancelamento/lembrete),
o risco de bloqueio é baixo — mas número novo saindo disparando automático é o
que mais queima. Detalhe completo no `CLAUDE.md` › Notificações.
