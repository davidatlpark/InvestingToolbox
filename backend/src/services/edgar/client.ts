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
}

// Export singleton instance
export const secEdgarClient = new SECEdgarClient();
