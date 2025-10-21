# Opus Rental Capital - Referência Técnica Completa

## Índice
1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura Backend](#arquitetura-backend)
3. [Arquitetura Frontend](#arquitetura-frontend)
4. [Segurança e Autenticação](#segurança-e-autenticação)
5. [Motor Financeiro](#motor-financeiro)
6. [Funções Utilitárias](#funções-utilitárias)
7. [Automação e Cron Jobs](#automação-e-cron-jobs)

---

## 1. Visão Geral do Sistema

Opus Rental Capital é uma plataforma de gestão de investimentos para trailers de carga. O sistema opera exclusivamente em dólares americanos (USD) e suporta três tipos de usuários:

- **Investor (Investidor)**: Compra cotas e acompanha retornos
- **Manager (Gestor)**: Gerencia ativos e operações
- **Admin (Administrador)**: Acesso total ao sistema

### Stack Tecnológico
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL (NeonDB Serverless)
- **ORM**: Drizzle ORM
- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **State Management**: React Query (TanStack Query v5)
- **Routing**: Wouter
- **Internacionalização**: react-i18next (PT-BR e EN-US)

---

## 2. Arquitetura Backend

### 2.1 Estrutura de Arquivos

```
server/
├── index.ts              # Entry point, Express setup
├── routes.ts             # API endpoints
├── storage.ts            # Data layer (CRUD operations)
├── db.ts                 # Database connection
├── policies.ts           # RBAC policies
├── scheduler.ts          # Cron jobs
├── middleware/
│   └── auth.ts          # Authentication & Authorization
└── services/
    └── finance.service.ts  # Payment generation
```

---

### 2.2 API Endpoints (routes.ts)

#### **Authentication Routes**

##### `POST /api/auth/login`
**Propósito**: Autenticar usuário e criar sessão  
**Acesso**: Público (com rate limit: 10 requisições/15min)  
**Parâmetros**:
```typescript
{
  email: string;
  password: string;
}
```
**Processo**:
1. Busca usuário por email via `storage.getUserByEmail()`
2. Valida senha usando `bcrypt.compare()`
3. Regenera sessão para segurança (`req.session.regenerate()`)
4. Salva `userId` e dados do usuário na sessão
5. Cria audit log da ação de login
6. Retorna dados do usuário (sem senha)

**Retorno**:
```typescript
{
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: "investor" | "manager" | "admin";
  country: string;
}
```

---

##### `POST /api/auth/logout`
**Propósito**: Encerrar sessão do usuário  
**Acesso**: Autenticado  
**Processo**:
1. Destrói sessão (`req.session.destroy()`)
2. Limpa cookie de sessão
3. Retorna mensagem de sucesso

---

##### `GET /api/auth/user`
**Propósito**: Obter dados do usuário logado  
**Acesso**: Autenticado  
**Processo**:
1. Verifica se existe `userId` na sessão
2. Busca usuário via `storage.getUser()`
3. Remove senha antes de retornar

---

#### **Dashboard Routes**

##### `GET /api/dashboard/stats`
**Propósito**: Estatísticas específicas por role  
**Acesso**: Autenticado (todos os roles)  
**Processo**:
- **Investor**: Retorna `getPortfolioData()` com total investido, cotas ativas e retorno mensal
- **Manager/Admin**: Retorna `getCompanyStats()` com receita total, investidores ativos e margem da empresa

**Retorno para Investor**:
```typescript
{
  totalValue: number;      // Valor total investido
  activeShares: number;    // Número de cotas ativas
  monthlyReturn: number;   // Retorno mensal acumulado
}
```

**Retorno para Manager/Admin**:
```typescript
{
  totalRevenue: number;     // Receita total
  activeInvestors: number;  // Investidores ativos
  companyMargin: number;    // Margem da empresa
}
```

---

#### **Portfolio Routes**

##### `GET /api/portfolio`
**Propósito**: Dados completos do portfólio do investidor  
**Acesso**: Investor apenas  
**Processo**:
1. Chama `storage.getPortfolioData(userId)`
2. Retorna shares com detalhes dos trailers
3. Retorna histórico de payments

**Retorno**:
```typescript
{
  shares: Array<{
    id: string;
    purchaseValue: string;
    purchaseDate: string;
    monthlyReturn: string;
    status: "active" | "inactive";
    trailer: {
      trailerId: string;
      model: string;
      location: string;
    }
  }>;
  payments: Array<{
    id: string;
    amount: string;
    paymentDate: string;
    status: "paid" | "pending";
    referenceMonth: string;
  }>;
}
```

---

##### `GET /api/shares`
**Propósito**: Lista de shares do usuário  
**Acesso**: Investor, Manager, Admin  
**Processo**:
- Investor: Retorna apenas suas próprias shares
- Manager/Admin: Retorna todas as shares do sistema

---

#### **Trailer Routes**

##### `GET /api/trailers`
**Propósito**: Listar todos os trailers  
**Acesso**: Manager, Admin  
**Processo**:
1. Chama `storage.getAllTrailers()`
2. Para cada trailer, calcula:
   - `soldShares`: Número de shares vendidas
   - `totalShares`: Total de shares disponíveis
   - `availableShares`: Shares ainda disponíveis

**Retorno**:
```typescript
Array<{
  id: string;
  trailerId: string;
  model: string;
  purchaseValue: string;
  status: "stock" | "active" | "maintenance" | "expired";
  totalShares: number;
  soldShares: number;
  availableShares: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
}>
```

---

##### `GET /api/trailers/available`
**Propósito**: Trailers com cotas disponíveis para compra  
**Acesso**: Todos os usuários autenticados  
**Processo**:
1. Busca todos os trailers (exceto "expired")
2. Para cada trailer, conta shares vendidas
3. Calcula `availableShares = totalShares - soldShares`
4. Filtra apenas trailers com `availableShares > 0`

**Diferencial**: Mostra trailers em qualquer status (stock, active, maintenance), desde que tenham cotas disponíveis.

---

##### `GET /api/trailers/:id`
**Propósito**: Detalhes de um trailer específico  
**Acesso**: Manager, Admin  
**Processo**:
1. Busca trailer via `storage.getTrailer(id)`
2. Conta shares vendidas
3. Retorna trailer com informações de disponibilidade

---

##### `POST /api/trailers`
**Propósito**: Cadastrar novo trailer  
**Acesso**: Manager, Admin  
**Validação**: Usa `insertTrailerSchema` do Zod  
**Parâmetros**:
```typescript
{
  trailerId: string;        // ID único do trailer (ex: TRL-001)
  model: string;            // Modelo do trailer
  purchaseValue: string;    // Valor de compra
  purchaseDate: string;     // Data de compra (ISO 8601)
  status: "stock" | "active" | "maintenance" | "expired";
  totalShares: number;      // Quantidade de cotas (padrão: 1)
  location?: string;        // Localização
  latitude?: number;        // Coordenada GPS
  longitude?: number;       // Coordenada GPS
}
```

**Processo**:
1. Valida dados com Zod
2. Verifica se `trailerId` já existe
3. Insere no banco via `storage.createTrailer()`
4. Cria audit log
5. Retorna trailer criado

---

#### **Share Routes**

##### `POST /api/shares`
**Propósito**: Comprar uma cota de trailer  
**Acesso**: Todos os usuários autenticados  
**Parâmetros**:
```typescript
{
  trailerId: string;  // ID do trailer
}
```

**Processo**:
1. Busca trailer via `storage.getTrailer()`
2. **Validações**:
   - Trailer existe
   - Trailer não está expirado
   - Existem cotas disponíveis (`availableShares > 0`)
3. Cria share via `storage.createShare()` com:
   - `userId`: ID do comprador
   - `trailerId`: ID do trailer
   - `purchaseValue`: Valor do trailer
   - `purchaseDate`: Data atual
   - `monthlyReturn`: 2% (padrão)
   - `status`: "active"
4. **Atualiza status do trailer**:
   - Se todas as cotas foram vendidas → status "active"
   - Se ainda há cotas disponíveis → mantém status atual
5. Cria audit log
6. Retorna share criada

**Retorno**:
```typescript
{
  id: string;
  userId: string;
  trailerId: string;
  purchaseValue: string;
  purchaseDate: string;
  monthlyReturn: string;
  status: "active";
}
```

---

##### `GET /api/shares/all`
**Propósito**: Todas as shares com detalhes de usuário e trailer  
**Acesso**: Manager, Admin  
**Processo**:
1. Chama `storage.getAllSharesWithDetails()`
2. Retorna join de shares + users + trailers

---

##### `GET /api/shares/:id`
**Propósito**: Detalhes de uma share específica  
**Acesso**: Owner (investor), Manager, Admin  
**Processo**:
1. Middleware `checkOwnership()` valida acesso
2. Investor só acessa suas próprias shares
3. Manager/Admin acessam qualquer share

---

#### **Payment Routes**

##### `GET /api/payments`
**Propósito**: Histórico de pagamentos do usuário  
**Acesso**: Investor, Manager, Admin  
**Processo**:
- Investor: Retorna apenas seus payments
- Manager/Admin: Pode filtrar por usuário

---

##### `GET /api/payments/:shareId`
**Propósito**: Pagamentos de uma share específica  
**Acesso**: Owner (investor), Manager, Admin  
**Processo**:
1. Middleware `checkOwnership()` valida propriedade da share
2. Busca payments via `storage.getPaymentsByShareId()`

---

##### `POST /api/payments`
**Propósito**: Criar pagamento manual  
**Acesso**: Manager, Admin  
**Processo**:
1. Valida dados
2. Cria payment via `storage.createPayment()`
3. Cria audit log

---

#### **Tracking Routes**

##### `GET /api/tracking`
**Propósito**: Dados GPS mais recentes de todos os trailers  
**Acesso**: Manager, Admin  
**Processo**:
1. Chama `storage.getAllLatestTracking()`
2. Retorna última posição GPS de cada trailer

**Retorno**:
```typescript
Array<{
  id: string;
  trailerId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: string;
}>
```

---

##### `GET /api/tracking/:trailerId/history`
**Propósito**: Histórico de rastreamento de um trailer  
**Acesso**: Manager, Admin  
**Parâmetros de Query**:
- `limit`: Número de registros (padrão: 100)

**Processo**:
1. Chama `storage.getTrackingHistory(trailerId, limit)`
2. Retorna histórico ordenado por timestamp DESC

---

#### **Financial Routes**

##### `GET /api/financial/records`
**Propósito**: Histórico de registros financeiros (últimos 12 meses)  
**Acesso**: Manager, Admin  
**Processo**:
1. Chama `storage.getAllFinancialRecords()`
2. Retorna registros consolidados por mês

**Retorno**:
```typescript
Array<{
  id: string;
  month: string;              // Formato YYYY-MM
  totalRevenue: string;       // Receita total
  investorPayouts: string;    // Pagamentos aos investidores
  operationalCosts: string;   // Custos operacionais
  companyMargin: string;      // Margem da empresa
  createdAt: string;
}>
```

---

##### `GET /api/financial/current`
**Propósito**: Resumo financeiro do mês atual  
**Acesso**: Manager, Admin  
**Processo**:
1. Gera string do mês atual (YYYY-MM)
2. Busca via `storage.getFinancialRecordByMonth()`
3. Se não existir, retorna zeros

---

##### `POST /api/financial/generate/:month`
**Propósito**: Gerar pagamentos mensais manualmente  
**Acesso**: Manager, Admin  
**Parâmetros de URL**:
- `month`: Mês de referência (formato YYYY-MM)

**Processo**:
1. Chama `generateMonth(month)` do finance service
2. Gera payments para todas as shares ativas
3. Consolida financial_records
4. Retorna resumo da operação

**Retorno**:
```typescript
{
  referenceMonth: string;    // "2025-10"
  sharesProcessed: number;   // 15
  investorPayouts: string;   // "3000.00"
  totalRevenue: string;      // "3000.00"
  companyMargin: string;     // "0.00"
}
```

---

#### **Compliance Routes**

##### `GET /api/documents`
**Propósito**: Documentos do usuário  
**Acesso**: Investor (próprios docs), Manager/Admin (todos)  
**Processo**:
1. Busca via `storage.getDocumentsByUserId()`
2. Investor vê apenas seus documentos

---

##### `GET /api/audit-logs`
**Propósito**: Logs de auditoria do sistema  
**Acesso**: Manager, Admin  
**Parâmetros de Query**:
- `limit`: Número de registros (padrão: 100)

**Processo**:
1. Chama `storage.getRecentAuditLogs(limit)`
2. Retorna logs ordenados por timestamp DESC

**Retorno**:
```typescript
Array<{
  id: string;
  userId: string;
  action: string;           // "login", "purchase_share", etc.
  entityType: string;       // "user", "share", "trailer", etc.
  entityId: string;
  details: object;          // Informações adicionais
  ipAddress: string;
  timestamp: string;
}>
```

---

### 2.3 Storage Layer (storage.ts)

A camada de storage abstrai todas as operações de banco de dados usando Drizzle ORM.

#### **Interface IStorage**

Define o contrato para todas as operações de dados:

```typescript
interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Trailer operations
  getTrailer(id: string): Promise<Trailer | undefined>;
  getTrailerByTrailerId(trailerId: string): Promise<Trailer | undefined>;
  getAllTrailers(): Promise<Trailer[]>;
  getAvailableTrailers(): Promise<Trailer[]>;
  createTrailer(trailer: InsertTrailer): Promise<Trailer>;
  updateTrailer(id: string, trailer: Partial<Trailer>): Promise<Trailer>;
  
  // Share operations
  getShare(id: string): Promise<Share | undefined>;
  getSharesByUserId(userId: string): Promise<Share[]>;
  getSharesByTrailerId(trailerId: string): Promise<Share[]>;
  getAllShares(): Promise<Share[]>;
  getAllSharesWithDetails(): Promise<any[]>;
  createShare(share: InsertShare): Promise<Share>;
  updateShare(id: string, share: Partial<Share>): Promise<Share>;
  
  // Payment operations
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByUserId(userId: string): Promise<Payment[]>;
  getPaymentsByShareId(shareId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Tracking operations
  getLatestTrackingByTrailerId(trailerId: string): Promise<TrackingData | undefined>;
  getTrackingHistory(trailerId: string, limit?: number): Promise<TrackingData[]>;
  getAllLatestTracking(): Promise<TrackingData[]>;
  createTrackingData(data: InsertTrackingData): Promise<TrackingData>;
  
  // Document operations
  getDocumentsByUserId(userId: string): Promise<Document[]>;
  getDocumentsByShareId(shareId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getRecentAuditLogs(limit?: number): Promise<AuditLog[]>;
  
  // Financial operations
  getFinancialRecordByMonth(month: string): Promise<FinancialRecord | undefined>;
  getAllFinancialRecords(): Promise<FinancialRecord[]>;
  createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord>;
  
  // Dashboard data
  getDashboardStats(userId: string): Promise<any>;
  getPortfolioData(userId: string): Promise<any>;
}
```

#### **Implementações Principais**

##### `getAvailableTrailers()`
**Propósito**: Buscar trailers com cotas disponíveis  
**Lógica**:
```typescript
async getAvailableTrailers(): Promise<any[]> {
  // 1. Busca todos os trailers (exceto expirados implicitamente)
  const availableTrailers = await db
    .select()
    .from(trailers)
    .orderBy(desc(trailers.createdAt));
  
  // 2. Para cada trailer, calcula disponibilidade
  const trailersWithAvailability = await Promise.all(
    availableTrailers.map(async (trailer) => {
      // Conta shares vendidas
      const soldShares = await db
        .select()
        .from(shares)
        .where(eq(shares.trailerId, trailer.id));
      
      const totalShares = parseInt(trailer.totalShares?.toString() || "1");
      const availableShares = totalShares - soldShares.length;
      
      return {
        ...trailer,
        soldShares: soldShares.length,
        availableShares,
      };
    })
  );
  
  // 3. Filtra apenas trailers com cotas disponíveis e não expirados
  return trailersWithAvailability.filter(
    t => t.availableShares > 0 && t.status !== "expired"
  );
}
```

---

##### `getPortfolioData(userId)`
**Propósito**: Dados completos do portfólio do investidor  
**Lógica**:
```typescript
async getPortfolioData(userId: string): Promise<any> {
  // 1. Busca shares do usuário
  const userShares = await db
    .select({
      id: shares.id,
      purchaseValue: shares.purchaseValue,
      purchaseDate: shares.purchaseDate,
      monthlyReturn: shares.monthlyReturn,
      status: shares.status,
      trailerId: trailers.trailerId,
      model: trailers.model,
      location: trailers.location,
    })
    .from(shares)
    .leftJoin(trailers, eq(shares.trailerId, trailers.id))
    .where(eq(shares.userId, userId));
  
  // 2. Busca payments do usuário
  const userPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.paymentDate));
  
  return {
    shares: userShares,
    payments: userPayments,
  };
}
```

---

##### `getDashboardStats(userId)`
**Propósito**: Estatísticas para o dashboard  
**Lógica**:
```typescript
async getDashboardStats(userId: string): Promise<any> {
  const user = await this.getUser(userId);
  
  if (user?.role === "investor") {
    // Busca shares ativas do investidor
    const userShares = await db
      .select()
      .from(shares)
      .where(
        and(
          eq(shares.userId, userId),
          eq(shares.status, "active")
        )
      );
    
    // Calcula total investido
    const totalValue = userShares.reduce(
      (sum, share) => sum + parseFloat(share.purchaseValue),
      0
    );
    
    // Calcula retorno mensal total
    const monthlyReturn = userShares.reduce((sum, share) => {
      const rate = parseFloat(share.monthlyReturn) / 100;
      return sum + (parseFloat(share.purchaseValue) * rate);
    }, 0);
    
    return {
      totalValue,
      activeShares: userShares.length,
      monthlyReturn,
    };
  } else {
    // Manager/Admin: estatísticas da empresa
    const allRecords = await this.getAllFinancialRecords();
    
    const totalRevenue = allRecords.reduce(
      (sum, r) => sum + parseFloat(r.totalRevenue),
      0
    );
    
    const companyMargin = allRecords.reduce(
      (sum, r) => sum + parseFloat(r.companyMargin),
      0
    );
    
    // Conta investidores únicos
    const activeInvestors = await db
      .selectDistinct({ userId: shares.userId })
      .from(shares)
      .where(eq(shares.status, "active"));
    
    return {
      totalRevenue,
      activeInvestors: activeInvestors.length,
      companyMargin,
    };
  }
}
```

---

##### `getAllSharesWithDetails()`
**Propósito**: Shares com informações completas de usuário e trailer  
**Lógica**:
```typescript
async getAllSharesWithDetails(): Promise<any[]> {
  return await db
    .select({
      // Share fields
      id: shares.id,
      purchaseValue: shares.purchaseValue,
      purchaseDate: shares.purchaseDate,
      monthlyReturn: shares.monthlyReturn,
      status: shares.status,
      // User fields
      userId: users.id,
      userName: users.username,
      userEmail: users.email,
      // Trailer fields
      trailerId: trailers.trailerId,
      trailerModel: trailers.model,
      trailerLocation: trailers.location,
    })
    .from(shares)
    .leftJoin(users, eq(shares.userId, users.id))
    .leftJoin(trailers, eq(shares.trailerId, trailers.id))
    .orderBy(desc(shares.createdAt));
}
```

---

### 2.4 Serviço Financeiro (finance.service.ts)

#### **Função `generateMonth(referenceMonth)`**

**Propósito**: Gerar pagamentos mensais para todas as shares ativas de forma idempotente.

**Parâmetros**:
- `referenceMonth`: String no formato "YYYY-MM" (ex: "2025-10")

**Processo Detalhado**:

```typescript
async function generateMonth(referenceMonth: string): Promise<GenerateMonthResult> {
  // 1. VALIDAÇÃO DO FORMATO
  if (!/^\d{4}-\d{2}$/.test(referenceMonth)) {
    throw new Error("Formato inválido. Use YYYY-MM");
  }
  
  // 2. CALCULAR DATA DE PAGAMENTO
  const [year, month] = referenceMonth.split('-').map(Number);
  const today = new Date();
  const paymentDate = new Date(Date.UTC(
    year,
    month - 1,
    Math.min(28, today.getUTCDate())
  ));
  
  // 3. BUSCAR SHARES ATIVAS
  const activeShares = await db.query.shares.findMany({
    where: eq(shares.status, "active"),
    columns: { 
      id: true, 
      userId: true, 
      purchaseValue: true, 
      monthlyReturn: true 
    },
  });
  
  // 4. GERAR PAGAMENTOS (IDEMPOTENTE)
  let payoutSum = 0;
  
  for (const share of activeShares) {
    // Calcula valor do pagamento (2% por padrão)
    const rate = Number(share.monthlyReturn ?? 2) / 100;
    const amount = +(Number(share.purchaseValue) * rate).toFixed(2);
    
    // INSERT com ON CONFLICT DO NOTHING para idempotência
    await db.execute(sql`
      INSERT INTO "payments" (
        "id",
        "share_id",
        "user_id",
        "amount",
        "payment_date",
        "status",
        "reference_month",
        "created_at"
      )
      VALUES (
        gen_random_uuid(),
        ${share.id},
        ${share.userId},
        ${amount},
        ${paymentDate.toISOString()},
        'paid',
        ${referenceMonth},
        now()
      )
      ON CONFLICT ("share_id", "reference_month") DO NOTHING
    `);
    
    payoutSum += amount;
  }
  
  // 5. CONSOLIDAR REGISTROS FINANCEIROS
  const investorPayouts = +payoutSum.toFixed(2);
  const totalRevenue = investorPayouts;
  const operationalCosts = 0;
  const companyMargin = +(totalRevenue - investorPayouts - operationalCosts).toFixed(2);
  
  // UPSERT no financial_records
  await db.execute(sql`
    INSERT INTO "financial_records" (
      "id",
      "month",
      "total_revenue",
      "investor_payouts",
      "operational_costs",
      "company_margin",
      "created_at"
    )
    VALUES (
      gen_random_uuid(),
      ${referenceMonth},
      ${totalRevenue},
      ${investorPayouts},
      ${operationalCosts},
      ${companyMargin},
      now()
    )
    ON CONFLICT ("month") DO UPDATE
    SET 
      "total_revenue" = EXCLUDED."total_revenue",
      "investor_payouts" = EXCLUDED."investor_payouts",
      "operational_costs" = EXCLUDED."operational_costs",
      "company_margin" = EXCLUDED."company_margin"
  `);
  
  // 6. RETORNAR RESUMO
  return {
    referenceMonth,
    sharesProcessed: activeShares.length,
    investorPayouts: investorPayouts.toFixed(2),
    totalRevenue: totalRevenue.toFixed(2),
    companyMargin: companyMargin.toFixed(2),
  };
}
```

**Características-Chave**:
- **Idempotência**: Pode ser executado múltiplas vezes sem duplicar pagamentos
- **Constraint de unicidade**: `UNIQUE(share_id, reference_month)` previne duplicatas
- **Upsert**: Atualiza financial_records se o mês já existir

---

## 3. Arquitetura Frontend

### 3.1 Estrutura de Arquivos

```
client/src/
├── App.tsx                 # Router principal
├── pages/                  # Páginas da aplicação
│   ├── login.tsx
│   ├── dashboard.tsx
│   ├── portfolio.tsx
│   ├── assets.tsx
│   ├── tracking.tsx
│   ├── financial.tsx
│   ├── reports.tsx
│   ├── compliance.tsx
│   ├── settings.tsx
│   ├── approvals.tsx
│   ├── investor-shares.tsx
│   └── not-found.tsx
├── components/
│   ├── layout/
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   ├── ui/                 # shadcn/ui components
│   ├── charts/
│   │   ├── performance-chart.tsx
│   │   └── revenue-chart.tsx
│   └── maps/
│       └── tracking-map.tsx
├── hooks/
│   ├── useAuth.tsx
│   └── use-toast.ts
├── lib/
│   ├── queryClient.ts      # React Query setup
│   ├── currency.ts         # Currency utilities
│   └── exportUtils.ts      # Export PDF/Excel
├── locales/
│   ├── en-US.json
│   └── pt-BR.json
└── i18n.ts                 # i18next config
```

---

### 3.2 Páginas Principais

#### **Login Page (login.tsx)**

**Propósito**: Autenticação de usuários

**Funcionalidades**:
- Form com validação Zod
- Submit via mutation POST /api/auth/login
- Redirecionamento baseado em role
- Persistência de idioma selecionado no localStorage

**Código Principal**:
```typescript
const loginMutation = useMutation({
  mutationFn: async (data: LoginFormData) => {
    return apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  onSuccess: (data) => {
    queryClient.setQueryData(["/api/auth/user"], data);
    navigate("/dashboard");
  },
});
```

---

#### **Dashboard Page (dashboard.tsx)**

**Propósito**: Visão geral personalizada por role

**Funcionalidades**:
- **Investor**: Cards com total investido, cotas ativas, retorno mensal
- **Manager/Admin**: Receita total, investidores ativos, margem da empresa
- Gráficos de performance (Recharts)
- Últimas transações

**Query Principal**:
```typescript
const { data: stats } = useQuery({
  queryKey: ["/api/dashboard/stats"],
});
```

---

#### **Portfolio Page (portfolio.tsx)**

**Propósito**: Gestão de investimentos do investidor

**Funcionalidades**:
1. **Compra de Novas Cotas**:
   - Dialog com lista de trailers disponíveis
   - Refetch automático ao abrir dialog
   - Mutation para compra instantânea

2. **Histórico de Retornos**:
   - Tabela com todos os payments
   - Formatação de moeda
   - Status badges

3. **Projeções de Ganho**:
   - Cálculo de retornos futuros (3, 6, 12 meses)
   - Progress bars visuais

4. **Minhas Cotas**:
   - Cards com detalhes de cada share
   - Status (ativa/inativa)
   - Valor do retorno mensal

**Código de Compra**:
```typescript
const purchaseMutation = useMutation({
  mutationFn: async (trailerId: string) => {
    return apiRequest("/api/shares", {
      method: "POST",
      body: JSON.stringify({ trailerId }),
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    queryClient.invalidateQueries({ queryKey: ["/api/trailers/available"] });
    setIsDialogOpen(false);
    toast({
      title: "Cota adquirida!",
      description: "Sua cota foi registrada com sucesso.",
    });
  },
});
```

**Refetch Automático**:
```typescript
const { data: availableTrailers, refetch: refetchAvailableTrailers } = useQuery<Trailer[]>({
  queryKey: ["/api/trailers/available"],
  refetchOnMount: true,
  refetchOnWindowFocus: true,
});

// Ao abrir dialog
<Dialog open={isDialogOpen} onOpenChange={(open) => {
  setIsDialogOpen(open);
  if (open) {
    refetchAvailableTrailers(); // Força refetch
  }
}}>
```

---

#### **Assets Page (assets.tsx)**

**Propósito**: Gestão de trailers (Manager/Admin)

**Funcionalidades**:
1. **Listagem de Trailers**:
   - Tabela com todos os trailers
   - Informações de cotas vendidas/disponíveis
   - Status badges

2. **Cadastro de Novo Trailer**:
   - Form com validação completa
   - Campos: ID, modelo, valor, data, status, cotas totais, localização GPS
   - Mutation POST /api/trailers

3. **Filtros e Busca**:
   - Busca por ID ou modelo
   - Filtro por status

**Form de Cadastro**:
```typescript
const form = useForm<TrailerFormData>({
  resolver: zodResolver(insertTrailerSchema.extend({
    totalShares: z.coerce.number().min(1).default(1),
  })),
  defaultValues: {
    status: "stock",
    totalShares: 1,
    purchaseDate: new Date().toISOString().split('T')[0],
  },
});

const createMutation = useMutation({
  mutationFn: async (data: TrailerFormData) => {
    return apiRequest("/api/trailers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/trailers"] });
    setIsOpen(false);
    form.reset();
    toast({ title: "Trailer cadastrado!" });
  },
});
```

---

#### **Tracking Page (tracking.tsx)**

**Propósito**: Rastreamento GPS de trailers (Manager/Admin)

**Funcionalidades**:
- Mapa interativo com Leaflet
- Marcadores para cada trailer
- Informações de velocidade e timestamp
- Atualização em tempo real

**Mapa**:
```typescript
const { data: trackingData } = useQuery({
  queryKey: ["/api/tracking"],
  refetchInterval: 30000, // Atualiza a cada 30s
});

<MapContainer center={[39.8283, -98.5795]} zoom={4}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  {trackingData?.map((point) => (
    <Marker 
      key={point.id} 
      position={[point.latitude, point.longitude]}
    >
      <Popup>
        <strong>{point.trailerId}</strong><br />
        Speed: {point.speed || 0} mph<br />
        {new Date(point.timestamp).toLocaleString()}
      </Popup>
    </Marker>
  ))}
</MapContainer>
```

---

#### **Financial Page (financial.tsx)**

**Propósito**: Gestão financeira (Manager/Admin)

**Funcionalidades**:
1. **Resumo do Mês Atual**:
   - Receita total
   - Pagamentos aos investidores
   - Margem da empresa

2. **Histórico Mensal**:
   - Tabela com últimos 12 meses
   - Gráfico de receita (Recharts)

3. **Geração Manual de Pagamentos**:
   - Seleção de mês
   - Botão para gerar
   - Confirmação com resumo

**Geração de Pagamentos**:
```typescript
const generateMutation = useMutation({
  mutationFn: async (month: string) => {
    return apiRequest(`/api/financial/generate/${month}`, {
      method: "POST",
    });
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ["/api/financial/records"] });
    toast({
      title: "Pagamentos gerados!",
      description: `${data.sharesProcessed} shares processadas. Total: $${data.investorPayouts}`,
    });
  },
});
```

---

#### **Reports Page (reports.tsx)**

**Propósito**: Geração de relatórios

**Funcionalidades**:
1. **Filtros**:
   - Período (data inicial e final)
   - Tipo de relatório (financeiro, investidores, trailers)

2. **Exportação**:
   - **PDF**: Usando jsPDF + jsPDF-AutoTable
   - **Excel**: Usando xlsx
   - **CSV**: Conversão manual

**Exportação PDF**:
```typescript
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const exportPDF = () => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text("Financial Report", 14, 22);
  
  autoTable(doc, {
    head: [["Month", "Revenue", "Payouts", "Margin"]],
    body: data.map(row => [
      row.month,
      `$${row.totalRevenue}`,
      `$${row.investorPayouts}`,
      `$${row.companyMargin}`,
    ]),
    startY: 30,
  });
  
  doc.save(`report-${new Date().toISOString()}.pdf`);
};
```

**Exportação Excel**:
```typescript
import * as XLSX from "xlsx";

const exportExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Financial");
  XLSX.writeFile(workbook, `report-${new Date().toISOString()}.xlsx`);
};
```

---

#### **Compliance Page (compliance.tsx)**

**Propósito**: Documentação e auditoria

**Funcionalidades**:
1. **Documentos do Usuário**:
   - Lista de documentos
   - Upload de novos documentos (mock)

2. **Logs de Auditoria** (Manager/Admin):
   - Tabela com todas as ações do sistema
   - Filtros por ação, usuário, data
   - Paginação

**Query de Audit Logs**:
```typescript
const { data: auditLogs } = useQuery({
  queryKey: ["/api/audit-logs"],
  enabled: user?.role !== "investor",
});
```

---

#### **Settings Page (settings.tsx)**

**Propósito**: Configurações do sistema

**Funcionalidades**:
1. **Perfil do Usuário**:
   - Edição de nome, email
   - Seleção de país (afeta moeda)

2. **Preferências**:
   - Idioma (PT-BR / EN-US)
   - Tema (claro/escuro - futuro)

3. **Segurança**:
   - Alteração de senha
   - Sessões ativas

---

### 3.3 Componentes Principais

#### **Header Component (header.tsx)**

**Propósito**: Barra superior com navegação e perfil

**Funcionalidades**:
- Logo da empresa
- Seletor de idioma (PT-BR / EN-US)
- Dropdown de perfil com logout

**Seletor de Idioma**:
```typescript
const { i18n } = useTranslation();

const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('language', lang);
};
```

---

#### **Sidebar Component (sidebar.tsx)**

**Propósito**: Menu lateral com navegação

**Funcionalidades**:
- Links para todas as páginas
- Ícones do Lucide React
- Indicador de página ativa
- Personalização por role

**Links Condicionais**:
```typescript
{user?.role === "investor" ? (
  <Link to="/portfolio">
    <Wallet className="h-5 w-5" />
    Portfolio
  </Link>
) : (
  <>
    <Link to="/assets">
      <Truck className="h-5 w-5" />
      Assets
    </Link>
    <Link to="/investor-shares">
      <Users className="h-5 w-5" />
      Investors
    </Link>
  </>
)}
```

---

#### **Tracking Map Component (tracking-map.tsx)**

**Propósito**: Mapa GPS interativo

**Tecnologia**: React-Leaflet

**Props**:
```typescript
interface TrackingMapProps {
  data: Array<{
    id: string;
    trailerId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    timestamp: string;
  }>;
}
```

**Implementação**:
```typescript
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export function TrackingMap({ data }: TrackingMapProps) {
  return (
    <MapContainer 
      center={[39.8283, -98.5795]} 
      zoom={4}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {data.map((point) => (
        <Marker 
          key={point.id}
          position={[point.latitude, point.longitude]}
        >
          <Popup>
            <div>
              <strong>{point.trailerId}</strong><br />
              Speed: {point.speed || 0} mph<br />
              {new Date(point.timestamp).toLocaleString()}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

---

#### **Performance Chart Component (performance-chart.tsx)**

**Propósito**: Gráfico de performance de investimento

**Tecnologia**: Recharts

**Props**:
```typescript
interface PerformanceChartProps {
  data: Array<{
    month: string;
    value: number;
  }>;
}
```

**Implementação**:
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value) => `$${value}`} />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#8884d8" 
          strokeWidth={2} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

### 3.4 Hooks Personalizados

#### **useAuth Hook (useAuth.tsx)**

**Propósito**: Gerenciar estado de autenticação

**Funcionalidades**:
- Query do usuário autenticado
- Função de logout
- Redirect para login se não autenticado

**Implementação**:
```typescript
export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/auth/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      window.location.href = "/login";
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: () => logoutMutation.mutate(),
  };
}
```

---

### 3.5 Utilitários

#### **Currency Utilities (currency.ts)**

**Propósito**: Formatação de moeda (USD fixo)

**Funções**:

##### `getCurrencyForCountry(country)`
```typescript
export function getCurrencyForCountry(country: string | null | undefined): CurrencyConversion {
  const countryCode = country?.toUpperCase() || 'US';
  return CURRENCY_RATES[countryCode] || CURRENCY_RATES.US;
}
```

##### `formatCurrency(value, userCountry)`
**Comportamento Atual**: Sempre retorna USD independente do país
```typescript
export function formatCurrency(
  value: number | string,
  userCountry?: string | null
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Sistema opera 100% em USD
  return `$${numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
```

**Exemplo**:
```typescript
formatCurrency(1500.5)  // "$1,500.50"
formatCurrency("2000")  // "$2,000.00"
```

---

#### **Export Utilities (exportUtils.ts)**

**Propósito**: Funções para exportação de dados

**Funções**:

##### `exportToCSV(data, filename)`
```typescript
export function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => `"${row[header]}"`).join(',')
    ),
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

##### `exportToPDF(data, title, headers, filename)`
```typescript
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToPDF(
  data: any[], 
  title: string, 
  headers: string[], 
  filename: string
) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  autoTable(doc, {
    head: [headers],
    body: data.map(row => headers.map(h => row[h])),
    startY: 30,
    styles: { fontSize: 10 },
  });
  
  doc.save(filename);
}
```

##### `exportToExcel(data, sheetName, filename)`
```typescript
import * as XLSX from "xlsx";

export function exportToExcel(
  data: any[], 
  sheetName: string, 
  filename: string
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
```

---

#### **Query Client (queryClient.ts)**

**Propósito**: Configuração do React Query

**Implementação**:
```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`${res.status}: ${await res.text()}`);
        }
        return res.json();
      },
      staleTime: 5 * 60 * 1000,      // 5 minutos
      gcTime: 10 * 60 * 1000,        // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  
  return res.json();
}
```

---

## 4. Segurança e Autenticação

### 4.1 Middleware de Autenticação (auth.ts)

#### **`isAuthenticated()`**
**Propósito**: Verificar se usuário está logado  
**Lógica**:
```typescript
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
```

---

#### **`requireRole(allowedRoles)`**
**Propósito**: Restringir acesso por role  
**Lógica**:
```typescript
export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        message: "Forbidden: Insufficient permissions",
        required: allowedRoles,
        current: user?.role
      });
    }

    req.user = user;
    next();
  };
};

