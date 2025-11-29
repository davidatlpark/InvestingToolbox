import { Component, type ReactNode } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

// Props for the ErrorBoundary component
interface ErrorBoundaryProps {
  children: ReactNode;
  // Optional fallback UI to render instead of the default
  fallback?: ReactNode;
  // Optional callback when an error is caught
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// State for tracking error status
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs them, and displays a fallback UI instead of crashing the app.
 *
 * Why a class component?
 * React currently only supports error boundaries as class components
 * because they rely on the getDerivedStateFromError and componentDidCatch
 * lifecycle methods, which don't have functional equivalents.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Static method called when an error is thrown.
   * Updates state to trigger fallback UI on next render.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Lifecycle method for logging errors.
   * Called after an error has been thrown by a descendant component.
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Resets the error state, allowing children to re-render.
   * Useful for "try again" functionality.
   */
  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  /**
   * Refreshes the page as a last resort recovery option.
   */
  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '50vh',
              py: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                maxWidth: 500,
                width: '100%',
              }}
            >
              {/* Error Icon */}
              <ErrorIcon
                sx={{
                  fontSize: 64,
                  color: 'error.main',
                  mb: 2,
                }}
              />

              {/* Error Title */}
              <Typography variant="h5" component="h1" gutterBottom>
                Something went wrong
              </Typography>

              {/* Error Description */}
              <Typography variant="body1" color="text.secondary" paragraph>
                An unexpected error occurred. This might be a temporary issue.
                Try refreshing the page or going back to the home page.
              </Typography>

              {/* Error Details (in development) */}
              {import.meta.env.DEV && this.state.error && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 3,
                    backgroundColor: 'grey.100',
                    textAlign: 'left',
                    overflow: 'auto',
                    maxHeight: 150,
                  }}
                >
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      m: 0,
                    }}
                  >
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </Typography>
                </Paper>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRefresh}
                >
                  Refresh Page
                </Button>
              </Box>
            </Paper>
          </Box>
        </Container>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

// Export as default for convenient importing
export default ErrorBoundary;
