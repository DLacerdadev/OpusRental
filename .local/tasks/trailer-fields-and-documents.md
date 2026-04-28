# Trailer Completo: Campos Extras + Documentos

## What & Why
A tabela `trailers` no `shared/schema.ts` está incompleta em relação ao que existe em produção (dump SQL): faltam `vin`, `year`, `make`, `body`, `weight_lbs`, `title_number`, `vehicle_use`, `title_date` e `image_data`. A tabela `trailer_documents` (anexos por categoria) também não foi portada para o schema. Por consequência, o formulário de **Novo Trailer** em Assets coleta menos da metade das informações reais e nada disso fica disponível para alimentar a criação de invoices, listagens e filtros.

Esta tarefa restaura o modelo completo do trailer no schema, atualiza o formulário para coletar todos os campos (todos opcionais), reintroduz a tabela `trailer_documents` com upload por categoria, e expõe esses dados nos pontos onde o gerente já espera vê-los: na criação/visualização de invoices e nos filtros da página Assets.

## Decisões já tomadas
- **Todos os campos extras são opcionais** no formulário e no schema (nullable).
- **Upload de documentos**: usar URL/caminho via Replit Object Storage em vez de gravar `base64` no banco. O campo no schema fica `fileUrl` (text). Isso evita inflar a tabela e mantém compatibilidade com download direto.
- **Nome do bucket**: `trailer-documents` (privado, pré-assinado para download).

## Done looks like
- O formulário "Novo Trailer" em **Assets** aceita e salva os 9 campos novos (todos opcionais), agrupados em uma seção "Identificação do veículo" colapsável dentro do diálogo.
- A página de detalhes do trailer (diálogo "Ver detalhes") exibe esses campos quando preenchidos.
- Existe uma aba/seção "Documentos" no diálogo de detalhes do trailer onde o gerente pode:
  - Fazer upload de arquivos selecionando uma categoria (ex.: `title`, `registration`, `insurance`, `inspection`, `purchase_invoice`, `other`).
  - Ver a lista de documentos já anexados, com nome, categoria, data e quem subiu.
  - Baixar/abrir e remover documentos.
- Na página **Assets**, a tabela ganha filtros por `year`, `make`, `vehicleUse` e busca livre por `vin` ou `titleNumber`.
- Na página **Invoices**, o Select de "Trailer" e os rótulos de invoice item passam a exibir `{trailerId} — {make} {model} {year}` (com fallback gracioso quando os campos extras estiverem vazios), e a página de detalhes da invoice mostra `vin` quando disponível.
- Strings novas existem em `pt-BR` e `en-US`.
- Migração rodada com sucesso e dados existentes preservados (todos os trailers atuais continuam acessíveis com as colunas novas em `null`).

## Out of scope
- Importar de volta os `image_data` em base64 que estão no dump antigo (campo passa a aceitar URL apenas; migração de dados históricos fica para uma tarefa futura se for necessário).
- OCR ou validação automática de documentos (apenas upload e download manual).
- Vinculação de documentos a contratos ou invoices (apenas a trailers nesta tarefa).
- Permissões granulares por categoria de documento (qualquer usuário do tenant com acesso a Assets pode subir/remover).

## Steps
1. **Schema** — Adicionar as colunas opcionais (`vin`, `year`, `make`, `body`, `weightLbs`, `titleNumber`, `vehicleUse`, `titleDate`, `imageData`) à tabela `trailers`. Criar a tabela `trailerDocuments` com `id`, `tenantId`, `trailerId`, `documentCategory`, `fileName`, `fileUrl`, `uploadedAt`, `uploadedBy`, com índices por `tenantId` e `trailerId` e relação `trailers ←→ trailerDocuments`. Gerar o `insertTrailerDocumentSchema` via `drizzle-zod` (omitindo campos auto-gerados) e atualizar o `insertTrailerSchema` para refletir os novos campos opcionais.

2. **Storage e API de documentos** — Configurar bucket `trailer-documents` no Replit Object Storage. Criar endpoints REST: `GET /api/trailers/:trailerId/documents`, `POST /api/trailers/:trailerId/documents` (recebe arquivo via multipart, faz upload no bucket, persiste o registro), `DELETE /api/trailer-documents/:id` (apaga registro e arquivo). Todos respeitam isolamento por `tenantId` via `policies.ts`.

3. **Storage interface (`IStorage`)** — Adicionar métodos: `getTrailerDocuments(trailerId, tenantId)`, `createTrailerDocument(input)`, `deleteTrailerDocument(id, tenantId)`. Estender o método existente de criação/atualização de trailer para aceitar os campos novos.

4. **Formulário Novo Trailer** — Em Assets, adicionar a seção "Identificação do veículo" colapsável dentro do diálogo, com inputs para os 9 campos novos. Atualizar `defaultValues` do `useForm` e o `onSubmit` para enviar os campos. Garantir que campos vazios virem `undefined` antes do POST (mesmo padrão já usado para `latitude`/`longitude`).

5. **Diálogo de detalhes do trailer** — Adicionar aba/seção "Identificação" mostrando os campos extras quando preenchidos, e aba "Documentos" com a lista, botão de upload (com Select de categoria + input de arquivo), botão de download (link pré-assinado) e botão de remover.

6. **Filtros em Assets** — Acima da tabela, adicionar barra de filtros: Select para `year`, Select para `make` (populado dinamicamente a partir dos trailers carregados), Select para `vehicleUse` (`PRIVATE`/`COMMERCIAL`), e Input de busca livre que casa com `vin` ou `titleNumber`. Filtrar a lista no client.

7. **Exibição em Invoices** — Atualizar o rótulo de trailer no Select de contratos e nos invoice items para o formato enriquecido `{trailerId} — {make} {model} {year}`, sempre tratando ausência de campos novos com fallback para o rótulo atual. Na página de detalhes da invoice, exibir `vin` em uma linha auxiliar quando disponível.

8. **i18n** — Adicionar todas as strings novas (rótulos dos campos, categorias de documento, mensagens de upload/erro, filtros) em `pt-BR.json` e `en-US.json`.

9. **Migração e smoke test** — Rodar `npm run db:push` (ou equivalente) para aplicar as mudanças. Verificar que trailers já existentes continuam carregando, criar um novo trailer com todos os campos preenchidos, anexar 2 documentos de categorias diferentes, baixar um, remover outro, e confirmar que os filtros e os novos rótulos em Invoices funcionam.

## Relevant files
- `shared/schema.ts:78-99,154-168,519-540`
- `server/storage.ts`
- `server/routes.ts`
- `server/policies.ts`
- `client/src/pages/assets.tsx:1-170,260-630,770-860`
- `client/src/pages/invoices.tsx:43,432-441,1180-1200`
- `client/src/locales/pt-BR.json`
- `client/src/locales/en-US.json`
- `attached_assets/dump1_1777328341780.sql:519-565`
