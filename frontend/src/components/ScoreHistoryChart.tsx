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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useState } from 'react';
import { companyApi } from '../lib/api';

/**
 * ScoreHistoryChart Component
 *
 * Displays historical score trends for a company over time.
 *
 * WHY track score history?
 * - Shows if a company's quality is improving or declining
 * - Helps identify trends before they're obvious
 * - Supports "buy wonderful companies" philosophy
 *
 * The chart shows:
 * - Value Score (overall quality)
 * - ROIC Score (capital efficiency)
 * - Moat Score (competitive advantage)
 * - Debt Score (financial health)
 * - Management Score (capital allocation)
 */

interface ScoreHistoryChartProps {
  ticker: string;
}

// Score type for toggle
type ScoreType = 'all' | 'value' | 'fundamentals';

// Chart colors matching score theme
const SCORE_COLORS = {
  valueScore: '#2e7d32', // Green - primary score
  roicScore: '#1976d2', // Blue
  moatScore: '#9c27b0', // Purple
  debtScore: '#ed6c02', // Orange
  managementScore: '#d32f2f', // Red
};

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });
}

export function ScoreHistoryChart({ ticker }: ScoreHistoryChartProps) {
  const [viewType, setViewType] = useState<ScoreType>('value');

  const { data: history, isLoading, isError, error } = useQuery({
    queryKey: ['scoreHistory', ticker],
    queryFn: () => companyApi.getScoreHistory(ticker),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load score history: {(error as Error).message}
      </Alert>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            No historical score data available yet. Scores are recorded when you view a company's analysis.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Transform data for chart - format dates
  const chartData = history.map((point) => ({
    ...point,
    formattedDate: formatDate(point.date),
  }));

  // Determine which lines to show based on view type
  const getLines = () => {
    switch (viewType) {
      case 'value':
        return (
          <Line
            type="monotone"
            dataKey="valueScore"
            name="Value Score"
            stroke={SCORE_COLORS.valueScore}
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        );
      case 'fundamentals':
        return (
          <>
            <Line
              type="monotone"
              dataKey="roicScore"
              name="ROIC"
              stroke={SCORE_COLORS.roicScore}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="moatScore"
              name="Moat"
              stroke={SCORE_COLORS.moatScore}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="debtScore"
              name="Debt"
              stroke={SCORE_COLORS.debtScore}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="managementScore"
              name="Management"
              stroke={SCORE_COLORS.managementScore}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </>
        );
      case 'all':
      default:
        return (
          <>
            <Line
              type="monotone"
              dataKey="valueScore"
              name="Value"
              stroke={SCORE_COLORS.valueScore}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="roicScore"
              name="ROIC"
              stroke={SCORE_COLORS.roicScore}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="moatScore"
              name="Moat"
              stroke={SCORE_COLORS.moatScore}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </>
        );
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Score History</Typography>
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={(_, value) => value && setViewType(value)}
            size="small"
          >
            <ToggleButton value="value">Value</ToggleButton>
            <ToggleButton value="fundamentals">All Scores</ToggleButton>
            <ToggleButton value="all">Combined</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Track how scores change over time. {history.length} data point{history.length !== 1 ? 's' : ''} recorded.
        </Typography>

        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                stroke="#666"
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(0)}`,
                  name,
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              {getLines()}
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Summary stats */}
        {history.length >= 2 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="caption" color="text.secondary">
              Trend Analysis:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
              {(() => {
                const first = history[0];
                const last = history[history.length - 1];
                const change = last.valueScore - first.valueScore;
                const color = change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.secondary';
                return (
                  <Typography variant="body2" sx={{ color }}>
                    Value Score: {change > 0 ? '+' : ''}{change.toFixed(0)} ({first.valueScore.toFixed(0)} → {last.valueScore.toFixed(0)})
                  </Typography>
                );
              })()}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default ScoreHistoryChart;
