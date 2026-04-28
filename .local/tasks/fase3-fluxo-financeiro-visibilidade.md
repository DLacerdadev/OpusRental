# Fluxo Financeiro Completo e Visibilidade Operacional

## What & Why
Completar o ciclo financeiro ponta a ponta (cobrança → pagamento → confirmação) com visibilidade operacional em tempo real. O cronograma prevê nos dias 4-5 a criação de um endpoint de status do sistema e um painel de debug para o administrador. Também cobre os quatro pilares da estratégia imediata da imagem de referência: Documentação dos Ativos, Fluxo de Caixa, Invoice e Rastreador.

Corresponde ao **Dias 4-5 do cronograma** e às fases GESTÃO DE ATIVOS da imagem de estratégia.

## Done looks like
- Endpoint `GET /api/system/status` retorna visão consolidada do sistema: total de ativos, cotas ativas, invoices pendentes, pagamentos do mês, status do scheduler
- Painel `/admin/debug` na interface mostra: logs recentes, status das integrações (Stripe, SMTP, WhatsApp), fila do scheduler, e botões para disparar ações manuais (gerar mês, verificar atrasados)
- Fluxo completo testável via UI: criar trailer → alocar cota → gerar pagamento mensal → confirmar → visualizar no dashboard do investidor
- Invoices com rastreamento de status end-to-end visível no painel admin
- GPS/Rastreador exibindo localização atual dos trailers no mapa com status correto

## Out of scope
- Envio real de emails ou WhatsApp (apenas validação do fluxo lógico)
- Alterações no schema do banco
- Autenticação de dois fatores

## Tasks
1. **Endpoint /api/system/status** — Criar endpoint autenticado (manager+) que retorna um JSON consolidado com: total de trailers por status, cotas ativas, invoices por status, pagamentos do mês corrente, última execução do scheduler, e status das integrações externas configuradas.

2. **Painel de debug admin** — Criar página `/admin/debug` na interface com: cards de status do sistema (consumindo `/api/system/status`), log de emails recentes, botões de ações manuais (gerar pagamentos do mês, verificar atrasados, gerar invoices), e estado atual das integrações.

3. **Validação do fluxo de ativos (imagem de referência)** — Garantir que os 4 módulos da estratégia EUA funcionem de forma conectada: Documentação dos Ativos (trailers + shares + docs), Fluxo de Caixa (geração mensal + histórico), Invoice (criação + status + envio), Rastreador (GPS + mapa + status).

4. **Logs estruturados** — Padronizar logs do servidor com nível (INFO/WARN/ERROR), timestamp e contexto (tenantId, userId, endpoint) para facilitar diagnóstico em produção.

## Relevant files
- `server/routes.ts`
- `server/scheduler.ts`
- `server/services/finance.service.ts`
- `server/services/invoice-automation.service.ts`
- `server/services/monitoring.service.ts`
- `client/src/pages`
- `SYSTEM_STATUS.md`
