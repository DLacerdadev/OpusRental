---
title: 2ª Via de Fatura e Dia de Vencimento
---
# 2ª Via de Fatura e Dia de Vencimento

## What & Why

O sistema já tem geração automática de faturas via contratos de locação, mas dois comportamentos críticos estão faltando:

1. O campo `invoiceDayOfMonth` existe no banco e na tela de contrato, mas o serviço de automação o ignora — a data de vencimento sempre cai D+15 após a geração, independente do dia configurado.
2. Não existe mecanismo de 2ª via: quando o cliente pede reemissão de uma fatura em aberto, não há como fazer isso sem duplicar ou entrar no banco manualmente.

## Done looks like

- Na tela de faturas, cada fatura com status `pending` ou `overdue` exibe um botão "2ª Via" que reemite a fatura (mesmo ID, mesmo número de fatura, mesmo valor) com nova data de vencimento, marcando status como `reissued`.
- Faturas pagas mostram mensagem informando que já estão quitadas ao tentar reemitir.
- A geração automática mensal respeita o campo `invoiceDayOfMonth` do contrato para calcular a data de vencimento (ex: contrato com dia 5 → vencimento sempre no dia 5 do mês seguinte).
- O status `reissued` aparece com badge visual distinto na tabela de faturas e nos filtros.

## Out of scope

- Geração de PDF automático da 2ª via (impressão/download já existente não muda).
- Alteração do valor da fatura na reemissão.
- Notificação automática por WhatsApp/email na 2ª via (pode ser adicionada futuramente).
- Qualquer mudança no fluxo de pagamento via Stripe.

## Steps

1. **Adicionar status `reissued` ao schema** — Adicionar `reissued` ao enum/check do campo `status` da tabela `invoices` no schema Drizzle e rodar `db:push` para sincronizar o banco.
2. **Corrigir cálculo de vencimento na automação** — No `InvoiceAutomationService.generateMonthlyInvoices()`, calcular a `dueDate` usando `invoiceDayOfMonth` do contrato em vez de `today + paymentDueDays`. Se o dia já passou no mês corrente, usar o mesmo dia do próximo mês.
3. **Endpoint de 2ª via** — Criar `POST /api/invoices/:id/reissue` protegido por manager/admin: localiza a fatura, rejeita se já estiver paga, atualiza `dueDate` para nova data de vencimento calculada a partir de hoje + `paymentDueDays` do contrato, muda status para `reissued`, e registra no audit log.
4. **Storage para reemissão** — Adicionar método `reissueInvoice(id, newDueDate, tenantId)` ao `IStorage` e `DatabaseStorage`.
5. **Botão e lógica no frontend** — Na página de faturas (`invoices.tsx`), adicionar botão "2ª Via" em cada linha com status `pending` ou `overdue`, abrindo dialog de confirmação com nova data de vencimento. Após confirmação, chama a mutation e invalida o cache.
6. **Badge visual para `reissued`** — Adicionar estilo de badge distinto (ex: roxo/âmbar) para o status `reissued` na tabela de faturas e garantir que o filtro de status inclua essa opção.

## Relevant files

- `shared/schema.ts`
- `server/services/invoice-automation.service.ts`
- `server/routes.ts`
- `server/storage.ts`
- `client/src/pages/invoices.tsx`
- `client/src/locales/pt-BR.json`
- `client/src/locales/en-US.json`