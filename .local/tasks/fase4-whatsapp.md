# Integração WhatsApp — Notificações Automáticas

## What & Why
Implementar o serviço de integração com WhatsApp para notificar clientes e investidores automaticamente após eventos financeiros do sistema. Atualmente ausente no código (sem arquivo, sem dependência, sem endpoint). Corresponde ao FASE 6 do checklist operacional e ao FASE 4 do cronograma (Dias 6-7).

A estratégia é: mock desacoplado primeiro, integração real depois — permitindo validar a lógica de eventos sem depender de credenciais externas.

## Done looks like
- Serviço `whatsapp.service.ts` criado com interface desacoplada do provedor
- Mock mode funcional: mensagens logadas no console com payload completo
- Integração real com provedor escolhido (Twilio ou Z-API) ativada via variável de ambiente
- Eventos mapeados e disparando mensagens:
  - Pagamento mensal confirmado → investidor recebe mensagem com valor e mês
  - Invoice emitida → cliente de aluguel recebe notificação com vencimento e valor
  - Invoice vencida (overdue) → cliente recebe lembrete de cobrança
  - Manutenção devida → responsável recebe alerta do trailer
- Endpoint `POST /api/whatsapp/test` para envio manual de teste (admin only)
- Variável `WHATSAPP_API_KEY` (ou equivalente do provedor) documentada no sistema

## Out of scope
- Interface de configuração do WhatsApp no painel (configuração via env var)
- Histórico de mensagens enviadas (pode ser adicionado depois)
- Suporte a múltiplos provedores simultaneamente

## Tasks
1. **Serviço base WhatsApp com mock** — Criar `server/services/whatsapp.service.ts` com interface desacoplada: `sendMessage(to, body, metadata?)`. Em mock mode (sem credenciais), logar mensagem completa no console. Em produção, usar provedor configurado via env var.

2. **Mapear eventos do sistema** — Conectar o serviço WhatsApp aos eventos existentes: pagamento gerado (finance.service), invoice criada/vencida (invoice-automation.service), manutenção devida (scheduler). Cada evento dispara a mensagem correspondente ao destinatário correto.

3. **Integração real com provedor** — Implementar o adaptador de provedor (Twilio Messaging API ou Z-API) lido via `WHATSAPP_PROVIDER` e `WHATSAPP_API_KEY` do ambiente. Manter a mesma interface do mock para troca transparente.

4. **Endpoint de teste e documentação** — Criar `POST /api/whatsapp/test` (admin only) para envio manual de mensagem de teste. Documentar as variáveis de ambiente necessárias no SYSTEM_STATUS.md.

## Relevant files
- `server/services/finance.service.ts`
- `server/services/invoice-automation.service.ts`
- `server/services/notification.service.ts`
- `server/scheduler.ts`
- `server/routes.ts`
- `SYSTEM_STATUS.md`
