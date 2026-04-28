# Template 5 — Validação Rigorosa de Pagamento

## What & Why
Hoje, quando um pagamento Stripe chega via webhook (ou um manager marca uma invoice como paga manualmente), a validação é frouxa: o sistema só checa se a invoice existe e se já está paga. **Não compara o valor recebido com o valor da invoice**, nem rejeita explicitamente status incompatíveis (`cancelled`, etc.). Isso pode aceitar pagamentos divergentes silenciosamente — risco financeiro real.

O Template 5 do fluxo financeiro define este como o "passo crítico": **validar status, validar valor, recusar divergências, registrar auditoria**.

## Done looks like
- Quando o webhook do Stripe recebe `payment_intent.succeeded` para uma invoice:
  - Compara o valor recebido (em centavos) com `invoice.amount × 100`. Se divergir em mais de 1 centavo (tolerância de arredondamento), **rejeita**: não marca como paga, registra audit log com motivo `amount_mismatch`, retorna 200 ao Stripe (para não causar retry) mas loga o erro.
  - Verifica que `invoice.status` é um dos valores aceitáveis para pagamento: `pending`, `overdue`, `reissued`. Se for `paid`, `cancelled` ou outro: **rejeita**, audit log com motivo `invalid_status_for_payment`, idem 200 ao Stripe.
  - Só prossegue para marcar como paga se ambas as validações passarem.
- O endpoint manual de "marcar como paga" (gerenciado por managers) aplica **as mesmas regras**:
  - Se já está paga ou cancelada, retorna 400 com mensagem clara.
  - Se o valor informado pelo manager (campo opcional `paidAmount` no body) divergir do `invoice.amount`, retorna 400 — exceto se o manager passar `confirmAmountMismatch: true` (override explícito), nesse caso permite mas registra audit log destacando a divergência.
- Toda tentativa de pagamento (sucesso ou rejeição) gera entrada em `audit_logs` com: `action` (`payment_validated` / `payment_rejected_amount` / `payment_rejected_status`), `entityType: "invoice"`, `entityId`, `details` (valor esperado, valor recebido, status atual, fonte: stripe/manual).
- Mensagens de erro são claras e em português/inglês (i18n) onde aparecem na UI.

## Out of scope
- Adicionar novos métodos de pagamento (PIX, boleto, Zelle) — isso é o **Template 3** (tarefa paralela).
- Alterar a UI de pagamento ou checkout do Stripe.
- Refazer o fluxo de webhook para outros eventos (`payment_intent.payment_failed` continua como está).
- Validação de duplicidade de `paymentIntentId` (proteção contra replay) — pode ser uma tarefa de hardening separada.

## Steps
1. **Helper de validação compartilhado** — Criar uma função utilitária (pode ficar em `server/services/` ou em `server/storage.ts`) `validateInvoicePayment(invoice, receivedAmount, source)` que retorna `{ valid: true }` ou `{ valid: false, reason: 'amount_mismatch' | 'invalid_status', details }`. Aceita tolerância de 1 centavo para arredondamento.
2. **Webhook Stripe** — No handler de `payment_intent.succeeded` para `metadata.type === 'invoice_payment'`, chamar o helper antes de qualquer atualização de status. Se inválido: criar audit log de rejeição, logar no console, **não** chamar `updateInvoice`, e retornar 200 ao Stripe.
3. **Endpoint manual mark-as-paid** — Aceitar `paidAmount` opcional no body. Se ausente, usa `invoice.amount`. Aplicar o helper. Se inválido por valor: retornar 400 a menos que `confirmAmountMismatch: true`. Se inválido por status: retornar 400 sempre.
4. **Audit logs estruturados** — Garantir que cada caminho (sucesso, rejeição por valor, rejeição por status, override de divergência) crie um audit log distinto e identificável, para o relatório financeiro/auditoria conseguir reconstruir o histórico.
5. **Mensagens de erro i18n** — Adicionar as novas mensagens de erro nos arquivos de locale do frontend (pt-BR e en-US) para qualquer mensagem que possa aparecer na UI da página de invoices ao tentar marcar como pago.

## Critical constraints
- **Não pode bloquear pagamentos legítimos**: a tolerância de arredondamento é importante — Stripe trabalha em centavos, frontend pode ter cálculos com float.
- **Webhook deve sempre retornar 200 ao Stripe** quando a assinatura é válida, mesmo que a invoice seja rejeitada — caso contrário o Stripe fica reentregando indefinidamente. A rejeição é registrada em audit log, não em status HTTP.
- **Tenant scoping mantido**: todas as buscas de invoice continuam tenant-scoped.
- **Não tocar em `invoices.tsx`** (Template 1 já está editando ele) — qualquer mudança de UI deve ficar em mensagens de erro/toast retornadas pelo backend.
- **Sem `npm install` novos**.

## Relevant files
- `server/routes.ts:1200-1230`
- `server/routes.ts:2986-3024`
- `server/storage.ts`
- `client/src/locales/pt-BR.json`
- `client/src/locales/en-US.json`
