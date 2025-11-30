/**
 * Home Page E2E Tests
 *
 * Tests the landing page functionality including:
 * - Page loads correctly with all key elements
 * - Search functionality works
 * - Navigation links are present
 *
 * WHY these tests?
 * - Home page is the entry point for most users
 * - Search is a critical feature
 * - Ensures basic app functionality works
 */

import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays the app title and tagline', async ({ page }) => {
    // Check for the main title
    await expect(page.getByRole('heading', { name: /value investing toolbox/i })).toBeVisible();

    // Check for the tagline/description
    await expect(page.getByText(/find wonderful companies/i)).toBeVisible();
  });

  test('has a stock search input', async ({ page }) => {
    // Look for the search input
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test('has navigation links in header', async ({ page }) => {
    // Check for navigation elements
    await expect(page.getByRole('link', { name: /screener/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /watchlist/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /compare/i })).toBeVisible();
  });

  test('search navigates to analysis page when ticker is entered', async ({ page }) => {
    // Type a ticker into search
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('AAPL');

    // Press Enter or click search button
    await searchInput.press('Enter');

    // Should navigate to analysis page
    // Note: This depends on backend being available
    await expect(page).toHaveURL(/\/analysis\/AAPL/i, { timeout: 10000 });
  });

  test('clicking navigation links works', async ({ page }) => {
    // Click Screener link
    await page.getByRole('link', { name: /screener/i }).click();
    await expect(page).toHaveURL(/\/screener/);

    // Go back to home
    await page.goto('/');

    // Click Watchlist link
    await page.getByRole('link', { name: /watchlist/i }).click();
    await expect(page).toHaveURL(/\/watchlist/);
  });

  test('displays quick action cards or buttons', async ({ page }) => {
    // Check for action buttons/cards that direct users
    // These might be "Start Screening", "View Watchlist", etc.
    const actionElements = page.locator('[data-testid="action-card"], button, a').filter({
      hasText: /screen|watchlist|calculator|compare/i
    });

    // Should have at least one call-to-action
    await expect(actionElements.first()).toBeVisible();
  });
});

test.describe('Home Page - Responsive', () => {
  test('mobile menu is accessible on small screens', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // On mobile, navigation might be in a hamburger menu
    // or the main nav links should still be accessible
    const mobileMenuButton = page.getByRole('button', { name: /menu/i });
    const navLink = page.getByRole('link', { name: /screener/i });

    // Either mobile menu or direct nav link should be present
    const hasMobileMenu = await mobileMenuButton.isVisible().catch(() => false);
    const hasNavLink = await navLink.isVisible().catch(() => false);

    expect(hasMobileMenu || hasNavLink).toBeTruthy();
  });
});
