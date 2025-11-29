import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  TextField,
  Button,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  BookmarkBorder as WatchlistIcon,
  Calculate as CalculatorIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

function HomePage() {
  const [ticker, setTicker] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      navigate({ to: '/analysis/$ticker', params: { ticker: ticker.trim().toUpperCase() } });
    }
  };

  const features = [
    {
      icon: <AssessmentIcon sx={{ fontSize: 48 }} />,
      title: 'Stock Analysis',
      description: 'Get Big Five metrics, scores, and valuations for any stock',
      link: '/screener',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 48 }} />,
      title: 'Screener',
      description: 'Find wonderful businesses at attractive prices',
      link: '/screener',
    },
    {
      icon: <WatchlistIcon sx={{ fontSize: 48 }} />,
      title: 'Watchlist',
      description: 'Track stocks and get notified when they hit your target price',
      link: '/watchlist',
    },
    {
      icon: <CalculatorIcon sx={{ fontSize: 48 }} />,
      title: 'Valuation Calculator',
      description: 'Calculate sticker price and margin of safety',
      link: '/calculator',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Paper
        sx={{
          p: 6,
          mb: 4,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          textAlign: 'center',
        }}
        elevation={0}
      >
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Value Investing Toolbox
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
          Rule One Investing Analysis - Find Wonderful Businesses at Attractive Prices
        </Typography>

        {/* Search Box */}
        <Paper
          component="form"
          onSubmit={handleAnalyze}
          sx={{
            p: 2,
            maxWidth: 500,
            mx: 'auto',
            display: 'flex',
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            placeholder="Enter stock ticker (e.g., AAPL, MSFT, GOOGL)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            variant="outlined"
            size="medium"
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            disabled={!ticker.trim()}
          >
            Analyze
          </Button>
        </Paper>
      </Paper>

      {/* Features Grid */}
      <Typography variant="h4" component="h2" gutterBottom textAlign="center" sx={{ mb: 4 }}>
        What You Can Do
      </Typography>

      <Grid container spacing={3}>
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={3} key={feature.title}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea
                component={Link}
                to={feature.link}
                sx={{ height: '100%', p: 2 }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Methodology Section */}
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Rule One Investing Methodology
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              The 4 M&apos;s
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Meaning:</strong> Understand the business and stay within your circle of
              competence.
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Moat:</strong> Look for durable competitive advantages (Brand, Secret, Toll,
              Switching, Price).
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Management:</strong> Seek owner-oriented leadership with skin in the game.
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Margin of Safety:</strong> Only buy at 50% of the intrinsic value.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              The Big Five Numbers
            </Typography>
            <Typography variant="body1" paragraph>
              All growth rates should be <strong>≥10% for 10 years</strong>:
            </Typography>
            <Typography variant="body1" component="div">
              <ul>
                <li>ROIC (Return on Invested Capital)</li>
                <li>Equity/Book Value Growth</li>
                <li>EPS (Earnings Per Share) Growth</li>
                <li>Revenue/Sales Growth</li>
                <li>Free Cash Flow Growth</li>
              </ul>
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
});
