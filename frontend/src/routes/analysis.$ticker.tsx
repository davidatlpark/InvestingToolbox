import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Skeleton,
  Divider,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BookmarkBorder as WatchlistIcon,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { companyApi } from '../lib/api';
import { getScoreColor, getChangeColor } from '../theme';
import { BigFiveChart } from '../components/BigFiveChart';
import { FinancialsTable } from '../components/FinancialsTable';

// Score Card Component
function ScoreCard({
  title,
  score,
  description,
}: {
  title: string;
  score: number;
  description?: string;
}) {
  const color = getScoreColor(score);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography
          variant="h3"
          component="div"
          sx={{ color, fontWeight: 'bold', my: 1 }}
        >
          {score}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// Big Five Metric Row
function BigFiveRow({
  label,
  data,
  suffix = '%',
}: {
  label: string;
  data: { year1: number | null; year5: number | null; year10: number | null };
  suffix?: string;
}) {
  const formatValue = (val: number | null) => {
    if (val === null) return 'N/A';
    return `${val >= 0 ? '+' : ''}${val.toFixed(1)}${suffix}`;
  };

  const getColor = (val: number | null) => {
    if (val === null) return 'text.secondary';
    if (val >= 10) return 'success.main';
    if (val >= 0) return 'warning.main';
    return 'error.main';
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5, borderBottom: '1px solid #eee' }}>
      <Typography variant="body1" sx={{ width: 150, fontWeight: 500 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', gap: 4, flex: 1 }}>
        <Tooltip title="1-Year">
          <Typography variant="body1" sx={{ color: getColor(data.year1), width: 80 }}>
            {formatValue(data.year1)}
          </Typography>
        </Tooltip>
        <Tooltip title="5-Year Average">
          <Typography variant="body1" sx={{ color: getColor(data.year5), width: 80 }}>
            {formatValue(data.year5)}
          </Typography>
        </Tooltip>
        <Tooltip title="10-Year Average">
          <Typography variant="body1" sx={{ color: getColor(data.year10), width: 80, fontWeight: 600 }}>
            {formatValue(data.year10)}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  );
}

// Main Analysis Page
function AnalysisPage() {
  const { ticker } = Route.useParams();

  const {
    data: analysis,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['company', ticker],
    queryFn: () => companyApi.getAnalysis(ticker),
  });

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Grid item xs={12} sm={6} md={2.4} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load analysis for {ticker}: {(error as Error).message}
      </Alert>
    );
  }

  if (!analysis) return null;

  const { company, scores, bigFive, valuation } = analysis;
  const priceChange = valuation.currentPrice && valuation.mosPrice
    ? ((valuation.mosPrice - valuation.currentPrice) / valuation.currentPrice) * 100
    : null;

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
          // Stack vertically on mobile
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
            >
              {company.ticker}
            </Typography>
            {!scores.isPredictable && (
              <Chip label="Unpredictable" color="warning" size="small" />
            )}
          </Box>
          <Typography variant="h6" color="text.secondary">
            {company.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {company.sector} • {company.industry}
          </Typography>
        </Box>

        <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, width: { xs: '100%', sm: 'auto' } }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
          >
            ${valuation.currentPrice?.toFixed(2) ?? 'N/A'}
          </Typography>
          {priceChange !== null && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                gap: 0.5,
              }}
            >
              {priceChange > 0 ? (
                <TrendingUp sx={{ color: getChangeColor(priceChange) }} />
              ) : (
                <TrendingDown sx={{ color: getChangeColor(priceChange) }} />
              )}
              <Typography
                variant="body1"
                sx={{ color: getChangeColor(priceChange) }}
              >
                {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}% vs MOS
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              mt: 1,
              display: 'flex',
              gap: 1,
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<WatchlistIcon />}
            >
              Add to Watchlist
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={isFetching ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Score Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <ScoreCard title="Value Score" score={scores.valueScore} description="Overall" />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <ScoreCard title="ROIC Score" score={scores.roicScore} description="Capital efficiency" />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <ScoreCard title="Moat Score" score={scores.moatScore} description="Competitive advantage" />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <ScoreCard title="Debt Score" score={scores.debtScore} description="Financial health" />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <ScoreCard title="Management" score={scores.managementScore} description="Capital allocation" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Big Five Panel */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                The Big Five Numbers
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Target: ≥10% growth for all metrics over 10 years
              </Typography>

              {/* Big Five Chart */}
              <BigFiveChart data={bigFive} />

              <Divider sx={{ my: 2 }} />

              {/* Big Five Table */}
              <Box sx={{ display: 'flex', gap: 4, mb: 2, pl: '150px' }}>
                <Typography variant="caption" sx={{ width: 80 }}>1 Year</Typography>
                <Typography variant="caption" sx={{ width: 80 }}>5 Year</Typography>
                <Typography variant="caption" sx={{ width: 80, fontWeight: 600 }}>10 Year</Typography>
              </Box>

              <BigFiveRow label="ROIC" data={bigFive.roic} />
              <BigFiveRow label="EPS Growth" data={bigFive.epsGrowth} />
              <BigFiveRow label="Revenue Growth" data={bigFive.revenueGrowth} />
              <BigFiveRow label="Equity Growth" data={bigFive.equityGrowth} />
              <BigFiveRow label="FCF Growth" data={bigFive.fcfGrowth} />
            </CardContent>
          </Card>
        </Grid>

        {/* Valuation Panel */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Valuation
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary">Current Price</Typography>
                  <Typography variant="h6">
                    ${valuation.currentPrice?.toFixed(2) ?? 'N/A'}
                  </Typography>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary">Sticker Price</Typography>
                  <Typography variant="h6">
                    ${valuation.stickerPrice?.toFixed(2) ?? 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tooltip title="Buy below this price for 50% margin of safety">
                    <Typography color="text.secondary" sx={{ textDecoration: 'underline dotted', cursor: 'help' }}>
                      MOS Price
                    </Typography>
                  </Tooltip>
                  <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                    ${valuation.mosPrice?.toFixed(2) ?? 'N/A'}
                  </Typography>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tooltip title="Years for earnings to pay back investment">
                    <Typography color="text.secondary" sx={{ textDecoration: 'underline dotted', cursor: 'help' }}>
                      Payback Time
                    </Typography>
                  </Tooltip>
                  <Typography
                    variant="h6"
                    sx={{
                      color: valuation.paybackTime && valuation.paybackTime <= 8 ? 'success.main' : 'warning.main',
                    }}
                  >
                    {valuation.paybackTime?.toFixed(1) ?? 'N/A'} years
                  </Typography>
                </Box>

                {valuation.upside && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: valuation.upside > 0 ? 'success.light' : 'error.light',
                      borderRadius: 1,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="body2" color="white">
                      {valuation.upside > 0 ? 'Potential Upside' : 'Currently Overvalued'}
                    </Typography>
                    <Typography variant="h5" color="white" fontWeight="bold">
                      {valuation.upside > 0 ? '+' : ''}{valuation.upside.toFixed(1)}%
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                About
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {company.description?.slice(0, 300)}
                {company.description && company.description.length > 300 ? '...' : ''}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={company.sector ?? 'N/A'} size="small" />
                <Chip label={company.industry ?? 'N/A'} size="small" variant="outlined" />
                {company.marketCap && (
                  <Chip
                    label={`$${(company.marketCap / 1e9).toFixed(1)}B`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Historical Financials */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Historical Financials
        </Typography>
        <FinancialsTable ticker={ticker} />
      </Box>

      {/* Meta Info */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'right' }}>
        Data as of {analysis.meta.lastUpdated ? new Date(analysis.meta.lastUpdated).toLocaleDateString() : 'N/A'} •{' '}
        {analysis.meta.yearsOfData} years of data
      </Typography>
    </Box>
  );
}

export const Route = createFileRoute('/analysis/$ticker')({
  component: AnalysisPage,
});
