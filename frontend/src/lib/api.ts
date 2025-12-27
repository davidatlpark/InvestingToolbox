import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// =============================================================================
// API Configuration
// =============================================================================

// API client configured to proxy through Vite in development
export const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================================================
// Retry Logic
// =============================================================================

/**
 * Configuration for retry behavior
 *
 * WHY: Network requests can fail transiently due to:
 * - Network blips
 * - Server restarts
 * - Rate limiting
 * - Temporary overload
 *
 * Retrying automatically improves UX without user intervention.
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // Start with 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Timeout, Rate limit, Server errors
};

// Extend Axios config to track retry count
interface RetryConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

/**
 * Calculate delay with exponential backoff
 *
 * WHY exponential backoff?
 * - Gives server time to recover
 * - Spreads out retry attempts
 * - Prevents thundering herd problem
 *
 * Example: 1s -> 2s -> 4s
 */
function getRetryDelay(retryCount: number): number {
  return RETRY_CONFIG.retryDelay * Math.pow(2, retryCount);
}

/**
 * Check if an error should trigger a retry
 */
function shouldRetry(error: AxiosError, config: RetryConfig): boolean {
  const retryCount = config.__retryCount || 0;

  // Don't retry if we've exhausted attempts
  if (retryCount >= RETRY_CONFIG.maxRetries) {
    return false;
  }

  // Retry on network errors (no response)
  if (!error.response) {
    return true;
  }

  // Retry on specific status codes
  return RETRY_CONFIG.retryableStatuses.includes(error.response.status);
}

// Response interceptor for retry logic
api.interceptors.response.use(
  // Success - pass through
  (response) => response,

  // Error - potentially retry
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;

    // No config means we can't retry
    if (!config) {
      return Promise.reject(transformError(error));
    }

    // Check if we should retry
    if (!shouldRetry(error, config)) {
      return Promise.reject(transformError(error));
    }

    // Increment retry count
    config.__retryCount = (config.__retryCount || 0) + 1;

    // Calculate delay
    const delay = getRetryDelay(config.__retryCount);

    // Log retry attempt (helpful for debugging)
    console.log(
      `[API] Retrying request (${config.__retryCount}/${RETRY_CONFIG.maxRetries}) ` +
      `to ${config.url} in ${delay}ms`
    );

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry the request
    return api.request(config);
  }
);

// =============================================================================
// Error Transformation
// =============================================================================

/**
 * API Error with user-friendly message and details
 *
 * WHY a custom error class?
 * - Consistent error handling across the app
 * - User-friendly messages separate from technical details
 * - Easy to check error type with instanceof
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if this is a network error (no response from server)
   */
  isNetworkError(): boolean {
    return this.statusCode === 0;
  }

  /**
   * Check if this is a rate limit error
   */
  isRateLimited(): boolean {
    return this.statusCode === 429;
  }

  /**
   * Check if this is a not found error
   */
  isNotFound(): boolean {
    return this.statusCode === 404;
  }

  /**
   * Check if this is a validation error
   */
  isValidationError(): boolean {
    return this.statusCode === 400 && this.code === 'VALIDATION_ERROR';
  }
}

/**
 * Transform Axios error into user-friendly ApiError
 *
 * WHY transform errors?
 * - Raw Axios errors contain technical details users don't need
 * - We want consistent error messages across the app
 * - Makes it easier to show appropriate UI feedback
 */
function transformError(error: AxiosError): ApiError {
  // Network error - no response received
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new ApiError(
        'Request timed out. Please check your connection and try again.',
        0,
        'TIMEOUT'
      );
    }
    return new ApiError(
      'Unable to connect to the server. Please check your internet connection.',
      0,
      'NETWORK_ERROR'
    );
  }

  const { status, data } = error.response;
  const errorData = data as { error?: { message?: string; code?: string; details?: unknown } };

  // Extract error info from response
  const message = errorData?.error?.message || getDefaultMessage(status);
  const code = errorData?.error?.code;
  const details = errorData?.error?.details;

  return new ApiError(message, status, code, details);
}

/**
 * Get default user-friendly message for HTTP status codes
 */
function getDefaultMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'You need to be logged in to do this.';
    case 403:
      return 'You don\'t have permission to do this.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Something went wrong on our end. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'The server is temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Company Analysis types
