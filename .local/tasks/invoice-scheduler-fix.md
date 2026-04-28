# Fix Monthly Invoice Scheduler

## What & Why
O agendador de faturas (`InvoiceAutomationService.generateMonthlyInvoices`) hoje tem dois problemas conceituais que tornam o fluxo automático incorreto para qualquer contrato que não use os defaults:

1. **Ignora o `invoiceDayOfMonth` por contrato.** O cron está configurado como `"1 0 1 * *"` — roda apenas no dia 1 de cada mês às 00:01 UTC e gera todas as faturas de uma vez. Se o contrato diz "fatura no dia 15", o sistema gera no dia 1 mesmo assim. O campo só é usado depois para calcular o vencimento, o que inverte a semântica.

2. **Não usa `paymentDueDays` na geração automática.** Hoje o vencimento é calculado a partir de `invoiceDayOfMonth` (o que já é incorreto pelo item 1). O comportamento esperado é: `dueDate = data_de_emissao + paymentDueDays`.

O resultado prático é que cada fatura sai com data de emissão fora do dia combinado e vencimento incoerente com o prazo de pagamento contratual. Esta tarefa conserta os dois problemas e mantém a idempotência via constraint `uniq_invoices_contract_month`.

## Done looks like
- O cron passa a rodar **diariamente** às 00:01 UTC.
- Em cada execução, somente os contratos cujo `invoiceDayOfMonth` bate com o dia corrente são processados.
- Para meses curtos (28/29/30 dias), contratos com `invoiceDayOfMonth` maior que o último dia do mês são processados no último dia do mês para não pular um ciclo.
- A `dueDate` da fatura gerada passa a ser `data_de_emissao + contract.paymentDueDays` (default 15 se ausente).
- A constraint `uniq_invoices_contract_month` continua garantindo que rodar duas vezes no mesmo dia não cria duplicata.
- O método público `generateInvoicesNow()` (usado pelo botão "Disparar agora" da página de automação) continua funcionando e respeita as mesmas regras.
- Logs do job mostram, para cada execução: dia corrente, quantos contratos elegíveis, quantos gerados, quantos pulados (e por quê).
- Faturas geradas continuam disparando email e o evento de WhatsApp como hoje.

## Out of scope
- Mudar o fuso horário do cron (continua UTC).
- Mudar a estrutura da tabela `invoices` ou da constraint.
- Pré-popular `invoice_items` para contratos multi-trailer (é assunto de outra tarefa).
- Notificar o gerente sobre falhas individuais por canal externo (continua só nos logs).

## Steps
1. **Refatorar a lógica de geração para 1 contrato** — Extrair o bloco que cria a fatura de um contrato específico (cálculo de mês de referência, número, datas, persistência) para um método reutilizável (ex.: `generateInvoiceForContract(contract, today)`). Isso vai permitir reuso pelo botão "Gerar fatura agora" e por testes manuais.
2. **Mudar o cron e o filtro** — Atualizar o pattern para rodar diariamente; dentro do handler, calcular o dia corrente UTC e filtrar contratos cujo `invoiceDayOfMonth` bate (incluindo a regra de "último dia do mês quando o dia configurado não existe no mês corrente").
3. **Corrigir o cálculo de `dueDate`** — Trocar a fórmula para `data_de_emissao + paymentDueDays` (default 15). A `data_de_emissao` é a data corrente da execução do job.
4. **Atualizar `generateInvoicesNow()`** — Garantir que o método manual também roda pela mesma rotina de filtragem (com opção de forçar todos os contratos elegíveis hoje, ou aceitar uma lista explícita de `contractIds`).
5. **Logs e auditoria** — Garantir que cada execução loga resumo (data, elegíveis, gerados, pulados por duplicidade ou erro) e que os erros individuais não derrubam o job inteiro.
6. **Smoke test manual** — Criar dois contratos com `invoiceDayOfMonth` diferentes (ex.: 1 e 15) e disparar `generateInvoicesNow()` em datas simuladas; conferir que cada um gera só no seu dia e que o vencimento bate com `paymentDueDays`.

## Relevant files
- `server/services/invoice-automation.service.ts:1-200,380-410`
- `server/index.ts:55-70`
- `shared/schema.ts:238-285`
- `server/routes.ts:1200-1260`
