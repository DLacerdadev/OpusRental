# Infraestrutura Base Pronta para Produção

## What & Why
Resolver os bloqueantes críticos de infraestrutura que impedem o funcionamento correto em produção: o session store em memória perde todas as sessões ao reiniciar o servidor, o SESSION_SECRET está hardcoded, e não há endpoint público de health check. Sem isso, todas as fases seguintes (WhatsApp, estabilização) rodarão sobre uma base frágil.

Corresponde ao **Dia 2-3 do cronograma** e aos itens F-04, F-06 e F-07 do SYSTEM_STATUS.md.

## Done looks like
- Sessões persistem após reinicialização do servidor (PostgreSQL como store)
- `SESSION_SECRET` lido de variável de ambiente (sem fallback hardcoded em produção)
- Endpoint `GET /api/health` público retorna JSON com status do sistema (DB, scheduler, session store)
- `financial_records` incluem `tenantId` no INSERT para consistência multi-tenant
- Nenhuma sessão é perdida ao fazer deploy

## Out of scope
- Configuração das credenciais Stripe e SMTP (dependem de chaves externas do cliente)
- Qualquer mudança no schema de banco além de garantir tenantId em financial_records
- Testes de carga

## Tasks
1. **Session store PostgreSQL** — Instalar `connect-pg-simple`, configurar a sessão do Express para usar o banco PostgreSQL existente como store, mantendo a mesma estrutura de cookie.

2. **SESSION_SECRET via ambiente** — Garantir que a aplicação leia `SESSION_SECRET` de variável de ambiente e lance erro claro no boot se não estiver definida em produção.

3. **Endpoint /api/health público** — Criar `GET /api/health` que retorna JSON com: status do banco (ping), scheduler ativo, session store tipo, e timestamp. Não requer autenticação.

4. **Corrigir tenantId em financial_records** — Garantir que o INSERT em `financial_records` inclua o `tenantId` correto, em linha com o modelo multi-tenant de todas as outras tabelas.

## Relevant files
- `server/routes.ts:89-102`
- `server/services/finance.service.ts:80-111`
- `SYSTEM_STATUS.md`
