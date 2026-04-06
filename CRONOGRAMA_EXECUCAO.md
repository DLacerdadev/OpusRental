# 📅 Cronograma de Execução — Opus Capital

**Estratégia:** EUA - STRAT IMEDIATO  
**Módulo:** Gestão de Ativos + Financeiro + WhatsApp  
**Duração total:** 35 dias úteis  
**Responsável:** Daniel Lacerda  
**Base de referência:** Cronograma de Implementação + Checklist Operacional (FASE 0–7)

---

## ✅ PRÉ-FASE — Diagnóstico (Concluído)

**Período:** Dia 0  
**Marco M1 — Diagnóstico concluído**

| # | Atividade | Status |
|---|-----------|--------|
| 1 | Executar o sistema no Replit | ✅ Concluído |
| 2 | Identificar stack tecnológica (React + Express + PostgreSQL) | ✅ Concluído |
| 3 | Mapear estrutura de diretórios | ✅ Concluído |
| 4 | Validar conexão com banco de dados | ✅ Concluído |
| 5 | Levantar falhas existentes | ✅ Concluído |
| 6 | Criar `SYSTEM_STATUS.md` com estado completo do sistema | ✅ Concluído |
| 7 | Criar `CRONOGRAMA_EXECUCAO.md` com planejamento das fases | ✅ Concluído |

**Entregável:** `SYSTEM_STATUS.md` com status de todas as 8 fases do checklist.

---

## 🔹 FASE 1 — Infraestrutura Base (Dias 1–7)

**Período:** Dias 1 a 7  (dia 30/03 à 07/04)
**Marco M2 — Base de infraestrutura pronta para produção**

Objetivos alinhados com: FASE 7 do checklist + itens F-04, F-06 e F-07 do SYSTEM_STATUS.md

| # | Atividade | Período | Detalhe |
|---|-----------|---------|---------|
| 1.1 | Migrar session store para PostgreSQL | Dias 1–2 | Instalar `connect-pg-simple`, eliminar MemoryStore |
| 1.2 | Configurar `SESSION_SECRET` via variável de ambiente | Dia 2 | Erro claro no boot se ausente em produção |
| 1.3 | Criar endpoint público `GET /api/health` | Dias 3–4 | Retorna status do banco, scheduler e session store |
| 1.4 | Corrigir `tenantId` no INSERT de `financial_records` | Dia 4 | Consistência multi-tenant em toda a base |
| 1.5 | Validar sessões persistindo após reinicialização | Dias 5–6 | Testes manuais de login, reinício e reconexão |
| 1.6 | Documentar variáveis de ambiente da fase | Dia 7 | Atualizar `SYSTEM_STATUS.md` com F-04/F-06/F-07 ✅ |

**Entregável:** Sistema com sessões persistentes + health check operacional.

---

## 🔹 FASE 2 — Fluxo Financeiro Completo (Dias 8–17)

**Período:** Dias 8 a 17  (dia 08/04 à 21/04)
**Marco M3 — Fluxo funcional completo**

Objetivos alinhados com: FASE 3 do cronograma + Estratégia Imediata (imagem de referência EUA)

### 📦 Gestão de Ativos — EUA STRAT IMEDIATO

| Módulo | Período | Atividades |
|--------|---------|------------|
| **Documentação dos Ativos** | Dias 8–9 | Validar CRUD de trailers, cotas e documentos funcionando ponta a ponta |
| **Fluxo de Caixa** | Dias 10–11 | Validar geração mensal de pagamentos, idempotência e histórico consolidado |
| **Invoice** | Dias 12–13 | Validar criação, auto-geração, alteração de status e rastreamento do ciclo completo |
| **Rastreador** | Dias 14–15 | Validar GPS tracker: localização, status e alertas de geofencing ativos |

### 🔍 Visibilidade Operacional

