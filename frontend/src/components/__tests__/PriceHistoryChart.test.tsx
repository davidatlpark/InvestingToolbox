/**
 * PriceHistoryChart Component Tests
 *
 * Tests the price history chart that displays:
 * - Historical stock prices as a line chart
 * - Trading volume as a bar chart
 * - Toggle buttons for different time ranges (1M, 6M, 1Y, 5Y)
 *
 * WHY test charts?
 * - Ensure loading/error states render correctly
 * - Verify toggle buttons work as expected
 * - Check that chart container renders without errors
 *
 * NOTE: Recharts ResponsiveContainer doesn't fully render in jsdom
 * because it requires layout dimensions. We focus on testing
 * component states and interactions rather than chart internals.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils';
import { PriceHistoryChart } from '../PriceHistoryChart';

// Mock the API module
vi.mock('../../lib/api', () => ({
  quotesApi: {
    getPriceHistory: vi.fn(),
  },
}));

// Import the mocked module to control its behavior
import { quotesApi } from '../../lib/api';

// Mock price history data
const mockPriceHistory = {
  ticker: 'AAPL',
  range: '1Y' as const,
  prices: [
    { date: '2024-01-02', open: 150.0, high: 152.0, low: 149.0, close: 151.0, volume: 50000000, adjClose: 151.0 },
    { date: '2024-06-15', open: 175.0, high: 178.0, low: 174.0, close: 176.0, volume: 45000000, adjClose: 176.0 },
    { date: '2024-12-20', open: 195.0, high: 198.0, low: 194.0, close: 196.0, volume: 55000000, adjClose: 196.0 },
  ],
  fetchedAt: '2024-12-26T12:00:00Z',
};

describe('PriceHistoryChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading spinner while fetching data', () => {
      // Make the API hang indefinitely
      vi.mocked(quotesApi.getPriceHistory).mockImplementation(
        () => new Promise(() => {})
      );

      render(<PriceHistoryChart ticker="AAPL" />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when API fails', async () => {
      // Make the API reject
      vi.mocked(quotesApi.getPriceHistory).mockRejectedValue(
        new Error('Failed to fetch price history')
      );

      render(<PriceHistoryChart ticker="AAPL" />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load price history/i)).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('shows message when no data is available', async () => {
      // Return empty prices array
      vi.mocked(quotesApi.getPriceHistory).mockResolvedValue({
        ...mockPriceHistory,
        prices: [],
      });

      render(<PriceHistoryChart ticker="AAPL" />);

      await waitFor(() => {
        expect(screen.getByText(/No price history available for AAPL/i)).toBeInTheDocument();
      });
    });
  });

  describe('successful render', () => {
    beforeEach(() => {
      vi.mocked(quotesApi.getPriceHistory).mockResolvedValue(mockPriceHistory);
    });

    it('renders chart title', async () => {
      render(<PriceHistoryChart ticker="AAPL" />);

      await waitFor(() => {
        expect(screen.getByText('Price History')).toBeInTheDocument();
      });
    });

    it('renders all time range toggle buttons', async () => {
      render(<PriceHistoryChart ticker="AAPL" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '1M' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '6M' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '1Y' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '5Y' })).toBeInTheDocument();
      });
    });

    it('defaults to 1Y range selected', async () => {
      render(<PriceHistoryChart ticker="AAPL" />);

      await waitFor(() => {
        const yearButton = screen.getByRole('button', { name: '1Y' });
        // MUI ToggleButton adds aria-pressed when selected
        expect(yearButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('renders the chart container', async () => {
      const { container } = render(<PriceHistoryChart ticker="AAPL" />);

      await waitFor(() => {
        expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
      });
    });

    it('renders price change summary', async () => {
      render(<PriceHistoryChart ticker="AAPL" />);

      await waitFor(() => {
        // Should show the percentage change (from 151 to 196)
        // ((196 - 151) / 151) * 100 = 29.80%
        expect(screen.getByText(/1Y Change:/i)).toBeInTheDocument();
      });
    });
  });

  describe('toggle functionality', () => {
    beforeEach(() => {
      vi.mocked(quotesApi.getPriceHistory).mockResolvedValue(mockPriceHistory);
    });

    it('calls API with correct range when toggle is clicked', async () => {
      render(<PriceHistoryChart ticker="AAPL" />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('Price History')).toBeInTheDocument();
      });

      // Click 6M button - using fireEvent since userEvent isn't available in render result
      const sixMonthButton = screen.getByRole('button', { name: '6M' });
      sixMonthButton.click();

      // Verify API was called with '6M' range
      await waitFor(() => {
        expect(quotesApi.getPriceHistory).toHaveBeenCalledWith('AAPL', '6M');
      });
    });
  });

  describe('with different tickers', () => {
    it('fetches data for the provided ticker', async () => {
      vi.mocked(quotesApi.getPriceHistory).mockResolvedValue({
        ...mockPriceHistory,
        ticker: 'MSFT',
      });

      render(<PriceHistoryChart ticker="MSFT" />);

      await waitFor(() => {
        expect(quotesApi.getPriceHistory).toHaveBeenCalledWith('MSFT', '1Y');
      });
    });
  });
});
