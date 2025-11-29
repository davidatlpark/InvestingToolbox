import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Slider,
  Divider,
  Alert,
  Paper,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import { Calculate as CalculateIcon, Info as InfoIcon } from '@mui/icons-material';
import { useState } from 'react';
import { valuationApi, type ValuationResult } from '../lib/api';

function CalculatorPage() {
  const [inputs, setInputs] = useState({
    currentEps: '',
    growthRate: 10,
    futurePe: 20,
    currentPrice: '',
    minReturnRate: 15,
  });

  const [result, setResult] = useState<(ValuationResult & { recommendation: string | null }) | null>(null);

  const calculateMutation = useMutation({
    mutationFn: valuationApi.calculate,
    onSuccess: (data) => setResult(data),
  });

  const handleCalculate = () => {
    if (!inputs.currentEps) return;

    calculateMutation.mutate({
      currentEps: parseFloat(inputs.currentEps),
      growthRate: inputs.growthRate,
      futurePe: inputs.futurePe,
      currentPrice: inputs.currentPrice ? parseFloat(inputs.currentPrice) : undefined,
    });
  };

  const getRecommendationColor = (rec: string | null) => {
    if (rec === 'BUY') return 'success.main';
    if (rec === 'HOLD') return 'warning.main';
    if (rec === 'AVOID') return 'error.main';
    return 'text.secondary';
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Valuation Calculator
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Calculate Sticker Price and Margin of Safety using Phil Town&apos;s Rule One formula.
      </Typography>

      <Grid container spacing={3}>
        {/* Input Panel */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Inputs
              </Typography>

              {/* Current EPS */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Current EPS (TTM)"
                  type="number"
                  value={inputs.currentEps}
                  onChange={(e) => setInputs({ ...inputs, currentEps: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  helperText="Trailing twelve months earnings per share"
                />
              </Box>

              {/* Growth Rate */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    Estimated Growth Rate: {inputs.growthRate}%
                  </Typography>
                  <Tooltip title="Use the lower of: historical equity growth rate or analyst estimates. Rule One suggests 10%+ is good.">
                    <InfoIcon fontSize="small" color="action" />
                  </Tooltip>
                </Box>
                <Slider
                  value={inputs.growthRate}
                  onChange={(_, value) => setInputs({ ...inputs, growthRate: value as number })}
                  min={0}
                  max={30}
                  step={1}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 10, label: '10%' },
                    { value: 20, label: '20%' },
                    { value: 30, label: '30%' },
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v}%`}
                />
              </Box>

              {/* Future PE */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    Future PE Ratio: {inputs.futurePe}
                  </Typography>
                  <Tooltip title="Use 2x the growth rate, or the historical high PE, whichever is lower. Capped at 50.">
                    <InfoIcon fontSize="small" color="action" />
                  </Tooltip>
                </Box>
                <Slider
                  value={inputs.futurePe}
                  onChange={(_, value) => setInputs({ ...inputs, futurePe: value as number })}
                  min={5}
                  max={50}
                  step={1}
                  marks={[
                    { value: 10, label: '10' },
                    { value: 20, label: '20' },
                    { value: 30, label: '30' },
                    { value: 40, label: '40' },
                    { value: 50, label: '50' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Current Price (Optional) */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Current Stock Price (optional)"
                  type="number"
                  value={inputs.currentPrice}
                  onChange={(e) => setInputs({ ...inputs, currentPrice: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  helperText="Enter to get payback time and recommendation"
                />
              </Box>

              {/* Minimum Return Rate */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    Minimum Acceptable Return: {inputs.minReturnRate}%
                  </Typography>
                  <Tooltip title="Phil Town uses 15% as the minimum acceptable annual return.">
                    <InfoIcon fontSize="small" color="action" />
                  </Tooltip>
                </Box>
                <Slider
                  value={inputs.minReturnRate}
                  onChange={(_, value) => setInputs({ ...inputs, minReturnRate: value as number })}
                  min={10}
                  max={25}
                  step={1}
                  marks={[
                    { value: 10, label: '10%' },
                    { value: 15, label: '15%' },
                    { value: 20, label: '20%' },
                    { value: 25, label: '25%' },
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v}%`}
                />
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<CalculateIcon />}
                onClick={handleCalculate}
                disabled={!inputs.currentEps || calculateMutation.isPending}
              >
                Calculate Valuation
              </Button>

              {calculateMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {(calculateMutation.error as Error).message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={6}>
          {result ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Valuation Results
                </Typography>

                {/* Future Values */}
                <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    10 Years From Now
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Future EPS</Typography>
                    <Typography fontWeight="bold">${result.futureEps.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Future Stock Price</Typography>
                    <Typography fontWeight="bold">${result.futurePrice.toFixed(2)}</Typography>
                  </Box>
                </Paper>

                {/* Valuation */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                    <Tooltip title="The fair value of the stock for a 15% annual return">
                      <Typography sx={{ textDecoration: 'underline dotted', cursor: 'help' }}>
                        Sticker Price
                      </Typography>
                    </Tooltip>
                    <Typography variant="h6">${result.stickerPrice.toFixed(2)}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                    <Tooltip title="50% of sticker price - buy below this for margin of safety">
                      <Typography sx={{ textDecoration: 'underline dotted', cursor: 'help', color: 'success.main' }}>
                        Margin of Safety Price
                      </Typography>
                    </Tooltip>
                    <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                      ${result.mosPrice.toFixed(2)}
                    </Typography>
                  </Box>

                  {result.paybackTime !== null && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                      <Tooltip title="Years for earnings to pay back your investment">
                        <Typography sx={{ textDecoration: 'underline dotted', cursor: 'help' }}>
                          Payback Time
                        </Typography>
                      </Tooltip>
                      <Typography
                        variant="h6"
                        sx={{
                          color: result.paybackTime <= 8 ? 'success.main' : 'warning.main',
                        }}
                      >
                        {result.paybackTime.toFixed(1)} years
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Recommendation */}
                {result.recommendation && (
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      backgroundColor:
                        result.recommendation === 'BUY'
                          ? '#e8f5e9'
                          : result.recommendation === 'HOLD'
                          ? '#fff3e0'
                          : '#ffebee',
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary">
                      Recommendation
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ color: getRecommendationColor(result.recommendation), fontWeight: 'bold' }}
                    >
                      {result.recommendation}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {result.recommendation === 'BUY' && 'Current price is below MOS price - great opportunity!'}
                      {result.recommendation === 'HOLD' && 'Current price is between MOS and Sticker - fairly valued'}
                      {result.recommendation === 'AVOID' && 'Current price is above Sticker - overvalued'}
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', py: 6 }}>
                <CalculateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" textAlign="center">
                  Enter values and click Calculate
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Results will appear here
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Formula Explanation */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>1. Future EPS</strong> = Current EPS × (1 + Growth Rate)^10
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>2. Future Price</strong> = Future EPS × Future PE
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>3. Sticker Price</strong> = Future Price ÷ (1 + Min Return)^10
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>4. MOS Price</strong> = Sticker Price × 50%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export const Route = createFileRoute('/calculator')({
  component: CalculatorPage,
});