// Atalhos
export const isManager = requireRole(["manager", "admin"]);
export const isAdmin = requireRole(["admin"]);
```

---

#### **`authorize()`**
**Propósito**: Autorização baseada em políticas dinâmicas  
**Lógica**:
```typescript
export const authorize = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      // Log de tentativa não autorizada
      await storage.createAuditLog({
        userId: req.session.userId || "anonymous",
        action: "unauthorized_access",
        entityType: "route",
        entityId: req.path,
        details: { method: req.method, path: req.path },
        ipAddress: req.ip,
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Busca política para a rota
    const allowedRoles = matchPolicy(req.method, req.path);
    
    if (!allowedRoles) {
      return res.status(404).json({ message: "Not found" });
    }

    // Rota pública
    if (allowedRoles[0] === "*") {
      return next();
    }

    // Verifica se role do usuário está permitido
    if (!allowedRoles.includes(req.session.user.role)) {
      await storage.createAuditLog({
        userId: req.session.user.id,
        action: "forbidden_access",
        entityType: "route",
        entityId: req.path,
        details: { 
          method: req.method, 
          path: req.path,
          required: allowedRoles,
          current: req.session.user.role 
        },
        ipAddress: req.ip,
      });
      
      return res.status(403).json({ 
        message: "Forbidden: Insufficient permissions",
        required: allowedRoles,
        current: req.session.user.role
      });
    }

    next();
  };
};
```

---

#### **`checkOwnership()`**
**Propósito**: Validar que investidor acessa apenas seus recursos  
**Lógica**:
```typescript
export const checkOwnership = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.session.user.role;
    
    // Manager/Admin têm acesso a tudo
    if (userRole === "manager" || userRole === "admin") {
      return next();
    }

    const shareId = req.params.id || req.params.shareId;
    const userId = req.session.user.id;

    // Validar acesso a shares
    if (req.path.includes("/shares/") && shareId) {
      const share = await storage.getShare(shareId);
      if (!share || share.userId !== userId) {
        await storage.createAuditLog({
          userId,
          action: "ownership_violation",
          entityType: "share",
          entityId: shareId,
          details: { 
            attemptedAccess: shareId,
            actualOwner: share?.userId || "not_found"
          },
          ipAddress: req.ip,
        });
        return res.status(403).json({ 
          message: "Forbidden: You can only access your own resources" 
        });
      }
    }

    // Validar acesso a payments
    if (req.path.includes("/payments/") && shareId) {
      const share = await storage.getShare(shareId);
      if (!share || share.userId !== userId) {
        await storage.createAuditLog({
          userId,
          action: "ownership_violation",
          entityType: "payment",
          entityId: shareId,
          details: { 
            attemptedAccess: shareId,
            actualOwner: share?.userId || "not_found"
          },
          ipAddress: req.ip,
        });
        return res.status(403).json({ 
          message: "Forbidden: You can only access your own resources" 
        });
      }
    }

    next();
  };
};
```

---

#### **`logAccess()`**
**Propósito**: Log de todas as requisições  
**Lógica**:
```typescript
export const logAccess = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logEntry = {
        timestamp: new Date().toISOString(),
        userId: req.session?.user?.id || "anonymous",
        email: req.session?.user?.email || "unknown",
        role: req.session?.user?.role || "none",
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      };
      
      if (res.statusCode >= 400) {
        console.error("❌ Access Error:", JSON.stringify(logEntry));
      } else {
        console.log("✅ Access:", JSON.stringify(logEntry));
      }
    });
    
    next();
  };
};
```

---

### 4.2 Políticas de Acesso (policies.ts)

#### **Mapa de Políticas**
```typescript
export const Policy = {
  "GET /api/auth/user": ["investor", "manager", "admin"],
  "POST /api/auth/login": ["*"],
  "POST /api/auth/logout": ["investor", "manager", "admin"],
  
  "GET /api/dashboard/stats": ["investor", "manager", "admin"],
  "GET /api/portfolio": ["investor"],
  
  "GET /api/trailers": ["manager", "admin"],
  "GET /api/trailers/available": ["investor", "manager", "admin"],
  "GET /api/trailers/:id": ["manager", "admin"],
  "POST /api/trailers": ["manager", "admin"],
  
  "GET /api/tracking": ["manager", "admin"],
  "GET /api/tracking/:trailerId/history": ["manager", "admin"],
  
  "GET /api/financial/records": ["manager", "admin"],
  "GET /api/financial/current": ["manager", "admin"],
  "POST /api/financial/generate/:month": ["manager", "admin"],
  
  "GET /api/documents": ["investor", "manager", "admin"],
  "GET /api/audit-logs": ["manager", "admin"],
  
  "GET /api/shares/all": ["manager", "admin"],
  "GET /api/shares": ["investor", "manager", "admin"],
  "GET /api/shares/:id": ["investor", "manager", "admin"],
  "POST /api/shares": ["investor", "manager", "admin"],
  
  "GET /api/payments": ["investor", "manager", "admin"],
  "GET /api/payments/:shareId": ["investor", "manager", "admin"],
  "POST /api/payments": ["manager", "admin"],
} as const;
```

---

#### **`matchPolicy(method, path)`**
**Propósito**: Resolver política para uma rota dinâmica  
**Lógica**:
```typescript
export function matchPolicy(method: string, path: string): readonly UserRole[] | readonly ["*"] | undefined {
  // Normaliza path substituindo IDs/parâmetros por placeholders
  const normalizedPath = path.replace(/\/[^/]+$/, (match) => {
    const uuidPattern = /^\/[0-9a-f-]+$/i;
    const trailerIdPattern = /^\/[A-Z0-9-]+$/;
    const monthPattern = /^\/\d{4}-\d{2}$/;
    
    if (path.includes('/generate/') && monthPattern.test(match)) {
      return "/:month";
    }
    if (path.includes('/payments/') && uuidPattern.test(match)) {
      return "/:shareId";
    }
    if (path.includes('/tracking/') && trailerIdPattern.test(match)) {
      return "/:trailerId";
    }
    if (uuidPattern.test(match)) {
      return "/:id";
    }
    return match;
  });
  
  const key = `${method} ${normalizedPath}` as PolicyKey;
  return Policy[key];
}
```

**Exemplo**:
```typescript
matchPolicy("GET", "/api/shares/abc-123-def")
// Normaliza para "GET /api/shares/:id"
// Retorna ["investor", "manager", "admin"]

