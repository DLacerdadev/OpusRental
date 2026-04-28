# Serviço WhatsApp com adaptadores de provedor

## What & Why
Criar o serviço de integração com WhatsApp do zero (`server/services/whatsapp.service.ts`), seguindo a arquitetura de adaptadores já usada no GPS (factory + providers). O serviço opera em modo mock quando não há credenciais configuradas, permitindo desenvolvimento e testes sem dependência externa. Um endpoint admin de teste também é adicionado ao final de `server/routes.ts`.

## Done looks like
- `server/services/whatsapp.service.ts` existe com a interface pública completa: `WhatsAppService` (sendMessage, isConfigured, getProvider) e `WhatsAppTemplates` (5 templates em pt-BR).
- Sem `WHATSAPP_API_KEY` no ambiente, chamadas a `sendMessage()` retornam `{ success: true, mode: "mock" }` e imprimem o log padronizado `[WhatsApp MOCK]` no console.
- Com `WHATSAPP_API_KEY` definida, o serviço roteia para o adaptador correto: Twilio (`WHATSAPP_PROVIDER=twilio`) ou Z-API (`WHATSAPP_PROVIDER=zapi`).
- `POST /api/whatsapp/test` responde 401 sem sessão, 403 sem role admin, 400 com número inválido, e 200 com `{ success, mode, messageId? }` para admins autenticados.
- Nenhum arquivo existente (scheduler, finance, invoice-automation, schema, client/) teve sua lógica alterada — apenas adições.

## Out of scope
- Conexão dos eventos do scheduler/finance ao `sendMessage()` — isso é responsabilidade do T5.
- Qualquer alteração no frontend (`client/`).
- Alterações em `shared/schema.ts`.

## Tasks

1. **Criar `whatsapp.service.ts` com mock mode** — Implementar a classe `WhatsAppService` com `sendMessage`, `isConfigured` e `getProvider`. Quando `WHATSAPP_API_KEY` não estiver definida, retornar `{ success: true, mode: "mock" }` e logar no formato exato `[WhatsApp MOCK] {timestamp UTC} / Provider / To / Event / Message`.

2. **Implementar `WhatsAppTemplates`** — Adicionar a classe `WhatsAppTemplates` no mesmo arquivo com os 5 métodos estáticos: `paymentGenerated`, `invoiceIssued`, `invoiceOverdue`, `maintenanceDue` e `geofenceAlert`. Textos exatamente conforme o briefing, em português do Brasil.

3. **Implementar adaptadores Twilio e Z-API** — Criar funções de adaptador internas para os dois provedores. Twilio: `POST` para a API REST da Twilio com Basic Auth (form-urlencoded). Z-API: `POST` com header `Client-Token` (JSON). Se `WHATSAPP_PROVIDER` não for reconhecido, retornar `{ success: false, error: "Provider not supported", mode: "live" }`.

4. **Adicionar endpoint `POST /api/whatsapp/test`** — Acrescentar ao final de `server/routes.ts` (antes do fechamento/exportação), sem alterar nada existente. Usar `isAuthenticated` e `isAdmin` já importados. Validar que `to` tem mínimo 10 dígitos, gerar a mensagem de teste usando `WhatsAppTemplates` conforme o `eventType`, chamar `WhatsAppService.sendMessage()` e retornar o resultado.

5. **Verificar dependências** — Checar se `node-fetch` já está disponível; instalar apenas se necessário para o ambiente. Não instalar o SDK da Twilio — usar `fetch` nativo com Basic Auth para manter o serviço sem dependências desnecessárias.

## Relevant files
- `server/services/gps/factory.ts`
- `server/services/gps/adapters/base.ts`
- `server/services/email.service.ts`
- `server/services/notification.service.ts`
- `server/routes.ts`
- `server/middleware/auth.ts`
