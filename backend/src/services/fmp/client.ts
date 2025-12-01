import axios, { type AxiosInstance } from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type {
  FMPCompanyProfile,
  FMPIncomeStatement,
  FMPBalanceSheet,
  FMPCashFlowStatement,
  FMPQuote,
  FMPSearchResult,
  FMPKeyMetrics,
  NormalizedFinancialStatement,
} from './types.js';

/**
 * FMP API Client
 *
 * Uses the new stable API endpoints (not legacy v3).
 * FMP deprecated /api/v3 endpoints on August 31, 2025.
 *
 * Key differences from legacy API:
 * - Base URL: /stable instead of /api/v3
 * - Query params: ?symbol=AAPL instead of path /AAPL
 * - Search: /search-name instead of /search
 */
class FMPClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = env.FMP_API_KEY;
    this.client = axios.create({
      // Use new stable API endpoint (not deprecated v3)
      baseURL: 'https://financialmodelingprep.com/stable',
      timeout: 30000,
    });

    // Add API key to all requests
    this.client.interceptors.request.use((config) => {
      config.params = {
        ...config.params,
        apikey: this.apiKey,
      };
      return config;
    });

    // Log errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error(`FMP API Error: ${error.message}`);
        throw error;
      }
    );
  }

  // Get company profile
  // Stable API: /profile?symbol=AAPL
  async getCompanyProfile(ticker: string): Promise<FMPCompanyProfile | null> {
    try {
      const response = await this.client.get<FMPCompanyProfile[]>('/profile', {
        params: { symbol: ticker },
      });
      return response.data[0] || null;
    } catch (error) {
      logger.error(`Failed to fetch profile for ${ticker}`);
      return null;
    }
  }

  // Get income statements
  // Stable API: /income-statement?symbol=AAPL&limit=10
  async getIncomeStatements(ticker: string, limit = 10): Promise<FMPIncomeStatement[]> {
    try {
      const response = await this.client.get<FMPIncomeStatement[]>('/income-statement', {
        params: { symbol: ticker, limit },
      });
      return response.data || [];
    } catch (error) {
      logger.error(`Failed to fetch income statements for ${ticker}`);
      return [];
    }
  }

  // Get balance sheets
  // Stable API: /balance-sheet-statement?symbol=AAPL&limit=10
  async getBalanceSheets(ticker: string, limit = 10): Promise<FMPBalanceSheet[]> {
    try {
      const response = await this.client.get<FMPBalanceSheet[]>('/balance-sheet-statement', {
        params: { symbol: ticker, limit },
      });
      return response.data || [];
    } catch (error) {
      logger.error(`Failed to fetch balance sheets for ${ticker}`);
      return [];
    }
  }

  // Get cash flow statements
  // Stable API: /cash-flow-statement?symbol=AAPL&limit=10
  async getCashFlowStatements(ticker: string, limit = 10): Promise<FMPCashFlowStatement[]> {
    try {
      const response = await this.client.get<FMPCashFlowStatement[]>('/cash-flow-statement', {
        params: { symbol: ticker, limit },
      });
      return response.data || [];
    } catch (error) {
      logger.error(`Failed to fetch cash flow statements for ${ticker}`);
      return [];
    }
  }

  // Get key metrics (includes ROIC)
  // Stable API: /key-metrics?symbol=AAPL&limit=10
  async getKeyMetrics(ticker: string, limit = 10): Promise<FMPKeyMetrics[]> {
    try {
      const response = await this.client.get<FMPKeyMetrics[]>('/key-metrics', {
        params: { symbol: ticker, limit },
      });
      return response.data || [];
    } catch (error) {
      logger.error(`Failed to fetch key metrics for ${ticker}`);
      return [];
    }
  }

  // Get current quote
  // Stable API: /quote?symbol=AAPL
  async getQuote(ticker: string): Promise<FMPQuote | null> {
    try {
      const response = await this.client.get<FMPQuote[]>('/quote', {
        params: { symbol: ticker },
      });
      return response.data[0] || null;
    } catch (error) {
      logger.error(`Failed to fetch quote for ${ticker}`);
      return null;
    }
  }

  // Get batch quotes
  // Stable API: /quote?symbol=AAPL,MSFT,GOOGL
  async getBatchQuotes(tickers: string[]): Promise<FMPQuote[]> {
    try {
      const tickerString = tickers.join(',');
      const response = await this.client.get<FMPQuote[]>('/quote', {
        params: { symbol: tickerString },
      });
      return response.data || [];
    } catch (error) {
      logger.error(`Failed to fetch batch quotes`);
      return [];
    }
  }

  // Search companies
  // Stable API: /search-name?query=Apple&limit=10
  async searchCompany(query: string, limit = 10): Promise<FMPSearchResult[]> {
    try {
      const response = await this.client.get<FMPSearchResult[]>('/search-name', {
        params: { query, limit },
      });
      return response.data || [];
    } catch (error) {
      logger.error(`Failed to search for ${query}`);
      return [];
    }
  }

  /**
   * Get all financial statements and normalize them
   *
   * Handles both legacy (calendarYear) and stable API (fiscalYear) field names
   */
  async getFinancialStatements(
    ticker: string,
    years = 10
  ): Promise<NormalizedFinancialStatement[]> {
    const [incomeStatements, balanceSheets, cashFlowStatements, keyMetrics] = await Promise.all([
      this.getIncomeStatements(ticker, years),
      this.getBalanceSheets(ticker, years),
      this.getCashFlowStatements(ticker, years),
      this.getKeyMetrics(ticker, years),
    ]);

    // Helper to get year from either calendarYear or fiscalYear field
    const getYear = (item: { calendarYear?: string; fiscalYear?: string }): string => {
      return item.fiscalYear || item.calendarYear || '';
    };

    // Create a map by year for easy lookup
    const balanceMap = new Map(balanceSheets.map((b) => [getYear(b), b]));
    const cashFlowMap = new Map(cashFlowStatements.map((c) => [getYear(c), c]));
    const metricsMap = new Map(keyMetrics.map((m) => [getYear(m), m]));

    // Normalize and combine
    return incomeStatements.map((income) => {
      const year = getYear(income);
      const balance = balanceMap.get(year);
      const cashFlow = cashFlowMap.get(year);
      const metrics = metricsMap.get(year);

      // Get ROIC from either legacy or stable API field
      const roicValue = metrics?.returnOnInvestedCapital ?? metrics?.roic;
      // Get ROE from either legacy or stable API field
      const roeValue = metrics?.returnOnEquity ?? metrics?.roe;

      return {
        fiscalYear: parseInt(year, 10),
        fiscalQuarter: income.period === 'FY' ? null : parseInt(income.period.replace('Q', ''), 10),
        periodEndDate: new Date(income.date),
        filingDate: income.fillingDate ? new Date(income.fillingDate) : null,

        // Income Statement
        revenue: income.revenue || null,
        costOfRevenue: income.costOfRevenue || null,
        grossProfit: income.grossProfit || null,
        operatingExpenses: income.operatingExpenses || null,
        operatingIncome: income.operatingIncome || null,
        interestExpense: income.interestExpense || null,
        incomeBeforeTax: income.incomeBeforeTax || null,
        incomeTaxExpense: income.incomeTaxExpense || null,
        netIncome: income.netIncome || null,
        eps: income.eps || null,
        epsDiluted: income.epsdiluted || null,
        sharesOutstanding: income.weightedAverageShsOut || null,

        // Balance Sheet
        cashAndEquivalents: balance?.cashAndCashEquivalents || null,
        shortTermInvestments: balance?.shortTermInvestments || null,
        totalCurrentAssets: balance?.totalCurrentAssets || null,
        propertyPlantEquip: balance?.propertyPlantEquipmentNet || null,
        goodwill: balance?.goodwill || null,
        intangibleAssets: balance?.intangibleAssets || null,
        totalAssets: balance?.totalAssets || null,
        accountsPayable: balance?.accountPayables || null,
        shortTermDebt: balance?.shortTermDebt || null,
        totalCurrentLiab: balance?.totalCurrentLiabilities || null,
        longTermDebt: balance?.longTermDebt || null,
        totalLiabilities: balance?.totalLiabilities || null,
        totalEquity: balance?.totalStockholdersEquity || null,
        bookValuePerShare: metrics?.bookValuePerShare || null,

        // Cash Flow
        operatingCashFlow: cashFlow?.operatingCashFlow || null,
        capitalExpenditures: cashFlow?.capitalExpenditure
          ? Math.abs(cashFlow.capitalExpenditure)
          : null,
        freeCashFlow: cashFlow?.freeCashFlow || null,
        dividendsPaid: cashFlow?.dividendsPaid ? Math.abs(cashFlow.dividendsPaid) : null,
        netChangeInCash: cashFlow?.netChangeInCash || null,

        // Pre-calculated metrics (handle both legacy and stable API field names)
        // Stable API returns values as decimals (0.52), so convert to percentage
        roic: roicValue ? roicValue * 100 : null,
        roe: roeValue ? roeValue * 100 : null,
        currentRatio: metrics?.currentRatio || null,
        debtToEquity: metrics?.debtToEquity || null,
      };
    });
  }
}

// Export singleton instance
export const fmpClient = new FMPClient();
