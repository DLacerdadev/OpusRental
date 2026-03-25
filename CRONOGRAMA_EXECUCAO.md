# 📅 Cronograma de Execução — Opus Capital

**Estratégia:** EUA - STRAT IMEDIATO  
**Módulo:** Gestão de Ativos + Financeiro + WhatsApp  
**Duração estimada:** 10 dias úteis  
**Responsável:** Daniel Lacerda  
**Base de referência:** Cronograma de Implementação + Checklist Operacional (FASE 0–7)

---

## ✅ PRÉ-FASE — Diagnóstico (Concluído)

**Marco M1 — Diagnóstico concluído**

| # | Atividade | Status |
|---|-----------|--------|
| 1 | Executar o sistema no Replit | ✅ Concluído |
| 2 | Identificar stack tecnológica (React + Express + PostgreSQL) | ✅ Concluído |
| 3 | Mapear estrutura de diretórios | ✅ Concluído |
| 4 | Validar conexão com banco de dados | ✅ Concluído |
| 5 | Levantar falhas existentes | ✅ Concluído |
| 6 | Criar `SYSTEM_STATUS.md` com estado completo do sistema | ✅ Concluído |

**Entregável:** `SYSTEM_STATUS.md` com status de todas as 8 fases do checklist.

---

## 🔹 FASE 1 — Infraestrutura Base (Dias 1–2)

**Marco M2 — Base de infraestrutura pronta para produção**

Objetivos alinhados com: FASE 7 do checklist + itens F-04, F-06 e F-07 do SYSTEM_STATUS.md

| # | Atividade | Detalhe |
|---|-----------|---------|
| 1.1 | Migrar session store para PostgreSQL | Instalar `connect-pg-simple`, eliminar MemoryStore |
| 1.2 | Configurar `SESSION_SECRET` via variável de ambiente | Erro claro no boot se ausente em produção |
| 1.3 | Criar endpoint público `GET /api/health` | Retorna status do banco, scheduler e session store |
| 1.4 | Corrigir `tenantId` no INSERT de `financial_records` | Consistência multi-tenant em toda a base |

**Entregável:** Sistema com sessões persistentes + health check operacional.

---

## 🔹 FASE 2 — Fluxo Financeiro Completo (Dias 3–4)

**Marco M3 — Fluxo funcional completo**

Objetivos alinhados com: FASE 3 do cronograma + Estratégia Imediata (imagem de referência EUA)

### 📦 Gestão de Ativos — EUA STRAT IMEDIATO

| Módulo | Atividades |
|--------|------------|
| **Documentação dos Ativos** | Validar CRUD de trailers, cotas e documentos funcionando ponta a ponta |
| **Fluxo de Caixa** | Validar geração mensal de pagamentos, idempotência e histórico consolidado |
| **Invoice** | Validar criação, auto-geração, alteração de status e rastreamento do ciclo completo |
| **Rastreador** | Validar GPS tracker: localização, status e alertas de geofencing ativos |

### 🔍 Visibilidade Operacional

| # | Atividade | Detalhe |
|---|-----------|---------|
| 2.1 | Criar endpoint `GET /api/system/status` | Consolidado: trailers, cotas, invoices, pagamentos do mês, scheduler |
| 2.2 | Criar painel `/admin/debug` na interface | Cards de status, log de emails, ações manuais, estado das integrações |
| 2.3 | Validar fluxo completo: trailer → cota → pagamento → invoice | Teste manual documentado |
| 2.4 | Implementar logs estruturados nos serviços críticos | Nível, timestamp UTC, tenantId, operação |

**Entregável:** Painel de debug ativo + fluxo de ativos validado de ponta a ponta.

---

## 🔹 FASE 3 — Integração WhatsApp (Dias 5–6)

**Marco M4 — Integração WhatsApp ativa**

Objetivos alinhados com: FASE 4 do cronograma + FASE 6 do checklist operacional

