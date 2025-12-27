import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { quotesApi, type PriceRange } from '../lib/api';

/**
 * PriceHistoryChart Component
 *
 * Displays historical stock price data as a line chart with volume bars.
 *
 * WHY show price history?
 * - Helps visualize price trends over different time periods
 * - Volume shows trading activity and conviction behind price moves
 * - Complements fundamental analysis with technical context
 *
 * DESIGN DECISIONS:
 * - Line chart (not candlestick) - simpler, matches app's clean aesthetic
 * - Dual Y-axes - price (left) and volume (right) have different scales
 * - Toggle buttons - consistent with ScoreHistoryChart pattern
 * - 5-minute staleTime - prices change infrequently, reduces API calls
 */

interface PriceHistoryChartProps {
  ticker: string;
}

/**
 * Format large volume numbers for readability
 *
 * WHY abbreviate?
 * - Raw numbers like 45,234,567 are hard to read quickly
 * - "45.2M" is immediately understandable
 */
function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

/**
 * Format date based on selected range
 *
 * WHY different formats?
 * - Shorter ranges (1M, 6M) need day precision: "Jan 15"
 * - Longer ranges (1Y, 5Y) need year context: "Jan '24"
 */
function formatDate(dateString: string, range: PriceRange): string {
  const date = parseISO(dateString);
  switch (range) {
    case '1M':
    case '6M':
      return format(date, 'MMM d');
    case '1Y':
    case '5Y':
      return format(date, "MMM ''yy");
  }
}

export function PriceHistoryChart({ ticker }: PriceHistoryChartProps) {
  // Track selected time range - default to 1 year
  const [range, setRange] = useState<PriceRange>('1Y');

  // Fetch price history data with React Query
  // queryKey includes range so each range is cached separately
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['priceHistory', ticker, range],
    queryFn: () => quotesApi.getPriceHistory(ticker, range),
    staleTime: 5 * 60 * 1000, // 5 minutes - prices update once per day
  });

  // Handle range toggle change
  const handleRangeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newRange: PriceRange | null
  ) => {
    // Only update if a valid range is selected (prevents deselection)
    if (newRange) setRange(newRange);
  };

  // Loading state - show spinner inside card
  if (isLoading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  // Error state - show error message
  if (isError) {
    return (
      <Alert severity="error">
        Failed to load price history: {(error as Error).message}
      </Alert>
    );
  }

  // Empty state - no data available
  if (!data || data.prices.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            No price history available for {ticker}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Transform data for Recharts
  // Add formatted date for X-axis labels
  const chartData = data.prices.map((point) => ({
    date: point.date,
    formattedDate: formatDate(point.date, range),
    price: point.close, // Use closing price for line chart
    volume: point.volume,
  }));

  // Calculate price range for Y-axis domain
  // Add 5% padding so the line doesn't touch the edges
  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices) * 0.95;
  const maxPrice = Math.max(...prices) * 1.05;

  // Calculate price change for summary
  const firstPrice = chartData[0].price;
  const lastPrice = chartData[chartData.length - 1].price;
  const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

  return (
    <Card>
      <CardContent>
        {/* Header with title and range toggle */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            // Stack vertically on mobile
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Typography variant="h6">Price History</Typography>
          <ToggleButtonGroup
            value={range}
            exclusive
            onChange={handleRangeChange}
            size="small"
            aria-label="time range"
          >
            <ToggleButton value="1M">1M</ToggleButton>
            <ToggleButton value="6M">6M</ToggleButton>
            <ToggleButton value="1Y">1Y</ToggleButton>
            <ToggleButton value="5Y">5Y</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Chart container */}
        <Box sx={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 60, left: 10, bottom: 0 }}
            >
              {/* Grid lines for readability */}
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

              {/* X-axis - dates */}
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 11 }}
                tickLine={false}
                interval="preserveStartEnd"
              />

              {/* Left Y-axis for price */}
              <YAxis
                yAxisId="price"
                orientation="left"
                domain={[minPrice, maxPrice]}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />

              {/* Right Y-axis for volume */}
              <YAxis
                yAxisId="volume"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickFormatter={formatVolume}
              />

              {/* Custom tooltip */}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'Price') return [`$${value.toFixed(2)}`, name];
                  return [formatVolume(value), 'Volume'];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />

              <Legend />

              {/* Volume bars - rendered first so they appear behind price line */}
              <Bar
                yAxisId="volume"
                dataKey="volume"
                name="Volume"
                fill="#90caf9"
                opacity={0.5}
              />

              {/* Price line - main focus of the chart */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                name="Price"
                stroke="#1976d2"
                strokeWidth={2}
                dot={false} // Disable dots for performance with many data points
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>

        {/* Summary stats - shows price change over selected period */}
        {chartData.length >= 2 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography
              variant="body2"
              sx={{
                color: priceChange >= 0 ? 'success.main' : 'error.main',
              }}
            >
              {range} Change: {priceChange >= 0 ? '+' : ''}
              {priceChange.toFixed(2)}% (${firstPrice.toFixed(2)} → $
              {lastPrice.toFixed(2)})
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default PriceHistoryChart;
