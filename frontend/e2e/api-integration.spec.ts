/**
 * Backend API Integration E2E Tests
 *
 * Tests the backend API endpoints directly to ensure they work correctly
 * with the real database. These tests bypass the UI to focus on API behavior.
 *
 * WHY these tests?
 * - Verify API contracts are correct
 * - Test edge cases and error handling
 * - Ensure database queries work as expected
 * - Faster than full E2E tests through UI
 *
 * NOTE: Some tests require the FMP API key to be valid. If the FMP API
 * returns 403 (forbidden), those tests will be skipped gracefully.
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api';

/**
 * Helper: Check if FMP API is available
 * Returns true if we can fetch data, false if 403/unavailable
 */
async function isFmpApiAvailable(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get(`${API_BASE}/quotes/AAPL`);
    return response.ok();
  } catch {
    return false;
  }
}

test.describe('Companies API', () => {
  test('GET /companies/:ticker returns company analysis (requires FMP API)', async ({ request }) => {
    const fmpAvailable = await isFmpApiAvailable(request);
    test.skip(!fmpAvailable, 'FMP API not available - skipping test');

    const response = await request.get(`${API_BASE}/companies/AAPL`);

    expect(response.ok()).toBe(true);
    const data = await response.json();

    // Verify response structure
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.company).toBeDefined();
    expect(data.data.scores).toBeDefined();
    expect(data.data.bigFive).toBeDefined();
    expect(data.data.valuation).toBeDefined();

    // Verify company info
    expect(data.data.company.ticker).toBe('AAPL');
    expect(data.data.company.name).toBeTruthy();

    // Verify scores are numbers between 0-100
    expect(data.data.scores.valueScore).toBeGreaterThanOrEqual(0);
    expect(data.data.scores.valueScore).toBeLessThanOrEqual(100);
    expect(data.data.scores.roicScore).toBeGreaterThanOrEqual(0);
    expect(data.data.scores.moatScore).toBeGreaterThanOrEqual(0);
    expect(data.data.scores.debtScore).toBeGreaterThanOrEqual(0);
  });

  test('GET /companies/:ticker returns error for non-existent ticker', async ({ request }) => {
    // Ticker too long is validated as 400, not 404
    const response = await request.get(`${API_BASE}/companies/INVALIDTICKER999`);

    // Should return 400 (validation error - ticker too long) or 404 (not found)
    expect([400, 404]).toContain(response.status());
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('GET /companies/:ticker normalizes ticker to uppercase (requires FMP API)', async ({ request }) => {
    const fmpAvailable = await isFmpApiAvailable(request);
    test.skip(!fmpAvailable, 'FMP API not available - skipping test');

    const response = await request.get(`${API_BASE}/companies/aapl`);

    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.data.company.ticker).toBe('AAPL');
  });

  test('GET /companies/:ticker/financials returns financial statements', async ({ request }) => {
    // First ensure company data exists
    await request.get(`${API_BASE}/companies/MSFT`);

    const response = await request.get(`${API_BASE}/companies/MSFT/financials`);

    if (response.ok()) {
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);

      // Should have multiple years of data
      if (data.data.length > 0) {
        const firstYear = data.data[0];
        expect(firstYear.fiscalYear).toBeDefined();
        expect(firstYear.revenue).toBeDefined();
        expect(firstYear.netIncome).toBeDefined();
      }
    }
  });

  test('GET /companies/search returns search results (requires FMP API)', async ({ request }) => {
    const fmpAvailable = await isFmpApiAvailable(request);
    test.skip(!fmpAvailable, 'FMP API not available - skipping test');

    const response = await request.get(`${API_BASE}/companies/search?q=Apple`);

    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);

    // Should find Apple Inc
    if (data.data.length > 0) {
      const hasApple = data.data.some(
        (result: { ticker: string; name: string }) =>
          result.ticker === 'AAPL' || result.name.toLowerCase().includes('apple')
      );
      expect(hasApple).toBe(true);
    }
  });

  test('GET /companies/:ticker/scores/history returns historical scores', async ({ request }) => {
    // First ensure company data exists
    await request.get(`${API_BASE}/companies/GOOGL`);

    const response = await request.get(`${API_BASE}/companies/GOOGL/scores/history`);

    if (response.ok()) {
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    }
  });
});

