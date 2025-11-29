import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';

// Type for the BigFive metrics data
interface BigFiveData {
  roic: { year1: number | null; year5: number | null; year10: number | null };
  epsGrowth: { year1: number | null; year5: number | null; year10: number | null };
  revenueGrowth: { year1: number | null; year5: number | null; year10: number | null };
  equityGrowth: { year1: number | null; year5: number | null; year10: number | null };
  fcfGrowth: { year1: number | null; year5: number | null; year10: number | null };
}

interface BigFiveChartProps {
  data: BigFiveData;
}

// Transform BigFive data into chart-friendly format
function transformData(bigFive: BigFiveData) {
  return [
    {
      name: 'ROIC',
      '1 Year': bigFive.roic.year1,
      '5 Year': bigFive.roic.year5,
      '10 Year': bigFive.roic.year10,
    },
    {
      name: 'EPS Growth',
      '1 Year': bigFive.epsGrowth.year1,
      '5 Year': bigFive.epsGrowth.year5,
      '10 Year': bigFive.epsGrowth.year10,
    },
    {
      name: 'Revenue',
      '1 Year': bigFive.revenueGrowth.year1,
      '5 Year': bigFive.revenueGrowth.year5,
      '10 Year': bigFive.revenueGrowth.year10,
    },
    {
      name: 'Equity',
      '1 Year': bigFive.equityGrowth.year1,
      '5 Year': bigFive.equityGrowth.year5,
      '10 Year': bigFive.equityGrowth.year10,
    },
    {
      name: 'FCF',
      '1 Year': bigFive.fcfGrowth.year1,
      '5 Year': bigFive.fcfGrowth.year5,
      '10 Year': bigFive.fcfGrowth.year10,
    },
  ];
}

// Custom tooltip component
interface TooltipPayload {
  name: string;
  value: number | null;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload) return null;

  return (
    <Box
      sx={{
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: 1,
        p: 1.5,
        boxShadow: 2,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {label}
      </Typography>
      {payload.map((entry, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 0.5,
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: entry.color,
            }}
          />
          <Typography variant="body2">
            {entry.name}:{' '}
            <strong>
              {entry.value !== null ? `${entry.value >= 0 ? '+' : ''}${entry.value.toFixed(1)}%` : 'N/A'}
            </strong>
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/**
 * BigFiveChart Component
 *
 * Displays a grouped bar chart showing the Big Five metrics:
 * - ROIC (Return on Invested Capital)
 * - EPS Growth (Earnings Per Share)
 * - Revenue Growth
 * - Equity Growth (Book Value)
 * - FCF Growth (Free Cash Flow)
 *
 * Each metric shows 1-year, 5-year, and 10-year values.
 * A reference line at 10% shows the target threshold.
 */
export function BigFiveChart({ data }: BigFiveChartProps) {
  const theme = useTheme();
  const chartData = transformData(data);

  // Color scheme for the bars
  const colors = {
    '1 Year': theme.palette.info.light,
    '5 Year': theme.palette.primary.main,
    '10 Year': theme.palette.success.main,
  };

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            iconType="circle"
          />

          {/* Reference line at 10% - the target threshold */}
          <ReferenceLine
            y={10}
            stroke={theme.palette.success.dark}
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: '10% Target',
              position: 'right',
              fill: theme.palette.success.dark,
              fontSize: 11,
            }}
          />

          {/* Reference line at 0% */}
          <ReferenceLine y={0} stroke="#999" strokeWidth={1} />

          {/* Bar for 1-year data */}
          <Bar dataKey="1 Year" fill={colors['1 Year']} radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-1year-${index}`}
                fill={
                  entry['1 Year'] === null
                    ? '#ddd'
                    : entry['1 Year'] >= 10
                      ? theme.palette.success.light
                      : entry['1 Year'] >= 0
                        ? colors['1 Year']
                        : theme.palette.error.light
                }
              />
            ))}
          </Bar>

          {/* Bar for 5-year data */}
          <Bar dataKey="5 Year" fill={colors['5 Year']} radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-5year-${index}`}
                fill={
                  entry['5 Year'] === null
                    ? '#ddd'
                    : entry['5 Year'] >= 10
                      ? theme.palette.success.main
                      : entry['5 Year'] >= 0
                        ? colors['5 Year']
                        : theme.palette.error.main
                }
              />
            ))}
          </Bar>

          {/* Bar for 10-year data (most important) */}
          <Bar dataKey="10 Year" fill={colors['10 Year']} radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-10year-${index}`}
                fill={
                  entry['10 Year'] === null
                    ? '#ddd'
                    : entry['10 Year'] >= 10
                      ? theme.palette.success.dark
                      : entry['10 Year'] >= 0
                        ? colors['10 Year']
                        : theme.palette.error.dark
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export default BigFiveChart;
