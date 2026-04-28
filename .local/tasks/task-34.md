---
title: Fechar o ciclo fatura → pagamento → baixa de ponta a ponta
---
# Fechar o ciclo "fatura → pagamento → baixa" de ponta a ponta

## What & Why
O sistema já gera faturas (manual, "gerar agora" e cron mensal) e tem
endpoints de Stripe e PDF, mas hoje o ciclo NÃO fecha por uma combinação
de configuração ausente, telas incompletas e chamadas que dependem de
dados que ninguém preencheu. O resultado prático é: a fatura é criada,
mas o cliente não recebe um link de pagamento utilizável, o PDF não
mostra os dados do tenant correto, o checkout exige login e o webhook
do Stripe não chega de volta para marcar a fatura como paga.

Esta tarefa fecha esses gaps para que um administrador da Opus Capital
consiga: gerar uma fatura, enviá-la para o cliente, o cliente pagar via
Stripe (cartão) ou ver as instruções de PIX/boleto, e o sistema marcar
automaticamente a fatura como paga.

## Done looks like
- Em **Configurações** o admin consegue salvar (e ver salvos) os dados
  de cobrança do tenant Opus Capital: nome de exibição, e-mail de
  cobrança, logo, PIX (chave + beneficiário) e banco completo.
- O PDF da fatura mostra o nome, logo e dados de pagamento do tenant
  dinamicamente — nada hardcoded como "Opus Rental Capital".
- Cada fatura tem um link público de pagamento (sem precisar logar) que
  abre uma página com os dados da fatura, instruções de PIX/banco
  visíveis e o checkout do Stripe (cartão) embutido.
- Esse link é incluído no e-mail enviado ao cliente quando a fatura é
  emitida (e no WhatsApp, se o canal estiver habilitado).
- O webhook do Stripe valida assinatura, marca a fatura como `paid`,
  registra o pagamento na tabela `payments`/audit log e dispara
  notificação. Em produção, a validação de assinatura é obrigatória
  (sem o fallback silencioso de "aceitar qualquer body").
- Existe uma tela ou página de "verificação" que mostra ao admin o
  status das integrações necessárias (Stripe configurado? SMTP
  configurado? dados do tenant preenchidos?), com mensagens claras
  sobre o que ainda falta.
- Documentado um teste manual ponta a ponta: criar fatura → abrir link
  público → pagar com cartão de teste do Stripe → ver fatura virar
  "paga" automaticamente.

## Out of scope
- Stripe Connect / contas separadas por tenant (mantém uma única conta
  Stripe por instalação, com `STRIPE_SECRET_KEY` global).
- Geração de boleto bancário brasileiro (mantém PIX + cartão Stripe).
- Cobrança recorrente automática por cartão salvo (assinaturas Stripe).
- Reformatar visual do PDF (apenas substituir os campos hardcoded por
  dinâmicos; redesign fica para outra tarefa).
- Internacionalização do e-mail/PDF além de pt-BR e en-US, que já existem.

## Estado atual (o que está faltando — diagnóstico)

### 1. Configuração / segredos
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `VITE_STRIPE_PUBLIC_KEY`
  não estão setados como variáveis de ambiente. A integração
  `javascript_stripe` está instalada — usá-la para popular essas
  chaves em desenvolvimento e produção.
- Variáveis SMTP (`SMTP_HOST/PORT/USER/PASS/FROM`) não estão setadas.
  Em desenvolvimento o e-mail só vai para `console.info`. Definir
  qual provedor de e-mail usar (ex.: SendGrid via integração Replit,
  SMTP do Gmail, Resend) e configurar.
- A linha de Opus Capital em `tenants` está com TODOS os campos de
  pagamento vazios (`pix_key`, `pix_beneficiary`, `bank_*`,
  `billing_email`, `logo_url`).

### 2. Tela de Configurações
- A seção de PIX e banco em `client/src/pages/settings.tsx` está
  visualmente pronta, mas precisa garantir que a mutação realmente
  salva esses campos via `PUT /api/tenant` e que o tenant retorna os
  campos atualizados.
- A seção de Stripe / SMTP existe na tela mas os inputs estão
  desconectados (sem `onChange`/mutation). Decidir se essas
  configurações ficam só por env var (recomendado para chaves) ou se
  vão para a tabela `tenants` também. Caso fiquem por env var, ocultar
  os inputs e mostrar só status (configurado / não configurado).

### 3. PDF
- `server/services/pdf.service.ts:90,105` tem "Opus Rental Capital"
  hardcoded no cabeçalho e no rodapé. Trocar pelo `tenant.name`
  (já existe `tenant` no payload de invoice data).
- O `tenant.logoUrl` não é renderizado no PDF; adicionar como imagem
  no cabeçalho quando presente.
- Adicionar URL do link público de pagamento (e/ou QR Code) no bloco
  de "Como Pagar".

