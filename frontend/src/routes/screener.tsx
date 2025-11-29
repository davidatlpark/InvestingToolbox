import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
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
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  Pagination,
} from '@mui/material';
import { useState } from 'react';
import { screenerApi, type ScreenerResult } from '../lib/api';
import { getScoreColor } from '../theme';

function ScreenerPage() {
  // Filter state
  const [filters, setFilters] = useState({
    minValueScore: 0,
    minRoicScore: 0,
    minMoatScore: 0,
    maxPaybackTime: 20,
    sector: '',
    sortBy: 'valueScore' as const,
    sortOrder: 'desc' as const,
    page: 1,
    limit: 25,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['screener', filters],
    queryFn: () => screenerApi.screen(filters),
  });

  const handleFilterChange = (key: keyof typeof filters, value: number | string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Stock Screener
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Filter stocks by Rule One metrics to find wonderful businesses at attractive prices.
      </Typography>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Filters Sidebar */}
        <Card sx={{ width: 300, flexShrink: 0, height: 'fit-content' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>

            {/* Value Score */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Min Value Score: {filters.minValueScore}
              </Typography>
              <Slider
                value={filters.minValueScore}
                onChange={(_, value) => handleFilterChange('minValueScore', value as number)}
                min={0}
                max={100}
                step={5}
                marks={[
                  { value: 0, label: '0' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' },
                ]}
              />
            </Box>

            {/* ROIC Score */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Min ROIC Score: {filters.minRoicScore}
              </Typography>
              <Slider
                value={filters.minRoicScore}
                onChange={(_, value) => handleFilterChange('minRoicScore', value as number)}
                min={0}
                max={100}
                step={5}
              />
            </Box>

            {/* Moat Score */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Min Moat Score: {filters.minMoatScore}
              </Typography>
              <Slider
                value={filters.minMoatScore}
                onChange={(_, value) => handleFilterChange('minMoatScore', value as number)}
                min={0}
                max={100}
                step={5}
              />
            </Box>

            {/* Payback Time */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Max Payback Time: {filters.maxPaybackTime} years
              </Typography>
              <Slider
                value={filters.maxPaybackTime}
                onChange={(_, value) => handleFilterChange('maxPaybackTime', value as number)}
                min={1}
                max={20}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 8, label: '8' },
                  { value: 20, label: '20' },
                ]}
              />
            </Box>

            {/* Sector Filter */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Sector</InputLabel>
              <Select
                value={filters.sector}
                label="Sector"
                onChange={(e) => handleFilterChange('sector', e.target.value)}
              >
                <MenuItem value="">All Sectors</MenuItem>
                <MenuItem value="Technology">Technology</MenuItem>
                <MenuItem value="Healthcare">Healthcare</MenuItem>
                <MenuItem value="Financial Services">Financial Services</MenuItem>
                <MenuItem value="Consumer Cyclical">Consumer Cyclical</MenuItem>
                <MenuItem value="Consumer Defensive">Consumer Defensive</MenuItem>
                <MenuItem value="Industrials">Industrials</MenuItem>
                <MenuItem value="Energy">Energy</MenuItem>
                <MenuItem value="Utilities">Utilities</MenuItem>
                <MenuItem value="Real Estate">Real Estate</MenuItem>
                <MenuItem value="Communication Services">Communication Services</MenuItem>
                <MenuItem value="Basic Materials">Basic Materials</MenuItem>
              </Select>
            </FormControl>

            {/* Sort By */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sort By"
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <MenuItem value="valueScore">Value Score</MenuItem>
                <MenuItem value="roicScore">ROIC Score</MenuItem>
                <MenuItem value="moatScore">Moat Score</MenuItem>
                <MenuItem value="paybackTime">Payback Time</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              fullWidth
              onClick={() =>
                setFilters({
                  minValueScore: 0,
                  minRoicScore: 0,
                  minMoatScore: 0,
                  maxPaybackTime: 20,
                  sector: '',
                  sortBy: 'valueScore',
                  sortOrder: 'desc',
                  page: 1,
                  limit: 25,
                })
              }
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Box sx={{ flex: 1 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : isError ? (
            <Alert severity="error">
              Failed to load results: {(error as Error).message}
            </Alert>
          ) : data && data.data.length > 0 ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Found {data.meta.total} companies matching your criteria
              </Typography>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ticker</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Sector</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">ROIC</TableCell>
                      <TableCell align="right">Moat</TableCell>
                      <TableCell align="right">MOS Price</TableCell>
                      <TableCell align="right">Payback</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.data.map((stock: ScreenerResult) => (
                      <TableRow
                        key={stock.ticker}
                        hover
                        component={Link}
                        to={`/analysis/${stock.ticker}`}
                        sx={{
                          textDecoration: 'none',
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: '#f5f5f5' },
                        }}
                      >
                        <TableCell>
                          <Typography fontWeight="bold">{stock.ticker}</Typography>
                        </TableCell>
                        <TableCell>{stock.name}</TableCell>
                        <TableCell>
                          <Chip label={stock.sector ?? 'N/A'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ color: getScoreColor(stock.valueScore), fontWeight: 600 }}>
                            {stock.valueScore}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ color: getScoreColor(stock.roicScore) }}>
                            {stock.roicScore}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ color: getScoreColor(stock.moatScore) }}>
                            {stock.moatScore}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          ${stock.mosPrice?.toFixed(2) ?? 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            sx={{
                              color:
                                stock.paybackTime && stock.paybackTime <= 8
                                  ? 'success.main'
                                  : 'warning.main',
                            }}
                          >
                            {stock.paybackTime?.toFixed(1) ?? 'N/A'}y
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {data.meta.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={data.meta.totalPages}
                    page={filters.page}
                    onChange={(_, page) => setFilters((prev) => ({ ...prev, page }))}
                    color="primary"
                  />
                </Box>
              )}
            </>
          ) : (
            <Alert severity="info">
              No stocks found matching your criteria. Try adjusting the filters.
            </Alert>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export const Route = createFileRoute('/screener')({
  component: ScreenerPage,
});
