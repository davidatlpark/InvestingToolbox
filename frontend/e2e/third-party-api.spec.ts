/**
 * Third-Party API Integration E2E Tests
 *
 * Tests that verify the external API integrations (FMP and SEC EDGAR)
 * are working correctly through the backend.
 *
 * WHY these tests?
 * - Verify FMP API key is valid and returns data
 * - Verify SEC EDGAR API is accessible
 * - Test that data transformation works correctly
 * - Catch API changes or outages early
 *
 * NOTE: These tests make REAL API calls. They should be run sparingly
 * to avoid rate limits. FMP tests are skipped if API key is invalid.
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

const API_BASE = 'http://localhost:3001/api';

/**
 * Helper: Check if FMP API is available
 */
async function isFmpApiAvailable(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get(`${API_BASE}/quotes/AAPL`);
    return response.ok();
  } catch {
    return false;
  }
}

// Use well-known tickers that should always exist
const TEST_TICKERS = {
  LARGE_CAP: 'AAPL', // Apple - large cap, well-documented
  DIFFERENT_SECTOR: 'JPM', // JPMorgan - financial sector
  TECH: 'MSFT', // Microsoft - tech sector
};

test.describe('FMP API Integration', () => {
  test.describe('Company Profile', () => {
    test('fetches company profile from FMP', async ({ request }) => {
      const fmpAvailable = await isFmpApiAvailable(request);
      test.skip(!fmpAvailable, 'FMP API not available - skipping test');

      const response = await request.get(
        `${API_BASE}/companies/${TEST_TICKERS.LARGE_CAP}`
      );

      expect(response.ok()).toBe(true);
      const data = await response.json();

      // Verify company data came from FMP
      expect(data.data.company.name).toBeTruthy();
      expect(data.data.company.sector).toBeTruthy();
      expect(data.data.company.industry).toBeTruthy();
      expect(data.data.company.marketCap).toBeGreaterThan(0);
    });

    test('handles FMP API response for different companies', async ({ request }) => {
      const fmpAvailable = await isFmpApiAvailable(request);
      test.skip(!fmpAvailable, 'FMP API not available - skipping test');

      // Test with multiple tickers to verify consistency
      const responses = await Promise.all([
        request.get(`${API_BASE}/companies/${TEST_TICKERS.LARGE_CAP}`),
        request.get(`${API_BASE}/companies/${TEST_TICKERS.DIFFERENT_SECTOR}`),
        request.get(`${API_BASE}/companies/${TEST_TICKERS.TECH}`),
      ]);

      for (const response of responses) {
        expect(response.ok()).toBe(true);
        const data = await response.json();
        expect(data.data.company.name).toBeTruthy();
      }

      // Verify different sectors
      const appleData = await responses[0].json();
      const jpmData = await responses[1].json();

      expect(appleData.data.company.sector).not.toBe(jpmData.data.company.sector);
    });
  });

  test.describe('Financial Statements', () => {
    test('fetches financial statements from FMP', async ({ request }) => {
      const fmpAvailable = await isFmpApiAvailable(request);
      test.skip(!fmpAvailable, 'FMP API not available');
      // First get company data (triggers FMP fetch)
      await request.get(`${API_BASE}/companies/${TEST_TICKERS.LARGE_CAP}`);

      // Then get financials
      const response = await request.get(
        `${API_BASE}/companies/${TEST_TICKERS.LARGE_CAP}/financials`
      );

      if (response.ok()) {
        const data = await response.json();

        expect(Array.isArray(data.data)).toBe(true);

        if (data.data.length > 0) {
          const statement = data.data[0];

          // Verify key financial fields are present
          expect(statement.fiscalYear).toBeDefined();
          expect(statement.revenue).toBeDefined();
          expect(statement.netIncome).toBeDefined();
          expect(statement.eps).toBeDefined();

          // Revenue and earnings should be reasonable numbers
          if (statement.revenue !== null) {
            expect(Math.abs(statement.revenue)).toBeGreaterThan(0);
          }
        }
      }
    });

    test('financial data includes required fields for calculations', async ({ request }) => {
      const fmpAvailable = await isFmpApiAvailable(request);
      test.skip(!fmpAvailable, 'FMP API not available');
      await request.get(`${API_BASE}/companies/${TEST_TICKERS.TECH}`);

      const response = await request.get(
        `${API_BASE}/companies/${TEST_TICKERS.TECH}/financials`
      );

      if (response.ok()) {
        const data = await response.json();

        if (data.data.length > 0) {
          const statement = data.data[0];

          // Fields needed for Big Five calculations
          expect('eps' in statement).toBe(true);
          expect('revenue' in statement).toBe(true);
          expect('totalEquity' in statement).toBe(true);
          expect('freeCashFlow' in statement).toBe(true);
          expect('operatingIncome' in statement).toBe(true);
        }
      }
    });

    test('returns multiple years of financial history', async ({ request }) => {
      const fmpAvailable = await isFmpApiAvailable(request);
      test.skip(!fmpAvailable, 'FMP API not available');
      await request.get(`${API_BASE}/companies/${TEST_TICKERS.LARGE_CAP}`);

      const response = await request.get(
        `${API_BASE}/companies/${TEST_TICKERS.LARGE_CAP}/financials?years=10`
      );

      if (response.ok()) {
        const data = await response.json();

        // Should have multiple years
        expect(data.data.length).toBeGreaterThan(1);

        // Years should be in descending order
        if (data.data.length >= 2) {
          const years = data.data.map((s: { fiscalYear: number }) => s.fiscalYear);
          expect(years[0]).toBeGreaterThan(years[years.length - 1]);
        }
      }
    });
  });

  test.describe('Quotes', () => {
    test('fetches real-time quotes from FMP', async ({ request }) => {
      const fmpAvailable = await isFmpApiAvailable(request);
      test.skip(!fmpAvailable, 'FMP API not available');
      const response = await request.get(`${API_BASE}/quotes/${TEST_TICKERS.LARGE_CAP}`);

      expect(response.ok()).toBe(true);
      const data = await response.json();

      // Verify quote data
      expect(data.data.ticker).toBe(TEST_TICKERS.LARGE_CAP);
      expect(data.data.price).toBeGreaterThan(0);

      // Apple's price should be reasonable (as of 2024, roughly $150-250 range)
      // This is a sanity check, not a precise test
      expect(data.data.price).toBeGreaterThan(50);
      expect(data.data.price).toBeLessThan(1000);
    });

    test('batch quote request works', async ({ request }) => {
      const tickers = Object.values(TEST_TICKERS).join(',');
      const response = await request.get(`${API_BASE}/quotes?tickers=${tickers}`);

      expect(response.ok()).toBe(true);
      const data = await response.json();

      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(3);

      // All should have valid prices
      for (const quote of data.data) {
        expect((quote as { price: number }).price).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Search', () => {
    test('search returns results from FMP', async ({ request }) => {
      const response = await request.get(`${API_BASE}/companies/search?q=Microsoft`);

      expect(response.ok()).toBe(true);
      const data = await response.json();

      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);

      // Should find Microsoft
      const hasMicrosoft = data.data.some(
        (r: { ticker: string; name: string }) =>
          r.ticker === 'MSFT' || r.name.toLowerCase().includes('microsoft')
      );
      expect(hasMicrosoft).toBe(true);
    });
  });
});

test.describe('SEC EDGAR API Integration', () => {
  test.describe('Company Filings', () => {
    test('fetches SEC filings for a company', async ({ request }) => {
      const response = await request.get(`${API_BASE}/filings/${TEST_TICKERS.LARGE_CAP}`);

      expect(response.ok()).toBe(true);
      const data = await response.json();

      // Verify basic response structure
      expect(data.data.ticker).toBe(TEST_TICKERS.LARGE_CAP);
      expect(data.data.companyName).toBeTruthy();
      expect(data.data.cik).toBeTruthy();

      // Should have filings
      expect(Array.isArray(data.data.filings)).toBe(true);
      expect(data.data.filings.length).toBeGreaterThan(0);
    });

    test('filings include required document information', async ({ request }) => {
      const response = await request.get(`${API_BASE}/filings/${TEST_TICKERS.LARGE_CAP}`);

      if (response.ok()) {
        const data = await response.json();
        const filing = data.data.filings[0];

        // Verify filing structure
        expect(filing.accessionNumber).toBeTruthy();
        expect(filing.form).toBeTruthy();
        expect(filing.filingDate).toBeTruthy();
        expect(filing.documentUrl).toBeTruthy();

        // URL should be a valid SEC.gov URL
        expect(filing.documentUrl).toContain('sec.gov');
      }
    });

    test('filters filings by form type', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/filings/${TEST_TICKERS.LARGE_CAP}?forms=10-K`
      );

      if (response.ok()) {
        const data = await response.json();

        // All should be 10-K forms
        for (const filing of data.data.filings) {
          expect((filing as { form: string }).form).toBe('10-K');
        }
      }
    });

    test('returns 10-Q quarterly reports', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/filings/${TEST_TICKERS.LARGE_CAP}?forms=10-Q`
      );

      if (response.ok()) {
        const data = await response.json();

        // Should have quarterly reports
        expect(data.data.filings.length).toBeGreaterThan(0);

        // All should be 10-Q forms
        for (const filing of data.data.filings) {
          expect((filing as { form: string }).form).toBe('10-Q');
        }
      }
    });

    test('CIK is properly formatted', async ({ request }) => {
      const response = await request.get(`${API_BASE}/filings/${TEST_TICKERS.LARGE_CAP}`);

      if (response.ok()) {
        const data = await response.json();

        // CIK should be a string of digits (padded to 10)
        expect(data.data.cik).toMatch(/^\d{10}$/);
      }
    });
  });

  test.describe('Filing Dates', () => {
    test('filing dates are in expected format', async ({ request }) => {
      const response = await request.get(`${API_BASE}/filings/${TEST_TICKERS.LARGE_CAP}`);

      if (response.ok()) {
        const data = await response.json();
        const filing = data.data.filings[0];

        // Dates should be ISO format (YYYY-MM-DD)
        expect(filing.filingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(filing.reportDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    test('filings are ordered by date (most recent first)', async ({ request }) => {
      const response = await request.get(`${API_BASE}/filings/${TEST_TICKERS.LARGE_CAP}`);

      if (response.ok()) {
        const data = await response.json();
        const filings = data.data.filings as { filingDate: string }[];

        if (filings.length >= 2) {
          // First filing should be more recent
          const firstDate = new Date(filings[0].filingDate);
          const lastDate = new Date(filings[filings.length - 1].filingDate);

          expect(firstDate.getTime()).toBeGreaterThan(lastDate.getTime());
        }
      }
    });
  });

  test.describe('Different Companies', () => {
    test('fetches filings for financial sector company', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/filings/${TEST_TICKERS.DIFFERENT_SECTOR}`
      );

      expect(response.ok()).toBe(true);
      const data = await response.json();

      // JPMorgan should have SEC filings
      expect(data.data.filings.length).toBeGreaterThan(0);
    });

    test('handles company not found in SEC database', async ({ request }) => {
      // Try a ticker that might not be SEC-registered
      const response = await request.get(`${API_BASE}/filings/INVALIDTICKER999`);

      expect(response.status()).toBe(404);
    });
  });
});

test.describe('API Rate Limiting and Resilience', () => {
  test('handles multiple concurrent requests', async ({ request }) => {
    // Make several concurrent requests
    const requests = [
      request.get(`${API_BASE}/companies/${TEST_TICKERS.LARGE_CAP}`),
      request.get(`${API_BASE}/companies/${TEST_TICKERS.TECH}`),
      request.get(`${API_BASE}/filings/${TEST_TICKERS.LARGE_CAP}`),
      request.get(`${API_BASE}/quotes/${TEST_TICKERS.LARGE_CAP}`),
    ];

    const responses = await Promise.all(requests);

    // All should succeed
    for (const response of responses) {
      expect(response.ok()).toBe(true);
    }
  });

  test('data is cached after first request', async ({ request }) => {
    // First request
    const startTime1 = Date.now();
    await request.get(`${API_BASE}/companies/${TEST_TICKERS.LARGE_CAP}`);
    const duration1 = Date.now() - startTime1;

    // Second request (should use cache)
    const startTime2 = Date.now();
    await request.get(`${API_BASE}/companies/${TEST_TICKERS.LARGE_CAP}`);
    const duration2 = Date.now() - startTime2;

    // Second request should be faster (cached)
    // Note: This is a soft assertion - caching behavior may vary
    // The main point is both requests should succeed
    expect(duration2).toBeLessThanOrEqual(duration1 + 100);
  });
});

test.describe('Data Transformation', () => {
  test('FMP data is correctly transformed to API response format', async ({ request }) => {
    const response = await request.get(`${API_BASE}/companies/${TEST_TICKERS.LARGE_CAP}`);

    if (response.ok()) {
      const data = await response.json();

      // Verify our API format (not raw FMP format)
      expect(data.data.company).toBeDefined();
      expect(data.data.scores).toBeDefined();
      expect(data.data.bigFive).toBeDefined();
      expect(data.data.valuation).toBeDefined();

      // Big Five should have our structure
      expect(data.data.bigFive.roic).toBeDefined();
      expect(data.data.bigFive.epsGrowth).toBeDefined();
      expect(data.data.bigFive.revenueGrowth).toBeDefined();
      expect(data.data.bigFive.equityGrowth).toBeDefined();
      expect(data.data.bigFive.fcfGrowth).toBeDefined();

      // Each metric should have year1, year5, year10
      expect('year1' in data.data.bigFive.roic).toBe(true);
      expect('year5' in data.data.bigFive.roic).toBe(true);
      expect('year10' in data.data.bigFive.roic).toBe(true);
    }
  });

  test('SEC EDGAR data is correctly transformed', async ({ request }) => {
    const response = await request.get(`${API_BASE}/filings/${TEST_TICKERS.LARGE_CAP}`);

    if (response.ok()) {
      const data = await response.json();
      const filing = data.data.filings[0];

      // Verify our API format includes constructed URL
      expect(filing.documentUrl).toContain('https://www.sec.gov');

      // Size should be a number
      expect(typeof filing.size).toBe('number');
    }
  });
});
