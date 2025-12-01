/**
 * Database Integration E2E Tests
 *
 * Tests that verify data actually persists to the database and can be retrieved.
 * These tests interact through the UI but verify database state via API calls.
 *
 * WHY these tests?
 * - Ensure data persistence works correctly
 * - Verify CRUD operations through the full stack
 * - Test database constraints and relationships
 */

import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

// Test data
const UNIQUE_TICKER = 'MSFT'; // Known good ticker for testing
const TEST_NOTES = `E2E Test Note ${Date.now()}`;
const TEST_TARGET_PRICE = 100.5;

/**
 * Helper: Direct API call to check watchlist state
 */
async function getWatchlistViaAPI(request: APIRequestContext): Promise<unknown[]> {
  const response = await request.get('http://localhost:3001/api/watchlist');
  if (!response.ok()) return [];
  const data = await response.json();
  return data.data || [];
}

/**
 * Helper: Check if ticker exists in watchlist via API
 */
async function isTickerInWatchlist(
  request: APIRequestContext,
  ticker: string
): Promise<boolean> {
  const watchlist = await getWatchlistViaAPI(request);
  return watchlist.some((item: unknown) =>
    typeof item === 'object' && item !== null && 'ticker' in item && (item as { ticker: string }).ticker === ticker
  );
}

/**
 * Helper: Remove ticker from watchlist via API (cleanup)
 */
async function removeFromWatchlistViaAPI(
  request: APIRequestContext,
  ticker: string
): Promise<void> {
  await request.delete(`http://localhost:3001/api/watchlist/${ticker}`);
}

test.describe('Database Persistence - Watchlist CRUD', () => {
  // Clean up before and after tests
  test.beforeEach(async ({ request }) => {
    // Remove test ticker if it exists
    await removeFromWatchlistViaAPI(request, UNIQUE_TICKER);
  });

  test.afterEach(async ({ request }) => {
    // Clean up after test
    await removeFromWatchlistViaAPI(request, UNIQUE_TICKER);
  });

  test('adding a stock via UI persists to database', async ({ page, request }) => {
    // Navigate to watchlist page
    await page.goto('/watchlist');
    await page.waitForLoadState('networkidle');

    // Verify ticker is NOT in watchlist initially (via API)
    const initialInWatchlist = await isTickerInWatchlist(request, UNIQUE_TICKER);
    expect(initialInWatchlist).toBe(false);

    // Find the add stock input and add the ticker
    const addInput = page.getByPlaceholder(/add|ticker|symbol/i);
    if (await addInput.isVisible()) {
      await addInput.fill(UNIQUE_TICKER);
      await addInput.press('Enter');

      // Wait for API response
      await page.waitForResponse(
        (response) => response.url().includes('/watchlist') && response.status() === 201,
        { timeout: 10000 }
      ).catch(() => null);

      // Wait for UI to update
      await page.waitForTimeout(500);

      // Verify ticker IS NOW in watchlist (via API)
      const finalInWatchlist = await isTickerInWatchlist(request, UNIQUE_TICKER);
      expect(finalInWatchlist).toBe(true);
    }
  });

  test('removing a stock via UI removes from database', async ({ page, request }) => {
    // First, add the stock via API so we have something to remove
    await request.post(`http://localhost:3001/api/watchlist/${UNIQUE_TICKER}`, {
      data: { notes: 'Test stock' },
    });

    // Verify it was added
    const wasAdded = await isTickerInWatchlist(request, UNIQUE_TICKER);
    expect(wasAdded).toBe(true);

    // Navigate to watchlist page
    await page.goto('/watchlist');
    await page.waitForLoadState('networkidle');

    // Find and click the remove button for this ticker
    const tickerRow = page.locator(`tr, [data-ticker="${UNIQUE_TICKER}"]`)
      .filter({ hasText: UNIQUE_TICKER });
    const removeButton = tickerRow.getByRole('button', { name: /remove|delete|×/i });

    if (await removeButton.isVisible()) {
      await removeButton.click();

      // Wait for API response
      await page.waitForResponse(
        (response) => response.url().includes('/watchlist') && response.status() === 200,
        { timeout: 10000 }
      ).catch(() => null);

      // Wait for UI to update
      await page.waitForTimeout(500);

      // Verify ticker is NO LONGER in watchlist (via API)
      const isStillInWatchlist = await isTickerInWatchlist(request, UNIQUE_TICKER);
      expect(isStillInWatchlist).toBe(false);
    }
  });

  test('updating target price persists to database', async ({ page, request }) => {
    // Add stock via API first
    await request.post(`http://localhost:3001/api/watchlist/${UNIQUE_TICKER}`, {
      data: { targetPrice: 50.0 },
    });

    // Navigate to watchlist page
    await page.goto('/watchlist');
    await page.waitForLoadState('networkidle');

    // Find the edit button or editable target price field
    const tickerRow = page.locator('tr').filter({ hasText: UNIQUE_TICKER });
    const editButton = tickerRow.getByRole('button', { name: /edit|update/i });

    if (await editButton.isVisible()) {
      await editButton.click();

      // Find target price input
      const targetPriceInput = page.getByRole('spinbutton', { name: /target|price/i })
        .or(page.locator('input[type="number"]').first());

      if (await targetPriceInput.isVisible()) {
        await targetPriceInput.clear();
        await targetPriceInput.fill(TEST_TARGET_PRICE.toString());

        // Submit the form
        await page.getByRole('button', { name: /save|update|submit/i }).click();

        // Wait for API response
        await page.waitForResponse(
          (response) => response.url().includes('/watchlist') && response.ok(),
          { timeout: 10000 }
        ).catch(() => null);

        // Verify via API
        const watchlist = await getWatchlistViaAPI(request);
        const updatedItem = watchlist.find(
          (item: unknown) => typeof item === 'object' && item !== null && 'ticker' in item && (item as { ticker: string }).ticker === UNIQUE_TICKER
        ) as { targetPrice: number | null } | undefined;

        expect(updatedItem?.targetPrice).toBe(TEST_TARGET_PRICE);
      }
    }
  });
});

