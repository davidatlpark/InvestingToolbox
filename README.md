# Value Investing Toolbox

A web application for value investing analysis based on Warren Buffett's principles and Phil Town's Rule One Investing methodology.

## Features

- **Stock Analysis**: Get Big Five metrics, scores, and valuations for any stock
- **Scoring System**: Value Score, ROIC Score, Moat Score, Debt Score
- **Valuation Calculator**: Calculate Sticker Price and Margin of Safety
- **Stock Screener**: Filter stocks by Rule One criteria
- **Watchlist**: Track stocks and price targets

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- TanStack Router + Query
- Material-UI (MUI)
- Recharts

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod validation

### Data Sources
- Financial Modeling Prep API
- SEC EDGAR (future)

## Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL)
- FMP API Key (get free at https://site.financialmodelingprep.com/)

## Quick Start

### 1. Clone and Setup Environment

```bash
cd InvestingToolbox

# Copy environment files
cp .env.example backend/.env
```

Edit `backend/.env` and add your FMP API key:
```
FMP_API_KEY=your_api_key_here
```

### 2. Start Database

```bash
docker-compose up -d
```

### 3. Setup Backend

```bash
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Backend runs at http://localhost:3001

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

## Project Structure

```
InvestingToolbox/
├── backend/
│   ├── src/
│   │   ├── calculators/     # Big Five, Scoring, Valuation
│   │   ├── config/          # Env, Database
│   │   ├── middleware/      # Error handling, Validation
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # FMP client
│   │   └── types/           # TypeScript types
│   └── prisma/              # Database schema
├── frontend/
│   ├── src/
│   │   ├── lib/             # API client
│   │   ├── routes/          # Page components
│   │   └── theme/           # MUI theme
│   └── public/
└── docker-compose.yml
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/companies/:ticker` | Full company analysis |
| `GET /api/companies/search?q=` | Search companies |
| `GET /api/screener` | Screen stocks with filters |
| `GET /api/screener/leaderboard` | Top ranked stocks |
| `POST /api/valuation/calculate` | Calculate valuation |
| `GET /api/valuation/:ticker/default` | Default valuation |
| `GET /api/watchlist` | Get watchlist |
| `POST /api/watchlist/:ticker` | Add to watchlist |
| `DELETE /api/watchlist/:ticker` | Remove from watchlist |
| `GET /api/quotes/:ticker` | Get stock quote |

## Rule One Investing Methodology

### The 4 M's
1. **Meaning**: Understand the business
2. **Moat**: Durable competitive advantage
3. **Management**: Owner-oriented leadership
4. **Margin of Safety**: Buy at 50% of value

### The Big Five Numbers (all should be ≥10% for 10 years)
1. ROIC (Return on Invested Capital)
2. Equity/Book Value Growth
3. EPS Growth
4. Revenue Growth
5. Free Cash Flow Growth

### Valuation
- **Sticker Price**: Fair value using DCF
- **MOS Price**: 50% of Sticker Price
- **Payback Time**: Years for earnings to repay investment (target ≤8)

## Development

### Run Tests
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Database Commands
```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## Resources

- [Rule One Investing](https://www.ruleoneinvesting.com/)
- [Phil Town's Calculators](https://www.ruleoneinvesting.com/investment-calculators/)
- [Financial Modeling Prep API](https://site.financialmodelingprep.com/developer/docs)
- [SEC EDGAR API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)

## License

MIT
