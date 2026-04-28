---
title: Refatorar documentos do ativo em abas com versionamento e aprovação
---
# Refactor Documentos por Abas com Versionamento

## What & Why
A aba "Documentos" do ativo hoje aceita upload livre numa lista única
(categorias planas: `title / registration / insurance / inspection /
purchase_invoice / other`), sem versionamento, sem status de aprovação e
sem distinção entre o que é obrigatório e o que é opcional. Para o
operador conseguir gerenciar a documentação real de um trailer ao longo
do tempo, vamos refatorar o módulo em 4 abas — **Veículo, Seguros,
Contratos, Rastreio** — onde cada aba tem uma checklist de tipos
obrigatórios e opcionais, suporta múltiplos arquivos por tipo, mantém o
histórico de versões e o status de aprovação (pendente, aprovado,
rejeitado), e registra cada mudança no log de auditoria.

A escolha é **estender a tabela existente `trailer_documents`** (já tem
escopo de tenant, FK para o trailer, integração com o Object Storage da
Replit, rotas e UI funcionando), em vez de criar uma estrutura paralela.
Isso preserva os documentos já carregados e mantém o fluxo de upload
presigned URL → POST de persistência intacto.

## Done looks like
- A tela do ativo mostra 4 sub-abas dentro de "Documentos": Veículo,
  Seguros, Contratos, Rastreio.
- Cada sub-aba lista os tipos de documento esperados (ex.: Título,
  Registration, Apólice, Contrato Assinado, Foto do Rastreador) com um
  selo "Obrigatório" ou "Opcional" e o status atual.
- O usuário consegue subir múltiplos arquivos para o mesmo tipo; cada
  upload novo vira uma versão (v1, v2, v3...) e a versão mais recente é
  a "atual"; as anteriores ficam acessíveis no histórico.
- Cada documento tem status visível: **Pendente** (default ao subir),
  **Aprovado** ou **Rejeitado**; gestores conseguem aprovar/rejeitar
  com motivo opcional.
- Toda ação relevante (upload, nova versão, mudança de status, exclusão)
  fica registrada no log de auditoria existente, com quem fez e quando.
- Adicionar um tipo novo no futuro é uma alteração de configuração
  (uma entrada num mapa em `shared/`) — não exige migração de banco.
- O endpoint de listagem devolve os documentos agrupados por categoria
  e por tipo, com a versão atual e a contagem de versões anteriores,
  para a UI renderizar a checklist sem precisar de N requisições.

## Out of scope
- Não vamos migrar a tabela genérica `documents` (KYC de investidor,
  contrato de share) — ela continua como está.
- Não vamos implementar OCR, extração de campos do documento, lembretes
  de vencimento, nem assinatura eletrônica.
- Não vamos criar fluxo de aprovação multi-nível (1 aprovação só).
- Sem mudança no provedor de armazenamento — continua Replit Object
  Storage com presigned URL via `/api/uploads/request-url`.

## Modelo de dados proposto

### Tabela `trailer_documents` (estendida)

```
id                  varchar PK     gen_random_uuid()
tenant_id           varchar FK     → tenants(id)
trailer_id          varchar FK     → trailers(id) ON DELETE CASCADE
category            text NOT NULL  -- 'vehicle' | 'insurance' | 'contract' | 'tracking'
document_type       text NOT NULL  -- ex.: 'title', 'registration', 'liability_insurance',
                                   --      'master_lease', 'rental_contract',
                                   --      'tracker_install_photo', 'tracker_certificate'
file_name           text NOT NULL
file_url            text NOT NULL  -- caminho /objects/uploads/<uuid>
file_size           integer        -- bytes (se conhecido)
mime_type           text
status              text NOT NULL DEFAULT 'pending'
                                   -- 'pending' | 'approved' | 'rejected'
version             integer NOT NULL DEFAULT 1
parent_document_id  varchar FK     → trailer_documents(id) ON DELETE SET NULL
                                   -- aponta para a v1 da cadeia; v1 tem NULL
is_current          boolean NOT NULL DEFAULT true
                                   -- só uma versão por (trailer, type) é current
sort_order          integer NOT NULL DEFAULT 0
rejection_reason    text           -- preenchido quando status='rejected'
reviewed_by         varchar FK     → users(id)
reviewed_at         timestamp
uploaded_by         varchar FK     → users(id)
uploaded_at         timestamp DEFAULT now()
```

Índices:
- `idx_trailer_documents_tenant (tenant_id)` — já existe
- `idx_trailer_documents_trailer (trailer_id)` — já existe
- `idx_trailer_documents_trailer_type (trailer_id, document_type)` — novo,
  acelera o agrupamento por tipo na listagem