export interface CompanyAnalysis {
  company: {
    ticker: string;
    name: string;
    sector: string | null;
    industry: string | null;
    description: string | null;
    marketCap: number | null;
    currentPrice: number | null;
  };
  scores: {
    valueScore: number;
    roicScore: number;
    moatScore: number;
    debtScore: number;
    managementScore: number;
    isPredictable: boolean;
  };
  bigFive: {
    roic: { year1: number | null; year5: number | null; year10: number | null };
    epsGrowth: {
      year1: number | null;
      year5: number | null;
      year10: number | null;
      maxYear: number | null;
      maxYearPeriod: number;
    };
    revenueGrowth: {
      year1: number | null;
      year5: number | null;
      year10: number | null;
      maxYear: number | null;
      maxYearPeriod: number;
    };
    equityGrowth: {
      year1: number | null;
      year5: number | null;
      year10: number | null;
      maxYear: number | null;
      maxYearPeriod: number;
    };
    fcfGrowth: {
      year1: number | null;
      year5: number | null;
      year10: number | null;
      maxYear: number | null;
      maxYearPeriod: number;
    };
  };
  valuation: {
    stickerPrice: number | null;
    mosPrice: number | null;
    paybackTime: number | null;
    currentPrice: number | null;
    upside: number | null;
  };
  meta: {
    lastUpdated: string | null;
    yearsOfData: number;
  };
}

// Screener result item
export interface ScreenerResult {
  ticker: string;
  name: string;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  valueScore: number;
  roicScore: number;
  moatScore: number;
  debtScore: number;
  stickerPrice: number | null;
  mosPrice: number | null;
  paybackTime: number | null;
  currentPrice: number | null;
}

// Watchlist item
export interface WatchlistItem {
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  targetPrice: number | null;
  notes: string | null;
  currentPrice: number | null;
  change: number | null;
  changePercent: number | null;
  valueScore: number | null;
  mosPrice: number | null;
  percentToTarget: number | null;
  addedAt: string;
}

// Valuation result
export interface ValuationResult {
  futureEps: number;
  futurePrice: number;
  stickerPrice: number;
  mosPrice: number;
  paybackTime: number | null;
  recommendation: string | null;
}

// Quote
export interface Quote {
  ticker: string;
  name: string;
  price: number;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: number | null;
  pe: number | null;
  eps: number | null;
  fetchedAt: string;
}

/**
 * Time range options for price history chart
 *
 * WHY these specific ranges?
 * - 1M: Short-term price action, recent news impact
 * - 6M: Medium-term trends
 * - 1Y: Full year including seasonal patterns
 * - 5Y: Long-term performance, business cycle
 */
export type PriceRange = '1M' | '6M' | '1Y' | '5Y';

/**
 * Historical price data point for charting
 *
 * WHY include adjClose?
 * - Adjusted close accounts for stock splits and dividends
 * - Without it, a 4-for-1 split would make old prices appear 4x higher
 * - Essential for accurate historical comparison
 */
export interface HistoricalPrice {
  date: string; // ISO date string (YYYY-MM-DD)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

/**
 * Response from the price history endpoint
 */
export interface PriceHistoryResponse {
  ticker: string;
  range: PriceRange;
  prices: HistoricalPrice[];
  fetchedAt: string;
}

// Search result
export interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
}

// API functions
// Financial statement data
export interface FinancialData {
  fiscalYear: number;
  fiscalQuarter: number | null;
  periodEndDate: string;
  revenue: number | null;
  netIncome: number | null;
  eps: number | null;
  totalEquity: number | null;
  longTermDebt: number | null;
  freeCashFlow: number | null;
  operatingIncome: number | null;
  roic: number | null;
}

// Score history data point for charting
export interface ScoreHistoryPoint {
  date: string;
  valueScore: number;
  roicScore: number;
  moatScore: number;
  debtScore: number;
  managementScore: number;
  currentPrice: number | null;
  mosPrice: number | null;
  stickerPrice: number | null;
}

export const companyApi = {
  getAnalysis: async (ticker: string): Promise<CompanyAnalysis> => {
    const response = await api.get<ApiResponse<CompanyAnalysis>>(`/companies/${ticker}`);
    return response.data.data;
  },

  getFinancials: async (ticker: string, years = 10): Promise<FinancialData[]> => {
    const response = await api.get<ApiResponse<FinancialData[]>>(`/companies/${ticker}/financials`, {
      params: { years },
    });
    return response.data.data;
  },

  /**
   * Get historical score data for a company
   *
   * WHY track score history?
   * - Shows how a company's quality metrics change over time
   * - Helps identify improving or declining businesses
   * - Useful for timing investment decisions
   */
  getScoreHistory: async (ticker: string, limit = 30): Promise<ScoreHistoryPoint[]> => {
    const response = await api.get<ApiResponse<ScoreHistoryPoint[]>>(
      `/companies/${ticker}/scores/history`,
      { params: { limit } }
    );
    return response.data.data;
  },

  search: async (query: string, limit = 10): Promise<SearchResult[]> => {
    const response = await api.get<ApiResponse<SearchResult[]>>('/companies/search', {
      params: { q: query, limit },
    });
    return response.data.data;
  },

  refresh: async (ticker: string): Promise<void> => {
    await api.post(`/companies/${ticker}/refresh`);
  },
};

