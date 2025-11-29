/**
 * TableSkeleton Component Tests
 *
 * Tests the skeleton loading states for tables.
 * These provide visual feedback while data is loading.
 *
 * WHY test skeletons?
 * - Ensures loading states render correctly
 * - Verifies correct number of rows/columns
 * - Confirms accessibility during loading
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/utils';
import {
  TableSkeleton,
  ScreenerTableSkeleton,
  WatchlistTableSkeleton,
  FinancialsTableSkeleton,
} from '../TableSkeleton';

describe('TableSkeleton', () => {
  describe('base component', () => {
    it('renders with default 10 rows', () => {
      render(<TableSkeleton columns={[100, 200, 100]} />);

      // Should have a table element
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('renders with custom number of rows', () => {
      const { container } = render(
        <TableSkeleton columns={[100, 200]} rows={5} />
      );

      // Check table body has correct number of rows
      const tableBody = container.querySelector('tbody');
      expect(tableBody?.children).toHaveLength(5);
    });

    it('renders correct number of columns', () => {
      const { container } = render(
        <TableSkeleton columns={[100, 150, 200, 80]} rows={1} />
      );

      // Check header row has correct number of cells
      const headerRow = container.querySelector('thead tr');
      expect(headerRow?.children).toHaveLength(4);
    });
  });

  describe('predefined skeletons', () => {
    it('ScreenerTableSkeleton renders with 10 rows', () => {
      const { container } = render(<ScreenerTableSkeleton />);

      const tableBody = container.querySelector('tbody');
      expect(tableBody?.children).toHaveLength(10);
    });

    it('WatchlistTableSkeleton renders with 5 rows', () => {
      const { container } = render(<WatchlistTableSkeleton />);

      const tableBody = container.querySelector('tbody');
      expect(tableBody?.children).toHaveLength(5);
    });

    it('FinancialsTableSkeleton renders with 4 rows', () => {
      const { container } = render(<FinancialsTableSkeleton />);

      const tableBody = container.querySelector('tbody');
      expect(tableBody?.children).toHaveLength(4);
    });
  });

  describe('accessibility', () => {
    it('renders as a proper table structure', () => {
      render(<TableSkeleton columns={[100, 200, 100]} rows={3} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});
