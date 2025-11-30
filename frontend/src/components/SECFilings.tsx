/**
 * SEC Filings Component
 *
 * Displays a list of SEC filings (10-K, 10-Q) for a company
 * with links to view the original documents on SEC.gov.
 *
 * WHY this component?
 * - SEC filings contain critical investor information
 * - 10-K annual reports have detailed business descriptions
 * - 10-Q quarterly reports show recent financial performance
 * - Risk factors and MD&A sections are essential for due diligence
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Collapse,
  Paper,
  Link,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { format } from 'date-fns';
import { filingsApi, type SECFiling } from '../lib/api';

interface SECFilingsProps {
  ticker: string;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get chip color based on form type
 */
function getFormColor(form: string): 'primary' | 'secondary' | 'default' {
  if (form === '10-K') return 'primary';
  if (form === '10-Q') return 'secondary';
  return 'default';
}

export function SECFilings({ ticker }: SECFilingsProps) {
  const [expanded, setExpanded] = useState(false);
  const [formFilter, setFormFilter] = useState<string>('all');

  // Fetch filings data
  const {
    data: filingsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['filings', ticker],
    queryFn: () => filingsApi.getFilings(ticker, { limit: 20 }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter filings based on selected form type
  const filteredFilings =
    filingsData?.filings.filter((filing) => {
      if (formFilter === 'all') return true;
      return filing.form === formFilter;
    }) ?? [];

  // Handle form filter change
  const handleFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: string | null
  ) => {
    if (newFilter !== null) {
      setFormFilter(newFilter);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <DescriptionIcon color="action" />
            <Typography variant="h6">SEC Filings</Typography>
          </Box>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <DescriptionIcon color="action" />
            <Typography variant="h6">SEC Filings</Typography>
          </Box>
          <Alert severity="warning">
            Unable to load SEC filings. The company may not be registered with the SEC.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // No filings found
  if (!filingsData || filingsData.filings.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <DescriptionIcon color="action" />
            <Typography variant="h6">SEC Filings</Typography>
          </Box>
          <Alert severity="info">No SEC filings found for {ticker}.</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header with toggle */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ cursor: 'pointer' }}
          onClick={() => setExpanded(!expanded)}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <DescriptionIcon color="action" />
            <Typography variant="h6">SEC Filings</Typography>
            <Chip
              label={`${filingsData.filings.length} filings`}
              size="small"
              variant="outlined"
            />
          </Box>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {/* Expanded content */}
        <Collapse in={expanded}>
          <Box mt={2}>
            {/* Filter buttons */}
            <Box mb={2}>
              <ToggleButtonGroup
                value={formFilter}
                exclusive
                onChange={handleFilterChange}
                size="small"
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="10-K">10-K (Annual)</ToggleButton>
                <ToggleButton value="10-Q">10-Q (Quarterly)</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Filings table */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Form</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Filing Date</TableCell>
                    <TableCell>Report Date</TableCell>
                    <TableCell align="right">Size</TableCell>
                    <TableCell align="center">View</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFilings.map((filing) => (
                    <FilingRow key={filing.accessionNumber} filing={filing} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* SEC disclaimer */}
            <Typography variant="caption" color="text.secondary" mt={2} display="block">
              Data from{' '}
              <Link
                href="https://www.sec.gov/edgar"
                target="_blank"
                rel="noopener noreferrer"
              >
                SEC EDGAR
              </Link>
              . Click the open icon to view the original filing on SEC.gov.
            </Typography>
          </Box>
        </Collapse>

        {/* Summary when collapsed */}
        {!expanded && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Latest filings from {filingsData.companyName}
            </Typography>
            <Box display="flex" gap={1} mt={1} flexWrap="wrap">
              {filingsData.filings.slice(0, 3).map((filing) => (
                <Chip
                  key={filing.accessionNumber}
                  label={`${filing.form} - ${format(new Date(filing.filingDate), 'MMM yyyy')}`}
                  size="small"
                  color={getFormColor(filing.form)}
                  variant="outlined"
                  component="a"
                  href={filing.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                />
              ))}
              {filingsData.filings.length > 3 && (
                <Chip
                  label={`+${filingsData.filings.length - 3} more`}
                  size="small"
                  variant="outlined"
                  onClick={() => setExpanded(true)}
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Individual filing row component
 */
function FilingRow({ filing }: { filing: SECFiling }) {
  return (
    <TableRow hover>
      <TableCell>
        <Chip
          label={filing.form}
          size="small"
          color={getFormColor(filing.form)}
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
          {filing.description || filing.primaryDocument}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {format(new Date(filing.filingDate), 'MMM d, yyyy')}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {format(new Date(filing.reportDate), 'MMM d, yyyy')}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="text.secondary">
          {formatFileSize(filing.size)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Tooltip title="View on SEC.gov">
          <IconButton
            size="small"
            component="a"
            href={filing.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
