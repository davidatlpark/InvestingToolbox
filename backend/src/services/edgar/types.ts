/**
 * SEC EDGAR API Types
 *
 * Type definitions for SEC EDGAR filing data.
 * The SEC provides free access to all public filings.
 *
 * WHY these types?
 * - SEC returns specific JSON structure for company data
 * - Filing documents have standard naming conventions
 * - Type safety ensures we handle the data correctly
 */

/**
 * Company submission data from SEC
 * GET https://data.sec.gov/submissions/CIK{cik}.json
 */
export interface SECCompanySubmissions {
  cik: string;
  entityType: string;
  sic: string;
  sicDescription: string;
  name: string;
  tickers: string[];
  exchanges: string[];
  ein: string;
  fiscalYearEnd: string;
  stateOfIncorporation: string;
  filings: {
    recent: SECRecentFilings;
    files: Array<{
      name: string;
      filingCount: number;
      filingFrom: string;
      filingTo: string;
    }>;
  };
}

/**
 * Recent filings array data
 */
export interface SECRecentFilings {
  accessionNumber: string[];
  filingDate: string[];
  reportDate: string[];
  acceptanceDateTime: string[];
  act: string[];
  form: string[];
  fileNumber: string[];
  filmNumber: string[];
  items: string[];
  size: number[];
  isXBRL: number[];
  isInlineXBRL: number[];
  primaryDocument: string[];
  primaryDocDescription: string[];
}

/**
 * Parsed filing information
 */
export interface SECFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string; // '10-K', '10-Q', '8-K', etc.
  description: string;
  primaryDocument: string;
  documentUrl: string;
  size: number;
  isXBRL: boolean;
}

/**
 * Company ticker to CIK mapping
 * GET https://www.sec.gov/files/company_tickers.json
 */
export interface SECTickerMapping {
  [key: string]: {
    cik_str: number;
    ticker: string;
    title: string;
  };
}

/**
 * Filing document content (parsed)
 */
export interface SECFilingDocument {
  filing: SECFiling;
  content: string; // HTML content of the filing
  sections?: SECFilingSection[];
}

/**
 * Parsed sections from a 10-K or 10-Q filing
 * These are the standard sections investors look for
 */
export interface SECFilingSection {
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Standard 10-K sections (Form 10-K structure)
 */
export const FORM_10K_SECTIONS = [
  { id: 'item1', title: 'Item 1 - Business', regex: /item\s*1[.\s-]*business/i },
  { id: 'item1a', title: 'Item 1A - Risk Factors', regex: /item\s*1a[.\s-]*risk\s*factors/i },
  { id: 'item1b', title: 'Item 1B - Unresolved Staff Comments', regex: /item\s*1b/i },
  { id: 'item2', title: 'Item 2 - Properties', regex: /item\s*2[.\s-]*properties/i },
  { id: 'item3', title: 'Item 3 - Legal Proceedings', regex: /item\s*3[.\s-]*legal/i },
  { id: 'item4', title: 'Item 4 - Mine Safety', regex: /item\s*4/i },
  { id: 'item5', title: 'Item 5 - Market for Common Equity', regex: /item\s*5/i },
  { id: 'item6', title: 'Item 6 - Selected Financial Data', regex: /item\s*6/i },
  { id: 'item7', title: 'Item 7 - MD&A', regex: /item\s*7[.\s-]*(management|md&a)/i },
  { id: 'item7a', title: 'Item 7A - Market Risk', regex: /item\s*7a/i },
  { id: 'item8', title: 'Item 8 - Financial Statements', regex: /item\s*8[.\s-]*financial/i },
  { id: 'item9', title: 'Item 9 - Accountant Changes', regex: /item\s*9[^a]/i },
  { id: 'item9a', title: 'Item 9A - Controls and Procedures', regex: /item\s*9a/i },
] as const;

/**
 * API response types for our endpoints
 */
export interface FilingsListResponse {
  ticker: string;
  companyName: string;
  cik: string;
  filings: SECFiling[];
}

export interface FilingContentResponse {
  filing: SECFiling;
  contentUrl: string;
  sections: Array<{
    id: string;
    title: string;
    available: boolean;
  }>;
}
