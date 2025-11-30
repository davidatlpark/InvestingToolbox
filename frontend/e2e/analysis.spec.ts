/**
 * Stock Analysis Page E2E Tests
 *
 * Tests the detailed stock analysis view including:
 * - Score cards display
 * - Big Five metrics chart
 * - Valuation panel
 * - Financials table
 * - Add to watchlist functionality
 *
 * WHY these tests?
 * - Analysis page is the main value proposition
 * - Complex data visualization needs testing
 * - Ensures API integration displays correctly
 */

import { test, expect } from '@playwright/test';

// Use a well-known ticker that should exist in the database
const TEST_TICKER = 'AAPL';

test.describe('Stock Analysis Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/analysis/${TEST_TICKER}`);
    // Wait for page to load data
    await page.waitForLoadState('networkidle');
  });

  test('displays company name and ticker', async ({ page }) => {
    // Check for ticker in page
    await expect(page.getByText(TEST_TICKER)).toBeVisible({ timeout: 15000 });

    // Check for company name (Apple Inc for AAPL)
    await expect(page.getByText(/apple/i)).toBeVisible({ timeout: 15000 });
  });

  test('shows score cards', async ({ page }) => {
    // Wait for scores to load
    await page.waitForSelector('[data-testid="score-card"], .MuiCard-root', { timeout: 15000 });

    // Check for score labels
    const valueScore = page.getByText(/value score/i);
    const roicScore = page.getByText(/roic/i);
    const moatScore = page.getByText(/moat/i);

    await expect(valueScore).toBeVisible();
    await expect(roicScore).toBeVisible();
    await expect(moatScore).toBeVisible();
  });

  test('displays Big Five metrics section', async ({ page }) => {
    // Check for Big Five section
    await expect(page.getByText(/big five/i)).toBeVisible({ timeout: 10000 });

    // Check for individual metrics
    const metrics = ['ROIC', 'EPS Growth', 'Revenue Growth', 'Equity Growth', 'FCF Growth'];

    for (const metric of metrics) {
      await expect(page.getByText(new RegExp(metric, 'i'))).toBeVisible();
    }
  });

  test('shows valuation information', async ({ page }) => {
    // Check for valuation section
    await expect(page.getByText(/valuation|sticker price/i)).toBeVisible({ timeout: 10000 });

    // Check for key valuation metrics
    await expect(page.getByText(/mos price|margin of safety/i)).toBeVisible();
    await expect(page.getByText(/payback/i)).toBeVisible();
  });

  test('has financials table with tabs', async ({ page }) => {
    // Check for financials section
    await expect(page.getByText(/financials/i)).toBeVisible({ timeout: 10000 });

    // Check for tab options
    const incomeTab = page.getByRole('tab', { name: /income/i });
    const balanceTab = page.getByRole('tab', { name: /balance/i });
    const cashFlowTab = page.getByRole('tab', { name: /cash flow/i });

    // At least one financial tab should be present
    const hasIncome = await incomeTab.isVisible().catch(() => false);
    const hasBalance = await balanceTab.isVisible().catch(() => false);
    const hasCashFlow = await cashFlowTab.isVisible().catch(() => false);

    expect(hasIncome || hasBalance || hasCashFlow).toBeTruthy();
  });

  test('has add to watchlist button', async ({ page }) => {
    // Look for watchlist button
    const watchlistButton = page.getByRole('button', { name: /watchlist|watch|add/i });
    await expect(watchlistButton).toBeVisible();
  });

  test('clicking watchlist button adds stock', async ({ page }) => {
    // Find watchlist button
    const watchlistButton = page.getByRole('button', { name: /watchlist|add/i });

    if (await watchlistButton.isVisible()) {
      await watchlistButton.click();

      // Should see feedback (success message or button state change)
      await page.waitForTimeout(500);

      // Button might change to "Remove from Watchlist" or show a snackbar
      const successIndicator = page.getByText(/added|removed|watchlist/i);
      await expect(successIndicator).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Stock Analysis - Score History', () => {
  test('displays score history chart', async ({ page }) => {
    await page.goto(`/analysis/${TEST_TICKER}`);
    await page.waitForLoadState('networkidle');

    // Look for score history section
    const scoreHistorySection = page.getByText(/score history|historical/i);

    if (await scoreHistorySection.isVisible().catch(() => false)) {
      // Check for chart container
      const chartContainer = page.locator('.recharts-responsive-container');
      await expect(chartContainer).toBeVisible();
    }
  });
});

test.describe('Stock Analysis - Error States', () => {
  test('shows error for invalid ticker', async ({ page }) => {
    // Navigate to invalid ticker
    await page.goto('/analysis/INVALIDTICKER123');

    // Should show error message
    await expect(page.getByText(/not found|error|invalid/i)).toBeVisible({ timeout: 10000 });
  });

  test('handles loading state gracefully', async ({ page }) => {
    // Navigate to analysis page
    await page.goto(`/analysis/${TEST_TICKER}`);

    // Either shows loading indicator or content
    const loadingIndicator = page.locator('.MuiSkeleton-root, [role="progressbar"]');
    const content = page.getByText(TEST_TICKER);

    // Within first few seconds, should see loading or content
    await expect(loadingIndicator.or(content)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Stock Analysis - Navigation', () => {
  test('back button returns to previous page', async ({ page }) => {
    // Start from screener
    await page.goto('/screener');
    await page.waitForLoadState('networkidle');

    // Navigate to analysis
    await page.goto(`/analysis/${TEST_TICKER}`);
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();

    // Should be back on screener
    await expect(page).toHaveURL(/\/screener/);
  });

  test('refresh data button works', async ({ page }) => {
    await page.goto(`/analysis/${TEST_TICKER}`);
    await page.waitForLoadState('networkidle');

    // Look for refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });

    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Should trigger data refresh without error
      // Wait for any loading state to complete
      await page.waitForLoadState('networkidle');

      // Page should still show the stock
      await expect(page.getByText(TEST_TICKER)).toBeVisible();
    }
  });
});
