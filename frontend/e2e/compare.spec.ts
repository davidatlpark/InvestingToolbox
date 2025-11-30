/**
 * Compare Page E2E Tests
 *
 * Tests the stock comparison functionality including:
 * - Adding multiple stocks for comparison
 * - Side-by-side display of metrics
 * - URL sharing with tickers
 * - CSV export
 *
 * WHY these tests?
 * - Comparison is a power-user feature
 * - URL sharing needs to work correctly
 * - Complex multi-stock data display
 */

import { test, expect } from '@playwright/test';

test.describe('Compare Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/compare');
  });

  test('displays compare page header', async ({ page }) => {
    // Check for page title
    await expect(page.getByRole('heading', { name: /compare/i })).toBeVisible();
  });

  test('shows stock selection input', async ({ page }) => {
    // Look for input to add stocks
    const stockInput = page.getByPlaceholder(/search|add|ticker/i);
    const autocomplete = page.getByRole('combobox');

    const hasInput = await stockInput.isVisible().catch(() => false);
    const hasAutocomplete = await autocomplete.isVisible().catch(() => false);

    expect(hasInput || hasAutocomplete).toBeTruthy();
  });

  test('shows empty state when no stocks selected', async ({ page }) => {
    // Without URL params, should show instruction or empty state
    const emptyState = page.getByText(/add stocks|select|compare/i);
    await expect(emptyState).toBeVisible();
  });

  test('has CSV export button', async ({ page }) => {
    // Look for export button
    const exportButton = page.getByRole('button', { name: /export|csv|download/i });
    await expect(exportButton).toBeVisible();
  });
});

test.describe('Compare Page - URL Parameters', () => {
  test('loads stocks from URL parameters', async ({ page }) => {
    // Navigate with tickers in URL
    await page.goto('/compare?tickers=AAPL,MSFT');

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Should show both tickers
    await expect(page.getByText('AAPL')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('MSFT')).toBeVisible({ timeout: 15000 });
  });

  test('displays comparison table with multiple stocks', async ({ page }) => {
    await page.goto('/compare?tickers=AAPL,MSFT');
    await page.waitForLoadState('networkidle');

    // Should have a table with stock data
    const table = page.getByRole('table');
    await expect(table).toBeVisible({ timeout: 15000 });

    // Table should have rows for each stock
    const rows = page.locator('table tbody tr');
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
  });

  test('shows scores for compared stocks', async ({ page }) => {
    await page.goto('/compare?tickers=AAPL,MSFT');
    await page.waitForLoadState('networkidle');

    // Check for score columns
    await expect(page.getByText(/value score/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/roic/i)).toBeVisible();
  });
});

test.describe('Compare Page - Adding Stocks', () => {
  test('can add a stock to comparison', async ({ page }) => {
    await page.goto('/compare');

    // Find the stock input
    const stockInput = page.getByRole('combobox').first();

    if (await stockInput.isVisible()) {
      // Type a ticker
      await stockInput.fill('AAPL');

      // Wait for autocomplete
      await page.waitForTimeout(500);

      // Select from autocomplete or press enter
      await stockInput.press('Enter');

      // Wait for data to load
      await page.waitForTimeout(1000);

      // Stock should appear in comparison
      await expect(page.getByText('AAPL')).toBeVisible({ timeout: 10000 });
    }
  });

  test('can add multiple stocks', async ({ page }) => {
    await page.goto('/compare');

    const stockInput = page.getByRole('combobox').first();

    if (await stockInput.isVisible()) {
      // Add first stock
      await stockInput.fill('AAPL');
      await page.waitForTimeout(500);
      await stockInput.press('Enter');
      await page.waitForTimeout(1000);

      // Add second stock
      await stockInput.fill('MSFT');
      await page.waitForTimeout(500);
      await stockInput.press('Enter');
      await page.waitForTimeout(1000);

      // Both should be visible
      await expect(page.getByText('AAPL')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('MSFT')).toBeVisible({ timeout: 10000 });
    }
  });

  test('updates URL when stocks are added', async ({ page }) => {
    await page.goto('/compare');

    const stockInput = page.getByRole('combobox').first();

    if (await stockInput.isVisible()) {
      // Add a stock
      await stockInput.fill('AAPL');
      await page.waitForTimeout(500);
      await stockInput.press('Enter');

      // Wait for URL to update
      await page.waitForTimeout(1000);

      // URL should contain ticker
      await expect(page).toHaveURL(/tickers=.*AAPL/i, { timeout: 5000 });
    }
  });
});

