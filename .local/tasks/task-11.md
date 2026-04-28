---
title: Localizar fluxo de fatura para o mercado US
---
# Localizar fluxo de fatura para o mercado US

## What & Why
Hoje o sistema mistura idiomas e moedas: PDF sai em inglês com USD, mas o e-mail vai em português com R$, o Stripe está fixado em BRL (não cobra USD), e o checkout/cadastro do tenant usa terminologia brasileira (PIX, Agência, Conta Corrente/Poupança). Como o Opus Capital atende clientes nos EUA via OpusRental.com, todo o material que chega no cliente final precisa ser em inglês americano, em USD, com terminologia bancária ACH (Routing Number / Account Number) e com suporte a Sales Tax editável (zero por padrão). Isso é pré-requisito para colocar o sistema em produção.

## Done looks like
- O cliente recebe um e-mail em inglês ("Invoice #...", "Due Date", "Pay Now") com valor formatado em US$ (`$1,234.56`) e datas em MM/DD/YYYY.
- O PDF da fatura sai 100% em inglês, com bloco "How to Pay" mostrando ACH (Routing/Account) em vez de PIX/Agência, e a linha de Sales Tax aparece quando o tenant configurou alguma alíquota (caso contrário é omitida ou exibida como `Sales Tax: $0.00`).
- O Stripe cobra em USD — passar o cartão de teste `4242 4242 4242 4242` na página `/pay/:token` gera um PaymentIntent em `usd` e marca a fatura como paga normalmente.
- A página pública de pagamento `/pay/:token` mostra "Invoice #...", "Amount Due", "Pay with Card" tudo em inglês, com valor em US$.
- Em `Configurações → Billing Data`, o tenant vê os campos: **Bank Name, Routing Number, Account Number, Account Holder, Account Type (Checking/Savings)** — em vez de PIX/Agência/Conta. Há um novo campo **Default Sales Tax Rate (%)** com 0 por padrão.
- Ao criar/editar uma fatura, é possível sobrescrever a alíquota de Sales Tax dessa fatura específica (ainda numérica, em %), e o total final exibido no PDF/e-mail/checkout reflete o cálculo.
- Não sobra nenhum texto em PT-BR nem nenhum "R$"/"BRL" hardcoded nos artefatos do cliente final.

## Out of scope
- Configurar credenciais reais (Stripe Live, SMTP do provedor, apontar DNS de OpusRental.com) — fica para uma tarefa seguinte assim que o usuário tiver as contas criadas.
- Suporte multi-país/multi-moeda real (tenant com `country`/`currency`/`locale`) — agora é só US, hardcode `usd`/`en-US`.
- Cálculo de Sales Tax por estado/jurisdição via API externa (Avalara, TaxJar). O campo é uma alíquota única manual por tenant/fatura.
- NFS-e / nota fiscal eletrônica — não se aplica ao mercado US.
- Tradução de telas administrativas internas (Faturas, Contratos, Settings, etc.). Apenas o que vai para o cliente final precisa virar inglês.
- Apagar as colunas `pix_key`, `pix_beneficiary` do banco. Vamos só ocultá-las da UI e do output (evita migração destrutiva).

## Steps

1. **Atualizar schema e tipos** — Em `shared/schema.ts`, adicionar `salesTaxRate` na tabela `tenants` (numeric, default 0) e adicionar `salesTaxRate` + `salesTaxAmount` + `subtotal` na tabela `invoices`. Atualizar `insertTenantSchema` e `insertInvoiceSchema` correspondentes. Aplicar via `npm run db:push --force`.

2. **Adaptar o serviço de métodos de pagamento** — Em `server/services/payment-methods.service.ts`, traduzir todas as strings PT-BR para EN ("Bank Transfer", "Routing Number", "Account Number", "Holder", "Checking"/"Savings", "Pay online at"), trocar a formatação de `formatAmount` para `en-US`/`USD`, e remover a emissão do método `pix` (não vamos exibir PIX no mercado US, mesmo que o tenant tenha legado configurado).

