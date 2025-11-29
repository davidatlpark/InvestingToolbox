/**
 * BigFiveChart Component Tests
 *
 * Tests the Big Five metrics bar chart that displays:
 * - ROIC, EPS Growth, Revenue Growth, Equity Growth, FCF Growth
 * - 1-year, 5-year, and 10-year values for each metric
 *
 * WHY test charts?
 * - Ensure data is correctly transformed for display
 * - Verify chart renders without errors
 *
 * NOTE: Recharts ResponsiveContainer doesn't render chart content
 * in jsdom because it requires layout dimensions. We test that
 * the component renders without crashing with various data shapes.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/utils';
import { BigFiveChart } from '../BigFiveChart';
import { mockFactories } from '../../test/utils';

describe('BigFiveChart', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      const data = mockFactories.bigFiveData();
      const { container } = render(<BigFiveChart data={data} />);

      // Should render the responsive container
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });

    it('renders container with correct class', () => {
      const data = mockFactories.bigFiveData();
      const { container } = render(<BigFiveChart data={data} />);

      // Verify the container structure exists
      expect(container.querySelector('.MuiBox-root')).toBeInTheDocument();
    });
  });

  describe('with null values', () => {
    it('handles null values gracefully', () => {
      const dataWithNulls = {
        roic: { year1: null, year5: 10.5, year10: 12.0 },
        epsGrowth: { year1: 5.0, year5: null, year10: 8.0 },
        revenueGrowth: { year1: 3.0, year5: 4.0, year10: null },
        equityGrowth: { year1: null, year5: null, year10: null },
        fcfGrowth: { year1: 15.0, year5: 12.0, year10: 10.0 },
      };

      // Should not throw when rendering with null values
      expect(() => render(<BigFiveChart data={dataWithNulls} />)).not.toThrow();
    });

    it('renders all null data without crashing', () => {
      const allNullData = {
        roic: { year1: null, year5: null, year10: null },
        epsGrowth: { year1: null, year5: null, year10: null },
        revenueGrowth: { year1: null, year5: null, year10: null },
        equityGrowth: { year1: null, year5: null, year10: null },
        fcfGrowth: { year1: null, year5: null, year10: null },
      };

      const { container } = render(<BigFiveChart data={allNullData} />);
      // Should still render the container structure
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });
  });

  describe('with negative values', () => {
    it('handles negative values correctly', () => {
      const dataWithNegatives = {
        roic: { year1: -5.0, year5: -2.0, year10: 3.0 },
        epsGrowth: { year1: -10.0, year5: 5.0, year10: 8.0 },
        revenueGrowth: { year1: 2.0, year5: -3.0, year10: 5.0 },
        equityGrowth: { year1: -15.0, year5: -8.0, year10: -2.0 },
        fcfGrowth: { year1: 20.0, year5: 15.0, year10: 12.0 },
      };

      // Should render without errors
      expect(() => render(<BigFiveChart data={dataWithNegatives} />)).not.toThrow();
    });
  });

  describe('with extreme values', () => {
    it('handles very large positive values', () => {
      const extremeData = mockFactories.bigFiveData({
        roic: { year1: 100.0, year5: 150.0, year10: 200.0 },
      });

      expect(() => render(<BigFiveChart data={extremeData} />)).not.toThrow();
    });

    it('handles very large negative values', () => {
      const extremeData = mockFactories.bigFiveData({
        equityGrowth: { year1: -50.0, year5: -75.0, year10: -100.0 },
      });

      expect(() => render(<BigFiveChart data={extremeData} />)).not.toThrow();
    });
  });
});
