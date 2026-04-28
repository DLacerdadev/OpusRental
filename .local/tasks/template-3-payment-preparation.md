# Template 3 — Preparação de Pagamento (PIX + Stripe + Transferência)

## What & Why
O Template 3 do fluxo financeiro define a etapa de **preparar a cobrança**: dado uma invoice gerada, oferecer ao cliente os métodos de pagamento disponíveis com instruções claras e identificadores rastreáveis. Hoje o sistema só oferece Stripe (cartão, USD) e instruções de transferência bancária americana **hardcoded no PDF** (`US Bank`, `Routing Number`). Para um cenário multi-tenant com clientes brasileiros, **PIX é essencial** e os dados bancários precisam ser configuráveis por tenant.

## Done looks like
- O tenant pode configurar, nas configurações da empresa, seus dados de cobrança:
  - Chave PIX (string livre: CPF/CNPJ/email/telefone/aleatória) e nome do beneficiário
  - Dados bancários para transferência (banco, agência, conta, titular, tipo)
  - Esses campos são opcionais — se vazios, o método correspondente não é oferecido.
- Cada invoice expõe (no JSON estruturado do **Template 1** e no PDF) uma seção "Métodos de pagamento" com os métodos habilitados pelo tenant:
  - **PIX**: chave, beneficiário, valor, identificador (= número da invoice como referência), instruções textuais.
  - **Transferência bancária**: dados da conta + referência (= número da invoice).
  - **Cartão (Stripe)**: link para checkout (já existe).
- Existe um endpoint `GET /api/invoices/:id/payment-methods` (autenticado, tenant-scoped) que retorna a lista de métodos habilitados e os dados de cobrança prontos para apresentar ao cliente.
- Na página de Invoices, o botão "Pagar" abre um diálogo com tabs (uma por método disponível): PIX (mostra chave + valor copiáveis), Transferência (mostra dados copiáveis), Cartão (botão que vai para checkout Stripe existente). Cada campo tem botão de copiar.
- Audit log registra qualquer geração de instrução de pagamento (`action: "payment_instructions_generated"`) para rastrear quando o cliente pediu para pagar.

## Out of scope
- **Integração com gateway PIX** (Pagar.me, Mercado Pago, Asaas) para gerar QR code dinâmico e confirmar pagamento automaticamente. Esta tarefa entrega **PIX manual com chave estática**: o cliente paga e o manager confirma via Template 5/6.
- Boleto bancário (requer integração com banco/gateway).
- Zelle (US-only, mercado-alvo brasileiro prioritário).
- Notificação automática ao cliente com as instruções (pode ser tarefa posterior, reaproveitando o serviço de email já existente).
- Localização total do PDF para pt-BR (moeda BRL, datas) — esta tarefa apenas adiciona a seção PIX/banco; tradução completa do PDF é tema separado.

## Steps
1. **Schema do tenant** — Adicionar campos opcionais ao `tenants`: `pixKey`, `pixBeneficiary`, `bankName`, `bankAgency`, `bankAccount`, `bankAccountHolder`, `bankAccountType`. Rodar `npm run db:push --force` se necessário (atenção às colunas legadas em drift — não deletar nada).
2. **Configuração no painel** — Adicionar um formulário em "Configurações do tenant" (página existente ou nova) para o admin/manager preencher esses campos. Usar `useForm` + Zod + shadcn Form. Rota PATCH no backend para atualizar.
3. **Service de instruções** — Criar `server/services/payment-methods.service.ts` com função `buildPaymentMethods(tenant, invoice)` que retorna a lista de métodos habilitados com seus dados formatados (PIX, Bank, Stripe link). Reaproveitar o JSON estruturado do **Template 1** (`buildInvoiceData`) injetando essa lista no campo `paymentInstructions`.
4. **Endpoint REST** — Criar `GET /api/invoices/:id/payment-methods` que retorna `{ methods: [...] }`. Reusa o service do passo 3.
5. **PDF: seção de métodos** — Atualizar a seção "PAYMENT INSTRUCTIONS" do PDF para iterar sobre os métodos habilitados (em vez do texto hardcoded). Manter o estilo visual.
6. **UI de pagamento** — Substituir/melhorar o botão de pagamento na página de invoices: um diálogo com tabs por método (`<Tabs>` do shadcn). Cada tab mostra os dados do método com botões "Copiar" (chave PIX, valor, conta, etc.). Manter o fluxo Stripe existente como uma das tabs.
7. **i18n** — Adicionar todas as labels novas (PIX, beneficiário, banco, agência, conta, titular, tipo, copiar, etc.) em pt-BR.json e en-US.json.

## Critical constraints
- **Depende do Template 1**: o JSON estruturado de invoice (`buildInvoiceData`) precisa estar mergiado para esta tarefa injetar `paymentInstructions` nele.
- **Não quebrar o Stripe existente**: o fluxo de pagamento por cartão deve continuar funcionando exatamente como hoje (mesmo endpoint, mesmo webhook, mesma página de checkout).
- **Validação de pagamento é separada**: esta tarefa **não** valida pagamentos recebidos — isso é responsabilidade do **Template 5** (tarefa paralela). O fluxo manual permanece: cliente paga via PIX, manager confirma marcando como paga (com a validação rigorosa do Template 5 aplicada).
- **Tenant scoping obrigatório** em todos os novos endpoints e queries.
- **Não tocar em `package.json`** — usar shadcn Tabs e componentes já instalados.
- **Atenção ao drift do schema**: o `npm run db:push` está bloqueado por colunas legadas (`title_number`, `vehicle_use`, etc.) que ainda existem no DB. Adicionar as novas colunas via Drizzle e rodar com `--force` apenas se o diff mostrar **somente as adições** novas — nunca aceitar deletar colunas legadas sem confirmação.

## Relevant files
- `shared/schema.ts:21-49`
- `server/services/pdf.service.ts:437-455`
- `server/routes.ts:2922-2984`
- `client/src/pages/invoices.tsx`
- `client/src/locales/pt-BR.json`
- `client/src/locales/en-US.json`