- `idx_trailer_documents_current (trailer_id, document_type) WHERE is_current` — novo

Observação sobre o campo `category` legado: a coluna existente chama
`document_category` e mistura categoria com tipo. A migração renomeia
para `category` + `document_type` (com mapeamento dos valores antigos
para os novos pares — ex.: `title` → `category='vehicle', document_type='title'`,
`insurance` → `category='insurance', document_type='liability_insurance'`).

### Catálogo de tipos (config, não tabela)

Em `shared/document-types.ts` exportamos um mapa que dirige a UI e a
validação no servidor — adicionar/remover tipo é só editar o arquivo:

```
{
  vehicle: [
    { type: 'title',              required: true  },
    { type: 'registration',       required: true  },
    { type: 'vin_plate_photo',    required: false },
    { type: 'odometer_photo',     required: false },
  ],
  insurance: [
    { type: 'liability_insurance', required: true },
    { type: 'cargo_insurance',     required: false },
  ],
  contract: [
    { type: 'master_lease',       required: true  },
    { type: 'rental_contract',    required: false },
    { type: 'addendum',           required: false },
  ],
  tracking: [
    { type: 'tracker_certificate',  required: true  },
    { type: 'tracker_install_photo', required: false },
  ],
}
```

### Auditoria

Reusamos a tabela `audit_logs` que já existe. Cada operação grava:
- `entity_type = 'trailer_document'`
- `entity_id   = trailer_documents.id`
- `action`     ∈ `document_uploaded` | `document_version_added`
                 | `document_status_changed` | `document_replaced` | `document_deleted`
- `details`    = JSON com `{ category, documentType, version,
                 fromStatus, toStatus, rejectionReason, fileName }`

Não precisamos de tabela `document_versions` separada porque a cadeia
de versões já está representada por `parent_document_id` + `version`.

### Relacionamentos

```
tenants ─┬─< trailers ──< trailer_documents >── users (uploader, reviewer)
         │                       │
         └─< audit_logs (entity_type='trailer_document', entity_id=...)
```

## Steps
1. **Schema + migração**. Estender `trailerDocuments` com as colunas
   novas (`category`, `document_type`, `status`, `version`,
   `parent_document_id`, `is_current`, `mime_type`, `file_size`,
   `rejection_reason`, `reviewed_by`, `reviewed_at`), criar índices
   novos, popular os campos a partir do `document_category` legado,
   atualizar `insertTrailerDocumentSchema`, tipos exportados e relations.
   Rodar `npm run db:push --force` preservando os PKs `varchar`.
2. **Catálogo de tipos**. Criar `shared/document-types.ts` com o mapa
   de categoria → tipos (obrigatório/opcional) e helpers
   (`isKnownType`, `isRequired`, `getTypesByCategory`) consumidos pelo
   servidor e pelo cliente.
3. **Storage + rotas**. Estender `IStorage` com `getTrailerDocumentsGrouped`
   (agrupado por categoria/tipo, com versão atual + histórico),
   `addTrailerDocumentVersion` (nova versão marca anteriores como
   `is_current=false`), `setTrailerDocumentStatus` (pending → approved/
   rejected, exige reviewer + motivo quando rejeitado). Adaptar as rotas
   `/api/trailers/:id/documents` (GET com agrupamento, POST que aceita
   `{ category, documentType, fileUrl, fileName }` e cria v1 ou nova
   versão, PATCH `/status` para aprovar/rejeitar, DELETE soft que mantém
   histórico). Toda mutação grava em `audit_logs`.
4. **UI das abas**. Refatorar `TrailerDocumentsTab` em
   `client/src/pages/assets.tsx` para um `Tabs` interno com as 4 abas;
   cada aba renderiza a checklist do catálogo, mostra para cada tipo a
   versão atual + selo de status + botão "Nova versão", e um popover de
   histórico de versões. Adicionar ações de aprovar/rejeitar (com modal
   pedindo motivo) visíveis para perfis com permissão.
5. **i18n + dados de teste**. Adicionar chaves `assets.docs.*` em
   `client/src/locales/en-US.json` e `pt-BR.json` para nomes de
   categorias, tipos e status, e atualizar o seed/fixtures se houver
   referência aos valores antigos de `documentCategory`.

## Relevant files
- `shared/schema.ts:120-134,602-673,781-786,916-917`
- `server/storage.ts:104-113,430-540,154,803`
- `server/routes.ts:53-54,2530-2810`
- `server/replit_integrations/object_storage/objectStorage.ts`
- `client/src/pages/assets.tsx:1080-1090,1259-1262,1450-2154`
- `client/src/hooks/use-upload.ts`
- `client/src/locales/en-US.json`
- `client/src/locales/pt-BR.json`