matchPolicy("POST", "/api/financial/generate/2025-10")
// Normaliza para "POST /api/financial/generate/:month"
// Retorna ["manager", "admin"]
```

---

#### **`requiresOwnershipCheck(method, path)`**
**Propósito**: Verificar se rota requer validação de propriedade  
**Lógica**:
```typescript
export const OwnershipRoutes = new Set([
  "GET /api/shares/:id",
  "GET /api/payments/:shareId",
  "GET /api/documents",
]);

export function requiresOwnershipCheck(method: string, path: string): boolean {
  const normalizedPath = path.replace(/\/[^/]+$/, (match) => {
    const uuidPattern = /^\/[0-9a-f-]+$/i;
    
    if (path.includes('/payments/') && uuidPattern.test(match)) {
      return "/:shareId";
    }
    if (uuidPattern.test(match)) {
      return "/:id";
    }
    return match;
  });
  
  const key = `${method} ${normalizedPath}`;
  return OwnershipRoutes.has(key);
}
```

---

### 4.3 Segurança de Sessão

#### **Configuração de Sessão**
```typescript
app.use(
  session({
    secret: process.env.SESSION_SECRET || "opus-rental-capital-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,              // Previne acesso via JavaScript
      sameSite: "lax",             // Proteção CSRF
      secure: process.env.NODE_ENV === "production",  // HTTPS em produção
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 1 semana
    },
  })
);
```

---

### 4.4 Rate Limiting

#### **Limitadores Configurados**
```typescript
// Login: 10 requisições / 15 minutos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, please try again later",
});

