# Auto-Fill Nova Fatura From Contract

## What & Why
Hoje, quando o gerente abre "Nova fatura" e escolhe um contrato no diálogo de criação, o formulário não puxa nenhum dado do contrato — `amount`, `referenceMonth` e `dueDate` precisam ser digitados manualmente. Isso é a maior fonte de erro humano nas faturas avulsas (valor digitado errado, mês errado, vencimento incoerente com `paymentDueDays` do contrato). O Select de contrato também exibe duas vezes o `contractNumber` em vez de mostrar o cliente e o trailer, o que dificulta achar o contrato certo quando há muitos.

Esta tarefa faz o formulário se comportar como o gerente espera: escolher o contrato preenche os outros campos automaticamente, mantendo a possibilidade de edição manual antes de submeter.

## Done looks like
- No diálogo "Nova fatura", o Select de contrato exibe `{contractNumber} — {clienteNome} — {trailerNome ou placa}` em vez de duplicar o número do contrato.
- Ao escolher um contrato, o formulário popula automaticamente:
  - `amount` = `contract.monthlyRate`
  - `referenceMonth` = mês corrente no formato `YYYY-MM`
  - `dueDate` = data de hoje + `contract.paymentDueDays` dias
- O gerente ainda pode sobrescrever qualquer um desses campos antes de salvar.
- Trocar o contrato após preencher recalcula os 3 campos (a menos que o usuário já tenha editado manualmente — comportamento aceitável: sempre recalcular).
- A criação manual continua funcionando para contratos sem `monthlyRate` definido (campo fica vazio para edição).
- Strings novas existem em `pt-BR` e `en-US`.

## Out of scope
- Mudar o endpoint POST `/api/invoices` (a lógica de auto-cálculo é client-side; o servidor continua aceitando os mesmos campos).
- Pré-popular `invoiceItems` automaticamente a partir do contrato (isso é coberto por outras tarefas futuras de multi-trailer).
- Mudanças no agendador automático mensal.

## Steps
1. **Hidratar o Select de contratos** — Mostrar número + nome do cliente + identificador do trailer no rótulo de cada opção; juntar dados de `rentalClients` e `trailers` que já estão no cache do client.
2. **Reagir à mudança de `contractId`** — Usar `form.watch("contractId")` (ou um `useEffect`) para, quando o valor mudar, encontrar o contrato selecionado e chamar `form.setValue` em `amount`, `referenceMonth` e `dueDate` com os valores derivados.
3. **Cálculo das datas** — `referenceMonth` usa o mês corrente em UTC (`YYYY-MM`); `dueDate` é hoje + `paymentDueDays` em formato ISO date. Tratar `paymentDueDays` ausente caindo em um default razoável (15).
4. **i18n** — Adicionar/ajustar chaves se rótulos novos aparecerem (ex.: legenda do auto-preenchimento no diálogo, opcional).
5. **Smoke test manual** — Criar fatura para um contrato existente, confirmar que os três campos preenchem, confirmar que dá para sobrescrever e salvar, e verificar a fatura resultante na lista.

## Relevant files
- `client/src/pages/invoices.tsx:67-75,420-450,820-900`
- `shared/schema.ts:238-260`
- `client/src/locales/pt-BR.json`
- `client/src/locales/en-US.json`
