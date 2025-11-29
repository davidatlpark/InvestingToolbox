import { createTheme } from '@mui/material/styles';

// Custom color palette for finance/investing theme
const palette = {
  primary: {
    main: '#1976d2', // Professional blue
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#fff',
  },
  secondary: {
    main: '#9c27b0', // Purple accent
    light: '#ba68c8',
    dark: '#7b1fa2',
    contrastText: '#fff',
  },
  success: {
    main: '#2e7d32', // Green for positive values
    light: '#4caf50',
    dark: '#1b5e20',
  },
  error: {
    main: '#d32f2f', // Red for negative values
    light: '#ef5350',
    dark: '#c62828',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
  },
};

// Score color helpers
export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#2e7d32'; // Green - Excellent
  if (score >= 60) return '#558b2f'; // Light green - Good
  if (score >= 40) return '#f9a825'; // Yellow - Fair
  if (score >= 20) return '#ef6c00'; // Orange - Poor
  return '#c62828'; // Red - Bad
};

export const getChangeColor = (change: number): string => {
  if (change > 0) return palette.success.main;
  if (change < 0) return palette.error.main;
  return palette.text.secondary;
};

export const theme = createTheme({
  palette,
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f5f5',
        },
      },
    },
  },
});
