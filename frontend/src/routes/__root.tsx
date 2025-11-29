import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  IconButton,
  InputBase,
  Paper,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Leaderboard as LeaderboardIcon,
  BookmarkBorder as WatchlistIcon,
  Calculate as CalculatorIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

function RootComponent() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: '/analysis/$ticker', params: { ticker: searchQuery.trim().toUpperCase() } });
      setSearchQuery('');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          {/* Logo */}
          <IconButton
            edge="start"
            color="inherit"
            component={Link}
            to="/"
            sx={{ mr: 2 }}
          >
            <TrendingUpIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 0,
              textDecoration: 'none',
              color: 'inherit',
              mr: 4,
            }}
          >
            Value Investing Toolbox
          </Typography>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
            <Button
              color="inherit"
              component={Link}
              to="/screener"
              startIcon={<LeaderboardIcon />}
            >
              Screener
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/watchlist"
              startIcon={<WatchlistIcon />}
            >
              Watchlist
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/calculator"
              startIcon={<CalculatorIcon />}
            >
              Calculator
            </Button>
          </Box>

          {/* Search Bar */}
          <Paper
            component="form"
            onSubmit={handleSearch}
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              width: 250,
              backgroundColor: 'rgba(255,255,255,0.15)',
            }}
            elevation={0}
          >
            <InputBase
              sx={{ ml: 1, flex: 1, color: 'white' }}
              placeholder="Enter ticker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputProps={{ 'aria-label': 'search stock' }}
            />
            <IconButton type="submit" sx={{ p: '10px', color: 'white' }} aria-label="search">
              <SearchIcon />
            </IconButton>
          </Paper>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container
        maxWidth="xl"
        component="main"
        sx={{
          flexGrow: 1,
          py: 3,
        }}
      >
        <Outlet />
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: '#f5f5f5',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="body2" color="text.secondary" align="center">
            Value Investing Toolbox - Based on Rule One Investing Principles
          </Typography>
        </Container>
      </Box>

      {/* Dev Tools */}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </Box>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
