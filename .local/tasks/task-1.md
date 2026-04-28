---
title: Refresh Visual das Páginas de Gestão
---
# Refresh Visual das Páginas de Gestão

## What & Why
Refatorar a parte visual das telas de Gestão (Trailers/Assets, Contratos, Faturas, Clientes) para melhorar usabilidade, densidade de informação, hierarquia visual e responsividade nos três breakpoints (mobile, tablet, desktop). Antes de mexer em qualquer página real, o usuário quer ver 2–3 direções visuais lado a lado no Canvas pra escolher qual seguir.

## Done looks like
- Etapa 1 (Exploração): Canvas exibe lado a lado 2–3 mockups distintos de uma tela de referência (lista de Faturas em desktop, tablet e mobile), cada um representando uma direção visual diferente — ex: "Polish da identidade atual", "Fintech Premium", "Dashboard Analítico Denso".
- Cada variante mostra: cabeçalho da página + filtros + tabela/cards de faturas + estados (loading, vazio, hover) + comportamento responsivo nos três tamanhos.
- Etapa 2 (Aplicação, após escolha): A direção aprovada é aplicada nas 4 páginas de Gestão (Trailers/Assets, Rental Contracts, Invoices, Rental Clients) sem alterar o backend nem quebrar nenhuma funcionalidade existente (filtros, formulários, dialogs, ações).
- Todas as 4 páginas funcionam bem e ficam visualmente coerentes em mobile (375px), tablet (768px) e desktop (1280px+).
- Sidebar e Header continuam funcionando e ficam alinhados com a nova identidade.

## Out of scope
- Alterações no backend, schemas, queries ou rotas de API.
- Refatoração das outras páginas (Dashboard, Portfolio, Landing, Tracking, etc.) — fica pra depois.
- Mudanças no fluxo de negócio (criação de fatura, contrato, etc.) — só a camada visual.
- Tema dark/light novo do zero — manter os tokens existentes ou ajustar de forma incremental.

## Steps
1. **Setup do mockup sandbox no Canvas** — Preparar o ambiente de prévia isolada e criar 3 componentes de variante da tela de Faturas (a mais densa e representativa): Variante A "Polish atual", Variante B "Fintech Premium", Variante C "Dashboard Analítico". Cada variante deve ser um componente isolado renderizando a lista de faturas com dados realistas (cliente, número, valor, status, vencimento) e ações (visualizar, baixar PDF, marcar como paga).
2. **Posicionar variantes no Canvas com 3 breakpoints cada** — Colocar 9 iframes no Canvas organizados em uma grade 3×3 (3 variantes × 3 tamanhos: mobile/tablet/desktop) com rótulos claros, pra o usuário comparar lado a lado. Aguardar escolha da direção antes de seguir.
3. **Aplicar direção escolhida na página de Faturas (referência)** — Refatorar `client/src/pages/invoices.tsx` aplicando a direção visual aprovada, garantindo que filtros, dialogs, formulários, ações e estados (loading, vazio, erro) continuem funcionando idênticos ao comportamento atual. Validar nos três breakpoints.
4. **Propagar para Trailers/Assets, Contratos e Clientes** — Aplicar os mesmos padrões visuais (cabeçalhos, cards, tabelas, badges de status, espaçamentos, tokens de cor) nas três páginas restantes, mantendo todas as funcionalidades intactas.
5. **Ajustes globais de Sidebar/Header e tokens** — Alinhar `client/src/components/layout/sidebar.tsx`, `header.tsx` e os tokens de cor em `client/src/index.css` se a direção escolhida exigir, sem quebrar as páginas que ficam de fora desse refresh.

## Relevant files
- `client/src/pages/invoices.tsx`
- `client/src/pages/assets.tsx`
- `client/src/pages/rental-contracts.tsx`
- `client/src/pages/rental-clients.tsx`
- `client/src/components/layout/sidebar.tsx`
- `client/src/components/layout/header.tsx`
- `client/src/index.css`