// API Geral: 100 requisições / 15 minutos
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Admin: 50 requisições / 15 minutos
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});
```

**Uso**:
```typescript
app.post("/api/auth/login", authLimiter, async (req, res) => {
  // ...
});

app.use("/api/*", apiLimiter);
app.use("/api/admin/*", adminLimiter);
```

---

### 4.5 Helmet (Segurança HTTP)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
```

**Proteções**:
- XSS (Cross-Site Scripting)
- Clickjacking
- MIME type sniffing
- Insecure requests

---

## 5. Motor Financeiro

### 5.1 Visão Geral

O motor financeiro do Opus Rental Capital opera com:
- **Retorno fixo**: 2% ao mês sobre o valor da cota
- **Geração automática**: Cron job no 1º dia de cada mês às 06:00 UTC
- **Idempotência**: Previne duplicação de pagamentos
- **Consolidação**: Registros financeiros mensais

---

### 5.2 Fluxo de Geração de Pagamentos

```
┌─────────────────────────────────────────────────────────────┐
│  1. TRIGGER (Cron ou Manual)                                 │
│     - Cron: 1º dia do mês às 06:00 UTC                       │
│     - Manual: POST /api/financial/generate/:month            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  2. BUSCAR SHARES ATIVAS                                     │
│     SELECT * FROM shares WHERE status = 'active'             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  3. CALCULAR PAGAMENTOS                                      │
│     Para cada share:                                         │
│       - rate = monthlyReturn / 100 (default 2%)              │
│       - amount = purchaseValue * rate                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  4. INSERIR PAGAMENTOS (IDEMPOTENTE)                         │
│     INSERT INTO payments ... ON CONFLICT DO NOTHING          │
│     Constraint: UNIQUE(share_id, reference_month)            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  5. CONSOLIDAR FINANCIALS                                    │
│     INSERT INTO financial_records ... ON CONFLICT DO UPDATE  │
│     - total_revenue = SUM(payments)                          │
│     - investor_payouts = SUM(payments)                       │
│     - company_margin = revenue - payouts - costs             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  6. RETORNAR RESUMO                                          │
│     {                                                        │
│       referenceMonth: "2025-10",                             │
│       sharesProcessed: 15,                                   │
│       investorPayouts: "3000.00",                            │
│       totalRevenue: "3000.00",                               │
│       companyMargin: "0.00"                                  │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.3 Fórmula de Cálculo

#### **Retorno Mensal por Cota**
```
monthlyPayment = purchaseValue × (monthlyReturn / 100)
```

**Exemplo**:
- `purchaseValue`: $50,000
- `monthlyReturn`: 2%
- `monthlyPayment`: $50,000 × 0.02 = **$1,000**

#### **Retorno Total do Investidor**
```
totalMonthlyIncome = Σ (cada cota ativa × seu retorno)
```

**Exemplo**:
- Cota 1: $50,000 × 2% = $1,000
- Cota 2: $75,000 × 2% = $1,500
- **Total**: $2,500/mês

#### **Margem da Empresa**
```
companyMargin = totalRevenue - investorPayouts - operationalCosts
```

**Atualmente**: 
- `operationalCosts` = 0
- `companyMargin` = 0 (modelo 100% pass-through)

---

### 5.4 Idempotência

#### **Constraint de Banco**
```sql
CREATE UNIQUE INDEX payments_share_month_unique 
ON payments(share_id, reference_month);
```

#### **Insert Idempotente**
```sql
INSERT INTO payments (id, share_id, user_id, amount, payment_date, status, reference_month)
VALUES (gen_random_uuid(), $1, $2, $3, $4, 'paid', $5)
ON CONFLICT (share_id, reference_month) DO NOTHING;
```

**Resultado**:
- 1ª execução: Insere pagamento
- 2ª+ execuções: Não faz nada (previne duplicatas)

---

### 5.5 Upsert de Financial Records

```sql
INSERT INTO financial_records (id, month, total_revenue, investor_payouts, operational_costs, company_margin)
VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
ON CONFLICT (month) DO UPDATE
SET 
  total_revenue = EXCLUDED.total_revenue,
  investor_payouts = EXCLUDED.investor_payouts,
  operational_costs = EXCLUDED.operational_costs,
  company_margin = EXCLUDED.company_margin;
