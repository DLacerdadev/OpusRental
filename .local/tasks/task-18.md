---
title: Botão "Gerar fatura agora" na página de Contratos
---
# Generate Invoice Now From Contract

## What & Why
Quando um cliente novo entra no meio do mês, ou quando o gerente precisa emitir uma fatura "fora do calendário" (ex.: cliente pediu adiantado, ou o agendador automático foi pausado para um contrato), hoje a única opção é abrir a página de Faturas, clicar em "Nova fatura" e preencher tudo manualmente — mesmo que toda a informação já exista no contrato.

Esta tarefa adiciona um botão "Gerar fatura agora" na linha de cada contrato da página de Contratos. Um clique cria uma fatura para aquele contrato no mês corrente, com `amount`, `dueDate` e `referenceMonth` derivados do contrato — exatamente o que o agendador automático faria, só que sob demanda.

## Done looks like
- A coluna de ações da tabela em "Contratos" passa a ter um botão "Gerar fatura agora" (somente para gerentes/admins, contratos ativos).
- Clicar pede confirmação rápida, e ao confirmar:
  - Cria uma fatura para o contrato no mês corrente.
  - `amount` = `monthlyRate` do contrato; `dueDate` = hoje + `paymentDueDays`; `referenceMonth` = mês corrente em `YYYY-MM`.
  - Se já existir uma fatura para esse contrato + mês (constraint `uniq_invoices_contract_month`), o botão mostra um toast claro do tipo "Já existe fatura para este mês" em vez de erro genérico.
- Após sucesso, um toast informa "Fatura gerada" e a lista de faturas (cache do client) é invalidada para refletir a nova entrada.
- Strings novas existem em `pt-BR` e `en-US`.
- A geração reaproveita a mesma rotina usada pelo agendador automático — não duplica lógica de cálculo de datas.

## Out of scope
- Permitir escolher um mês de referência diferente do atual (versão futura pode aceitar `referenceMonth` opcional; por enquanto, sempre mês corrente).
- Edição inline do `amount` antes de gerar (se o gerente quer um valor diferente, usa "Nova fatura" na página de Faturas).
- Geração em lote (selecionar vários contratos ao mesmo tempo).
- Mexer no agendador automático em si.

## Steps
1. **Endpoint** — Criar `POST /api/rental-contracts/:id/generate-invoice` em `server/routes.ts` (authorize + isManager, tenant-scoped). Ele chama a mesma rotina de geração reutilizável usada pelo agendador (`generateInvoiceForContract` ou equivalente). Retorna a fatura criada ou um erro estruturado quando duplicata.
2. **Tratamento de duplicata** — Capturar o erro de violação da constraint `uniq_invoices_contract_month` e devolver `409 Conflict` com mensagem amigável, em vez de 500.
3. **Botão na tabela de Contratos** — Adicionar um item na coluna de ações (`client/src/pages/rental-contracts.tsx`) com confirmação. Estado de loading durante a mutação, toast no sucesso e no erro.
4. **Invalidação de cache** — Invalidar `["/api/invoices"]` no client após sucesso para que a lista de faturas reflita imediatamente.
5. **i18n** — Adicionar chaves para o rótulo do botão, mensagem de confirmação, toasts de sucesso/erro e mensagem específica de duplicata em `pt-BR` e `en-US`.
6. **Audit log** — Registrar a ação no audit log existente (mesmo padrão dos outros endpoints de faturas).
7. **Smoke test manual** — Em um contrato ativo: clicar uma vez (deve gerar fatura) → clicar de novo no mesmo dia (deve mostrar mensagem de duplicata) → conferir que a fatura aparece na página de Faturas com os campos corretos.

## Relevant files
- `client/src/pages/rental-contracts.tsx:300-420`
- `server/routes.ts:1200-1260,2600-2800`
- `server/services/invoice-automation.service.ts:60-200`
- `shared/schema.ts:263-285`
- `client/src/locales/pt-BR.json`
- `client/src/locales/en-US.json`