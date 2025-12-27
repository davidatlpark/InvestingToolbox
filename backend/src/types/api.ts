// Common API response types

// Generic success response
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Sort parameters
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Screener filter parameters
export interface ScreenerFilters {
  minValueScore?: number;
  maxValueScore?: number;
  minRoicScore?: number;
  maxRoicScore?: number;
  minMoatScore?: number;
  maxMoatScore?: number;
  minDebtScore?: number;
  maxDebtScore?: number;
  maxPaybackTime?: number;
  sector?: string;
  industry?: string;
  minMarketCap?: number;
  maxMarketCap?: number;
}

// Company analysis response
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

// Valuation calculation input
export interface ValuationInput {
  currentEps: number;
  growthRate: number;
  futurePe: number;
  minReturnRate?: number;
  years?: number;
}

// Valuation calculation result
export interface ValuationResult {
  futureEps: number;
  futurePrice: number;
  stickerPrice: number;
  mosPrice: number;
  inputs: ValuationInput;
}

// Quote data
export interface Quote {
  ticker: string;
  price: number;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  fetchedAt: string;
}
