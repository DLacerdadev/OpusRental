# Fechar o ciclo fatura → pagamento → baixa

## What & Why
A maior parte da infraestrutura do ciclo já existe (endpoints públicos
de pagamento, página `/pay/:token` sem login, validação de assinatura
do webhook em produção, link público no e-mail). O ciclo ainda não
fecha por causa de **gaps pontuais**: chaves de Stripe e SMTP não
configuradas, dados do tenant Opus Capital vazios, PDF com nome/footer
hardcoded e sem logo nem link público, webhook que marca a fatura como
paga mas não registra em `payments` nem notifica, e e-mail que não
anexa PDF nem mostra instruções de PIX.

Esta tarefa fecha esses gaps para que um administrador da Opus Capital
consiga: gerar uma fatura, enviá-la para o cliente, o cliente pagar
via cartão (Stripe) ou ver as instruções de PIX/banco, e o sistema
marcar a fatura como paga, registrar o pagamento e notificar o admin.

## Done looks like
- Em **Configurações**, além dos campos de PIX/banco já existentes, o
  admin também consegue editar e salvar **e-mail de cobrança** e
  **logo** do tenant; os valores aparecem ao reabrir a tela.
- O **PDF da fatura** mostra o nome e o logo do tenant
  dinamicamente (sem "Opus Rental Capital" hardcoded) e inclui um
  bloco "Como Pagar" com link público da fatura e instruções PIX/banco
  do tenant.
- O **e-mail enviado ao cliente** anexa o PDF da fatura e mostra no
  corpo as instruções de PIX/banco do tenant, junto com o link público
  e o botão "Pagar fatura".
- Quando o cliente paga pelo Stripe, o **webhook `payment_intent.succeeded`**
  marca a fatura como `paid`, **insere uma linha na tabela `payments`**
  e **dispara uma notificação** para o admin/manager do tenant.
- A seção de **status de integrações** em Configurações ganha um
  item "Dados de cobrança do tenant" que fica vermelho enquanto
  PIX/banco/billing_email/logo estiverem vazios e verde quando
  preenchidos.