```

**Resultado**:
- 1ª execução: Cria registro do mês
- 2ª+ execuções: Atualiza valores (caso haja novas shares)

---

## 6. Funções Utilitárias

### 6.1 Internacionalização (i18n)

#### **Configuração (i18n.ts)**
```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enUS from "./locales/en-US.json";
import ptBR from "./locales/pt-BR.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      "en-US": { translation: enUS },
      "pt-BR": { translation: ptBR },
    },
    lng: localStorage.getItem('language') || "pt-BR",
    fallbackLng: "pt-BR",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

#### **Uso em Componentes**
```typescript
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <button onClick={() => i18n.changeLanguage('en-US')}>
        English
      </button>
    </div>
  );
}
```

#### **Estrutura de Tradução**
```json
{
  "dashboard": {
    "title": "Dashboard",
    "totalInvested": "Total Invested",
    "activeShares": "Active Shares"
  },
  "portfolio": {
    "title": "My Portfolio",
    "buyNewShare": "Buy New Share",
    "availableTrailers": "Available Trailers"
  }
}
```

---

### 6.2 Proteção de Rotas

#### **ProtectedRoute Component**
```typescript
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
}
```

**Uso**:
```typescript
<Route path="/assets">
  <ProtectedRoute allowedRoles={["manager", "admin"]}>
    <AssetsPage />
  </ProtectedRoute>
</Route>
```

