import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Snackbar,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  TrendingUp,
  TrendingDown,
  NotificationsActive as AlertIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { watchlistApi, type WatchlistItem } from '../lib/api';
import { getChangeColor, getScoreColor } from '../theme';

/**
 * Price Alert Types
 *
 * WHY browser notifications?
 * - No backend infrastructure needed for notifications
 * - Works even when tab is in background
 * - User controls notification permissions
 * - Instant feedback when checking prices
 */
interface PriceAlert {
  ticker: string;
  name: string;
  currentPrice: number;
  targetPrice: number;
  type: 'buy' | 'mos'; // 'buy' = at/below target, 'mos' = at/below MOS price
}

function WatchlistPage() {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [newTargetPrice, setNewTargetPrice] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Price alert state
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [alertSnackbarOpen, setAlertSnackbarOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  /**
   * Request notification permission from the browser
   *
   * WHY request on demand?
   * - Better UX than requesting on page load
   * - User understands why we need permission
   * - Required by modern browsers
   */
  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      return 'denied';
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  };

  /**
   * Check all watchlist items against their target prices
   * Sends browser notification for any stocks that hit targets
   */
  const checkPriceAlerts = async () => {
    if (!watchlist || watchlist.length === 0) return;

    // Request permission if not granted
    let permission = notificationPermission;
    if (permission === 'default') {
      permission = await requestNotificationPermission();
    }

    // Find stocks that hit their targets
    const triggeredAlerts: PriceAlert[] = [];

    for (const item of watchlist) {
      if (!item.currentPrice) continue;

      // Check if price is at or below target price
      if (item.targetPrice && item.currentPrice <= item.targetPrice) {
        triggeredAlerts.push({
          ticker: item.ticker,
          name: item.name,
          currentPrice: item.currentPrice,
          targetPrice: item.targetPrice,
          type: 'buy',
        });
      }
      // Check if price is at or below MOS price (margin of safety)
      else if (item.mosPrice && item.currentPrice <= item.mosPrice) {
        triggeredAlerts.push({
          ticker: item.ticker,
          name: item.name,
          currentPrice: item.currentPrice,
          targetPrice: item.mosPrice,
          type: 'mos',
        });
      }
    }

    setAlerts(triggeredAlerts);
    setAlertSnackbarOpen(true);

    // Send browser notification if permission granted
    if (permission === 'granted' && triggeredAlerts.length > 0) {
      const title = `${triggeredAlerts.length} Price Alert${triggeredAlerts.length > 1 ? 's' : ''}!`;
      const body = triggeredAlerts
        .map((a) => `${a.ticker}: $${a.currentPrice.toFixed(2)} (target: $${a.targetPrice.toFixed(2)})`)
        .join('\n');

      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'price-alert', // Prevents duplicate notifications
      });
    }
  };

  /**
   * Check if a watchlist item has triggered an alert
   */
  const hasAlert = (ticker: string): PriceAlert | undefined => {
    return alerts.find((a) => a.ticker === ticker);
  };

  const { data: watchlist, isLoading, isError, error } = useQuery({
    queryKey: ['watchlist'],
    queryFn: watchlistApi.getAll,
  });

  const addMutation = useMutation({
    mutationFn: (data: { ticker: string; targetPrice?: number; notes?: string }) =>
      watchlistApi.add(data.ticker, { targetPrice: data.targetPrice, notes: data.notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      setAddDialogOpen(false);
      setNewTicker('');
      setNewTargetPrice('');
      setNewNotes('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: watchlistApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const handleAdd = () => {
    if (newTicker.trim()) {
      addMutation.mutate({
        ticker: newTicker.trim().toUpperCase(),
        targetPrice: newTargetPrice ? parseFloat(newTargetPrice) : undefined,
        notes: newNotes || undefined,
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Watchlist
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track stocks and monitor price targets.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip
            title={
              notificationPermission === 'denied'
                ? 'Notifications blocked - enable in browser settings'
                : 'Check which stocks hit their target prices'
            }
          >
            <span>
              <Button
                variant="outlined"
                startIcon={<AlertIcon />}
                onClick={checkPriceAlerts}
                disabled={!watchlist || watchlist.length === 0}
              >
                Check Alerts
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Stock
          </Button>
        </Box>
      </Box>

      {/* Alert Summary Banner */}
      {alerts.length > 0 && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setAlerts([])}
          icon={<CheckIcon />}
        >
          <Typography variant="subtitle2">
            {alerts.length} stock{alerts.length > 1 ? 's' : ''} hit target price!
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            {alerts.map((alert) => (
              <Chip
                key={alert.ticker}
                label={`${alert.ticker}: $${alert.currentPrice.toFixed(2)}`}
                color={alert.type === 'buy' ? 'success' : 'info'}
                size="small"
                component={Link}
                to={`/analysis/${alert.ticker}`}
                clickable
              />
            ))}
          </Box>
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">
          Failed to load watchlist: {(error as Error).message}
        </Alert>
      ) : watchlist && watchlist.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ticker</TableCell>
                <TableCell>Company</TableCell>
                <TableCell align="right">Current Price</TableCell>
                <TableCell align="right">Change</TableCell>
                <TableCell align="right">Target Price</TableCell>
                <TableCell align="right">% to Target</TableCell>
                <TableCell align="right">Value Score</TableCell>
                <TableCell align="right">MOS Price</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {watchlist.map((item: WatchlistItem) => {
                const alert = hasAlert(item.ticker);
                return (
                <TableRow
                  key={item.id}
                  hover
                  sx={{
                    // Highlight rows that triggered alerts
                    backgroundColor: alert ? 'rgba(46, 125, 50, 0.08)' : undefined,
                    '&:hover': {
                      backgroundColor: alert ? 'rgba(46, 125, 50, 0.12)' : undefined,
                    },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        component={Link}
                        to={`/analysis/${item.ticker}`}
                        sx={{ fontWeight: 'bold', textDecoration: 'none', color: 'primary.main' }}
                      >
                        {item.ticker}
                      </Typography>
                      {alert && (
                        <Chip
                          label={alert.type === 'buy' ? 'BUY' : 'MOS'}
                          color="success"
                          size="small"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell align="right">
                    ${item.currentPrice?.toFixed(2) ?? 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    {item.changePercent !== null && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        {item.changePercent >= 0 ? (
                          <TrendingUp sx={{ fontSize: 16, color: getChangeColor(item.changePercent) }} />
                        ) : (
                          <TrendingDown sx={{ fontSize: 16, color: getChangeColor(item.changePercent) }} />
                        )}
                        <Typography sx={{ color: getChangeColor(item.changePercent) }}>
                          {item.changePercent >= 0 ? '+' : ''}
                          {item.changePercent.toFixed(2)}%
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {item.targetPrice ? `$${item.targetPrice.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {item.percentToTarget !== null && (
                      <Typography sx={{ color: item.percentToTarget > 0 ? 'success.main' : 'error.main' }}>
                        {item.percentToTarget > 0 ? '+' : ''}
                        {item.percentToTarget.toFixed(1)}%
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {item.valueScore !== null && (
                      <Typography sx={{ color: getScoreColor(item.valueScore), fontWeight: 600 }}>
                        {item.valueScore}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {item.mosPrice !== null ? `$${item.mosPrice.toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={item.notes || ''}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.notes || '-'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeMutation.mutate(item.ticker)}
                      disabled={removeMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Your watchlist is empty
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add stocks to track their prices and get notified when they hit your target.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add Your First Stock
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Stock Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add to Watchlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ticker Symbol"
            fullWidth
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            placeholder="e.g., AAPL"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Target Price (optional)"
            fullWidth
            type="number"
            value={newTargetPrice}
            onChange={(e) => setNewTargetPrice(e.target.value)}
            placeholder="e.g., 150.00"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Notes (optional)"
            fullWidth
            multiline
            rows={2}
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Why are you watching this stock?"
          />
          {addMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(addMutation.error as Error).message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={!newTicker.trim() || addMutation.isPending}
          >
            {addMutation.isPending ? <CircularProgress size={20} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Check Snackbar */}
      <Snackbar
        open={alertSnackbarOpen}
        autoHideDuration={6000}
        onClose={() => setAlertSnackbarOpen(false)}
        message={
          alerts.length > 0
            ? `${alerts.length} stock${alerts.length > 1 ? 's' : ''} at or below target price!`
            : 'No stocks at target price yet.'
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

export const Route = createFileRoute('/watchlist')({
  component: WatchlistPage,
});