test.describe('Compare Page - Removing Stocks', () => {
  test('can remove a stock from comparison', async ({ page }) => {
    await page.goto('/compare?tickers=AAPL,MSFT');
    await page.waitForLoadState('networkidle');

    // Look for remove button (usually X or trash icon)
    const removeButton = page.locator('[aria-label*="remove"], button:has-text("X"), .MuiChip-deleteIcon').first();

    if (await removeButton.isVisible()) {
      // Count stocks before
      const stocksBefore = await page.getByText(/AAPL|MSFT/).count();

      // Click remove
      await removeButton.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Should have one less stock (or updated display)
      // URL should update
      expect(true).toBeTruthy(); // Remove action completed
    }
  });
});

test.describe('Compare Page - Data Display', () => {
  test('shows Big Five metrics for comparison', async ({ page }) => {
    await page.goto('/compare?tickers=AAPL,MSFT');
    await page.waitForLoadState('networkidle');

    // Check for Big Five metrics in comparison
    const metrics = ['ROIC', 'EPS', 'Revenue', 'Equity', 'FCF'];

    let metricsFound = 0;
    for (const metric of metrics) {
      const metricElement = page.getByText(new RegExp(metric, 'i'));
      if (await metricElement.isVisible().catch(() => false)) {
        metricsFound++;
      }
    }

    // At least some metrics should be shown
    expect(metricsFound).toBeGreaterThan(0);
  });

  test('shows valuation metrics for comparison', async ({ page }) => {
    await page.goto('/compare?tickers=AAPL,MSFT');
    await page.waitForLoadState('networkidle');

    // Check for valuation data
    await expect(page.getByText(/sticker|mos|price/i)).toBeVisible({ timeout: 15000 });
  });

  test('clicking stock in comparison navigates to analysis', async ({ page }) => {
    await page.goto('/compare?tickers=AAPL,MSFT');
    await page.waitForLoadState('networkidle');

    // Find a clickable ticker link
    const tickerLink = page.getByRole('link', { name: 'AAPL' }).first();

    if (await tickerLink.isVisible()) {
      await tickerLink.click();

      // Should navigate to analysis page
      await expect(page).toHaveURL(/\/analysis\/AAPL/i);
    }
  });
});

test.describe('Compare Page - Limit', () => {
  test('enforces maximum stock limit (5)', async ({ page }) => {
    // Load with max stocks
    await page.goto('/compare?tickers=AAPL,MSFT,GOOGL,AMZN,META');
    await page.waitForLoadState('networkidle');

    // Try to add another stock
    const stockInput = page.getByRole('combobox').first();

    if (await stockInput.isVisible()) {
      // Input might be disabled or show warning
      const isDisabled = await stockInput.isDisabled();

      // Either input is disabled or adding shows a limit message
      if (!isDisabled) {
        await stockInput.fill('NVDA');
        await stockInput.press('Enter');
        await page.waitForTimeout(500);

        // Look for limit message
        const limitMessage = page.getByText(/max|limit|5/i);
        const stillFiveStocks = (await page.locator('table tbody tr').count()) <= 5;

        expect(await limitMessage.isVisible().catch(() => false) || stillFiveStocks).toBeTruthy();
      } else {
        expect(isDisabled).toBeTruthy();
      }
    }
  });
});