export const screenerApi = {
  screen: async (filters: Record<string, unknown>): Promise<{
    data: ScreenerResult[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const response = await api.get<ApiResponse<ScreenerResult[]>>('/screener', {
      params: filters,
    });
    return {
      data: response.data.data,
      meta: response.data.meta as { page: number; limit: number; total: number; totalPages: number },
    };
  },

  getLeaderboard: async (limit = 50): Promise<ScreenerResult[]> => {
    const response = await api.get<ApiResponse<ScreenerResult[]>>('/screener/leaderboard', {
      params: { limit },
    });
    return response.data.data;
  },
};

export const valuationApi = {
  calculate: async (input: {
    currentEps: number;
    growthRate: number;
    futurePe: number;
    currentPrice?: number;
  }): Promise<ValuationResult> => {
    const response = await api.post<ApiResponse<ValuationResult>>('/valuation/calculate', input);
    return response.data.data;
  },

  getDefault: async (ticker: string): Promise<ValuationResult & { ticker: string; currentPrice: number | null }> => {
    const response = await api.get<ApiResponse<ValuationResult & { ticker: string; currentPrice: number | null }>>(
      `/valuation/${ticker}/default`
    );
    return response.data.data;
  },
};

export const watchlistApi = {
  getAll: async (): Promise<WatchlistItem[]> => {
    const response = await api.get<ApiResponse<WatchlistItem[]>>('/watchlist');
    return response.data.data;
  },

  add: async (ticker: string, data?: { targetPrice?: number; notes?: string }): Promise<WatchlistItem> => {
    const response = await api.post<ApiResponse<WatchlistItem>>(`/watchlist/${ticker}`, data || {});
    return response.data.data;
  },

  remove: async (ticker: string): Promise<void> => {
    await api.delete(`/watchlist/${ticker}`);
  },

  update: async (
    ticker: string,
    data: { targetPrice?: number | null; notes?: string | null }
  ): Promise<WatchlistItem> => {
    const response = await api.patch<ApiResponse<WatchlistItem>>(`/watchlist/${ticker}`, data);
    return response.data.data;
  },
};

export const quotesApi = {
  getQuote: async (ticker: string): Promise<Quote> => {
    const response = await api.get<ApiResponse<Quote>>(`/quotes/${ticker}`);
    return response.data.data;
  },

  getBatch: async (tickers: string[]): Promise<Quote[]> => {
    const response = await api.get<ApiResponse<Quote[]>>('/quotes', {
      params: { tickers: tickers.join(',') },
    });
    return response.data.data;
  },

  /**
   * Get historical price data for charting
   *
   * WHY cache for 5 minutes on frontend?
   * - Historical prices don't change frequently (once per day after market close)
   * - Reduces API calls when toggling between ranges
   * - React Query will refetch if user explicitly refreshes
   *
   * @param ticker - Stock symbol (e.g., "AAPL")
   * @param range - Time range: 1M, 6M, 1Y, or 5Y (default: 1Y)
   */
  getPriceHistory: async (
    ticker: string,
    range: PriceRange = '1Y'
  ): Promise<PriceHistoryResponse> => {
    const response = await api.get<ApiResponse<PriceHistoryResponse>>(
      `/quotes/${ticker}/history`,
      { params: { range } }
    );
    return response.data.data;
  },
};

// =============================================================================
// SEC Filings API
// =============================================================================

/**
 * SEC Filing from EDGAR database
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
 * SEC Filings list response
 */
export interface FilingsResponse {
  ticker: string;
  companyName: string;
  cik: string;
  filings: SECFiling[];
}

/**
 * SEC filing detail response
 */
export interface FilingDetailResponse {
  ticker: string;
  companyName: string;
  cik: string;
  filing: SECFiling;
  viewerUrl: string;
  indexUrl: string;
}

/**
 * SEC Filings API
 *
 * Fetches SEC EDGAR filing data for companies.
 * Provides access to 10-K (annual) and 10-Q (quarterly) reports.
 */
export const filingsApi = {
  /**
   * Get list of SEC filings for a company
   *
   * @param ticker - Stock ticker symbol
   * @param options - Filter options (forms, limit)
   */
  getFilings: async (
    ticker: string,
    options?: { forms?: string[]; limit?: number }
  ): Promise<FilingsResponse> => {
    const params: Record<string, string> = {};

    if (options?.forms) {
      params.forms = options.forms.join(',');
    }
    if (options?.limit) {
      params.limit = String(options.limit);
    }

    const response = await api.get<ApiResponse<FilingsResponse>>(
      `/filings/${ticker}`,
      { params }
    );
    return response.data.data;
  },

  /**
   * Get details for a specific filing
   *
   * @param ticker - Stock ticker symbol
   * @param accessionNumber - SEC accession number (e.g., "0000320193-23-000077")
   */
  getFilingDetail: async (
    ticker: string,
    accessionNumber: string
  ): Promise<FilingDetailResponse> => {
    const response = await api.get<ApiResponse<FilingDetailResponse>>(
      `/filings/${ticker}/${accessionNumber}`
    );
    return response.data.data;
  },
};
