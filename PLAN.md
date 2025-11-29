# Value Investing Toolbox - Comprehensive Implementation Plan

## Project Vision

Build a personal web application for value investing analysis based on Warren Buffett's principles and Phil Town's Rule One Investing methodology. The tool will automate the calculations and scoring systems used by professional value investors to identify wonderful businesses at attractive prices.

**Inspiration Sources:**
- [DecodeInvesting](https://decodeinvesting.com/) - AI-powered stock analysis platform
- [Rule One Toolbox](https://www.ruleoneinvesting.com/toolbox/) - Phil Town's official investing tools
- [IsThisStockGood](https://github.com/mrhappyasthma/IsThisStockGood) - Open source Rule #1 calculator

---

## Implementation Progress

### Completed (Phases 1-5 Core)

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Project Foundation - Backend & Frontend scaffolding |
| Phase 2 | ✅ Partial | Data Layer - FMP integration done, SEC EDGAR deferred |
| Phase 3 | ✅ Complete | Calculator Engine - Big Five, Scoring, Valuation |
| Phase 4 | ✅ Complete | API Routes - All endpoints implemented |
| Phase 5 | ✅ Complete | Frontend Core Pages - All 4 main pages built |
| Phase 6 | ✅ Complete | Polish & Testing - 109 tests, error handling, responsive UI |
| Phase 7 | 🔶 In Progress | Advanced Features - Comparison, CSV export, Alerts, Score History |

### What's Built

**Backend:**
- ✅ Express + TypeScript server with Prisma ORM
- ✅ PostgreSQL database with full schema
- ✅ FMP API client for financial data
- ✅ Calculator engine (Big Five, Scoring, Valuation)
- ✅ All API routes (companies, screener, valuation, watchlist, quotes)
- ✅ 109 tests (83 unit + 26 integration) with Vitest & Supertest
- ✅ Historical scores API endpoint for tracking score changes

**Frontend:**
- ✅ Vite + React + TypeScript setup
- ✅ TanStack Router + Query integration
- ✅ Material-UI theme with score colors
- ✅ Home page with search
- ✅ Stock Analysis page with scores, Big Five, valuation
- ✅ Screener page with filters and pagination
- ✅ Watchlist page with add/remove
- ✅ Valuation Calculator page
- ✅ **Compare page** - Side-by-side stock comparison (up to 5)
- ✅ Big Five bar chart (Recharts)
- ✅ Historical financials table with tabs
- ✅ Error boundary for crash recovery
- ✅ Retry logic with exponential backoff
- ✅ Skeleton loading states
- ✅ Mobile responsive layouts
- ✅ **CSV Export** - Export screener results and comparisons
- ✅ **Price Alerts** - Browser notifications for watchlist targets
- ✅ **Score History Chart** - Track score changes over time
- ✅ **24 Component Tests** - React Testing Library tests for key components

### What's Remaining (Phase 7 - Future)

**Optional Enhancements:**
- ✅ **Component tests (React Testing Library)** - 24 tests for BigFiveChart, ErrorBoundary, TableSkeleton
- 🔲 E2E tests (Playwright)

**Advanced Features:**
- 🔲 SEC EDGAR filing viewer (10-K, 10-Q documents)
- ✅ **Price alerts / notifications** - Browser notifications on watchlist
- ✅ **Batch analysis / export to CSV** - Screener and comparison CSV export
- 🔲 AI-powered analysis (earnings call summaries)
- ✅ **Historical score tracking over time** - Score history API and chart
- ✅ **Comparison view for multiple stocks** - `/compare` page with URL sharing

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Core Features | Stock analysis + screener + leaderboard + watchlist |
| Data Source | Hybrid | Financial Modeling Prep API + SEC EDGAR for filings |
| Authentication | None | Personal single-user tool |
| Deployment | TBD | Focus on local development first |

---

## Value Investing Methodology

### The 4 M's Framework (Phil Town)

1. **Meaning**
   - Understand the business completely
   - Within your circle of competence
   - Company you'd be proud to own

2. **Moat** (Competitive Advantage)
   - **Brand**: Consumer loyalty (e.g., Coca-Cola, Apple)
   - **Secret**: Patents, trade secrets (e.g., Pfizer)
   - **Toll Bridge**: Monopoly-like position (e.g., utilities)
   - **Switching**: High switching costs (e.g., ADP, Salesforce)
   - **Price**: Lowest cost producer (e.g., Walmart, Costco)

3. **Management**
   - Owner-oriented CEO
   - Honest and transparent
   - Skin in the game (insider ownership)
   - Reasonable compensation
   - Track record of good capital allocation

4. **Margin of Safety**
   - Buy at 50% of intrinsic value
   - Protects against errors in analysis
   - "Buy a dollar for fifty cents"

### The Big Five Numbers

All should be **≥10% annually for 10 years** to indicate a durable moat:

| Metric | Description | Why It Matters |
|--------|-------------|----------------|
| **ROIC** | Return on Invested Capital | CEO's ability to allocate capital wisely |
| **Equity Growth** | Book Value Per Share growth | Company's value is compounding |
| **EPS Growth** | Earnings Per Share growth | Profits are growing |
| **Revenue Growth** | Sales growth | Business is expanding |
| **FCF Growth** | Free Cash Flow growth | Real cash generation |

### Valuation Methods

#### 1. Sticker Price (Phil Town's DCF)

```
Inputs:
├── Current EPS (TTM)
├── Estimated Growth Rate (conservative: lower of historical or analyst)
├── Future PE Ratio (lower of: historical high PE, or 2x growth rate)
└── Minimum Acceptable Return (always 15%)

Calculation:
1. Future EPS = Current EPS × (1 + Growth Rate)^10
2. Future Price = Future EPS × Future PE
3. Sticker Price = Future Price ÷ (1.15)^10
4. MOS Price = Sticker Price × 0.50
```

**Example:**
```
Current EPS: $5.00
Growth Rate: 15%
Future PE: 30 (2x growth rate)

Future EPS = $5.00 × (1.15)^10 = $20.23
Future Price = $20.23 × 30 = $606.90
Sticker Price = $606.90 ÷ (1.15)^10 = $150.00
MOS Price = $150.00 × 0.50 = $75.00

→ Buy below $75.00 for 15% annual return with safety margin
```

#### 2. Payback Time

How many years for company earnings to pay back your investment:

```
Year 1: EPS₁ = Current EPS × (1 + growth)
Year 2: EPS₂ = EPS₁ × (1 + growth)
...
Payback = Year where Σ(EPS₁..EPSₙ) ≥ Stock Price
```

**Target:** ≤ 8 years is attractive

#### 3. Ten Cap (Owner Earnings)

```
Owner Earnings = Net Income + Depreciation - Maintenance CapEx
Ten Cap Price = Owner Earnings × 10
```

---

## Scoring System Design

### Overall Value Score (0-100%)

```
Value Score = (Moat Score × 0.50) + (ROIC Score × 0.40) + (Debt Score × 0.10)
```

### ROIC Score (0-100%)

Evaluate ROIC for each of the last 10 years:

```typescript
function calculateROICScore(roicHistory: number[]): number {
  const yearlyScores = roicHistory.map(roic => {
    if (roic >= 10) return 100;      // Perfect
    if (roic >= 5) return 50;        // Acceptable
    if (roic >= 0) return 25;        // Weak
    return 0;                         // Negative
  });
  return average(yearlyScores);
}
```

### Moat Score (Competitive Advantage) (0-100%)

Based on growth rate consistency across multiple timeframes:

```typescript
const TIMEFRAMES = [1, 3, 5, 7, 10]; // years
const GROWTH_METRICS = ['revenue', 'eps', 'equity', 'fcf'];

function calculateMoatScore(financials: FinancialData): number {
  let totalScore = 0;
  let maxScore = 0;

  for (const metric of GROWTH_METRICS) {
    for (const years of TIMEFRAMES) {
      const cagr = calculateCAGR(financials, metric, years);
      maxScore += 10;

      if (cagr >= 10) totalScore += 10;      // Perfect
      else if (cagr >= 5) totalScore += 5;   // Okay
      else if (cagr >= 0) totalScore += 2;   // Weak
      // Negative = 0 points
    }
  }

  return (totalScore / maxScore) * 100;
}
```

### Debt Score (0-100%)

Based on debt payoff time using Free Cash Flow:

```typescript
function calculateDebtScore(longTermDebt: number, fcf: number): number {
  if (longTermDebt <= 0) return 100;  // No debt = perfect
  if (fcf <= 0) return 0;             // Can't pay debt

  const payoffYears = longTermDebt / fcf;

  if (payoffYears <= 1) return 100;
  if (payoffYears <= 3) return 80;
  if (payoffYears <= 5) return 60;
  if (payoffYears <= 7) return 40;
  if (payoffYears <= 10) return 20;
  return 0;  // 10+ years = poor
}
```

### Management Score (0-100%)

```
Management Score = (ROIC Score × 0.80) + (Debt Score × 0.20)
```

### Predictability Assessment

A company is marked "Unpredictable" if:
- Any of the Big Five is negative
- High variance in earnings (coefficient of variation > 50%)
- Less than 5 years of financial history
- Major accounting irregularities

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Analysis │ │ Screener │ │Leaderboard│ │ Watchlist│           │
│  │   Page   │ │   Page   │ │   Page   │ │   Page   │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       └────────────┴────────────┴────────────┘                  │
│                            │                                     │
│                    TanStack Query                                │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────┼─────────────────────────────────────┐
│                         Backend (Express)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     API Routes                            │   │
│  │  /companies  /screener  /leaderboard  /valuation         │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────┴───────────────────────────────┐   │
│  │                  Calculator Engine                        │   │
│  │  • Big Five Calculator    • Sticker Price Calculator     │   │
│  │  • Scoring Engine         • Payback Time Calculator      │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────┴───────────────────────────────┐   │
│  │                  Data Service Layer                       │   │
│  │  • Financial Modeling Prep Client                         │   │
│  │  • SEC EDGAR Client                                       │   │
│  │  • Caching Layer (in-memory or Redis)                     │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
┌─────────────────────────────┼────────────────────────────────────┐
│                        PostgreSQL                                │
│  ┌────────────┐ ┌────────────────┐ ┌─────────────────┐          │
│  │ companies  │ │ financials     │ │ company_scores  │          │
│  └────────────┘ └────────────────┘ └─────────────────┘          │
│  ┌────────────┐ ┌────────────────┐                              │
│  │ watchlist  │ │ cached_quotes  │                              │
│  └────────────┘ └────────────────┘                              │
└──────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┴────────────────────────────────────┐
│                      External APIs                                │
│  ┌────────────────────┐  ┌────────────────────┐                  │
│  │ Financial Modeling │  │    SEC EDGAR       │                  │
│  │       Prep         │  │      (Free)        │                  │
│  │  • Financials      │  │  • 10-K Filings    │                  │
│  │  • Ratios          │  │  • 10-Q Filings    │                  │
│  │  • Quotes          │  │  • XBRL Data       │                  │
│  └────────────────────┘  └────────────────────┘                  │
└──────────────────────────────────────────────────────────────────┘
```

### Tech Stack Details

#### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| TanStack Router | File-based routing |
| TanStack Query | Server state management |
| Material-UI (MUI) | Component library |
| React Hook Form | Form handling |
| Zod | Schema validation |
| Recharts | Data visualization |
| Axios | HTTP client |

#### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express | Web framework |
| TypeScript | Type safety |
| Prisma | ORM |
| Zod | Request validation |
| Winston | Logging |
| node-cron | Scheduled jobs |

#### Database & Infrastructure
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary database |
| Docker Compose | Local development |
| Biome | Linting & formatting |
| Vitest | Testing |

---

## Database Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// COMPANY DATA
// ============================================

model Company {
  id          String   @id @default(cuid())
  ticker      String   @unique
  name        String
  sector      String?
  industry    String?
  exchange    String?
  description String?
  marketCap   Decimal?
  country     String?
  website     String?

  // Relationships
  financials    FinancialStatement[]
  scores        CompanyScore[]
  watchlistItem WatchlistItem?

  // Metadata
  lastUpdated   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([sector])
  @@index([industry])
}

model FinancialStatement {
  id              String   @id @default(cuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  // Period
  fiscalYear      Int
  fiscalQuarter   Int?     // null = annual, 1-4 = quarterly
  periodEndDate   DateTime
  filingDate      DateTime?

  // Income Statement
  revenue              Decimal?
  costOfRevenue        Decimal?
  grossProfit          Decimal?
  operatingExpenses    Decimal?
  operatingIncome      Decimal?
  interestExpense      Decimal?
  incomeBeforeTax      Decimal?
  incomeTaxExpense     Decimal?
  netIncome            Decimal?
  eps                  Decimal?
  epsDiluted           Decimal?
  sharesOutstanding    Decimal?

  // Balance Sheet
  cashAndEquivalents   Decimal?
  shortTermInvestments Decimal?
  totalCurrentAssets   Decimal?
  propertyPlantEquip   Decimal?
  goodwill             Decimal?
  intangibleAssets     Decimal?
  totalAssets          Decimal?
  accountsPayable      Decimal?
  shortTermDebt        Decimal?
  totalCurrentLiab     Decimal?
  longTermDebt         Decimal?
  totalLiabilities     Decimal?
  totalEquity          Decimal?
  bookValuePerShare    Decimal?

  // Cash Flow Statement
  operatingCashFlow    Decimal?
  capitalExpenditures  Decimal?
  freeCashFlow         Decimal?
  dividendsPaid        Decimal?
  netChangeInCash      Decimal?

  // Calculated Metrics (stored for performance)
  roic                 Decimal?
  roe                  Decimal?
  currentRatio         Decimal?
  debtToEquity         Decimal?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@unique([companyId, fiscalYear, fiscalQuarter])
  @@index([companyId])
  @@index([fiscalYear])
}

model CompanyScore {
  id              String   @id @default(cuid())
  companyId       String
  company         Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  calculatedAt    DateTime @default(now())

  // Main Scores (0-100)
  valueScore       Float
  roicScore        Float
  moatScore        Float
  debtScore        Float
  managementScore  Float

  // Big Five Growth Rates (percentages)
  roic1Year        Float?
  roic5Year        Float?
  roic10Year       Float?

  epsGrowth1Year   Float?
  epsGrowth5Year   Float?
  epsGrowth10Year  Float?

  revenueGrowth1Year  Float?
  revenueGrowth5Year  Float?
  revenueGrowth10Year Float?

  equityGrowth1Year   Float?
  equityGrowth5Year   Float?
  equityGrowth10Year  Float?

  fcfGrowth1Year      Float?
  fcfGrowth5Year      Float?
  fcfGrowth10Year     Float?

  // Valuation
  currentPrice     Float?
  stickerPrice     Float?
  mosPrice         Float?   // Margin of Safety Price
  paybackTime      Float?   // Years

  // Assessment
  isPredictable    Boolean  @default(true)
  yearsOfData      Int      @default(0)

  // Timestamps
  createdAt        DateTime @default(now())

  @@index([companyId])
  @@index([valueScore])
  @@index([calculatedAt])
}

// ============================================
// USER DATA (simplified, no auth)
// ============================================

model WatchlistItem {
  id          String   @id @default(cuid())
  companyId   String   @unique
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  targetPrice Float?
  notes       String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([createdAt])
}

model SavedScreen {
  id          String   @id @default(cuid())
  name        String
  description String?
  filters     Json     // Store filter configuration as JSON

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================
// CACHING
// ============================================

model CachedQuote {
  id          String   @id @default(cuid())
  ticker      String   @unique
  price       Float
  change      Float?
  changePercent Float?
  volume      BigInt?

  fetchedAt   DateTime @default(now())

  @@index([fetchedAt])
}

model ApiCache {
  id          String   @id @default(cuid())
  endpoint    String
  params      String   // JSON stringified params
  response    Json

  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@unique([endpoint, params])
  @@index([expiresAt])
}
```

---

## API Design

### RESTful Endpoints

#### Companies

```
GET    /api/companies/:ticker
       → Get full company analysis with scores and financials

GET    /api/companies/:ticker/financials
       → Get historical financial statements
       Query: ?years=10&quarterly=false

GET    /api/companies/:ticker/scores
       → Get calculated scores and Big Five metrics

POST   /api/companies/:ticker/refresh
       → Force refresh data from external APIs

GET    /api/companies/search
       → Search companies by name or ticker
       Query: ?q=apple&limit=10
```

#### Screener

```
GET    /api/screener
       → Screen stocks with filters
       Query params:
         ?minValueScore=80
         &minMoatScore=70
         &minRoicScore=80
         &maxDebtScore=50
         &maxPaybackTime=8
         &sector=Technology
         &minMarketCap=1000000000
         &maxMarketCap=100000000000
         &sortBy=valueScore
         &sortOrder=desc
         &page=1
         &limit=25

GET    /api/screener/presets
       → Get saved screen presets

POST   /api/screener/presets
       → Save a new screen preset
       Body: { name, description, filters }
```

#### Leaderboard

```
GET    /api/leaderboard
       → Get top ranked companies
       Query: ?index=sp500&limit=50

GET    /api/leaderboard/sectors
       → Get top companies by sector
```

#### Valuation

```
POST   /api/valuation/calculate
       → Calculate sticker price with custom inputs
       Body: {
         currentEps: 5.00,
         growthRate: 15,
         futurePe: 30,
         minReturnRate: 15
       }

GET    /api/valuation/:ticker/default
       → Get default valuation using historical data
```

#### Watchlist

```
GET    /api/watchlist
       → Get all watchlist items with current prices

POST   /api/watchlist/:ticker
       → Add to watchlist
       Body: { targetPrice?, notes? }

DELETE /api/watchlist/:ticker
       → Remove from watchlist

PATCH  /api/watchlist/:ticker
       → Update watchlist item
       Body: { targetPrice?, notes? }
```

#### Quotes

```
GET    /api/quotes/:ticker
       → Get current quote for a ticker

GET    /api/quotes/batch
       → Get quotes for multiple tickers
       Query: ?tickers=AAPL,MSFT,GOOGL
```

### Response Formats

#### Company Analysis Response

```typescript
interface CompanyAnalysisResponse {
  company: {
    ticker: string;
    name: string;
    sector: string;
    industry: string;
    description: string;
    marketCap: number;
    currentPrice: number;
  };

  scores: {
    valueScore: number;      // 0-100
    roicScore: number;       // 0-100
    moatScore: number;       // 0-100
    debtScore: number;       // 0-100
    managementScore: number; // 0-100
    isPredictable: boolean;
  };

  bigFive: {
    roic: { year1: number; year5: number; year10: number; };
    epsGrowth: { year1: number; year5: number; year10: number; };
    revenueGrowth: { year1: number; year5: number; year10: number; };
    equityGrowth: { year1: number; year5: number; year10: number; };
    fcfGrowth: { year1: number; year5: number; year10: number; };
  };

  valuation: {
    stickerPrice: number;
    mosPrice: number;
    paybackTime: number;
    currentPrice: number;
    upside: number; // percentage
  };

  financials: FinancialStatement[]; // Last 10 years

  meta: {
    lastUpdated: string;
    yearsOfData: number;
  };
}
```

---

## Implementation Phases

### Phase 1: Project Foundation (Week 1)

#### 1.1 Backend Setup
```
backend/
├── src/
│   ├── index.ts              # Express app entry
│   ├── config/
│   │   ├── env.ts            # Environment variables
│   │   └── database.ts       # Prisma client
│   ├── routes/
│   │   └── index.ts          # Route registration
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── requestLogger.ts
│   └── utils/
│       └── logger.ts         # Winston setup
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
└── .env.example
```

**Tasks:**
- [x] Initialize Node.js project with TypeScript
- [x] Configure Express with middleware
- [x] Setup Prisma with PostgreSQL
- [x] Create Docker Compose for PostgreSQL
- [x] Configure Winston logging
- [x] Setup Biome for linting
- [x] Create initial database migrations

#### 1.2 Frontend Setup
```
frontend/
├── src/
│   ├── main.tsx              # React entry
│   ├── App.tsx
│   ├── routes/
│   │   └── __root.tsx        # TanStack Router root
│   ├── components/
│   │   └── Layout.tsx
│   ├── lib/
│   │   ├── api.ts            # Axios instance
│   │   └── queryClient.ts
│   └── theme/
│       └── index.ts          # MUI theme
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**Tasks:**
- [x] Initialize Vite + React + TypeScript
- [x] Configure TanStack Router
- [x] Configure TanStack Query
- [x] Setup Material-UI with custom theme
- [x] Create base layout component
- [x] Setup Axios client with base URL
- [x] Configure Biome

#### 1.3 Development Environment
```
(root)
├── docker-compose.yml        # PostgreSQL
├── .env.example
├── package.json              # Workspace scripts
└── README.md
```

**Tasks:**
- [x] Create Docker Compose for PostgreSQL
- [ ] Setup npm workspaces (optional)
- [x] Create development scripts
- [x] Document local setup process

---

### Phase 2: Data Layer (Week 2)

#### 2.1 Financial Modeling Prep Integration

```typescript
// src/services/fmp/client.ts
export class FMPClient {
  private apiKey: string;
  private baseUrl = 'https://financialmodelingprep.com/api/v3';

  async getIncomeStatement(ticker: string, limit = 10): Promise<IncomeStatement[]>;
  async getBalanceSheet(ticker: string, limit = 10): Promise<BalanceSheet[]>;
  async getCashFlow(ticker: string, limit = 10): Promise<CashFlowStatement[]>;
  async getKeyMetrics(ticker: string, limit = 10): Promise<KeyMetrics[]>;
  async getQuote(ticker: string): Promise<Quote>;
  async searchCompany(query: string): Promise<SearchResult[]>;
  async getCompanyProfile(ticker: string): Promise<CompanyProfile>;
}
```

**Tasks:**
- [x] Create FMP API client with types
- [ ] Implement rate limiting (avoid hitting free tier limits)
- [ ] Add response caching layer
- [x] Handle API errors gracefully
- [x] Map FMP responses to internal types

#### 2.2 SEC EDGAR Integration (Future)

```typescript
// src/services/edgar/client.ts
export class SECEdgarClient {
  async getFilings(cik: string, type: '10-K' | '10-Q'): Promise<Filing[]>;
  async getFilingDocument(accessionNumber: string): Promise<Document>;
  async getXBRLData(ticker: string): Promise<XBRLData>;
}
```

**Tasks:**
- [ ] Create SEC EDGAR API client
- [ ] Parse XBRL financial data
- [ ] Extract key sections from 10-K filings
- [ ] Map to internal data structures

#### 2.3 Data Service Layer

```typescript
// src/services/dataService.ts
export class DataService {
  async getCompanyData(ticker: string): Promise<CompanyData>;
  async refreshCompanyData(ticker: string): Promise<void>;
  async getHistoricalFinancials(ticker: string, years: number): Promise<Financials[]>;
  async getCurrentQuote(ticker: string): Promise<Quote>;
  async batchRefresh(tickers: string[]): Promise<void>;
}
```

**Tasks:**
- [x] Create unified data service
- [ ] Implement data caching strategy
- [x] Store fetched data in PostgreSQL
- [ ] Create background refresh job

---

### Phase 3: Calculator Engine (Week 3)

#### 3.1 Big Five Calculator

```typescript
// src/calculators/bigFive.ts

export function calculateCAGR(
  startValue: number,
  endValue: number,
  years: number
): number {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

export function calculateROIC(
  operatingIncome: number,
  taxRate: number,
  totalEquity: number,
  totalDebt: number
): number {
  const nopat = operatingIncome * (1 - taxRate);
  const investedCapital = totalEquity + totalDebt;
  if (investedCapital <= 0) return 0;
  return (nopat / investedCapital) * 100;
}

export function calculateBigFive(
  financials: FinancialStatement[]
): BigFiveMetrics {
  // Calculate ROIC for each year
  // Calculate growth rates at 1, 3, 5, 7, 10 year intervals
  // Return structured metrics
}
```

**Tasks:**
- [x] Implement CAGR calculation
- [x] Implement ROIC calculation
- [x] Calculate growth rates for all timeframes
- [x] Handle edge cases (negative values, missing data)
- [x] Unit tests for all calculations

#### 3.2 Scoring Engine

```typescript
// src/calculators/scoring.ts

export function calculateROICScore(roicHistory: number[]): number;
export function calculateMoatScore(growthRates: GrowthRates): number;
export function calculateDebtScore(debt: number, fcf: number): number;
export function calculateManagementScore(roicScore: number, debtScore: number): number;
export function calculateValueScore(moat: number, roic: number, debt: number): number;
```

**Tasks:**
- [x] Implement all scoring functions
- [x] Define score thresholds and weights
- [x] Add predictability assessment
- [x] Unit tests for scoring

#### 3.3 Valuation Calculator

```typescript
// src/calculators/valuation.ts

export function calculateStickerPrice(
  currentEps: number,
  growthRate: number,
  futurePe: number,
  minReturnRate: number = 0.15,
  years: number = 10
): { stickerPrice: number; mosPrice: number } {
  const futureEps = currentEps * Math.pow(1 + growthRate, years);
  const futurePrice = futureEps * futurePe;
  const stickerPrice = futurePrice / Math.pow(1 + minReturnRate, years);
  const mosPrice = stickerPrice * 0.5;

  return { stickerPrice, mosPrice };
}

export function calculatePaybackTime(
  currentPrice: number,
  currentEps: number,
  growthRate: number
): number {
  let cumulativeEps = 0;
  let year = 0;
  let eps = currentEps;

  while (cumulativeEps < currentPrice && year < 50) {
    year++;
    eps = eps * (1 + growthRate);
    cumulativeEps += eps;
  }

  return year;
}
```

**Tasks:**
- [x] Implement sticker price calculation
- [x] Implement margin of safety calculation
- [x] Implement payback time calculation
- [x] Add default value estimation from historical data
- [x] Unit tests for valuation

---

### Phase 4: API Routes (Week 4)

#### 4.1 Company Routes

```typescript
// src/routes/companies.ts
router.get('/:ticker', getCompanyAnalysis);
router.get('/:ticker/financials', getCompanyFinancials);
router.get('/:ticker/scores', getCompanyScores);
router.post('/:ticker/refresh', refreshCompanyData);
router.get('/search', searchCompanies);
```

**Tasks:**
- [x] Implement company analysis endpoint
- [x] Implement financials endpoint with filters
- [x] Implement scores endpoint
- [x] Implement data refresh endpoint
- [x] Implement search endpoint
- [x] Add request validation with Zod
- [x] Add error handling

#### 4.2 Screener Routes

```typescript
// src/routes/screener.ts
router.get('/', screenStocks);
router.get('/presets', getScreenPresets);
router.post('/presets', saveScreenPreset);
```

**Tasks:**
- [x] Implement stock screener with filters
- [x] Add pagination support
- [x] Add sorting options
- [ ] Implement preset saving/loading

#### 4.3 Other Routes

```typescript
// src/routes/leaderboard.ts
router.get('/', getLeaderboard);
router.get('/sectors', getLeaderboardBySector);

// src/routes/valuation.ts
router.post('/calculate', calculateValuation);
router.get('/:ticker/default', getDefaultValuation);

// src/routes/watchlist.ts
router.get('/', getWatchlist);
router.post('/:ticker', addToWatchlist);
router.delete('/:ticker', removeFromWatchlist);
router.patch('/:ticker', updateWatchlistItem);
```

**Tasks:**
- [x] Implement all route handlers
- [x] Add request validation
- [x] Add comprehensive error handling
- [ ] Write API tests

---

### Phase 5: Frontend - Core Pages (Week 5-6)

#### 5.1 Stock Analysis Page

```
/analysis/:ticker

Components:
├── CompanyHeader
│   ├── Logo, Name, Ticker
│   ├── Current Price & Change
│   └── Quick Stats (Market Cap, Sector)
│
├── ScoreCards
│   ├── Value Score (large, prominent)
│   ├── ROIC Score
│   ├── Moat Score
│   ├── Debt Score
│   └── Management Score
│
├── BigFivePanel
│   ├── ROIC Chart (10 year trend)
│   ├── EPS Growth Chart
│   ├── Revenue Growth Chart
│   ├── Equity Growth Chart
│   └── FCF Growth Chart
│
├── ValuationPanel
│   ├── Sticker Price
│   ├── MOS Price
│   ├── Current Price vs. MOS
│   ├── Payback Time
│   └── Interactive Calculator
│
├── FinancialsTable
│   ├── Income Statement Tab
│   ├── Balance Sheet Tab
│   └── Cash Flow Tab
│
└── Actions
    ├── Add to Watchlist
    └── Refresh Data
```

**Tasks:**
- [x] Create page layout
- [x] Build score card components
- [x] Build Big Five charts with Recharts
- [x] Build valuation panel with calculator
- [x] Build financials table with tabs
- [x] Connect to API with TanStack Query
- [x] Add loading states
- [x] Add error handling

#### 5.2 Stock Screener Page

```
/screener

Components:
├── FilterPanel (sidebar)
│   ├── Score Filters (sliders)
│   │   ├── Min Value Score
│   │   ├── Min ROIC Score
│   │   ├── Min Moat Score
│   │   └── Max Debt Score
│   ├── Valuation Filters
│   │   ├── Max Payback Time
│   │   └── Price vs MOS
│   ├── Company Filters
│   │   ├── Sector Select
│   │   ├── Industry Select
│   │   └── Market Cap Range
│   └── Actions
│       ├── Apply Filters
│       ├── Reset
│       └── Save Screen
│
└── ResultsPanel
    ├── Result Count
    ├── Sort Dropdown
    ├── Results Table
    │   ├── Ticker
    │   ├── Company Name
    │   ├── Sector
    │   ├── Value Score
    │   ├── Price
    │   ├── MOS Price
    │   └── Upside %
    └── Pagination
```

**Tasks:**
- [x] Create filter panel with controls
- [x] Create results table
- [x] Implement filter state management
- [x] Connect to screener API
- [x] Add pagination
- [x] Add sorting
- [ ] Save/load screen presets

#### 5.3 Leaderboard Page

```
/leaderboard

Components:
├── IndexTabs
│   ├── All
│   ├── S&P 500
│   ├── Nasdaq 100
│   └── By Sector
│
└── LeaderboardTable
    ├── Rank
    ├── Ticker
    ├── Company
    ├── Sector
    ├── Value Score
    ├── ROIC Score
    ├── Moat Score
    ├── Price
    └── MOS Price
```

**Tasks:**
- [x] Create leaderboard table (combined with screener)
- [ ] Add index/sector tabs
- [x] Connect to API
- [x] Add click-through to analysis page

#### 5.4 Watchlist Page

```
/watchlist

Components:
├── WatchlistHeader
│   └── Add Stock Input
│
└── WatchlistTable
    ├── Ticker
    ├── Company
    ├── Current Price
    ├── Target Price
    ├── % to Target
    ├── Value Score
    ├── Notes
    └── Actions (Edit, Remove)
```

**Tasks:**
- [x] Create watchlist table
- [x] Add/remove functionality
- [x] Edit target price and notes
- [ ] Show price alerts

---

### Phase 6: Polish & Testing (Week 7)

#### 6.1 Error Handling & Edge Cases
- [ ] Handle API rate limits gracefully
- [ ] Show meaningful error messages
- [ ] Handle missing/incomplete data
- [ ] Add retry logic for failed requests
- [ ] Offline state handling

#### 6.2 Loading States
- [ ] Skeleton loaders for tables
- [ ] Progress indicators for calculations
- [ ] Optimistic updates where appropriate

#### 6.3 Responsive Design
- [ ] Mobile-friendly layouts
- [ ] Touch-friendly controls
- [ ] Responsive tables

#### 6.4 Testing
- [ ] Unit tests for calculators
- [ ] Integration tests for API routes
- [ ] Component tests for key UI elements
- [ ] E2E tests for critical flows

#### 6.5 Performance
- [ ] Implement data caching
- [ ] Optimize database queries
- [ ] Lazy load charts
- [ ] Pagination for large lists

---

### Phase 7: Advanced Features (Future)

#### 7.1 SEC Filings Integration
- [ ] 10-K document viewer
- [ ] 10-Q document viewer
- [ ] Key sections extraction
- [ ] Risk factors highlighting

#### 7.2 Historical Analysis
- [ ] Historical score tracking
- [ ] Price charts with valuation overlays
- [ ] Compare current vs historical valuations

#### 7.3 Batch Analysis
- [ ] Import list of tickers
- [ ] Bulk analysis report
- [ ] Export to CSV/PDF

#### 7.4 Alerts
- [ ] Price alerts (email/browser notifications)
- [ ] Score change alerts
- [ ] New filing alerts

#### 7.5 AI Features (Far Future)
- [ ] Earnings call summary
- [ ] SEC filing analysis
- [ ] Natural language queries

---

## File Structure (Final)

```
InvestingToolbox/
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── app.ts
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── database.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── companies.ts
│   │   │   ├── screener.ts
│   │   │   ├── leaderboard.ts
│   │   │   ├── valuation.ts
│   │   │   ├── watchlist.ts
│   │   │   └── quotes.ts
│   │   ├── services/
│   │   │   ├── fmp/
│   │   │   │   ├── client.ts
│   │   │   │   └── types.ts
│   │   │   ├── edgar/
│   │   │   │   ├── client.ts
│   │   │   │   └── types.ts
│   │   │   ├── dataService.ts
│   │   │   └── cacheService.ts
│   │   ├── calculators/
│   │   │   ├── bigFive.ts
│   │   │   ├── scoring.ts
│   │   │   ├── valuation.ts
│   │   │   └── index.ts
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   ├── requestLogger.ts
│   │   │   └── validateRequest.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   └── helpers.ts
│   │   └── types/
│   │       ├── api.ts
│   │       ├── financials.ts
│   │       └── scores.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── tests/
│   │   ├── calculators/
│   │   ├── routes/
│   │   └── services/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/
│   │   │   ├── __root.tsx
│   │   │   ├── index.tsx
│   │   │   ├── analysis.$ticker.tsx
│   │   │   ├── screener.tsx
│   │   │   ├── leaderboard.tsx
│   │   │   └── watchlist.tsx
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── ScoreCard/
│   │   │   ├── BigFiveChart/
│   │   │   ├── ValuationPanel/
│   │   │   ├── FinancialsTable/
│   │   │   ├── ScreenerFilters/
│   │   │   └── common/
│   │   ├── hooks/
│   │   │   ├── useCompanyAnalysis.ts
│   │   │   ├── useScreener.ts
│   │   │   └── useWatchlist.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── queryClient.ts
│   │   │   └── formatters.ts
│   │   ├── theme/
│   │   │   └── index.ts
│   │   └── types/
│   │       └── index.ts
│   ├── tests/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── PLAN.md
└── README.md
```

---

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/investing_toolbox"

# Financial Modeling Prep API
FMP_API_KEY="your_api_key_here"

# Server
PORT=3001
NODE_ENV=development

# Frontend (for CORS)
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

---

## Getting Started Checklist

### Prerequisites
- [ ] Node.js 20+ installed
- [ ] Docker Desktop installed
- [ ] PostgreSQL client (optional, for debugging)
- [ ] Sign up for FMP API key (free tier)

### First Steps
1. [ ] Clone/initialize repository
2. [ ] Copy `.env.example` to `.env` and fill in values
3. [ ] Start PostgreSQL with `docker-compose up -d`
4. [ ] Install backend dependencies: `cd backend && npm install`
5. [ ] Run migrations: `npx prisma migrate dev`
6. [ ] Start backend: `npm run dev`
7. [ ] Install frontend dependencies: `cd frontend && npm install`
8. [ ] Start frontend: `npm run dev`
9. [ ] Open http://localhost:5173

---

## Resources & References

### Rule One Investing
- [Rule One Investing Website](https://www.ruleoneinvesting.com/)
- [The 4 M's Guide](https://www.ruleoneinvesting.com/blog/how-to-invest/the-4ms-for-successful-investing/)
- [Big Five Numbers Guide](https://www.ruleoneinvesting.com/investing-guide/chapter-3/)
- [Sticker Price Calculator](https://www.ruleoneinvesting.com/margin-of-safety-calculator/)
- [Phil Town's Excel Formulas PDF](https://www.ruleoneinvesting.com/ExcelFormulas.pdf)
- [Investment Calculators](https://www.ruleoneinvesting.com/investment-calculators/)

### Data Sources
- [Financial Modeling Prep API Docs](https://site.financialmodelingprep.com/developer/docs)
- [SEC EDGAR API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)

### Similar Projects
- [DecodeInvesting](https://decodeinvesting.com/) - Full-featured SaaS reference
- [IsThisStockGood](https://github.com/mrhappyasthma/IsThisStockGood) - Open source Python implementation
- [Rule One Stock Screener](https://github.com/mrhappyasthma/Rule1-StockScreener) - Bulk screening tool

### Books
- "Rule #1" by Phil Town
- "Payback Time" by Phil Town
- "The Intelligent Investor" by Benjamin Graham
- "The Warren Buffett Way" by Robert Hagstrom
