import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { companyApi, type FinancialData } from '../lib/api';
import { FinancialsTableSkeleton } from './TableSkeleton';

interface FinancialsTableProps {
  ticker: string;
}

// Format large numbers to readable format (e.g., 1.5B, 250M)
function formatNumber(value: number | null): string {
  if (value === null) return 'N/A';

  const absValue = Math.abs(value);

  if (absValue >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T`;
  }
  if (absValue >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  }
  if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }

  return value.toFixed(2);
}

// Format percentage
function formatPercent(value: number | null): string {
  if (value === null) return 'N/A';
  return `${value.toFixed(1)}%`;
}

// Tab panel component
interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`financials-tabpanel-${index}`}
      aria-labelledby={`financials-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </Box>
  );
}

// Income Statement tab content
function IncomeStatementTab({ financials }: { financials: FinancialData[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Year</TableCell>
            {financials.map((f) => (
              <TableCell key={f.fiscalYear} align="right" sx={{ fontWeight: 600 }}>
                {f.fiscalYear}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Revenue</TableCell>
            {financials.map((f) => (
              <TableCell key={f.fiscalYear} align="right">
                {formatNumber(f.revenue)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow sx={{ backgroundColor: '#fafafa' }}>
            <TableCell>Operating Income</TableCell>
            {financials.map((f) => (
              <TableCell key={f.fiscalYear} align="right">
                {formatNumber(f.operatingIncome)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell>Net Income</TableCell>
            {financials.map((f) => (
              <TableCell key={f.fiscalYear} align="right">
                {formatNumber(f.netIncome)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow sx={{ backgroundColor: '#fafafa' }}>
            <TableCell sx={{ fontWeight: 500 }}>EPS</TableCell>
            {financials.map((f) => (
              <TableCell key={f.fiscalYear} align="right" sx={{ fontWeight: 500 }}>
                {f.eps !== null ? `$${f.eps.toFixed(2)}` : 'N/A'}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Balance Sheet tab content
function BalanceSheetTab({ financials }: { financials: FinancialData[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Year</TableCell>
            {financials.map((f) => (
              <TableCell key={f.fiscalYear} align="right" sx={{ fontWeight: 600 }}>
                {f.fiscalYear}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell sx={{ fontWeight: 500 }}>Total Equity</TableCell>
            {financials.map((f) => (
              <TableCell key={f.fiscalYear} align="right" sx={{ fontWeight: 500 }}>
                {formatNumber(f.totalEquity)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow sx={{ backgroundColor: '#fafafa' }}>
            <TableCell>Long-term Debt</TableCell>
            {financials.map((f) => (
              <TableCell key={f.fiscalYear} align="right">
                {formatNumber(f.longTermDebt)}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Cash Flow / Returns tab content
function CashFlowTab({ financials }: { financials: FinancialData[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Year</TableCell>
            {financials.map((f) => (
              <TableCell key={f.fiscalYear} align="right" sx={{ fontWeight: 600 }}>
                {f.fiscalYear}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell sx={{ fontWeight: 500 }}>Free Cash Flow</TableCell>
            {financials.map((f) => (
              <TableCell key={f.fiscalYear} align="right" sx={{ fontWeight: 500 }}>
                {formatNumber(f.freeCashFlow)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow sx={{ backgroundColor: '#fafafa' }}>
            <TableCell sx={{ fontWeight: 500 }}>ROIC</TableCell>
            {financials.map((f) => (
              <TableCell
                key={f.fiscalYear}
                align="right"
                sx={{
                  fontWeight: 500,
                  color:
                    f.roic !== null
                      ? f.roic >= 10
                        ? 'success.main'
                        : f.roic >= 0
                          ? 'warning.main'
                          : 'error.main'
                      : 'text.secondary',
                }}
              >
                {formatPercent(f.roic)}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * FinancialsTable Component
 *
 * Displays historical financial data in a tabbed interface:
 * - Income Statement: Revenue, Operating Income, Net Income, EPS
 * - Balance Sheet: Total Equity, Long-term Debt
 * - Cash Flow & Returns: Free Cash Flow, ROIC
 */
export function FinancialsTable({ ticker }: FinancialsTableProps) {
  const [tabValue, setTabValue] = useState(0);

  const {
    data: financials,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['financials', ticker],
    queryFn: () => companyApi.getFinancials(ticker),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <Paper variant="outlined">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ width: 140, height: 36, bgcolor: '#e0e0e0', borderRadius: 1 }} />
            <Box sx={{ width: 120, height: 36, bgcolor: '#f5f5f5', borderRadius: 1 }} />
            <Box sx={{ width: 150, height: 36, bgcolor: '#f5f5f5', borderRadius: 1 }} />
          </Box>
        </Box>
        <Box sx={{ p: 2 }}>
          <FinancialsTableSkeleton />
        </Box>
      </Paper>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load financials: {(error as Error).message}
      </Alert>
    );
  }

  if (!financials || financials.length === 0) {
    return (
      <Alert severity="info">No financial data available for {ticker}</Alert>
    );
  }

  return (
    <Paper variant="outlined">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="financials tabs"
          variant="fullWidth"
        >
          <Tab
            label="Income Statement"
            id="financials-tab-0"
            aria-controls="financials-tabpanel-0"
          />
          <Tab
            label="Balance Sheet"
            id="financials-tab-1"
            aria-controls="financials-tabpanel-1"
          />
          <Tab
            label="Cash Flow & Returns"
            id="financials-tab-2"
            aria-controls="financials-tabpanel-2"
          />
        </Tabs>
      </Box>

      <Box sx={{ p: 2 }}>
        <TabPanel value={tabValue} index={0}>
          <IncomeStatementTab financials={financials} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <BalanceSheetTab financials={financials} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <CashFlowTab financials={financials} />
        </TabPanel>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2, textAlign: 'right' }}
        >
          Showing {financials.length} years of annual data
        </Typography>
      </Box>
    </Paper>
  );
}

export default FinancialsTable;
