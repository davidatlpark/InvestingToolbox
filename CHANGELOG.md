# Changelog

## [Unreleased]

### Added
- **Stock Price History Chart**: Added interactive price chart to stock analysis page
  - Line chart showing historical closing prices with volume bars below
  - Toggle buttons for 1M, 6M, 1Y, 5Y time ranges
  - Summary showing percentage change over selected period
  - Located after Score Cards, before Big Five panel

### Backend
- `backend/src/services/yahoo/client.ts`: Added `HistoricalPrice` interface, `PriceRange` type, and `getHistoricalPrices()` method using yahoo-finance2's `.historical()` API
- `backend/src/routes/quotes.ts`: Added `GET /api/quotes/:ticker/history?range=` endpoint with Zod validation

### Frontend
- `frontend/src/components/PriceHistoryChart.tsx`: New chart component using Recharts ComposedChart
- `frontend/src/lib/api.ts`: Added `PriceRange`, `HistoricalPrice`, `PriceHistoryResponse` types and `quotesApi.getPriceHistory()` function
- `frontend/src/routes/analysis.$ticker.tsx`: Integrated PriceHistoryChart component
- `frontend/src/test/utils.tsx`: Added `priceHistoryResponse` mock factory

### Tests
- `frontend/src/components/__tests__/PriceHistoryChart.test.tsx`: 10 unit tests covering loading, error, empty states, toggle functionality
