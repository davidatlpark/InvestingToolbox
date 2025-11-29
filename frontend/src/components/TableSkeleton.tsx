/**
 * TableSkeleton Component
 *
 * Provides a skeleton loading state that matches the table layout.
 * This gives users a visual indication of what content will appear,
 * which feels faster than a generic spinner.
 *
 * WHY skeleton loaders?
 * - They indicate the shape of upcoming content
 * - Perceived performance is better than spinners
 * - Users feel more in control when they can see the layout
 */

import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

interface TableSkeletonProps {
  /** Number of rows to display (default: 10) */
  rows?: number;
  /** Column widths as percentages or pixel values */
  columns: (number | string)[];
  /** Whether the first column should look like a header cell */
  hasHeaderColumn?: boolean;
}

/**
 * Skeleton loader for tabular data
 *
 * @example
 * // Screener table with 8 columns
 * <TableSkeleton
 *   rows={10}
 *   columns={[80, 200, 100, 60, 60, 60, 80, 60]}
 * />
 */
export function TableSkeleton({
  rows = 10,
  columns,
  hasHeaderColumn = true,
}: TableSkeletonProps) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((width, index) => (
              <TableCell key={index}>
                <Skeleton
                  variant="text"
                  width={typeof width === 'number' ? width * 0.6 : '60%'}
                  height={24}
                />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((width, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton
                    variant={colIndex === 0 && hasHeaderColumn ? 'rectangular' : 'text'}
                    width={width}
                    height={colIndex === 0 && hasHeaderColumn ? 28 : 20}
                    sx={{
                      borderRadius: colIndex === 0 && hasHeaderColumn ? 1 : 0,
                    }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * Predefined skeleton for the stock screener table
 */
export function ScreenerTableSkeleton() {
  return (
    <TableSkeleton
      rows={10}
      columns={[80, 180, 100, 50, 50, 50, 70, 50]}
      hasHeaderColumn
    />
  );
}

/**
 * Predefined skeleton for the watchlist table
 */
export function WatchlistTableSkeleton() {
  return (
    <TableSkeleton
      rows={5}
      columns={[80, 160, 80, 80, 80, 60, 60]}
      hasHeaderColumn
    />
  );
}

/**
 * Predefined skeleton for financial statements table
 */
export function FinancialsTableSkeleton() {
  return (
    <TableSkeleton
      rows={4}
      columns={[120, 80, 80, 80, 80, 80, 80, 80, 80, 80]}
      hasHeaderColumn
    />
  );
}

export default TableSkeleton;