---

### 6.3 Toast Notifications

#### **Hook useToast**
```typescript
import { toast as sonnerToast } from "sonner";

export function useToast() {
  return {
    toast: ({ title, description, variant }: ToastOptions) => {
      if (variant === "destructive") {
        sonnerToast.error(title, { description });
      } else {
        sonnerToast.success(title, { description });
      }
    },
  };
}
```

**Uso**:
```typescript
const { toast } = useToast();

toast({
  title: "Success!",
  description: "Share purchased successfully",
});

toast({
  title: "Error",
  description: "Failed to purchase share",
  variant: "destructive",
});
```

---

## 7. Automação e Cron Jobs

### 7.1 Scheduler (scheduler.ts)

#### **Configuração do Cron**
```typescript
import cron from "node-cron";
import { generateMonth } from "./services/finance.service";

export function startScheduler() {
  // Executar no 1º dia de cada mês às 06:00 UTC
  cron.schedule("0 6 1 * *", async () => {
    try {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, "0");
      const referenceMonth = `${year}-${month}`;

      console.log(`[Scheduler] Iniciando geração automática de pagamentos para ${referenceMonth}`);
      
      const result = await generateMonth(referenceMonth);
      
      console.log(`[Scheduler] Pagamentos gerados com sucesso:`, result);
    } catch (error) {
      console.error("[Scheduler] Erro ao gerar pagamentos automáticos:", error);
    }
  });

  console.log("[Scheduler] Agendamento configurado: 1º dia de cada mês às 06:00 UTC");
}
```

