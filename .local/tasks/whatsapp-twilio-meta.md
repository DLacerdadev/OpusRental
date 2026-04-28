# Integração WhatsApp — Twilio + Meta

  ## What & Why

  Implementar notificações WhatsApp automáticas em duas fases: Twilio (entrega rápida, produção imediata) e Meta Business API (escala, menor custo). O serviço é desacoplado por interface de provedor — a variável de ambiente `WHATSAPP_PROVIDER` seleciona qual adaptador está ativo sem alterar o código.

  Os eventos já existem no sistema (finance.service, invoice-automation.service, notification.service). A tarefa é conectar um serviço WhatsApp a esses gatilhos existentes, com templates de mensagem, retry automático e log de entrega persistido.

  ## Done looks like

  - Notificações WhatsApp disparadas automaticamente para os 5 eventos mapeados (pagamento mensal, invoice emitida, overdue, manutenção devida, geofencing)
  - Fase 1 (Twilio): funciona com `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` configurados
  - Fase 2 (Meta): funciona com `META_WHATSAPP_TOKEN`, `META_PHONE_NUMBER_ID` configurados; `WHATSAPP_PROVIDER=meta` ativa o adaptador
  - Sem credenciais → mock mode (logs estruturados JSON, sem envio real)
  - Retry automático: até 3 tentativas com backoff exponencial por envio
  - Log de entrega persistido na tabela `whatsapp_logs` (status: sent/failed/retrying)
  - Endpoint `POST /api/whatsapp/test` (admin only) permite envio manual de teste pelo painel
  - Endpoint `GET /api/whatsapp/logs` (admin/manager) retorna histórico de envios
  - Painel de debug (`/admin/debug`) exibe contagem e status dos logs WhatsApp
  - Logs estruturados com schema `{ level, timestamp, service:"whatsapp", operation, tenantId, detail }`

  ## Out of scope

  - UI de configuração de templates no frontend (templates são definidos em código)
  - Suporte a arquivos de mídia (imagens, documentos) — apenas texto por agora
  - Grupos WhatsApp — apenas mensagens individuais
  - Métricas de conversão ou CRM

  ## Tasks

  1. **Schema: tabela whatsapp_logs** — Adicionar tabela `whatsapp_logs` ao `shared/schema.ts` com campos: id (UUID), tenantId, event (enum), recipientPhone, recipientName, status (sent/failed/retrying), provider (twilio/meta/mock), messageId, retries, error, createdAt. Rodar `npm run db:push` para aplicar.

  2. **Serviço WhatsApp com dois adaptadores** — Criar `server/services/whatsapp.service.ts` com interface `IWhatsAppProvider` (método `send(to, template, vars)`). Implementar três classes: `TwilioAdapter` (Fase 1, usa `twilio` SDK), `MetaAdapter` (Fase 2, usa `node-fetch` para API da Meta), `MockAdapter` (logs estruturados, sem envio real). A factory seleciona o adaptador por `WHATSAPP_PROVIDER` (twilio|meta|mock, default: mock). Implementar retry automático (3 tentativas, backoff 1s/2s/4s). Cada envio grava resultado em `whatsapp_logs`. Usar schema de log estruturado `{ level, timestamp, service:"whatsapp", operation, tenantId, detail }`.

  3. **Templates de mensagem** — Definir 5 templates no serviço: `payment_generated` (para investidor), `invoice_issued` (para cliente de aluguel), `invoice_overdue` (para cliente, a cada 7 dias), `maintenance_due` (para admin/manager), `geofence_alert` (para admin/manager). Templates em pt-BR com variáveis dinâmicas (nome, valor, data, número de invoice, placa do trailer).

  4. **Integração nos gatilhos existentes** — Conectar `WhatsAppService.send()` nos pontos de disparo já existentes: `finance.service.ts` (pagamento mensal gerado → investidor), `invoice-automation.service.ts` (invoice emitida → cliente, overdue → cliente), `notification.service.ts` (maintenance_due → managers, geofence_alert → managers). Os números de telefone vêm dos registros existentes (campo `phone` de usuários e clientes de aluguel). Não remover a lógica existente — WhatsApp é um canal adicional.

  5. **Endpoints e policies** — Adicionar `POST /api/whatsapp/test` (envio manual de teste, payload: `{ phone, event }`) e `GET /api/whatsapp/logs` (histórico paginado) em `server/routes.ts`. Registrar ambos em `server/policies.ts`: test → admin only; logs → manager+admin.

  6. **Debug panel e documentação** — Adicionar card "WhatsApp" no `client/src/pages/admin-debug.tsx` com contagem de envios (sent/failed) e tabela de logs recentes de `/api/whatsapp/logs`. Atualizar `SYSTEM_STATUS.md` (FASE 6 como ✅), `CRONOGRAMA_EXECUCAO.md` (estratégia Twilio→Meta documentada) e `replit.md` com as novas variáveis de ambiente.

  ## Relevant files

  - `server/services/notification.service.ts`
  - `server/services/invoice-automation.service.ts`
  - `server/services/finance.service.ts`
  - `server/services/email.service.ts`
  - `server/scheduler.ts`
  - `server/routes.ts`
  - `server/policies.ts`
  - `server/storage.ts`
  - `shared/schema.ts`
  - `client/src/pages/admin-debug.tsx`
  - `SYSTEM_STATUS.md`
  - `CRONOGRAMA_EXECUCAO.md`
  