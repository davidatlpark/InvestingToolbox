import axios from 'axios';

// API client configured to proxy through Vite in development
export const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    epsGrowth: { year1: number | null; year5: number | null; year10: number | null };
    revenueGrowth: { year1: number | null; year5: number | null; year10: number | null };
    equityGrowth: { year1: number | null; year5: number | null; year10: number | null };
    fcfGrowth: { year1: number | null; year5: number | null; year10: number | null };
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

// Search result
export interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
}

// API functions
export const companyApi = {
  getAnalysis: async (ticker: string): Promise<CompanyAnalysis> => {
    const response = await api.get<ApiResponse<CompanyAnalysis>>(`/companies/${ticker}`);
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
};