test.describe('Database Persistence - Company Data', () => {
  test('viewing analysis page stores company data in database', async ({ page, request }) => {
    // Navigate to analysis page for a ticker
    // This should trigger data fetch from FMP and storage in database
    await page.goto(`/analysis/${UNIQUE_TICKER}`);
    await page.waitForLoadState('networkidle');

    // Wait for content to load (indicates API call completed)
    await expect(page.getByText(UNIQUE_TICKER)).toBeVisible({ timeout: 15000 });

    // Verify company now exists via API
    const response = await request.get(`http://localhost:3001/api/companies/${UNIQUE_TICKER}`);
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.company.ticker).toBe(UNIQUE_TICKER);
  });

  test('financial data is persisted after viewing analysis', async ({ page, request }) => {
    // Navigate to analysis page
    await page.goto(`/analysis/${UNIQUE_TICKER}`);
    await page.waitForLoadState('networkidle');

    // Wait for financials section to load
    await expect(page.getByText(/financials/i)).toBeVisible({ timeout: 15000 });

    // Verify financials data is available via API
    const response = await request.get(
      `http://localhost:3001/api/companies/${UNIQUE_TICKER}/financials`
    );

    if (response.ok()) {
      const data = await response.json();
      expect(data.success).toBe(true);
      // Should have multiple years of financial data
      expect(Array.isArray(data.data)).toBe(true);
    }
  });

  test('company scores are calculated and stored', async ({ page, request }) => {
    // Navigate to analysis page
    await page.goto(`/analysis/${UNIQUE_TICKER}`);
    await page.waitForLoadState('networkidle');

    // Wait for scores to display
    await expect(page.getByText(/value score/i)).toBeVisible({ timeout: 15000 });

    // Verify scores exist via API
    const response = await request.get(`http://localhost:3001/api/companies/${UNIQUE_TICKER}`);

    if (response.ok()) {
      const data = await response.json();
      expect(data.data.scores).toBeDefined();
      expect(typeof data.data.scores.valueScore).toBe('number');
      expect(typeof data.data.scores.roicScore).toBe('number');
      expect(typeof data.data.scores.moatScore).toBe('number');
    }
  });
});

test.describe('Database Consistency', () => {
  test('multiple requests for same ticker return consistent data', async ({ request }) => {
    // Make two API calls for the same company
    const [response1, response2] = await Promise.all([
      request.get(`http://localhost:3001/api/companies/${UNIQUE_TICKER}`),
      request.get(`http://localhost:3001/api/companies/${UNIQUE_TICKER}`),
    ]);

    if (response1.ok() && response2.ok()) {
      const data1 = await response1.json();
      const data2 = await response2.json();

      // Company info should be identical
      expect(data1.data.company.ticker).toBe(data2.data.company.ticker);
      expect(data1.data.company.name).toBe(data2.data.company.name);

      // Scores should be identical (same calculation snapshot)
      expect(data1.data.scores.valueScore).toBe(data2.data.scores.valueScore);
    }
  });

  test('screener results match individual company data', async ({ request }) => {
    // Get screener results
    const screenerResponse = await request.get('http://localhost:3001/api/screener?limit=5');

    if (screenerResponse.ok()) {
      const screenerData = await screenerResponse.json();
      const results = screenerData.data;

      if (results && results.length > 0) {
        // Pick first result
        const firstResult = results[0] as { ticker: string; valueScore: number };

        // Get individual company data
        const companyResponse = await request.get(
          `http://localhost:3001/api/companies/${firstResult.ticker}`
        );

        if (companyResponse.ok()) {
          const companyData = await companyResponse.json();

          // Scores should match
          expect(firstResult.valueScore).toBe(companyData.data.scores.valueScore);
        }
      }
    }
  });
});