- As chaves `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `VITE_STRIPE_PUBLIC_KEY` e as variáveis SMTP estão configuradas no
  ambiente, e o tenant Opus Capital tem PIX/banco/billing_email/logo
  preenchidos.
- O `replit.md` ganha um runbook curto do teste manual ponta a ponta
  com cartão de teste `4242 4242 4242 4242`.

## Out of scope
- Stripe Connect / contas separadas por tenant (mantém uma única
  conta Stripe por instalação).
- Geração de boleto bancário brasileiro (mantém PIX + cartão Stripe).
- Cobrança recorrente automática por cartão salvo (assinaturas
  Stripe).
- Redesign visual do PDF (apenas substituir hardcoded por dinâmicos
  e adicionar o bloco "Como Pagar").
- Internacionalização do e-mail/PDF além de pt-BR e en-US, que já
  existem.
- Reescrita dos endpoints públicos `/api/public/invoices/:token` e
  da página `/pay/:token` — eles já funcionam.

## Estado atual (o que JÁ existe vs o que falta)

### Já pronto — não mexer
- Schema do tenant com colunas `pixKey`, `pixBeneficiary`, `bankName`,
  `bankAgency`, `bankAccount`, `billingEmail`, `logoUrl`.
- Inputs de PIX/banco em `settings.tsx` já wireados ao
  `PUT /api/tenant` com mutation, toast e load inicial via `useEffect`.
- `IntegrationStatusCard` já mostra status de Stripe/SMTP/WhatsApp
  lido de env vars.
- Endpoints públicos `GET /api/public/invoices/:token` e
  `POST /api/public/invoices/:token/payment-intent` funcionando, com
  tokens HMAC stateless gerados em `invoice-token.service.ts`.
- Página pública `/pay/:token` (`pay-invoice.tsx`) renderizando dados
  da fatura, instruções PIX e Stripe Elements sem exigir login.
- Webhook do Stripe com validação de assinatura (`stripe.webhooks.constructEvent`)
  e recusa em produção quando `STRIPE_WEBHOOK_SECRET` está ausente
  (retorna 530).
- Webhook marcando fatura como `paid` no `payment_intent.succeeded`
  para `invoice_payment`.
- E-mail com botão "Pagar fatura" apontando para o link público real
  via `buildPublicPaymentUrl`.

### Gaps a fechar
1. **Configuração**:
   - Variáveis de ambiente Stripe (`STRIPE_SECRET_KEY`,
     `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLIC_KEY`) não estão
     setadas — usar a integração `javascript_stripe` já instalada.
   - Variáveis SMTP (`SMTP_HOST/PORT/USER/PASS/FROM`) não estão
     setadas — escolher provedor (SendGrid via integração, Resend,
     Gmail) e configurar.
   - Tenant Opus Capital (id `141682d0-…`) com TODOS os campos de
     cobrança vazios. Preencher após a UI estar pronta.

2. **Settings (`client/src/pages/settings.tsx`)**: adicionar inputs de
   `billingEmail` e `logoUrl` ao formulário do tenant (schema já
   suporta, falta só a UI).

3. **PDF (`server/services/pdf.service.ts`)**:
   - Trocar `DEFAULT_BRAND_NAME = 'Opus Rental Capital'` (linha 83)
     pelo `tenant.name` do payload (já chega no `addHeader`/`addFooter`
     mas não é usado consistentemente).
   - Renderizar `tenant.logoUrl` como imagem no cabeçalho quando
     presente (download via `fetch` + `doc.image`, com fallback
     silencioso se a URL falhar).
   - Adicionar bloco "Como Pagar" com link público da fatura (gerado
     com `buildPublicPaymentUrl(invoice.id)`) e dados de PIX/banco
     do tenant.

4. **Webhook (`server/routes.ts` ~3943-4074)**: no ramo
   `payment_intent.succeeded` para `invoice_payment`, **inserir uma
   linha em `payments`** com tipo `invoice_payment`, valor, fatura,
   tenant; **disparar notificação** para o role manager/admin do
   tenant via `notification.service`.

5. **E-mail (`server/services/email.service.ts`)**: no
   `sendInvoiceEmail`, gerar o PDF com `PDFService` e anexá-lo ao
   e-mail; adicionar bloco no template HTML com chave PIX,
   beneficiário e dados bancários do tenant (quando preenchidos).

6. **Status checklist**: estender `IntegrationStatusCard` (ou a
   resposta de `/api/system/status`) para incluir "Dados de cobrança
   do tenant" — verde quando PIX/banco/billingEmail/logo estão
   preenchidos, vermelho com mensagem clara quando vazios.

7. **Runbook E2E**: adicionar ao `replit.md` uma seção curta com o
   passo a passo do teste manual: criar fatura → copiar link público
   da tabela ou da resposta da API → abrir em aba anônima → pagar com
   `4242 4242 4242 4242` → confirmar fatura `paid`, linha em
   `payments` e notificação para o admin.

## Steps
1. **Configurar segredos e dados do tenant** — Setar as chaves Stripe
   (a partir da integração já instalada) e as variáveis SMTP do
   provedor escolhido. Preencher PIX/banco/billing_email/logo do
   tenant Opus Capital direto no banco ou pela tela após o passo 2.
2. **Completar formulário de Configurações** — Adicionar os inputs de
   `billingEmail` e `logoUrl` à seção de cobrança do tenant em
   Settings, conectados à mesma mutation `PUT /api/tenant` já existente.
3. **Tornar o PDF dinâmico** — Substituir o nome/footer hardcoded por
   `tenant.name`, renderizar o `tenant.logoUrl` no cabeçalho e
   adicionar o bloco "Como Pagar" com link público + PIX/banco.
4. **Fechar o webhook** — No ramo `invoice_payment` do webhook,
   inserir o pagamento em `payments` e disparar notificação para o
   admin/manager do tenant.
5. **Robustecer o e-mail** — Anexar o PDF da fatura no
   `sendInvoiceEmail` e adicionar bloco de instruções PIX/banco no
   template HTML.
6. **Item "Tenant preenchido" no status** — Estender
   `IntegrationStatusCard` e `/api/system/status` para refletir se os
   dados de cobrança do tenant estão completos.
7. **Runbook ponta a ponta** — Documentar no `replit.md` o passo a
   passo do teste manual com cartão `4242` e checklist de verificação
   (fatura `paid`, linha em `payments`, notificação criada).

## Constraints arquiteturais
- Manter `STRIPE_SECRET_KEY` global (sem Stripe Connect).
- Não tocar nos endpoints públicos de pagamento já funcionando.
- Não alterar o esquema da tabela `invoices` (tokens são stateless via
  HMAC; não precisa de coluna nova).
- Validação de assinatura do webhook em produção é obrigatória — não
  reintroduzir fallback silencioso.

## Relevant files
- `shared/schema.ts:21-56`
- `server/routes.ts:3878,3943-4074`
- `server/services/email.service.ts:47-91,137-217,403-433`
- `server/services/pdf.service.ts:83,90,105,406-485`
- `server/services/invoice-token.service.ts`
- `server/services/notification.service.ts`
- `server/services/invoice-automation.service.ts`
- `client/src/pages/settings.tsx:108-155,247-520`
- `client/src/pages/pay-invoice.tsx`
- `client/src/pages/invoices.tsx`
- `replit.md`