#### **Formato Cron**
```
"0 6 1 * *"
 │ │ │ │ │
 │ │ │ │ └─── Dia da semana (0-7, 0 e 7 = domingo)
 │ │ │ └───── Mês (1-12)
 │ │ └─────── Dia do mês (1-31)
 │ └───────── Hora (0-23)
 └─────────── Minuto (0-59)

0 6 1 * * = Minuto 0, Hora 6, Dia 1, Todo mês, Todo dia da semana
```

---

### 7.2 Inicialização

#### **Entry Point (index.ts)**
```typescript
import { startScheduler } from "./scheduler";

(async () => {
  const server = await registerRoutes(app);
  
  // Iniciar scheduler
  startScheduler();
  
  // ... resto da inicialização
})();
```

---

## 8. Banco de Dados

### 8.1 Schema Principal (shared/schema.ts)

#### **Tabela: users**
```typescript
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  role: varchar("role").notNull().default("investor"), // investor, manager, admin
  country: varchar("country").default("US"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

#### **Tabela: trailers**
```typescript
export const trailers = pgTable("trailers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trailerId: varchar("trailer_id").unique().notNull(),
  model: varchar("model").notNull(),
  purchaseValue: varchar("purchase_value").notNull(),
  purchaseDate: varchar("purchase_date").notNull(),
  status: varchar("status").notNull().default("stock"), // stock, active, maintenance, expired
  currentValue: varchar("current_value").notNull(),
  depreciationRate: varchar("depreciation_rate").default("0.05"),
  expirationDate: varchar("expiration_date"),
  location: varchar("location"),
  latitude: varchar("latitude"),
  longitude: varchar("longitude"),
  lastActivity: timestamp("last_activity"),
  totalShares: integer("total_shares").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

#### **Tabela: shares**
```typescript
export const shares = pgTable("shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  purchaseValue: varchar("purchase_value").notNull(),
  purchaseDate: varchar("purchase_date").notNull(),
  monthlyReturn: varchar("monthly_return").default("2.00"),
  totalReturns: varchar("total_returns").default("0"),
  status: varchar("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

#### **Tabela: payments**
```typescript
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shareId: varchar("share_id").notNull().references(() => shares.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: varchar("amount").notNull(),
  paymentDate: varchar("payment_date").notNull(),
  status: varchar("status").notNull().default("paid"), // paid, pending
  referenceMonth: varchar("reference_month").notNull(), // YYYY-MM
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  shareMonthUnique: uniqueIndex("payments_share_month_unique").on(table.shareId, table.referenceMonth),
}));
```

---

#### **Tabela: financial_records**
```typescript
export const financialRecords = pgTable("financial_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  month: varchar("month").unique().notNull(), // YYYY-MM
  totalRevenue: varchar("total_revenue").notNull(),
  investorPayouts: varchar("investor_payouts").notNull(),
  operationalCosts: varchar("operational_costs").default("0"),
  companyMargin: varchar("company_margin").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

#### **Tabela: tracking_data**
```typescript
export const trackingData = pgTable("tracking_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  latitude: varchar("latitude").notNull(),
  longitude: varchar("longitude").notNull(),
  speed: varchar("speed"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

#### **Tabela: documents**
```typescript
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  shareId: varchar("share_id").references(() => shares.id),
  documentType: varchar("document_type").notNull(),
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  uploadDate: timestamp("upload_date").defaultNow(),
  status: varchar("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

#### **Tabela: audit_logs**
```typescript
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action").notNull(),
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  details: text("details"),
  ipAddress: varchar("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});
```

---

### 8.2 Índices de Performance

```sql
-- Índice para busca rápida de shares por usuário
CREATE INDEX idx_shares_user_id ON shares(user_id);

-- Índice para busca rápida de shares por trailer
CREATE INDEX idx_shares_trailer_id ON shares(trailer_id);

-- Índice para busca de payments por share
CREATE INDEX idx_payments_share_id ON payments(share_id);

-- Índice para busca de payments por usuário
CREATE INDEX idx_payments_user_id ON payments(user_id);

-- Índice para busca de tracking por trailer
CREATE INDEX idx_tracking_trailer_id ON tracking_data(trailer_id);

-- Índice para ordenação de tracking por timestamp
CREATE INDEX idx_tracking_timestamp ON tracking_data(timestamp DESC);

-- Índice para audit logs por usuário
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Índice para ordenação de audit logs por timestamp
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
```

---

## 9. Fluxos de Negócio

### 9.1 Fluxo de Compra de Cota

```
┌─────────────────────────────────────────────────────────────┐
│  INVESTOR: Visualiza Trailers Disponíveis                   │
│  GET /api/trailers/available                                 │
│    → Retorna trailers com availableShares > 0               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  INVESTOR: Clica em "Comprar" no trailer desejado           │
│  POST /api/shares                                            │
│  Body: { trailerId: "abc-123" }                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND: Validações                                         │
│  1. Trailer existe?                                          │
│  2. Trailer não está expirado?                               │
│  3. Tem cotas disponíveis? (availableShares > 0)             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND: Cria Share                                         │
│  INSERT INTO shares (                                        │
│    user_id, trailer_id, purchase_value,                      │
│    purchase_date, monthly_return, status                     │
│  ) VALUES (...)                                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND: Atualiza Status do Trailer                         │
│  IF (soldShares === totalShares)                             │
│    UPDATE trailers SET status = 'active'                     │
│  ELSE                                                        │
│    Mantém status atual                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND: Cria Audit Log                                     │
│  INSERT INTO audit_logs (                                    │
│    user_id, action: "purchase_share",                        │
│    entity_type: "share", entity_id: shareId                  │
│  )                                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND: Invalida Cache React Query                        │
│  queryClient.invalidateQueries("/api/portfolio")             │
│  queryClient.invalidateQueries("/api/trailers/available")    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND: Mostra Toast de Sucesso                           │
│  toast({ title: "Cota adquirida!" })                         │
│  Fecha dialog de compra                                      │
└─────────────────────────────────────────────────────────────┘
```

---

### 9.2 Fluxo de Geração de Pagamentos Mensais

```
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER: Cron Job (1º dia do mês, 06:00 UTC)                │
│  OU                                                          │
│  MANAGER: POST /api/financial/generate/2025-10               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  SERVICE: generateMonth("2025-10")                           │
│  1. Valida formato YYYY-MM                                   │
│  2. Calcula paymentDate                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  DATABASE: Busca Shares Ativas                               │
│  SELECT * FROM shares WHERE status = 'active'                │
│    → Exemplo: 15 shares ativas                               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  LOOP: Para cada share ativa                                 │
│  1. Calcula amount = purchaseValue * (monthlyReturn / 100)   │
│  2. INSERT payment ON CONFLICT DO NOTHING                    │
│  3. Soma payoutSum += amount                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  CONSOLIDAÇÃO: Financial Record                              │
│  INSERT INTO financial_records (                             │
│    month: "2025-10",                                         │
│    total_revenue: payoutSum,                                 │
│    investor_payouts: payoutSum,                              │
│    company_margin: 0                                         │
│  ) ON CONFLICT (month) DO UPDATE                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  RETORNO: Resumo da Operação                                 │
│  {                                                           │
│    referenceMonth: "2025-10",                                │
│    sharesProcessed: 15,                                      │
│    investorPayouts: "3000.00",                               │
│    totalRevenue: "3000.00",                                  │
│    companyMargin: "0.00"                                     │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Convenções e Boas Práticas

### 10.1 Convenções de Código

#### **Backend**
- Usar `async/await` para operações assíncronas
- Sempre validar input com Zod schemas
- Usar try-catch para error handling
- Criar audit logs para ações críticas
- Retornar status HTTP apropriados

#### **Frontend**
- Usar React Query para todas as requisições
- Invalidar cache após mutations
- Mostrar loading states
- Usar toast para feedback
- Seguir padrão de nomenclatura:
  - Componentes: PascalCase
  - Funções: camelCase
  - Constantes: UPPER_SNAKE_CASE

---

### 10.2 Padrões de Nomenclatura

#### **Database**
- Tabelas: snake_case plural (ex: `users`, `trailers`)
- Colunas: snake_case (ex: `first_name`, `created_at`)
- Índices: `idx_<table>_<column>` (ex: `idx_shares_user_id`)

#### **API Routes**
- Recursos: plural (ex: `/api/trailers`, `/api/shares`)
- IDs: singular (ex: `/api/trailers/:id`)
- Ações: verbos (ex: `/api/financial/generate/:month`)

#### **Frontend**
- Pages: kebab-case (ex: `assets.tsx`, `investor-shares.tsx`)
- Components: PascalCase (ex: `TrackingMap.tsx`)
- Hooks: camelCase com prefixo `use` (ex: `useAuth.tsx`)

---

### 10.3 Segurança

#### **Checklist de Segurança**
- ✅ Sessões com HTTP-only cookies
- ✅ CSRF protection via SameSite cookies
- ✅ Rate limiting em todas as rotas
- ✅ Helmet para security headers
- ✅ bcrypt para hash de senhas
- ✅ RBAC com políticas centralizadas
- ✅ Ownership checks para investidores
- ✅ Audit logging de ações críticas
- ✅ Input validation com Zod
- ✅ Prepared statements (Drizzle ORM)

---

### 10.4 Performance

#### **Otimizações**
- Índices em foreign keys e campos de busca
- React Query cache (5min stale, 10min gc)
- Lazy loading de componentes
- Debounce em campos de busca
- Paginação em listas grandes

---

## 11. Resumo de Endpoints

| Método | Endpoint | Acesso | Função |
|--------|----------|--------|--------|
| POST | /api/auth/login | Público | Login |
| POST | /api/auth/logout | Autenticado | Logout |
| GET | /api/auth/user | Autenticado | Dados do usuário |
| GET | /api/dashboard/stats | Todos | Estatísticas |
| GET | /api/portfolio | Investor | Portfólio completo |
| GET | /api/trailers | Manager/Admin | Todos os trailers |
| GET | /api/trailers/available | Todos | Trailers disponíveis |
| POST | /api/trailers | Manager/Admin | Cadastrar trailer |
| GET | /api/shares | Todos | Shares (filtrado por role) |
| POST | /api/shares | Todos | Comprar cota |
| GET | /api/shares/all | Manager/Admin | Todas as shares com detalhes |
| GET | /api/payments | Todos | Histórico de pagamentos |
| GET | /api/tracking | Manager/Admin | Dados GPS atuais |
| GET | /api/tracking/:id/history | Manager/Admin | Histórico GPS |
| GET | /api/financial/records | Manager/Admin | Histórico financeiro |
| POST | /api/financial/generate/:month | Manager/Admin | Gerar pagamentos |
| GET | /api/audit-logs | Manager/Admin | Logs de auditoria |
| GET | /api/documents | Todos | Documentos (filtrado) |

---

## 12. Credenciais de Teste

### Usuários Pré-cadastrados

**Investor**
- Email: `investor@example.com`
- Password: `password123`

**Manager**
- Email: `manager@example.com`
- Password: `password123`

**Admin**
- Email: `admin@example.com`
- Password: `password123`

---

## Fim da Documentação

Esta documentação cobre todas as funções principais do sistema Opus Rental Capital. Para detalhes adicionais sobre implementação específica, consulte o código-fonte ou a documentação do projeto em `PROJECT_DOCUMENTATION.md`.

**Última Atualização**: 21 de Outubro de 2025