### 4. Checkout público (cliente final)
- `POST /api/stripe/create-invoice-payment` exige `isAuthenticated`,
  então um cliente da Opus Capital sem usuário no sistema não
  consegue pagar pelo link recebido.
- Criar um endpoint público `POST /api/public/invoices/:token/pay`
  (ou similar) que aceita um token assinado curto associado à fatura
  e cria o PaymentIntent. O token entra no e-mail/WhatsApp.
- Página `client/src/pages/checkout-invoice.tsx` precisa ter uma
  variante pública (ou rota dedicada `/pay/:token`) que carrega os
  dados da fatura via `GET /api/public/invoices/:token` (read-only),
  mostra dados de pagamento (PIX + banco) e renderiza o Stripe
  Elements quando `VITE_STRIPE_PUBLIC_KEY` estiver configurada.

### 5. Webhook Stripe
- `POST /api/stripe/webhook` (`server/routes.ts:3928-3949`) hoje aceita
  o body sem validar assinatura quando `STRIPE_WEBHOOK_SECRET` não está
  setado. Em `NODE_ENV === "production"` recusar a requisição se o
  segredo não existir, em vez do fallback silencioso.
- Garantir que após `payment_intent.succeeded` a fatura seja marcada
  como `paid`, criada a linha em `payments` e disparada notificação
  para o admin/manager.

### 6. E-mail
- `EmailService.sendInvoiceEmail` tem `href="#"` no botão "View Invoice
  Details" — substituir pelo link público da fatura (token).
- Anexar o PDF da fatura ao e-mail (já existe `PDFService` para gerar).
- Garantir que o template inclui o número da fatura, valor, data de
  vencimento e instruções de PIX do tenant.

### 7. Tela de status de integrações
- Criar uma seção em Configurações (ou página própria `/system-status`)
  que mostra um checklist visível ao admin: Stripe (sk + webhook + pk
  do front), SMTP, dados de cobrança do tenant, logo. Cada item com
  ícone "ok / faltando" e instruções para resolver.

## Steps
1. **Configurar segredos** — Setar `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLIC_KEY` (a partir da
   integração de Stripe já instalada) e as variáveis SMTP do provedor
   escolhido. Validar que o servidor sobe sem erros e que a integração
   de Stripe responde no modo de teste.
2. **Completar Configurações do tenant** — Conectar de fato os inputs
   de PIX/banco/e-mail de cobrança/logo à mutação `PUT /api/tenant` na
   tela de Configurações; mostrar feedback de sucesso/erro; carregar os
   valores atuais ao abrir a tela. Esconder ou converter em "status"
   os blocos de Stripe/SMTP que não vão para o banco.
3. **Tornar o PDF dinâmico** — Substituir nome/rodapé hardcoded por
   `tenant.name`, renderizar `tenant.logoUrl` (quando houver) e incluir
   o link público de pagamento no bloco "Como Pagar".
4. **Link público de pagamento** — Criar um token assinado por fatura,
   um endpoint público de leitura `GET /api/public/invoices/:token` e
   um endpoint público de criação de PaymentIntent
   `POST /api/public/invoices/:token/pay`. Adicionar a rota `/pay/:token`
   no front, reusando o componente atual de checkout, sem exigir login.
5. **Robustecer o webhook** — Em produção, recusar requisições sem
   `STRIPE_WEBHOOK_SECRET` configurado. Confirmar que
   `payment_intent.succeeded` marca a fatura como paga, registra em
   `payments` e dispara notificação.
6. **E-mail completo** — Trocar o link do botão pelo link público,
   anexar o PDF da fatura e garantir que o e-mail é enviado tanto na
   geração manual quanto na geração via cron.
7. **Checklist de integrações para o admin** — Adicionar uma seção em
   Configurações que mostra o que está pronto e o que falta (Stripe,
   SMTP, dados do tenant), com instruções diretas em cada item que não
   estiver ok.
8. **Teste ponta a ponta documentado** — Escrever no `replit.md` um
   roteiro curto: criar uma fatura para o cliente XTREME → copiar o
   link público → pagar com `4242 4242 4242 4242` → confirmar que a
   fatura aparece como paga, que existe registro em `payments` e que o
   admin recebeu notificação.

## Relevant files
- `shared/schema.ts:21-56`
- `server/routes.ts:58-65,304,3802-3950`
- `server/services/email.service.ts:37-103,122-190,380`
- `server/services/payment-validation.service.ts`
- `server/services/payment-methods.service.ts`
- `server/services/pdf.service.ts:90,105,406-485`
- `server/services/invoice-automation.service.ts`
- `server/policies.ts`
- `client/src/pages/settings.tsx:247-520`
- `client/src/pages/invoices.tsx`
- `client/src/pages/checkout-invoice.tsx`
- `client/src/pages/rental-contracts.tsx`
- `client/src/App.tsx`