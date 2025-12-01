/**
 * SEC EDGAR API Client
 *
 * Fetches SEC filing data from the official EDGAR database.
 * All data is free and publicly available.
 *
 * WHY this client?
 * - SEC filings contain critical information for investors
 * - 10-K annual reports and 10-Q quarterly reports
 * - Risk factors, management discussion, financial statements
 *
 * API Documentation:
 * https://www.sec.gov/edgar/sec-api-documentation
 *
 * IMPORTANT: SEC requires a User-Agent header with contact info
 * https://www.sec.gov/os/webmaster-faq#code-support
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';
import {
  SECCompanySubmissions,
  SECFiling,
  SECTickerMapping,
  FilingsListResponse,
  SECCompanyFacts,
  SECExtractedFinancials,
  SECFactUnit,
  XBRL_TAG_MAPPINGS,
} from './types';

// Cache for ticker to CIK mapping (loaded once)
let tickerToCikCache: Map<string, { cik: string; name: string }> | null = null;

/**
 * SEC EDGAR API Client
 *
 * Handles all communication with SEC EDGAR database.
 * Uses caching to minimize API calls.
 */
export class SECEdgarClient {
  private client: AxiosInstance;

  constructor() {
    // SEC requires identifying User-Agent
    // Format: Company Name AdminContact@company.com
    this.client = axios.create({
      baseURL: 'https://data.sec.gov',
      headers: {
        'User-Agent': 'InvestingToolbox contact@example.com',
        Accept: 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Load ticker to CIK mapping from SEC
   * This is cached after first load
   */
  private async loadTickerMapping(): Promise<Map<string, { cik: string; name: string }>> {
    if (tickerToCikCache) {
      return tickerToCikCache;
    }

    try {
      logger.info('Loading SEC ticker to CIK mapping...');

      const response = await axios.get<SECTickerMapping>(
        'https://www.sec.gov/files/company_tickers.json',
        {
          headers: {
            'User-Agent': 'InvestingToolbox contact@example.com',
          },
        }
      );

      const mapping = new Map<string, { cik: string; name: string }>();

      // SEC returns object with numeric keys
      for (const key of Object.keys(response.data)) {
        const company = response.data[key];
        // Pad CIK to 10 digits (SEC format)
        const paddedCik = String(company.cik_str).padStart(10, '0');
        mapping.set(company.ticker.toUpperCase(), {
          cik: paddedCik,
          name: company.title,
        });
      }

      tickerToCikCache = mapping;
      logger.info(`Loaded ${mapping.size} ticker mappings`);

      return mapping;
    } catch (error) {
      logger.error('Failed to load ticker mapping:', error);
      throw new Error('Failed to load SEC ticker mapping');
    }
  }

  /**
   * Get CIK (Central Index Key) for a ticker symbol
   */
  async getCikForTicker(ticker: string): Promise<{ cik: string; name: string } | null> {
    const mapping = await this.loadTickerMapping();
    return mapping.get(ticker.toUpperCase()) ?? null;
  }

  /**
   * Get company submissions (all filings) from SEC
   */
  async getCompanySubmissions(cik: string): Promise<SECCompanySubmissions> {
    try {
      // CIK must be 10 digits, padded with zeros
      const paddedCik = cik.padStart(10, '0');

      const response = await this.client.get<SECCompanySubmissions>(
        `/submissions/CIK${paddedCik}.json`
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to get submissions for CIK ${cik}:`, error);
      throw new Error(`Failed to fetch SEC filings for CIK ${cik}`);
    }
  }

  /**
   * Get list of filings for a ticker
   * Filters to 10-K and 10-Q forms by default
   */
  async getFilings(
    ticker: string,
    options: {
      forms?: string[]; // Default: ['10-K', '10-Q']
      limit?: number; // Default: 20
    } = {}
  ): Promise<FilingsListResponse> {
    const { forms = ['10-K', '10-Q'], limit = 20 } = options;

    // Get CIK for ticker
    const cikData = await this.getCikForTicker(ticker);
    if (!cikData) {
      throw new Error(`No SEC data found for ticker ${ticker}`);
    }

    // Get all submissions
    const submissions = await this.getCompanySubmissions(cikData.cik);
    const recent = submissions.filings.recent;

    // Parse filings array
    const filings: SECFiling[] = [];
    const upperForms = forms.map((f) => f.toUpperCase());

    for (let i = 0; i < recent.accessionNumber.length && filings.length < limit; i++) {
      const form = recent.form[i];

      // Filter by form type
      if (!upperForms.includes(form.toUpperCase())) {
        continue;
      }

      // Format accession number for URL (remove dashes)
      const accessionNoForUrl = recent.accessionNumber[i].replace(/-/g, '');

      const filing: SECFiling = {
        accessionNumber: recent.accessionNumber[i],
        filingDate: recent.filingDate[i],
        reportDate: recent.reportDate[i],
        form: recent.form[i],
        description: recent.primaryDocDescription[i] || `${form} Filing`,
        primaryDocument: recent.primaryDocument[i],
        documentUrl: `https://www.sec.gov/Archives/edgar/data/${cikData.cik.replace(/^0+/, '')}/${accessionNoForUrl}/${recent.primaryDocument[i]}`,
        size: recent.size[i],
        isXBRL: recent.isXBRL[i] === 1,
      };

      filings.push(filing);
    }

    return {
      ticker: ticker.toUpperCase(),
      companyName: submissions.name,
      cik: cikData.cik,
      filings,
    };
  }

  /**
   * Get filing index page URL (contains links to all documents)
   */
  getFilingIndexUrl(cik: string, accessionNumber: string): string {
    const cleanCik = cik.replace(/^0+/, '');
    const accessionNoForUrl = accessionNumber.replace(/-/g, '');
    return `https://www.sec.gov/Archives/edgar/data/${cleanCik}/${accessionNoForUrl}/index.json`;
  }

  /**
   * Get the full document URL for a filing
   */
  getDocumentUrl(cik: string, accessionNumber: string, primaryDocument: string): string {
    const cleanCik = cik.replace(/^0+/, '');
    const accessionNoForUrl = accessionNumber.replace(/-/g, '');
    return `https://www.sec.gov/Archives/edgar/data/${cleanCik}/${accessionNoForUrl}/${primaryDocument}`;
  }

  /**
   * Get the SEC viewer URL (formatted HTML view)
   */
  getViewerUrl(accessionNumber: string): string {
    return `https://www.sec.gov/cgi-bin/viewer?action=view&cik=&accession_number=${accessionNumber.replace(/-/g, '')}&xbrl_type=v`;
  }

  /**
   * Search for a company by name or ticker
   * Returns basic company info with CIK
   */
  async searchCompany(
    query: string
  ): Promise<Array<{ ticker: string; cik: string; name: string }>> {
    const mapping = await this.loadTickerMapping();
    const results: Array<{ ticker: string; cik: string; name: string }> = [];
    const queryUpper = query.toUpperCase();

    for (const [ticker, data] of mapping) {
      // Match by ticker or company name
      if (ticker.includes(queryUpper) || data.name.toUpperCase().includes(queryUpper)) {
        results.push({
          ticker,
          cik: data.cik,
          name: data.name,
        });

        // Limit results
        if (results.length >= 10) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Get company facts (XBRL financial data) from SEC
   *
   * This is the FREE source for all financial statement data!
   * Contains all historical 10-K and 10-Q financial data.
   */
  async getCompanyFacts(cik: string): Promise<SECCompanyFacts> {
    try {
      const paddedCik = cik.padStart(10, '0');

      const response = await this.client.get<SECCompanyFacts>(
        `/api/xbrl/companyfacts/CIK${paddedCik}.json`
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to get company facts for CIK ${cik}:`, error);
      throw new Error(`Failed to fetch SEC financial data for CIK ${cik}`);
    }
  }

  /**
   * Get financial statements for a ticker from SEC XBRL data
   *
   * WHY this method?
   * - Extracts annual (10-K) financial data from SEC's free XBRL API
   * - Maps multiple XBRL tags to our normalized field names
   * - Returns data sorted by fiscal year (newest first)
   *
   * @param ticker - Stock ticker symbol
   * @param years - Number of years of history to return (default: 10)
   */
  async getFinancialStatements(
    ticker: string,
    years: number = 10
  ): Promise<SECExtractedFinancials[]> {
    // Get CIK for ticker
    const cikData = await this.getCikForTicker(ticker);
    if (!cikData) {
      throw new Error(`No SEC data found for ticker ${ticker}`);
    }

    // Get all company facts
    const facts = await this.getCompanyFacts(cikData.cik);
    const usGaap = facts.facts['us-gaap'];

    if (!usGaap) {
      logger.warn(`No US-GAAP data found for ${ticker}`);
      return [];
    }

    // Find all fiscal years with 10-K filings
    const fiscalYearsMap = new Map<number, {
      filingDate: string;
      periodEnd: string;
    }>();

    // Use revenue or net income to identify fiscal years
    const revenueTags = XBRL_TAG_MAPPINGS.revenue;
    for (const tag of revenueTags) {
      if (usGaap[tag]?.units?.USD) {
        for (const fact of usGaap[tag].units.USD) {
          // Only include 10-K filings (full year)
          if (fact.form === '10-K' && fact.fp === 'FY') {
            fiscalYearsMap.set(fact.fy, {
              filingDate: fact.filed,
              periodEnd: fact.end,
            });
          }
        }
        break; // Found revenue data, stop looking
      }
    }

    // Sort fiscal years descending and limit
    const sortedYears = Array.from(fiscalYearsMap.keys())
      .sort((a, b) => b - a)
      .slice(0, years);

    // Extract financial data for each year
    const financials: SECExtractedFinancials[] = [];

    for (const fy of sortedYears) {
      const yearInfo = fiscalYearsMap.get(fy)!;

      const statement: SECExtractedFinancials = {
        fiscalYear: fy,
        periodEndDate: yearInfo.periodEnd,
        filingDate: yearInfo.filingDate,

        // Income Statement
        revenue: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.revenue, fy, 'USD'),
        costOfRevenue: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.costOfRevenue, fy, 'USD'),
        grossProfit: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.grossProfit, fy, 'USD'),
        operatingExpenses: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.operatingExpenses, fy, 'USD'),
        operatingIncome: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.operatingIncome, fy, 'USD'),
        interestExpense: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.interestExpense, fy, 'USD'),
        incomeBeforeTax: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.incomeBeforeTax, fy, 'USD'),
        incomeTaxExpense: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.incomeTaxExpense, fy, 'USD'),
        netIncome: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.netIncome, fy, 'USD'),
        eps: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.eps, fy, 'USD/shares'),
        epsDiluted: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.epsDiluted, fy, 'USD/shares'),
        sharesOutstanding: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.sharesOutstanding, fy, 'shares'),

        // Balance Sheet (point-in-time values from 10-K)
        cashAndEquivalents: this.extractInstantValue(usGaap, XBRL_TAG_MAPPINGS.cashAndEquivalents, fy, 'USD'),
        shortTermInvestments: this.extractInstantValue(usGaap, XBRL_TAG_MAPPINGS.shortTermInvestments, fy, 'USD'),
        totalCurrentAssets: this.extractInstantValue(usGaap, XBRL_TAG_MAPPINGS.totalCurrentAssets, fy, 'USD'),
        propertyPlantEquip: this.extractInstantValue(usGaap, XBRL_TAG_MAPPINGS.propertyPlantEquip, fy, 'USD'),
        goodwill: this.extractInstantValue(usGaap, XBRL_TAG_MAPPINGS.goodwill, fy, 'USD'),
        intangibleAssets: this.extractInstantValue(usGaap, XBRL_TAG_MAPPINGS.intangibleAssets, fy, 'USD'),
        totalAssets: this.extractInstantValue(usGaap, XBRL_TAG_MAPPINGS.totalAssets, fy, 'USD'),
        accountsPayable: this.extractInstantValue(usGaap, XBRL_TAG_MAPPINGS.accountsPayable, fy, 'USD'),
        shortTermDebt: this.extractInstantValue(usGaap, XBRL_TAG_MAPPINGS.shortTermDebt, fy, 'USD'),
        totalCurrentLiab: this.extractInstantValue(usGaap, XBRL_TAG_MAPPINGS.totalCurrentLiab, fy, 'USD'),
        longTermDebt: this.extractInstantValue(usGaap, XBRL_TAG_MAPPINGS.longTermDebt, fy, 'USD'),
        totalLiabilities: this.extractInstantValue(usGaap, XBRL_TAG_MAPPINGS.totalLiabilities, fy, 'USD'),
        totalEquity: this.extractInstantValue(usGaap, XBRL_TAG_MAPPINGS.totalEquity, fy, 'USD'),

        // Cash Flow
        operatingCashFlow: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.operatingCashFlow, fy, 'USD'),
        capitalExpenditures: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.capitalExpenditures, fy, 'USD'),
        freeCashFlow: null, // Calculated below
        dividendsPaid: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.dividendsPaid, fy, 'USD'),
        netChangeInCash: this.extractValue(usGaap, XBRL_TAG_MAPPINGS.netChangeInCash, fy, 'USD'),

        // Book Value Per Share (calculated below)
        bookValuePerShare: null,
      };

      // Calculate derived fields
      // Free Cash Flow = Operating Cash Flow - Capital Expenditures
      if (statement.operatingCashFlow !== null && statement.capitalExpenditures !== null) {
        // CapEx is usually reported as positive, so we subtract
        statement.freeCashFlow = statement.operatingCashFlow - Math.abs(statement.capitalExpenditures);
      }

      // Book Value Per Share = Total Equity / Shares Outstanding
      if (statement.totalEquity !== null && statement.sharesOutstanding !== null && statement.sharesOutstanding > 0) {
        statement.bookValuePerShare = statement.totalEquity / statement.sharesOutstanding;
      }

      // EPS Fallback: If EPS not reported directly, calculate from NetIncome / SharesOutstanding
      // WHY? Some companies (like MNST) don't report EarningsPerShareBasic in XBRL consistently
      if (statement.eps === null && statement.netIncome !== null && statement.sharesOutstanding !== null && statement.sharesOutstanding > 0) {
        statement.eps = statement.netIncome / statement.sharesOutstanding;
        logger.debug(`Calculated EPS fallback for ${ticker} FY${fy}: ${statement.eps}`);
      }

      // Diluted EPS Fallback: Use basic EPS if diluted not available
      if (statement.epsDiluted === null && statement.eps !== null) {
        statement.epsDiluted = statement.eps;
      }

      financials.push(statement);
    }

    logger.info(`Extracted ${financials.length} years of financials for ${ticker} from SEC XBRL`);
    return financials;
  }

  /**
   * Extract a period value (income statement, cash flow) for a fiscal year
   *
   * WHY this approach?
   * - Income statement items are for a period (start to end)
   * - We look for 10-K filings with fp='FY'
   * - Try multiple XBRL tags in priority order
   */
  private extractValue(
    usGaap: Record<string, { units: { USD?: SECFactUnit[]; shares?: SECFactUnit[]; 'USD/shares'?: SECFactUnit[] } }>,
    tags: readonly string[],
    fiscalYear: number,
    unit: 'USD' | 'shares' | 'USD/shares'
  ): number | null {
    for (const tag of tags) {
      const factData = usGaap[tag];
      if (!factData?.units?.[unit]) continue;

      // Find the 10-K value for this fiscal year
      const fact = factData.units[unit].find(
        (f) => f.form === '10-K' && f.fp === 'FY' && f.fy === fiscalYear
      );

      if (fact) {
        return fact.val;
      }
    }

    return null;
  }

  /**
   * Extract an instant value (balance sheet) for a fiscal year
   *
   * WHY this approach?
   * - Balance sheet items are point-in-time (no start date)
   * - We look for the value at fiscal year end
   * - Some items appear in both 10-K and 10-Q, prefer 10-K
   */
  private extractInstantValue(
    usGaap: Record<string, { units: { USD?: SECFactUnit[]; shares?: SECFactUnit[] } }>,
    tags: readonly string[],
    fiscalYear: number,
    unit: 'USD' | 'shares'
  ): number | null {
    for (const tag of tags) {
      const factData = usGaap[tag];
      if (!factData?.units?.[unit]) continue;

      // For balance sheet items, find the value from 10-K filing
      // Instant facts have 'end' date but no 'start'
      const fact = factData.units[unit].find(
        (f) => f.form === '10-K' && f.fp === 'FY' && f.fy === fiscalYear
      );

      if (fact) {
        return fact.val;
      }
    }

    return null;
  }
}

// Export singleton instance
export const secEdgarClient = new SECEdgarClient();
