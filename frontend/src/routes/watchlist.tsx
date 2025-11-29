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
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { useState } from 'react';
import { watchlistApi, type WatchlistItem } from '../lib/api';
import { getChangeColor, getScoreColor } from '../theme';

function WatchlistPage() {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [newTargetPrice, setNewTargetPrice] = useState('');
  const [newNotes, setNewNotes] = useState('');

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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Stock
        </Button>
      </Box>

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
              {watchlist.map((item: WatchlistItem) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography
                      component={Link}
                      to={`/analysis/${item.ticker}`}
                      sx={{ fontWeight: 'bold', textDecoration: 'none', color: 'primary.main' }}
                    >
                      {item.ticker}
                    </Typography>
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
              ))}
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
    </Box>
  );
}

export const Route = createFileRoute('/watchlist')({
  component: WatchlistPage,
});
