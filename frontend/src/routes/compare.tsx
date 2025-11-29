import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQueries } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  IconButton,
  Chip,
  Alert,
  Autocomplete,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';
import { companyApi, type CompanyAnalysis, type SearchResult } from '../lib/api';
import { getScoreColor } from '../theme';

/**
 * Compare Page
 *
 * Allows users to compare multiple stocks side by side.
 * Shows scores, Big Five metrics, and valuations for easy comparison.
 *
 * WHY this feature?
 * - Investors often need to choose between similar companies
 * - Side-by-side comparison makes differences obvious
 * - Helps identify the "best" investment opportunity
 */

// Search state for adding new stocks
interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
}

// Helper to format numbers with color coding
function MetricCell({
  value,
  suffix = '',
  greenAbove = 10,
  format = 'number',
}: {
  value: number | null;
  suffix?: string;
  greenAbove?: number;
  format?: 'number' | 'percent' | 'currency';
}) {
  if (value === null) {
    return (
      <Typography variant="body2" color="text.secondary">
        N/A
      </Typography>
    );
  }

  let formatted: string;
  switch (format) {
    case 'currency':
      formatted = `$${value.toFixed(2)}`;
      break;
    case 'percent':
      formatted = `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
      break;
    default:
      formatted = value.toFixed(1) + suffix;
  }

  const color =
    value >= greenAbove
      ? 'success.main'
      : value >= 0
        ? 'warning.main'
        : 'error.main';

  return (
    <Typography variant="body2" sx={{ color, fontWeight: 500 }}>
      {formatted}
    </Typography>
  );
}

// Score cell with color coding (0-100 scale)
function ScoreCell({ score }: { score: number }) {
  return (
    <Typography
      variant="body1"
      sx={{ color: getScoreColor(score), fontWeight: 600 }}
    >
      {score}
    </Typography>
  );
}

function ComparePage() {
  const navigate = useNavigate();

  // Get tickers from URL query params
  const { tickers: tickersParam } = Route.useSearch();
  const initialTickers = tickersParam ? tickersParam.split(',').filter(Boolean) : [];

  // State for selected tickers (max 5 for readability)
  const [selectedTickers, setSelectedTickers] = useState<string[]>(initialTickers);
  const [search, setSearch] = useState<SearchState>({
    query: '',
    results: [],
    isLoading: false,
  });

  // Update URL when tickers change
  useEffect(() => {
    const tickerString = selectedTickers.join(',');
    if (tickerString !== tickersParam) {
      navigate({
        to: '/compare',
        search: tickerString ? { tickers: tickerString } : {},
        replace: true,
      });
    }
  }, [selectedTickers, tickersParam, navigate]);

  // Fetch analysis for all selected tickers in parallel
  // WHY useQueries? Each ticker is an independent query that can succeed/fail independently
  const analysisQueries = useQueries({
    queries: selectedTickers.map((ticker) => ({
      queryKey: ['company', ticker],
      queryFn: () => companyApi.getAnalysis(ticker),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })),
  });

  // Search for stocks to add
  const handleSearch = async (query: string) => {
    setSearch((prev) => ({ ...prev, query, isLoading: true }));

    if (query.length < 1) {
      setSearch((prev) => ({ ...prev, results: [], isLoading: false }));
      return;
    }

    try {
      const results = await companyApi.search(query, 10);
      // Filter out already selected tickers
      const filtered = results.filter(
        (r) => !selectedTickers.includes(r.ticker)
      );
      setSearch({ query, results: filtered, isLoading: false });
    } catch {
      setSearch((prev) => ({ ...prev, results: [], isLoading: false }));
    }
  };

  // Add a ticker to comparison
  const addTicker = (ticker: string) => {
    if (selectedTickers.length >= 5) {
      return; // Max 5 for readability
    }
    if (!selectedTickers.includes(ticker)) {
      setSelectedTickers([...selectedTickers, ticker.toUpperCase()]);
    }
    setSearch({ query: '', results: [], isLoading: false });
  };

  // Remove a ticker from comparison
  const removeTicker = (ticker: string) => {
    setSelectedTickers(selectedTickers.filter((t) => t !== ticker));
  };

  // Export comparison to CSV
  const exportToCSV = () => {
    const analyses = analysisQueries
      .filter((q) => q.isSuccess && q.data)
      .map((q) => q.data as CompanyAnalysis);

    if (analyses.length === 0) return;

    // Build CSV content
    const headers = [
      'Metric',
      ...analyses.map((a) => a.company.ticker),
    ];

    const rows = [
      ['Company Name', ...analyses.map((a) => a.company.name)],
      ['Sector', ...analyses.map((a) => a.company.sector || 'N/A')],
      ['Value Score', ...analyses.map((a) => a.scores.valueScore.toString())],
      ['ROIC Score', ...analyses.map((a) => a.scores.roicScore.toString())],
      ['Moat Score', ...analyses.map((a) => a.scores.moatScore.toString())],
      ['Debt Score', ...analyses.map((a) => a.scores.debtScore.toString())],
      ['Management Score', ...analyses.map((a) => a.scores.managementScore.toString())],
      ['ROIC (10Y)', ...analyses.map((a) => a.bigFive.roic.year10?.toFixed(1) || 'N/A')],
      ['EPS Growth (10Y)', ...analyses.map((a) => a.bigFive.epsGrowth.year10?.toFixed(1) || 'N/A')],
      ['Revenue Growth (10Y)', ...analyses.map((a) => a.bigFive.revenueGrowth.year10?.toFixed(1) || 'N/A')],
      ['Equity Growth (10Y)', ...analyses.map((a) => a.bigFive.equityGrowth.year10?.toFixed(1) || 'N/A')],
      ['FCF Growth (10Y)', ...analyses.map((a) => a.bigFive.fcfGrowth.year10?.toFixed(1) || 'N/A')],
      ['Current Price', ...analyses.map((a) => a.valuation.currentPrice?.toFixed(2) || 'N/A')],
      ['Sticker Price', ...analyses.map((a) => a.valuation.stickerPrice?.toFixed(2) || 'N/A')],
      ['MOS Price', ...analyses.map((a) => a.valuation.mosPrice?.toFixed(2) || 'N/A')],
      ['Payback Time', ...analyses.map((a) => a.valuation.paybackTime?.toFixed(1) || 'N/A')],
      ['Upside %', ...analyses.map((a) => a.valuation.upside?.toFixed(1) || 'N/A')],
    ];

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-comparison-${selectedTickers.join('-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get successfully loaded analyses
  const loadedAnalyses = analysisQueries
    .map((q, i) => ({
      ticker: selectedTickers[i],
      data: q.data as CompanyAnalysis | undefined,
      isLoading: q.isLoading,
      isError: q.isError,
      error: q.error,
    }))
    .filter((item) => item.data || item.isLoading || item.isError);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <CompareIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Compare Stocks
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Compare up to 5 stocks side by side to find the best investment opportunity.
          </Typography>
        </Box>

        {selectedTickers.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToCSV}
            disabled={analysisQueries.every((q) => q.isLoading)}
          >
            Export CSV
          </Button>
        )}
      </Box>

      {/* Add Stock Input */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Autocomplete
              sx={{ width: 300 }}
              freeSolo
              options={search.results}
              getOptionLabel={(option) =>
                typeof option === 'string'
                  ? option
                  : `${option.ticker} - ${option.name}`
              }
              inputValue={search.query}
              onInputChange={(_, value) => handleSearch(value)}
              onChange={(_, value) => {
                if (value && typeof value !== 'string') {
                  addTicker(value.ticker);
                } else if (typeof value === 'string' && value.length > 0) {
                  addTicker(value);
                }
              }}
              loading={search.isLoading}
              disabled={selectedTickers.length >= 5}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Add stock to compare"
                  placeholder="Search by ticker or name..."
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {search.isLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.ticker}>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {option.ticker}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.name}
                    </Typography>
                  </Box>
                </li>
              )}
            />

            {/* Selected ticker chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {selectedTickers.map((ticker) => (
                <Chip
                  key={ticker}
                  label={ticker}
                  onDelete={() => removeTicker(ticker)}
                  color="primary"
                  variant="outlined"
                />
              ))}
              {selectedTickers.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No stocks selected. Search to add stocks for comparison.
                </Typography>
              )}
              {selectedTickers.length >= 5 && (
                <Typography variant="caption" color="warning.main">
                  Maximum 5 stocks for comparison
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {selectedTickers.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 180 }}>Metric</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center" sx={{ minWidth: 120 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Typography fontWeight={600}>{item.ticker}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeTicker(item.ticker)}
                        sx={{ p: 0.5 }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    {item.data && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {item.data.company.name}
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Loading/Error States */}
              {loadedAnalyses.some((item) => item.isLoading) && (
                <TableRow>
                  <TableCell colSpan={loadedAnalyses.length + 1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                      <CircularProgress size={20} />
                      <Typography>Loading data...</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {loadedAnalyses.some((item) => item.isError) && (
                <TableRow>
                  <TableCell colSpan={loadedAnalyses.length + 1}>
                    <Alert severity="warning" sx={{ my: 1 }}>
                      Some stocks failed to load. They may not exist or have insufficient data.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}

              {/* Company Info */}
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell colSpan={loadedAnalyses.length + 1}>
                  <Typography variant="subtitle2">Company Info</Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Sector</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data ? (
                      <Chip
                        label={item.data.company.sector || 'N/A'}
                        size="small"
                        variant="outlined"
                      />
                    ) : item.isLoading ? (
                      <CircularProgress size={16} />
                    ) : (
                      'Error'
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Market Cap</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data?.company.marketCap
                      ? `$${(item.data.company.marketCap / 1e9).toFixed(1)}B`
                      : 'N/A'}
                  </TableCell>
                ))}
              </TableRow>

              {/* Scores Section */}
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell colSpan={loadedAnalyses.length + 1}>
                  <Typography variant="subtitle2">Scores (0-100)</Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Value Score</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data ? (
                      <ScoreCell score={item.data.scores.valueScore} />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>ROIC Score</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data ? (
                      <ScoreCell score={item.data.scores.roicScore} />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Moat Score</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data ? (
                      <ScoreCell score={item.data.scores.moatScore} />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Debt Score</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data ? (
                      <ScoreCell score={item.data.scores.debtScore} />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Management Score</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data ? (
                      <ScoreCell score={item.data.scores.managementScore} />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Predictable?</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data ? (
                      <Chip
                        label={item.data.scores.isPredictable ? 'Yes' : 'No'}
                        size="small"
                        color={item.data.scores.isPredictable ? 'success' : 'warning'}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                ))}
              </TableRow>

              {/* Big Five Section */}
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell colSpan={loadedAnalyses.length + 1}>
                  <Typography variant="subtitle2">Big Five Numbers (10-Year)</Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Tooltip title="Return on Invested Capital - measures how well management allocates capital">
                    <span>ROIC</span>
                  </Tooltip>
                </TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data ? (
                      <MetricCell value={item.data.bigFive.roic.year10} suffix="%" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>EPS Growth</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data ? (
                      <MetricCell value={item.data.bigFive.epsGrowth.year10} suffix="%" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Revenue Growth</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data ? (
                      <MetricCell value={item.data.bigFive.revenueGrowth.year10} suffix="%" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Equity Growth</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data ? (
                      <MetricCell value={item.data.bigFive.equityGrowth.year10} suffix="%" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>FCF Growth</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data ? (
                      <MetricCell value={item.data.bigFive.fcfGrowth.year10} suffix="%" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                ))}
              </TableRow>

              {/* Valuation Section */}
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell colSpan={loadedAnalyses.length + 1}>
                  <Typography variant="subtitle2">Valuation</Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Current Price</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data?.valuation.currentPrice
                      ? `$${item.data.valuation.currentPrice.toFixed(2)}`
                      : 'N/A'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Sticker Price</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data?.valuation.stickerPrice
                      ? `$${item.data.valuation.stickerPrice.toFixed(2)}`
                      : 'N/A'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>
                  <Tooltip title="Margin of Safety Price - buy below this for 50% safety margin">
                    <span>MOS Price</span>
                  </Tooltip>
                </TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    <Typography
                      variant="body2"
                      sx={{ color: 'success.main', fontWeight: 600 }}
                    >
                      {item.data?.valuation.mosPrice
                        ? `$${item.data.valuation.mosPrice.toFixed(2)}`
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>
                  <Tooltip title="Years for earnings to pay back your investment (target: ≤8 years)">
                    <span>Payback Time</span>
                  </Tooltip>
                </TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data?.valuation.paybackTime ? (
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            item.data.valuation.paybackTime <= 8
                              ? 'success.main'
                              : 'warning.main',
                          fontWeight: 500,
                        }}
                      >
                        {item.data.valuation.paybackTime.toFixed(1)} years
                      </Typography>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Upside</TableCell>
                {loadedAnalyses.map((item) => (
                  <TableCell key={item.ticker} align="center">
                    {item.data?.valuation.upside !== null &&
                    item.data?.valuation.upside !== undefined ? (
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            item.data.valuation.upside > 0
                              ? 'success.main'
                              : 'error.main',
                          fontWeight: 600,
                        }}
                      >
                        {item.data.valuation.upside > 0 ? '+' : ''}
                        {item.data.valuation.upside.toFixed(1)}%
                      </Typography>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Empty State */}
      {selectedTickers.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <CompareIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No stocks to compare
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use the search box above to add stocks for side-by-side comparison.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tip: You can also bookmark comparison URLs like{' '}
              <code>/compare?tickers=AAPL,MSFT,GOOGL</code>
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

// Route definition with search params
export const Route = createFileRoute('/compare')({
  component: ComparePage,
  validateSearch: (search: Record<string, unknown>): { tickers?: string } => {
    return {
      tickers: typeof search.tickers === 'string' ? search.tickers : undefined,
    };
  },
});