| # | Atividade | Detalhe |
|---|-----------|---------|
| 3.1 | Criar `whatsapp.service.ts` com interface desacoplada | Mock mode (sem credenciais) → log no console |
| 3.2 | Mapear eventos do sistema para mensagens | Pagamento confirmado, invoice emitida, overdue, manutenção devida |
| 3.3 | Implementar adaptador de provedor real | Twilio ou Z-API via `WHATSAPP_PROVIDER` + `WHATSAPP_API_KEY` |
| 3.4 | Integrar eventos ao scheduler e aos serviços existentes | `finance.service`, `invoice-automation.service`, `scheduler` |
| 3.5 | Criar endpoint `POST /api/whatsapp/test` (admin only) | Envio manual de mensagem de teste |
| 3.6 | Documentar variáveis de ambiente necessárias | `WHATSAPP_PROVIDER`, `WHATSAPP_API_KEY` no SYSTEM_STATUS |

### 📲 Mensagens Mapeadas

| Evento | Destinatário | Gatilho |
|--------|-------------|---------|
| Pagamento mensal gerado | Investidor | Dia 1 de cada mês (06:00 UTC) |
| Invoice emitida | Cliente de aluguel | Criação de invoice |
| Invoice vencida (overdue) | Cliente de aluguel | Cron diário — a cada 7 dias de atraso |
| Manutenção devida | Administrador | Cron diário às 08:00 UTC |
| Alerta de geofencing | Administrador | Cron a cada 2 horas |

**Entregável:** Notificações WhatsApp automáticas funcionando (mock ou real).

---

## 🔹 FASE 4 — Estabilização e Entrega (Dias 7–10)

**Marco M5 — Entrega final estabilizada**

Objetivos alinhados com: FASE 5 do cronograma + FASE 7 do checklist operacional

| # | Atividade | Detalhe |
|---|-----------|---------|
| 4.1 | Tratamento de erros consistente em todos os endpoints críticos | JSON padronizado `{ error, message, code }` sem stack trace exposto |
| 4.2 | Revisão final dos logs estruturados em todos os serviços | Auditoria de qualidade de logging |
| 4.3 | Executar e documentar fluxo completo ponta a ponta | Trailer → cota → pagamento → WhatsApp → invoice → confirmação |
| 4.4 | Corrigir bugs identificados durante os testes | Prioridade: críticos e altos |
| 4.5 | Revisar código dos módulos financeiro e WhatsApp | Qualidade, clareza, manutenibilidade |
| 4.6 | Preparar Stripe para ativação imediata | Código pronto; aguarda `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` |
| 4.7 | Preparar SMTP para ativação imediata | Código pronto; aguarda `SMTP_HOST/PORT/USER/PASS/FROM` |
| 4.8 | Atualizar `SYSTEM_STATUS.md` com estado final | Todas as fases marcadas como ✅ |
| 4.9 | Atualizar `replit.md` com arquitetura final | Módulos, variáveis de ambiente, guia de deploy |

**Entregável:** Sistema estável, documentado e pronto para produção.

---

## 📊 Marcos de Entrega

| Marco | Descrição | Prazo |
|-------|-----------|-------|
| ~~M1~~ | ~~Diagnóstico concluído~~ | ~~Dia 0~~ ✅ |
| M2 | Infraestrutura base pronta (session store + health endpoint) | Dia 2 |
| M3 | Fluxo financeiro completo + painel de visibilidade | Dia 4 |
| M4 | Integração WhatsApp ativa | Dia 6 |
| M5 | Entrega final estabilizada | Dia 10 |

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
| API WhatsApp exige aprovação de conta business | Usar mock desacoplado enquanto conta é aprovada |
| Credenciais Stripe/SMTP não disponíveis | Código preparado para ativação imediata via variável de ambiente |
| Sessões perdidas durante implementação | FASE 1 resolve antes de qualquer outra fase avançar |
| Regressão nos fluxos existentes | Validação manual do fluxo completo na FASE 4 |

---

*Cronograma baseado no documento "Módulo Financeiro com Integração WhatsApp" e no Checklist Operacional (FASE 0–7). Diagnóstico inicial concluído em 25/03/2025.*