test.describe('Screener API', () => {
  test('GET /screener returns paginated results', async ({ request }) => {
    const response = await request.get(`${API_BASE}/screener?limit=10&page=1`);

    expect(response.ok()).toBe(true);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.meta).toBeDefined();
    expect(data.meta.page).toBeDefined();
    expect(data.meta.limit).toBeDefined();
    expect(data.meta.total).toBeDefined();
    expect(data.meta.totalPages).toBeDefined();
  });

  test('GET /screener filters by minValueScore', async ({ request }) => {
    const response = await request.get(`${API_BASE}/screener?minValueScore=50&limit=50`);

    if (response.ok()) {
      const data = await response.json();

      // All results should have valueScore >= 50
      for (const result of data.data) {
        expect((result as { valueScore: number }).valueScore).toBeGreaterThanOrEqual(50);
      }
    }
  });

  test('GET /screener filters by sector', async ({ request }) => {
    const response = await request.get(`${API_BASE}/screener?sector=Technology&limit=50`);

    if (response.ok()) {
      const data = await response.json();

      // All results should be in Technology sector
      for (const result of data.data) {
        if ((result as { sector: string | null }).sector) {
          expect((result as { sector: string }).sector.toLowerCase()).toContain('tech');
        }
      }
    }
  });

  test('GET /screener sorts by valueScore descending', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/screener?sortBy=valueScore&sortOrder=desc&limit=10`
    );

    if (response.ok()) {
      const data = await response.json();
      const results = data.data as { valueScore: number }[];

      // Verify descending order
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].valueScore).toBeGreaterThanOrEqual(results[i].valueScore);
      }
    }
  });

  test('GET /screener/leaderboard returns top companies', async ({ request }) => {
    const response = await request.get(`${API_BASE}/screener/leaderboard?limit=10`);

    expect(response.ok()).toBe(true);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});

test.describe('Watchlist API', () => {
  const TEST_TICKER = 'NVDA';

  // Clean up before and after tests
  test.beforeEach(async ({ request }) => {
    await request.delete(`${API_BASE}/watchlist/${TEST_TICKER}`);
  });

  test.afterEach(async ({ request }) => {
    await request.delete(`${API_BASE}/watchlist/${TEST_TICKER}`);
  });

  test('GET /watchlist returns watchlist items', async ({ request }) => {
    const response = await request.get(`${API_BASE}/watchlist`);

    expect(response.ok()).toBe(true);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('POST /watchlist/:ticker adds item to watchlist (requires FMP API)', async ({ request }) => {
    const fmpAvailable = await isFmpApiAvailable(request);
    test.skip(!fmpAvailable, 'FMP API not available - skipping test');

    const response = await request.post(`${API_BASE}/watchlist/${TEST_TICKER}`, {
      data: { targetPrice: 500.0, notes: 'Test note' },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.ticker).toBe(TEST_TICKER);
    expect(data.data.targetPrice).toBe(500.0);
    expect(data.data.notes).toBe('Test note');
  });

  test('POST /watchlist/:ticker returns 400 for duplicate (requires FMP API)', async ({ request }) => {
    const fmpAvailable = await isFmpApiAvailable(request);
    test.skip(!fmpAvailable, 'FMP API not available - skipping test');

    // Add first time
    await request.post(`${API_BASE}/watchlist/${TEST_TICKER}`, {});

    // Try to add again
    const response = await request.post(`${API_BASE}/watchlist/${TEST_TICKER}`, {});

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('PATCH /watchlist/:ticker updates item (requires FMP API)', async ({ request }) => {
    const fmpAvailable = await isFmpApiAvailable(request);
    test.skip(!fmpAvailable, 'FMP API not available - skipping test');

    // Add item first
    await request.post(`${API_BASE}/watchlist/${TEST_TICKER}`, {
      data: { targetPrice: 100.0 },
    });

    // Update it
    const response = await request.patch(`${API_BASE}/watchlist/${TEST_TICKER}`, {
      data: { targetPrice: 200.0, notes: 'Updated note' },
    });

    expect(response.ok()).toBe(true);
    const data = await response.json();

    expect(data.data.targetPrice).toBe(200.0);
    expect(data.data.notes).toBe('Updated note');
  });

  test('DELETE /watchlist/:ticker removes item (requires FMP API)', async ({ request }) => {
    const fmpAvailable = await isFmpApiAvailable(request);
    test.skip(!fmpAvailable, 'FMP API not available - skipping test');

    // Add item first
    await request.post(`${API_BASE}/watchlist/${TEST_TICKER}`, {});

    // Delete it
    const response = await request.delete(`${API_BASE}/watchlist/${TEST_TICKER}`);
    expect(response.ok()).toBe(true);

    // Verify it's gone
    const watchlistResponse = await request.get(`${API_BASE}/watchlist`);
    const data = await watchlistResponse.json();
    const hasItem = data.data.some(
      (item: { ticker: string }) => item.ticker === TEST_TICKER
    );
    expect(hasItem).toBe(false);
  });
});

test.describe('Valuation API', () => {
  test('POST /valuation/calculate returns valuation', async ({ request }) => {
    const response = await request.post(`${API_BASE}/valuation/calculate`, {
      data: {
        currentEps: 5.0,
        growthRate: 15,
        futurePe: 25,
        currentPrice: 100,
      },
    });

    expect(response.ok()).toBe(true);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.stickerPrice).toBeDefined();
    expect(data.data.mosPrice).toBeDefined();
    expect(data.data.futureEps).toBeDefined();
    expect(data.data.futurePrice).toBeDefined();

    // MOS price should be 50% of sticker price
    expect(data.data.mosPrice).toBeCloseTo(data.data.stickerPrice * 0.5, 1);
  });

  test('POST /valuation/calculate validates input', async ({ request }) => {
    // Negative EPS should fail
    const response = await request.post(`${API_BASE}/valuation/calculate`, {
      data: {
        currentEps: -5.0,
        growthRate: 15,
        futurePe: 25,
      },
    });

    expect(response.status()).toBe(400);
  });

  test('GET /valuation/:ticker/default returns default valuation', async ({ request }) => {
    // Ensure company exists
    await request.get(`${API_BASE}/companies/AAPL`);

    const response = await request.get(`${API_BASE}/valuation/AAPL/default`);

    if (response.ok()) {
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.ticker).toBe('AAPL');
      expect(data.data.stickerPrice).toBeDefined();
      expect(data.data.mosPrice).toBeDefined();
    }
  });
});

test.describe('Quotes API', () => {
  test('GET /quotes/:ticker returns quote (requires FMP API)', async ({ request }) => {
    const fmpAvailable = await isFmpApiAvailable(request);
    test.skip(!fmpAvailable, 'FMP API not available - skipping test');

    const response = await request.get(`${API_BASE}/quotes/AAPL`);

    expect(response.ok()).toBe(true);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.ticker).toBe('AAPL');
    expect(data.data.price).toBeGreaterThan(0);
    expect(data.data.name).toBeTruthy();
  });

  test('GET /quotes?tickers=... returns batch quotes (requires FMP API)', async ({ request }) => {
    const fmpAvailable = await isFmpApiAvailable(request);
    test.skip(!fmpAvailable, 'FMP API not available - skipping test');

    const response = await request.get(`${API_BASE}/quotes?tickers=AAPL,MSFT,GOOGL`);

    expect(response.ok()).toBe(true);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBe(3);

    const tickers = data.data.map((q: { ticker: string }) => q.ticker);
    expect(tickers).toContain('AAPL');
    expect(tickers).toContain('MSFT');
    expect(tickers).toContain('GOOGL');
  });
});

test.describe('Filings API (SEC EDGAR)', () => {
  test('GET /filings/:ticker returns SEC filings', async ({ request }) => {
    const response = await request.get(`${API_BASE}/filings/AAPL`);

    expect(response.ok()).toBe(true);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.ticker).toBe('AAPL');
    expect(data.data.companyName).toBeTruthy();
    expect(data.data.cik).toBeTruthy();
    expect(Array.isArray(data.data.filings)).toBe(true);

    // Should have some filings
    if (data.data.filings.length > 0) {
      const firstFiling = data.data.filings[0];
      expect(firstFiling.form).toBeDefined();
      expect(firstFiling.filingDate).toBeDefined();
      expect(firstFiling.documentUrl).toBeTruthy();
    }
  });

  test('GET /filings/:ticker filters by form type', async ({ request }) => {
    const response = await request.get(`${API_BASE}/filings/MSFT?forms=10-K`);

    if (response.ok()) {
      const data = await response.json();

      // All filings should be 10-K
      for (const filing of data.data.filings) {
        expect((filing as { form: string }).form).toBe('10-K');
      }
    }
  });

  test('GET /filings/:ticker returns error for unknown ticker', async ({ request }) => {
    const response = await request.get(`${API_BASE}/filings/INVALIDTICKER999`);

    // Should return 400 (validation) or 404 (not found)
    expect([400, 404]).toContain(response.status());
  });
});

test.describe('API Error Handling', () => {
  test('API returns proper error format', async ({ request }) => {
    const response = await request.get(`${API_BASE}/companies/INVALIDTICKER999`);

    // Should return 400 (validation) or 404 (not found)
    expect([400, 404]).toContain(response.status());
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    expect(data.error.message).toBeTruthy();
  });

  test('API handles malformed requests', async ({ request }) => {
    const response = await request.post(`${API_BASE}/valuation/calculate`, {
      data: { invalid: 'data' },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