| # | Atividade | Período | Detalhe |
|---|-----------|---------|---------|
| 2.1 | Criar endpoint `GET /api/system/status` | Dias 8–9 | Consolidado: trailers, cotas, invoices, pagamentos do mês, scheduler |
| 2.2 | Criar painel `/admin/debug` na interface | Dias 10–12 | Cards de status, log de emails, ações manuais, estado das integrações |
| 2.3 | Implementar logs estruturados nos serviços críticos | Dias 13–14 | Nível, timestamp UTC, tenantId, operação |
| 2.4 | Validar fluxo completo: trailer → cota → pagamento → invoice | Dias 15–16 | Teste manual documentado passo a passo |
| 2.5 | Corrigir inconsistências identificadas nos testes | Dia 17 | Ajustes finais e atualização do `SYSTEM_STATUS.md` |

**Entregável:** Painel de debug ativo + fluxo de ativos validado de ponta a ponta.

---

## 🔹 FASE 3 — Integração WhatsApp (Dias 18–26) ✅ CONCLUÍDO

**Período:** Concluído antecipadamente em 06/04/2026 (Tarefa #6)
**Marco M4 — Integração WhatsApp ativa**

Objetivos alinhados com: FASE 4 do cronograma + FASE 6 do checklist operacional

| # | Atividade | Status | Detalhe |
|---|-----------|--------|---------|
| 3.1 | Criar `whatsapp.service.ts` com interface desacoplada | ✅ | MockAdapter, TwilioAdapter, MetaAdapter — seleção via `WHATSAPP_PROVIDER` |
| 3.2 | Mapear eventos do sistema para mensagens | ✅ | 5 eventos mapeados com templates pt-BR |
| 3.3 | Integrar eventos ao scheduler e aos serviços existentes | ✅ | `scheduler.ts`, `invoice-automation.service.ts`, `notification.service.ts` |
| 3.4 | Validar envio simulado (mock) de todas as mensagens | ✅ | Testado via `POST /api/whatsapp/test` — mock retorna messageId |
| 3.5 | Implementar adaptador Twilio e Meta | ✅ | TwilioAdapter (twilio SDK) + MetaAdapter (Graph API) com retry 3x |
| 3.6 | Criar endpoint `POST /api/whatsapp/test` (admin only) | ✅ | Endpoint ativo com policy `admin` |
| 3.7 | Endpoint `GET /api/whatsapp/logs` (manager+admin) | ✅ | Persiste logs na tabela `whatsapp_logs` (PostgreSQL) |
| 3.8 | Painel de debug WhatsApp em `/admin/debug` | ✅ | Card com formulário de teste + tabela de logs |

### 📲 Mensagens Mapeadas

| Evento | Destinatário | Gatilho |
|--------|-------------|---------|
| `payment_generated` | Investidor | Dia 1 de cada mês (06:00 UTC) — scheduler |
| `invoice_issued` | Cliente de aluguel | Cron de invoice upcoming due |
| `invoice_overdue` | Cliente de aluguel | Cron de invoice overdue |
| `maintenance_due` | Usuário (manager/admin) | Cron diário às 08:00 UTC |
| `geofence_alert` | Manager | Cron a cada 2 horas |

**Entregável:** Notificações WhatsApp automáticas funcionando — mock validado, Twilio/Meta prontos para credenciais de produção.
**Variáveis de produção:** `WHATSAPP_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (ou `META_WHATSAPP_TOKEN`, `META_PHONE_NUMBER_ID`)

---

## 🔹 FASE 4 — Estabilização e Entrega (Dias 27–35)

**Período:** Dias 27 a 35 (dia 05/05 à 14/05)
**Marco M5 — Entrega final estabilizada**

Objetivos alinhados com: FASE 5 do cronograma + FASE 7 do checklist operacional

| # | Atividade | Período | Detalhe |
|---|-----------|---------|---------|
| 4.1 | Tratamento de erros consistente em todos os endpoints críticos | Dias 27–28 | JSON padronizado `{ error, message, code }` sem stack trace exposto |
| 4.2 | Revisão final dos logs estruturados em todos os serviços | Dias 28–29 | Auditoria de qualidade e padronização de logging |
| 4.3 | Executar fluxo completo ponta a ponta e documentar | Dias 29–30 | Trailer → cota → pagamento → WhatsApp → invoice → confirmação |
| 4.4 | Corrigir bugs identificados durante os testes | Dias 30–31 | Prioridade: críticos e altos primeiro |
| 4.5 | Revisar código dos módulos financeiro e WhatsApp | Dias 31–32 | Qualidade, clareza, manutenibilidade |
| 4.6 | Preparar Stripe para ativação imediata | Dia 32 | Código pronto; aguarda `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` |
| 4.7 | Preparar SMTP para ativação imediata | Dia 33 | Código pronto; aguarda `SMTP_HOST/PORT/USER/PASS/FROM` |
| 4.8 | Atualizar `SYSTEM_STATUS.md` com estado final | Dia 34 | Todas as fases marcadas como ✅ |
| 4.9 | Atualizar `replit.md` com arquitetura final | Dias 34–35 | Módulos, variáveis de ambiente, guia de deploy |

**Entregável:** Sistema estável, documentado e pronto para produção.

---

## 📊 Marcos de Entrega

| Marco | Descrição | Prazo |
|-------|-----------|-------|
| ~~M1~~ | ~~Diagnóstico concluído~~ | ~~Dia 0~~ ✅ |
| M2 | Infraestrutura base pronta (session store + health endpoint) | Dia 7 |
| M3 | Fluxo financeiro completo + painel de visibilidade | Dia 17 |
| M4 | Integração WhatsApp ativa | Dia 26 |
| M5 | Entrega final estabilizada | Dia 35 |

---

## 🗓️ Visão Resumida das Semanas

| Semana | Dias | Foco Principal |
|--------|------|---------------|
| Semana 1 | 1–7 | Infraestrutura base — session store, health endpoint, multi-tenant |
| Semana 2 | 8–14 | Gestão de Ativos — Documentação, Fluxo de Caixa, Invoice, Rastreador |
| Semana 3 | 15–21 | Fluxo financeiro completo + painel de debug + início WhatsApp mock |
| Semana 4 | 22–28 | WhatsApp integração real + testes + início estabilização |
| Semana 5 | 29–35 | Estabilização final, revisão, documentação e entrega |

---

## 🔑 Variáveis de Ambiente Necessárias

| Variável | Fase | Descrição |
|----------|------|-----------|
| `SESSION_SECRET` | FASE 1 | Secret forte para assinatura de cookies de sessão |
| `WHATSAPP_PROVIDER` | FASE 3 | Provedor escolhido (`twilio`, `zapi`) |
| `WHATSAPP_API_KEY` | FASE 3 | Chave de API do provedor WhatsApp |
| `STRIPE_SECRET_KEY` | FASE 4 | Chave secreta Stripe para pagamentos online |
| `STRIPE_WEBHOOK_SECRET` | FASE 4 | Secret para validar webhooks do Stripe |
| `SMTP_HOST` | FASE 4 | Servidor SMTP para envio de emails |
| `SMTP_PORT` | FASE 4 | Porta SMTP (587 ou 465) |
| `SMTP_USER` | FASE 4 | Usuário SMTP |
| `SMTP_PASS` | FASE 4 | Senha SMTP |
| `SMTP_FROM` | FASE 4 | Endereço de origem dos emails |

---

## ⚠️ Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| API WhatsApp exige aprovação de conta business | Usar mock desacoplado durante aprovação (Dias 18–23) |
| Credenciais Stripe/SMTP não disponíveis | Código preparado para ativação imediata via variável de ambiente |
| Sessões perdidas durante implementação | FASE 1 (Dias 1–7) resolve antes de qualquer outra fase avançar |
| Regressão nos fluxos existentes | Validação manual do fluxo completo nos Dias 29–30 |
| Atraso em uma fase | Buffer de 1–2 dias embutido em cada fase para absorver imprevistos |

---

*Cronograma baseado no documento "Módulo Financeiro com Integração WhatsApp" e no Checklist Operacional (FASE 0–7). Diagnóstico inicial concluído em 25/03/2025. Iniciando a primeira fase do projeto dia 30/03/2025 Duração total: 35 dias úteis.*
