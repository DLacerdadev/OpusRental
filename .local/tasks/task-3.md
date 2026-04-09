---
title: Fluxo financeiro completo e painel de visibilidade
---
# FASE 2 — Fluxo Financeiro Completo e Painel de Debug

## What & Why

Concluir a validação do fluxo de ativos e criar visibilidade operacional total sobre o sistema. O administrador precisa de um painel único para ver o estado de todos os módulos críticos sem precisar abrir o banco de dados — e os serviços internos precisam de logs estruturados para facilitar o diagnóstico.

Esta tarefa também atualiza o SYSTEM_STATUS.md para refletir os itens concluídos na FASE 1 (F-04 ✅, F-06 ✅, F-07 ✅, session store PostgreSQL ✅, health endpoint ✅).

## Done looks like

- `SYSTEM_STATUS.md` atualizado: F-04, F-06 e F-07 marcados como ✅; FASE 7 com session store ✅ e SECRET ✅; FASE 4 com `/api/health` ✅
- Novo endpoint `GET /api/system/status` (admin/manager) retorna: contagem de trailers, cotas ativas, invoices em aberto, total pago no mês corrente, estado do scheduler, última execução do cron
- Painel de debug acessível via sidebar em `/admin/debug` com: cards de status do sistema, log de emails, log de auditoria, botão de geração manual de pagamentos, estado das integrações (Stripe, SMTP, WhatsApp)
- Logs estruturados (nível + timestamp UTC + tenantId + operação) em: `finance.service.ts`, `invoice-automation.service.ts`, `scheduler.ts` e `email.service.ts`
- Validação manual do fluxo completo documentada nos logs: trailer ativo → share comprada → pagamento gerado → invoice emitida

## Out of scope

- Integração WhatsApp (Tarefa #4)
- Ativação real de Stripe ou SMTP (aguardam credenciais do usuário)
- Testes automatizados (fora do escopo do projeto)
- Qualquer alteração no schema do banco de dados

## Tasks

1. **Atualizar SYSTEM_STATUS.md** — Marcar F-04, F-06, F-07 como ✅ na tabela de falhas; atualizar FASE 7 (session store e SESSION_SECRET ✅); atualizar FASE 4 (endpoint `/api/health` ✅); atualizar o Resumo Executivo e Próximas Ações. Data do documento: 30/03/2026.

2. **Endpoint `GET /api/system/status`** — Criar endpoint (role: manager ou admin) que consolida em uma única chamada: total de trailers ativos, cotas ativas, invoices abertas (status pending/overdue), total pago no mês corrente, estado do scheduler (ativo/inativo), timestamp da última execução do cron de pagamentos.

3. **Painel `/admin/debug` no frontend** — Criar nova página React acessível via sidebar para roles admin/manager. Deve exibir: cards com os dados do `/api/system/status`; tabela das últimas entradas do `/api/email-logs`; tabela das últimas entradas do `/api/audit-logs`; botão de "Gerar Pagamentos" que chama `POST /api/financial/generate/:month` com o mês atual; indicadores visuais do estado das integrações (Stripe configurado? SMTP configurado? WhatsApp: pendente).

4. **Logs estruturados nos serviços críticos** — Substituir `console.log` soltos por um padrão consistente `{ level, timestamp, tenantId, service, operation, detail }` em `finance.service.ts`, `invoice-automation.service.ts`, `scheduler.ts` e `email.service.ts`. Usar `console.info` para operações normais e `console.error` para falhas.

5. **Validação do fluxo completo** — Executar manualmente via API: verificar trailer ativo no banco → buscar share ativa vinculada → chamar endpoint de geração de pagamento para o mês corrente → verificar invoice gerada. Registrar resultado no `SYSTEM_STATUS.md` (FASE 2 Validação).

## Relevant files

- `SYSTEM_STATUS.md`
- `server/routes.ts`
- `server/services/finance.service.ts`
- `server/services/invoice-automation.service.ts`
- `server/services/email.service.ts`
- `server/scheduler.ts`
- `client/src/App.tsx`
- `client/src/components/layout/sidebar.tsx`
- `client/src/pages/compliance.tsx`
- `client/src/pages/invoice-automation.tsx`