3. **Traduzir e adaptar templates de e-mail** — Em `server/services/email.service.ts`, traduzir os 3 templates (nova fatura, lembrete antes do vencimento, lembrete de atraso, 2ª via) para inglês americano; trocar o locale de formatação de `pt-BR`/`BRL` para `en-US`/`USD`; ajustar o assunto dos e-mails ("Invoice #X", "Payment Reminder — Invoice #X", "Reissued Invoice #X"); incluir a linha de Sales Tax quando aplicável.

4. **Adaptar o PDF da fatura** — Em `server/services/pdf.service.ts`, garantir que a linha de Sales Tax apareça no bloco de totais (Subtotal → Sales Tax → Total) quando a fatura tiver alíquota > 0, e que o bloco "COMO PAGAR" use os textos em inglês vindos do passo 2. A formatação numérica do PDF já está em `en-US`/`USD`, manter.

5. **Trocar a moeda do Stripe** — Em `server/routes.ts`, na criação do PaymentIntent (`/api/invoices/:id/payment-intent` e qualquer outro ponto que crie PaymentIntent), trocar `currency: "brl"` por `currency: "usd"`. Recalcular o `amount` em centavos sobre o total já com Sales Tax incluído.

6. **Cálculo de Sales Tax na criação/edição da fatura** — Na rota `POST /api/contracts/:id/invoices`, na criação manual via `POST /api/invoices`, na geração automática (`server/services/invoice-automation.service.ts`) e na reissue, calcular `subtotal` (soma dos itens) → `salesTaxAmount` (subtotal × salesTaxRate / 100, arredondado a 2 casas) → `amount` (subtotal + salesTaxAmount). A alíquota usada deve ser a da fatura (se passada) ou cair para `tenant.salesTaxRate` como default.

7. **Atualizar página de Configurações (Billing Data)** — Em `client/src/pages/settings.tsx` (ou onde estiver o cartão "Dados de Cobrança"), substituir os labels PT-BR por EN ("Billing Email", "Logo URL", "Bank Name", "Routing Number", "Account Number", "Account Holder", "Account Type"); remover os campos de PIX da UI; adicionar o input "Default Sales Tax Rate (%)" com hint; e ajustar o cartão "Status do sistema → Dados de cobrança" para verificar `bankName + bankAccount + billingEmail` (sem PIX) e exibir os labels em EN.

8. **Atualizar a página pública de pagamento** — Em `client/src/pages/pay-invoice.tsx`, traduzir todos os textos para inglês ("Invoice", "Amount Due", "Pay with Card", "Successfully paid", "Already paid", "Cancelled", etc.); trocar `toLocaleString('pt-BR'/'BRL')` por `en-US`/`USD`; trocar `toLocaleDateString('pt-BR')` por `en-US`; trocar a inicialização do Stripe Elements para passar `currency: 'usd'`.

9. **Permitir editar Sales Tax no formulário de fatura** — Na tela admin de Faturas (`client/src/pages/invoices.tsx` e seu LineItemsManager), adicionar um campo opcional "Sales Tax Rate (%)" no formulário de criação/edição que pré-preenche com `tenant.salesTaxRate`. Mostrar Subtotal + Sales Tax + Total no rodapé do editor.

10. **Verificação manual ponta-a-ponta** — Criar um contrato de teste, gerar uma fatura, conferir que o PDF, o e-mail (preview HTML) e a página `/pay/:token` saem 100% em inglês com US$, com Sales Tax = 0 quando não configurado e cobrando corretamente quando alíquota > 0. Pagar com `4242 4242 4242 4242` e confirmar que o webhook fecha a fatura como `paid`.

## Relevant files
- `shared/schema.ts:21-56,166-210,729-810`
- `server/services/payment-methods.service.ts`
- `server/services/email.service.ts:140-200,220-580`
- `server/services/pdf.service.ts:340-700`
- `server/services/invoice-automation.service.ts`
- `server/routes.ts:4400-4470`
- `client/src/pages/settings.tsx`
- `client/src/pages/invoices.tsx`
- `client/src/pages/pay-invoice.tsx`