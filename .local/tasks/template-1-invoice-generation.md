# Template 1 — Geração de Invoice Profissional

## What & Why
Padronizar a geração de invoices conforme o spec do Template 1 do fluxo financeiro: numeração robusta, layout de itens com Rate × Qty, e dados estruturados (JSON) reutilizáveis fora do PDF. Hoje o PDF gera `Description | Period | Trailer | Amount`, a numeração é frágil (usa `length + 1`) e os dados só existem em forma de Buffer/PDF — não dá para enviar em email, mostrar em pré-visualização no frontend, nem integrar com outros canais.

## Done looks like
- Invoices passam a ser numeradas no formato `INV-000001` (6 dígitos, zero-padded).
- A numeração não se quebra se uma invoice for deletada (calcula a partir do maior número existente, não da contagem).
- O PDF da invoice mostra a tabela de itens com colunas **Description | Rate | Qty | Amount**, onde Rate = valor mensal do contrato, Qty = 1, Amount = Rate × Qty.
- A área de Totalização exibe Subtotal, Tax e Total.
- Existe um endpoint `GET /api/invoices/:id/data` (autenticado, tenant-scoped) que retorna um JSON estruturado com **exatamente os mesmos dados** usados na renderização do PDF: número, datas (emissão e vencimento), Bill To (cliente), itens, totais, instruções de pagamento e status.
- Na página de Invoices, um botão "Pré-visualizar" em cada linha abre um diálogo que mostra esses dados estruturados de forma legível (usando o endpoint acima), sem precisar baixar o PDF.
- Invoices antigas continuam sendo baixáveis sem erro — a mudança de numeração só vale para as próximas geradas.

## Out of scope
- Localização/i18n no PDF (moeda BRL, datas pt-BR, instruções PIX/boleto). Isso é tema do **Template 3 — Preparação de pagamento** e/ou de uma tarefa separada de localização de tenant.
- Versão HTML/Markdown renderizada do invoice (o spec menciona como alternativa; o JSON já cobre o caso de reuso programático e o PDF cobre o caso de apresentação).
- Cadastro de dados fiscais do tenant (CNPJ/EIN, endereço da empresa, chave PIX) — proposto como tarefa separada.
- Mudanças no fluxo de geração mensal automática além da numeração (cron, dia de vencimento, etc. já estão prontos).

## Steps
1. **Geração de número** — Atualizar a lógica de criação do número da invoice para formato `INV-000001` (6 dígitos) e calcular o próximo número a partir do maior número existente (parsing do prefixo `INV-`), não da contagem total. Aplicar tanto na geração automática mensal quanto em qualquer outro ponto que crie invoices.
2. **Reestruturar dados do item no PDF** — Trocar as colunas da tabela do PDF da invoice para `Description | Rate | Qty | Amount`. Description = "Locação Mensal — {trailerId} — {referenceMonth}"; Rate = `monthlyValue` do contrato; Qty = 1; Amount = Rate × Qty. Manter o layout visual (header, Bill To, totalização, payment instructions, status badge) já existente.
3. **Método de dados estruturados** — Adicionar ao serviço de PDF um método paralelo (ex.: `buildInvoiceData`) que recebe os mesmos dados de entrada que `generateInvoicePDF` e retorna um objeto tipado com: `invoiceNumber`, `issueDate`, `dueDate`, `billTo` (nome, email, telefone, endereço, taxId se houver), `items[]` (description, rate, qty, amount), `totals` (subtotal, tax, total), `paymentInstructions` (texto), `status`, `referenceMonth`, `notes`. Esse é o "single source of truth" que o PDF e o endpoint vão consumir.
4. **Endpoint JSON** — Criar `GET /api/invoices/:id/data` protegido por autenticação e tenant-scoped (mesma proteção do download do PDF). Retorna o JSON estruturado do passo 3. Manter `GET /api/invoices/:id/pdf` funcionando.
5. **Pré-visualização no frontend** — Na página de Invoices, adicionar um botão de pré-visualizar (ícone de olho) em cada linha que abre um diálogo modal mostrando os dados estruturados de forma organizada: cabeçalho com número e datas, bloco Bill To, tabela de itens, totais e instruções de pagamento. Reaproveitar componentes shadcn já em uso (Dialog, Table, Card). Adicionar traduções pt-BR/en-US para os novos rótulos.

## Critical constraints
- **Não quebrar invoices existentes**: a mudança de numeração só se aplica a invoices novas. Invoices antigas com número `INV-0001` continuam válidas e baixáveis.
- **Tenant scoping obrigatório**: o endpoint `/api/invoices/:id/data` deve verificar que a invoice pertence ao tenant do usuário logado, igual ao endpoint do PDF.
- **PDF e JSON consistentes**: o JSON retornado pelo endpoint deve ser exatamente o mesmo conjunto de dados que aparece no PDF — para que pré-visualização e PDF nunca divirjam.
- **Sem `npm install` novos**: usar apenas o que já está no projeto (jspdf, jspdf-autotable, shadcn).
- **Sem editar `package.json` nem `vite.config.ts`/`server/vite.ts`**.

## Relevant files
- `server/services/pdf.service.ts:14-19,329-470`
- `server/services/invoice-automation.service.ts:80-110`
- `server/routes.ts:2380-2410`
- `server/storage.ts`
- `shared/schema.ts:254-273`
- `client/src/pages/invoices.tsx`
- `client/src/locales/pt-BR.json`
- `client/src/locales/en-US.json`
