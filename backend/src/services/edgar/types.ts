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

/**
 * SEC Company Facts API Response (XBRL data)
 * GET https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json
 *
 * This is the FREE source for all financial statement data!
 * Contains all XBRL data from 10-K and 10-Q filings.
 */
export interface SECCompanyFacts {
  cik: number;
  entityName: string;
  facts: {
    dei: Record<string, SECFactData>;
    'us-gaap': Record<string, SECFactData>;
  };
}

/**
 * Individual fact data (e.g., Revenues, NetIncomeLoss)
 */
export interface SECFactData {
  label: string;
  description: string;
  units: {
    USD?: SECFactUnit[];
    shares?: SECFactUnit[];
    'USD/shares'?: SECFactUnit[];
    pure?: SECFactUnit[];
  };
}

/**
 * Individual fact value with period information
 */
export interface SECFactUnit {
  start?: string; // Period start date
  end: string; // Period end date (for instant facts, this is the date)
  val: number; // The value
  accn: string; // Accession number of filing
  fy: number; // Fiscal year
  fp: string; // Fiscal period: 'FY', 'Q1', 'Q2', 'Q3', 'Q4'
  form: string; // '10-K', '10-Q', etc.
  filed: string; // Filing date
  frame?: string; // Calendar frame: 'CY2023', 'CY2023Q1', etc.
}

/**
 * XBRL tag mappings to our normalized financial statement fields
 *
 * WHY these mappings?
 * - Companies use different XBRL tags for similar concepts
 * - We need to normalize to a single field name
 * - Priority order matters (first match wins)
 */
export const XBRL_TAG_MAPPINGS = {
  // Revenue - companies use different tags
  revenue: [
    'RevenueFromContractWithCustomerExcludingAssessedTax', // Most common (ASC 606)
    'Revenues', // General revenue
    'SalesRevenueNet', // Net sales
    'SalesRevenueGoodsNet',
    'SalesRevenueServicesNet',
  ],

  // Cost of Revenue
  costOfRevenue: [
    'CostOfGoodsAndServicesSold',
    'CostOfRevenue',
    'CostOfGoodsSold',
    'CostOfServices',
  ],

  // Gross Profit
  grossProfit: ['GrossProfit'],

  // Operating Expenses
  operatingExpenses: [
    'OperatingExpenses',
    'CostsAndExpenses', // Some companies use this
  ],

  // Operating Income
  operatingIncome: [
    'OperatingIncomeLoss',
    'IncomeLossFromOperations',
  ],

  // Interest Expense
  interestExpense: [
    'InterestExpense',
    'InterestAndDebtExpense',
    'InterestExpenseDebt',
  ],

  // Income Before Tax
  incomeBeforeTax: [
    'IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest',
    'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments',
    'IncomeLossFromContinuingOperationsBeforeIncomeTaxesForeign',
    'IncomeLossFromContinuingOperationsBeforeIncomeTaxesDomestic',
  ],

  // Income Tax Expense
  incomeTaxExpense: [
    'IncomeTaxExpenseBenefit',
    'IncomeTaxesPaidNet',
  ],

  // Net Income
  netIncome: [
    'NetIncomeLoss',
    'NetIncomeLossAvailableToCommonStockholdersBasic',
    'ProfitLoss',
  ],

  // EPS
  eps: ['EarningsPerShareBasic'],
  epsDiluted: ['EarningsPerShareDiluted'],

  // Shares Outstanding
  sharesOutstanding: [
    'CommonStockSharesOutstanding',
    'WeightedAverageNumberOfSharesOutstandingBasic',
  ],

  // Balance Sheet - Assets
  cashAndEquivalents: [
    'CashAndCashEquivalentsAtCarryingValue',
    'Cash',
  ],
  shortTermInvestments: [
    'ShortTermInvestments',
    'MarketableSecuritiesCurrent',
    'AvailableForSaleSecuritiesCurrent',
  ],
  totalCurrentAssets: ['AssetsCurrent'],
  propertyPlantEquip: [
    'PropertyPlantAndEquipmentNet',
    'PropertyPlantAndEquipmentAndFinanceLeaseRightOfUseAssetAfterAccumulatedDepreciationAndAmortization',
  ],
  goodwill: ['Goodwill'],
  intangibleAssets: [
    'IntangibleAssetsNetExcludingGoodwill',
    'FiniteLivedIntangibleAssetsNet',
  ],
  totalAssets: ['Assets'],

  // Balance Sheet - Liabilities
  accountsPayable: [
    'AccountsPayableCurrent',
    'AccountsPayableAndAccruedLiabilitiesCurrent',
  ],
  shortTermDebt: [
    'ShortTermBorrowings',
    'DebtCurrent',
    'LongTermDebtCurrent',
  ],
  totalCurrentLiab: ['LiabilitiesCurrent'],
  longTermDebt: [
    'LongTermDebtNoncurrent',
    'LongTermDebt',
    'LongTermDebtAndCapitalLeaseObligations',
  ],
  totalLiabilities: ['Liabilities'],

  // Equity
  totalEquity: [
    'StockholdersEquity',
    'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
  ],

  // Cash Flow
  operatingCashFlow: [
    'NetCashProvidedByUsedInOperatingActivities',
    'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations',
  ],
  capitalExpenditures: [
    'PaymentsToAcquirePropertyPlantAndEquipment',
    'PaymentsToAcquireProductiveAssets',
  ],
  dividendsPaid: [
    'PaymentsOfDividendsCommonStock',
    'PaymentsOfDividends',
    'DividendsCommonStockCash',
  ],

  // Net Change in Cash
  netChangeInCash: [
    'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecreaseIncludingExchangeRateEffect',
    'CashAndCashEquivalentsPeriodIncreaseDecrease',
    'NetCashProvidedByUsedInContinuingOperations',
  ],

  // Key Metrics (for ROIC calculation)
  investedCapital: [
    'InvestedCapital', // Rarely directly reported
  ],
} as const;

/**
 * Extracted annual financial statement from SEC XBRL data
 */
export interface SECExtractedFinancials {
  fiscalYear: number;
  periodEndDate: string;
  filingDate: string;

  // Income Statement
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  operatingExpenses: number | null;
  operatingIncome: number | null;
  interestExpense: number | null;
  incomeBeforeTax: number | null;
  incomeTaxExpense: number | null;
  netIncome: number | null;
  eps: number | null;
  epsDiluted: number | null;
  sharesOutstanding: number | null;

  // Balance Sheet
  cashAndEquivalents: number | null;
  shortTermInvestments: number | null;
  totalCurrentAssets: number | null;
  propertyPlantEquip: number | null;
  goodwill: number | null;
  intangibleAssets: number | null;
  totalAssets: number | null;
  accountsPayable: number | null;
  shortTermDebt: number | null;
  totalCurrentLiab: number | null;
  longTermDebt: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;

  // Cash Flow
  operatingCashFlow: number | null;
  capitalExpenditures: number | null;
  freeCashFlow: number | null; // Calculated: operatingCashFlow - capitalExpenditures
  dividendsPaid: number | null;
  netChangeInCash: number | null;

  // Book Value Per Share (calculated from totalEquity / sharesOutstanding)
  bookValuePerShare: number | null;
}
