/**
 * Test Utilities
 *
 * Provides helper functions and wrapper components for testing.
 *
 * WHY custom render?
 * - Wraps components with required providers (QueryClient, Theme, Router)
 * - Simplifies test setup
 * - Ensures consistent test environment
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Create a fresh QueryClient for each test
// WHY fresh client? Prevents state leakage between tests
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        gcTime: 0, // Disable garbage collection
      },
    },
  });
}

// Basic theme for testing
const testTheme = createTheme();

// All providers wrapper
interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={testTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with all providers
 *
 * Usage:
 * ```tsx
 * import { render, screen } from '../test/utils';
 *
 * test('renders component', () => {
 *   render(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Override render with custom render
export { customRender as render };

/**
 * Mock data factories for testing
 *
 * WHY factories?
 * - Consistent test data
 * - Easy to create variations
 * - Single source of truth for mock structures
 */
export const mockFactories = {
  companyAnalysis: (overrides = {}) => ({
    company: {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      description: 'Apple designs and sells consumer electronics.',
      marketCap: 3000000000000,
      currentPrice: 175.5,
    },
    scores: {
      valueScore: 85,
      roicScore: 90,
      moatScore: 88,
      debtScore: 75,
      managementScore: 82,
      isPredictable: true,
    },
    bigFive: {
      roic: { year1: 45.2, year5: 42.1, year10: 38.5 },
      epsGrowth: { year1: 12.5, year5: 15.2, year10: 18.3 },
      revenueGrowth: { year1: 8.2, year5: 11.5, year10: 14.2 },
      equityGrowth: { year1: 5.5, year5: 8.2, year10: 10.1 },
      fcfGrowth: { year1: 15.2, year5: 18.5, year10: 20.1 },
    },
    valuation: {
      stickerPrice: 250.0,
      mosPrice: 125.0,
      paybackTime: 6.5,
      currentPrice: 175.5,
      upside: -28.8,
    },
    meta: {
      lastUpdated: new Date().toISOString(),
      yearsOfData: 10,
    },
    ...overrides,
  }),

  bigFiveData: (overrides = {}) => ({
    roic: { year1: 15.2, year5: 14.5, year10: 12.8 },
    epsGrowth: { year1: 12.5, year5: 11.2, year10: 10.5 },
    revenueGrowth: { year1: 8.2, year5: 9.5, year10: 10.2 },
    equityGrowth: { year1: 5.5, year5: 6.2, year10: 7.1 },
    fcfGrowth: { year1: 18.5, year5: 15.2, year10: 12.5 },
    ...overrides,
  }),

  watchlistItem: (overrides = {}) => ({
    id: 'watch-1',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    targetPrice: 150.0,
    notes: 'Great company',
    currentPrice: 175.5,
    change: 2.5,
    changePercent: 1.45,
    valueScore: 85,
    mosPrice: 125.0,
    percentToTarget: 14.5,
    addedAt: new Date().toISOString(),
    ...overrides,
  }),

  screenerResult: (overrides = {}) => ({
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    marketCap: 3000000000000,
    valueScore: 85,
    roicScore: 90,
    moatScore: 88,
    debtScore: 75,
    stickerPrice: 250.0,
    mosPrice: 125.0,
    paybackTime: 6.5,
    currentPrice: 175.5,
    ...overrides,
  }),

  /**
   * Mock price history data for chart testing
   *
   * Returns an array of historical price points with realistic data.
   */
  priceHistoryResponse: (overrides = {}) => ({
    ticker: 'AAPL',
    range: '1Y' as const,
    prices: [
      { date: '2024-01-02', open: 150.0, high: 152.0, low: 149.0, close: 151.0, volume: 50000000, adjClose: 151.0 },
      { date: '2024-03-15', open: 165.0, high: 168.0, low: 164.0, close: 167.0, volume: 48000000, adjClose: 167.0 },
      { date: '2024-06-01', open: 175.0, high: 178.0, low: 174.0, close: 176.0, volume: 45000000, adjClose: 176.0 },
      { date: '2024-09-15', open: 185.0, high: 188.0, low: 184.0, close: 186.0, volume: 52000000, adjClose: 186.0 },
      { date: '2024-12-20', open: 195.0, high: 198.0, low: 194.0, close: 196.0, volume: 55000000, adjClose: 196.0 },
    ],
    fetchedAt: new Date().toISOString(),
    ...overrides,
  }),
};
