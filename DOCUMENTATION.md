# 📚 Documentação - Opus Rental Capital

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
4. [Páginas e Rotas](#páginas-e-rotas)
5. [Controle de Acesso por Role](#controle-de-acesso-por-role)
6. [Design System](#design-system)
7. [API Endpoints](#api-endpoints)
8. [Credenciais de Acesso](#credenciais-de-acesso)

---

## 🎯 Visão Geral

**Opus Rental Capital** é uma plataforma completa de gestão de investimentos em trailers de carga no mercado americano. O sistema oferece:

- 💼 Gestão de portfólio de investimentos em cotas
- 📊 Dashboard com métricas em tempo real
- 🚚 Controle de ativos (trailers)
- 📍 Rastreamento GPS simulado
- 💰 Gestão financeira com retorno mensal de 2%
- 📄 Sistema de compliance e documentação
- 🔐 Controle de acesso baseado em roles (Investidor, Manager, Admin)

### Stack Tecnológico
- **Frontend:** React + TypeScript + Vite
- **Backend:** Express.js + Node.js
- **Banco de Dados:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **UI:** Shadcn/ui + Tailwind CSS
- **Autenticação:** Express Session + bcrypt
- **Validação:** Zod

---

## ⚡ Funcionalidades

### 📊 Dashboard
- Carteira total do investidor
- Cotas ativas
- Retorno mensal (2% a.m.)
- Próximo pagamento
- Gráfico de evolução de pagamentos
- Atividades recentes

### 💼 Minha Carteira (Portfolio)
- Histórico de retornos mensais
- Projeções de ganhos (3, 6 e 12 meses)
- Status de pagamentos (Pago/Pendente)
- Cálculo automático de rendimentos

### 🚚 Gestão de Ativos (Manager/Admin only)
- Listagem completa de trailers
- Farol de depreciação (verde/amarelo/vermelho)
- Status dos ativos (Ativo, Estoque, Manutenção, Vencido)
- Informações de localização
- Valor atual e data de aquisição

### 📍 Rastreamento GPS (Manager/Admin only)
- Mapa interativo com Leaflet
- Marcadores em tempo real
- Status de movimento (Em movimento/Parado)
- Velocidade e coordenadas
- Atividade recente
- Última atualização

### 💰 Financeiro (Manager/Admin only)
- Receita total mensal
- Repasses aos investidores
- Margem da empresa
- Capital total gerido
- Gráfico de evolução (12 meses)
- Fluxo financeiro detalhado

### 📄 Relatórios
- Relatório do Investidor
- Performance de Ativos
- Relatório Financeiro
- Compliance
- Operacional
- Relatórios Personalizados
- Exportação em PDF, Excel e CSV

### 🛡️ Compliance (Manager/Admin only)
- Contratos digitais
- Documentos verificados
- Pendências
- Trilha de auditoria completa
- Upload de documentos
- Logs de ações com IP

### ✅ Aprovações (Manager/Admin only)
- Solicitações de investimento
- Análise de documentos
- Resgates parciais
- Aprovar/Rejeitar solicitações
- Estatísticas de aprovações

### ⚙️ Configurações
- Perfil do usuário
- Notificações (Email, Relatórios, GPS)
- Segurança (Mudança de senha)
- Preferências (Tema, Idioma)

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### **users** (Usuários)
```typescript
{
  id: varchar (UUID)
  username: text (unique)
  email: text (unique)
  password: text (hashed)
  firstName: text
  lastName: text
  role: text (investor | manager | admin)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### **trailers** (Ativos/Trailers)
```typescript
{
  id: varchar (UUID)
  trailerId: text (unique) // TR001, TR002
  purchaseValue: decimal
  purchaseDate: date
  status: text (stock | active | maintenance | expired)
  currentValue: decimal
  depreciationRate: decimal (default 0.05)
  expirationDate: date
  location: text
  latitude: decimal
  longitude: decimal
  lastActivity: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### **shares** (Cotas de Investimento)
```typescript
{
  id: varchar (UUID)
  userId: varchar (FK -> users.id)
  trailerId: varchar (FK -> trailers.id)
  purchaseValue: decimal
  purchaseDate: date
  status: text (active | inactive)
  monthlyReturn: decimal (default 2.00) // 2%
  totalReturns: decimal (default 0.00)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### **payments** (Pagamentos)
```typescript
{
  id: varchar (UUID)
  shareId: varchar (FK -> shares.id)
  userId: varchar (FK -> users.id)
  amount: decimal
  paymentDate: date
  status: text (paid | pending | failed)
  referenceMonth: text // "January/2024"
  createdAt: timestamp
}
```

#### **trackingData** (Dados de Rastreamento)
```typescript
{
  id: varchar (UUID)
  trailerId: varchar (FK -> trailers.id)
  latitude: decimal
  longitude: decimal
  speed: decimal
  location: text
  status: text (moving | stopped | maintenance)
  distanceToday: decimal
  timestamp: timestamp
}
```

#### **documents** (Documentos)
```typescript
{
  id: varchar (UUID)
  userId: varchar (FK -> users.id)
  shareId: varchar (FK -> shares.id)
  documentType: text (contract | kyc | compliance)
  fileName: text
  fileUrl: text
  status: text (verified | pending | rejected)
  uploadedAt: timestamp
}
```

#### **auditLogs** (Logs de Auditoria)
```typescript
{
  id: varchar (UUID)
  userId: varchar (FK -> users.id)
  action: text
  entityType: text
  entityId: varchar
  details: jsonb
  ipAddress: text
  timestamp: timestamp
}
```

#### **financialRecords** (Registros Financeiros)
```typescript
{
  id: varchar (UUID)
  month: text // "January/2024"
  totalRevenue: decimal
  investorPayouts: decimal
  operationalCosts: decimal
  companyMargin: decimal
  createdAt: timestamp
}
```

### Relacionamentos
- **User** → tem muitas → **Shares**, **Payments**, **Documents**, **AuditLogs**
- **Trailer** → tem muitas → **Shares**, **TrackingData**
- **Share** → pertence a → **User**, **Trailer**
- **Share** → tem muitos → **Payments**, **Documents**
- **Payment** → pertence a → **User**, **Share**

---

## 📄 Páginas e Rotas

| Rota | Página | Componente | Acesso |
|------|--------|------------|--------|
| `/` | Dashboard | `dashboard.tsx` | Todos |
| `/login` | Login | `login.tsx` | Público |
| `/portfolio` | Minha Carteira | `portfolio.tsx` | Todos |
| `/assets` | Gestão de Ativos | `assets.tsx` | Manager/Admin |
| `/tracking` | Rastreamento GPS | `tracking.tsx` | Manager/Admin |
| `/financial` | Financeiro | `financial.tsx` | Manager/Admin |
| `/reports` | Relatórios | `reports.tsx` | Todos |
| `/compliance` | Compliance | `compliance.tsx` | Manager/Admin |
| `/approvals` | Aprovações | `approvals.tsx` | Manager/Admin |
| `/settings` | Configurações | `settings.tsx` | Todos |

---

## 🔐 Controle de Acesso por Role

### 👤 INVESTOR (Investidor)
**Acesso Permitido:**
- ✅ Dashboard
- ✅ Minha Carteira
- ✅ Relatórios
- ✅ Configurações

**Bloqueado:**
- ❌ Gestão de Ativos
- ❌ Rastreamento GPS
- ❌ Financeiro
- ❌ Compliance
- ❌ Aprovações

### 👨‍💼 MANAGER (Gestor)
**Acesso Total:**
- ✅ Dashboard
- ✅ Minha Carteira
- ✅ **Gestão de Ativos**
- ✅ **Rastreamento GPS**
- ✅ **Financeiro**
- ✅ Relatórios
- ✅ **Compliance**
- ✅ **Aprovações**
- ✅ Configurações

### 👑 ADMIN (Administrador)
**Acesso Total** (mesmo que Manager atualmente)

---

## 🎨 Design System

### Cores Opus Rental Capital

#### Cores Principais
- **Primary (Navy):** `#0D2847` - Sidebar, elementos principais
- **Accent (Blue):** `#2196F3` - Botões CTA, elementos ativos
- **Secondary (Red):** `#DC143C` - Destaques, alertas

#### Cores Funcionais
- **Green:** `#10B981` - Sucesso, valores positivos
- **Yellow:** `#F59E0B` - Avisos, atenção
- **Red (destructive):** `#EF4444` - Erros, ações destrutivas

### Componentes UI

#### Cards
- **Bordas laterais coloridas** (4px)
- **Sombras profundas** (shadow-lg, shadow-xl)
- **Hover effects** com elevação (-translate-y-1)
- **Backgrounds:** white com hover accent/5

#### Tipografia
- **Títulos:** font-bold, text-3xl
- **Subtítulos:** text-sm text-muted-foreground
- **Valores:** font-bold text-2xl
- **Labels:** font-semibold uppercase

#### Botões
- **Primary:** bg-accent hover:bg-accent/90
- **Outline:** border-2 hover effects
- **Destructive:** bg-secondary

#### Badges
- **Rounded:** rounded-full
- **Cores variadas** por contexto

### Layout
- **Sidebar colapsável:** 288px (expandido) / 80px (colapsado)
- **Padding padrão:** p-8
- **Gaps:** gap-6 entre cards
- **Bordas arredondadas:** rounded-xl (12px)

---

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Dados do usuário logado

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas do dashboard
- `GET /api/dashboard/recent-activity` - Atividades recentes

### Portfolio
- `GET /api/portfolio` - Dados da carteira (shares + payments)
- `GET /api/shares` - Cotas do usuário

### Ativos
- `GET /api/trailers` - Listar todos os trailers
- `GET /api/trailers/:id` - Detalhes de um trailer
- `POST /api/trailers` - Criar novo trailer
- `PUT /api/trailers/:id` - Atualizar trailer

### Rastreamento
- `GET /api/tracking` - Dados de rastreamento GPS

### Financeiro
- `GET /api/financial/current` - Dados financeiros do mês atual
- `GET /api/financial/records` - Histórico financeiro (12 meses)

### Compliance
- `GET /api/documents` - Listar documentos
- `GET /api/audit-logs` - Logs de auditoria

### Payments
- `GET /api/payments/:shareId` - Pagamentos de uma cota

---

## 🔑 Credenciais de Acesso

### Usuário Investidor
```
Email: investor@example.com
Senha: password123
Role: investor
```

### Usuário Manager
```
Email: manager@example.com
Senha: password123
Role: manager
```

### Notas
- Não há usuário Admin criado por padrão
- Todas as senhas são hasheadas com bcrypt
- Sessão válida por 7 dias
- Logout automático após inatividade

---

## 🚀 Como Executar

### Desenvolvimento
```bash
npm run dev
```

### Banco de Dados
```bash
# Aplicar schema
npm run db:push

# Seed de dados iniciais
npm run db:seed
```

### Build
```bash
npm run build
```

---

## 📝 Notas Técnicas

### Segurança
- Senhas hasheadas com bcrypt (10 rounds)
- Express Session com cookie httpOnly
- Middleware de autenticação em todas as rotas protegidas
- Logs de auditoria com IP tracking

### Performance
- React Query para cache de dados
- Invalidação automática após mutations
- Lazy loading de componentes

### Responsividade
- Grid system adaptativo
- Sidebar colapsável para mobile
- Tabelas com scroll horizontal

---

## 🔄 Fluxo de Dados

1. **Login** → Express Session → User data armazenado
2. **Dashboard** → Query stats → Display metrics
3. **Investimento** → Create share → Link to trailer → Generate payments
4. **Pagamento Mensal** → Calculate 2% → Create payment record
5. **GPS Tracking** → Update coordinates → Display on map
6. **Audit** → Log action → Store with IP

---

## 📊 Regras de Negócio

- **Retorno mensal:** 2% fixo sobre valor da cota
- **Farol de depreciação:**
  - 🟢 Verde: < 12 meses
  - 🟡 Amarelo: 12-24 meses
  - 🔴 Vermelho: > 24 meses
- **Status do trailer:** stock → active → maintenance → expired
- **Projeções:** Baseadas no retorno de 2% a.m.

---

**Última atualização:** Setembro 2024  
**Versão:** 1.0.0
