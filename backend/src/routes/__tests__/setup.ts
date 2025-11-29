/**
 * Test Setup for API Integration Tests
 *
 * This file provides mock factories and utilities for testing Express routes.
 * We mock:
 * - Prisma client (database operations)
 * - FMP client (external API calls)
 *
 * WHY: Integration tests should test the route logic without hitting
 * real databases or external APIs. This makes tests fast, reliable,
 * and doesn't consume API rate limits.
 */

import { vi } from 'vitest';
import type { Prisma } from '@prisma/client';

// =============================================================================
// Mock Data Factories
// =============================================================================

/**
 * Creates a mock company object with sensible defaults.
 * Use overrides to customize specific fields for your test.
 */
export function createMockCompany(overrides: Partial<{
  id: string;
  ticker: string;
  name: string;
  sector: string | null;
  industry: string | null;
  exchange: string | null;
  description: string | null;
  marketCap: Prisma.Decimal | null;
  country: string | null;
  website: string | null;
  lastUpdated: Date | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: 'cuid-123',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    exchange: 'NASDAQ',
    description: 'Apple designs and sells consumer electronics.',
    marketCap: new Prisma.Decimal(3000000000000),
    country: 'US',
    website: 'https://apple.com',
    lastUpdated: new Date('2024-01-15'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  };
}

/**
 * Creates a mock company score object.
 */
export function createMockScore(overrides: Partial<{
  id: string;
  companyId: string;
  calculatedAt: Date;
  valueScore: number;
  roicScore: number;
  moatScore: number;
  debtScore: number;
  managementScore: number;
  roic1Year: number | null;
  roic5Year: number | null;
  roic10Year: number | null;
  epsGrowth1Year: number | null;
  epsGrowth5Year: number | null;
  epsGrowth10Year: number | null;
  revenueGrowth1Year: number | null;
  revenueGrowth5Year: number | null;
  revenueGrowth10Year: number | null;
  equityGrowth1Year: number | null;
  equityGrowth5Year: number | null;
  equityGrowth10Year: number | null;
  fcfGrowth1Year: number | null;
  fcfGrowth5Year: number | null;
  fcfGrowth10Year: number | null;
  currentPrice: number | null;
  stickerPrice: number | null;
  mosPrice: number | null;
  paybackTime: number | null;
  isPredictable: boolean;
  yearsOfData: number;
  createdAt: Date;
}> = {}) {
  return {
    id: 'score-123',
    companyId: 'cuid-123',
    calculatedAt: new Date('2024-01-15'),
    valueScore: 75,
    roicScore: 85,
    moatScore: 70,
    debtScore: 80,
    managementScore: 82,
    roic1Year: 25.5,
    roic5Year: 22.3,
    roic10Year: 20.1,
    epsGrowth1Year: 15.2,
    epsGrowth5Year: 12.5,
    epsGrowth10Year: 11.8,
    revenueGrowth1Year: 8.5,
    revenueGrowth5Year: 10.2,
    revenueGrowth10Year: 9.8,
    equityGrowth1Year: 12.0,
    equityGrowth5Year: 11.5,
    equityGrowth10Year: 10.5,
    fcfGrowth1Year: 18.0,
    fcfGrowth5Year: 14.2,
    fcfGrowth10Year: 12.8,
    currentPrice: 185.5,
    stickerPrice: 250.0,
    mosPrice: 125.0,
    paybackTime: 6.5,
    isPredictable: true,
    yearsOfData: 10,
    createdAt: new Date('2024-01-15'),
    ...overrides,
  };
}

/**
 * Creates a mock financial statement.
 */
export function createMockFinancial(
  fiscalYear: number,
  overrides: Partial<{
    id: string;
    companyId: string;
    fiscalQuarter: number | null;
    periodEndDate: Date;
    revenue: Prisma.Decimal | null;
    netIncome: Prisma.Decimal | null;
    eps: Prisma.Decimal | null;
    totalEquity: Prisma.Decimal | null;
    longTermDebt: Prisma.Decimal | null;
    freeCashFlow: Prisma.Decimal | null;
    operatingIncome: Prisma.Decimal | null;
    roic: Prisma.Decimal | null;
  }> = {}
) {
  return {
    id: `financial-${fiscalYear}`,
    companyId: 'cuid-123',
    fiscalYear,
    fiscalQuarter: null,
    periodEndDate: new Date(`${fiscalYear}-12-31`),
    filingDate: new Date(`${fiscalYear + 1}-02-15`),
    revenue: new Prisma.Decimal(400000000000),
    costOfRevenue: new Prisma.Decimal(220000000000),
    grossProfit: new Prisma.Decimal(180000000000),
    operatingExpenses: new Prisma.Decimal(50000000000),
    operatingIncome: new Prisma.Decimal(130000000000),
    interestExpense: new Prisma.Decimal(3000000000),
    incomeBeforeTax: new Prisma.Decimal(127000000000),
    incomeTaxExpense: new Prisma.Decimal(25000000000),
    netIncome: new Prisma.Decimal(102000000000),
    eps: new Prisma.Decimal(6.15),
    epsDiluted: new Prisma.Decimal(6.13),
    sharesOutstanding: new Prisma.Decimal(16500000000),
    cashAndEquivalents: new Prisma.Decimal(25000000000),
    shortTermInvestments: new Prisma.Decimal(35000000000),
    totalCurrentAssets: new Prisma.Decimal(140000000000),
    propertyPlantEquip: new Prisma.Decimal(45000000000),
    goodwill: new Prisma.Decimal(0),
    intangibleAssets: new Prisma.Decimal(0),
    totalAssets: new Prisma.Decimal(350000000000),
    accountsPayable: new Prisma.Decimal(55000000000),
    shortTermDebt: new Prisma.Decimal(10000000000),
    totalCurrentLiab: new Prisma.Decimal(120000000000),
    longTermDebt: new Prisma.Decimal(95000000000),
    totalLiabilities: new Prisma.Decimal(280000000000),
    totalEquity: new Prisma.Decimal(70000000000),
    bookValuePerShare: new Prisma.Decimal(4.24),
    operatingCashFlow: new Prisma.Decimal(115000000000),
    capitalExpenditures: new Prisma.Decimal(10000000000),
    freeCashFlow: new Prisma.Decimal(105000000000),
    dividendsPaid: new Prisma.Decimal(15000000000),
    netChangeInCash: new Prisma.Decimal(5000000000),
    roic: new Prisma.Decimal(22.5),
    roe: new Prisma.Decimal(145.7),
    currentRatio: new Prisma.Decimal(1.17),
    debtToEquity: new Prisma.Decimal(1.36),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates a mock FMP company profile response.
 */
export function createMockFmpProfile(overrides: Partial<{
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  exchangeShortName: string;
  description: string;
  mktCap: number;
  country: string;
  website: string;
  price: number;
}> = {}) {
  return {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    exchangeShortName: 'NASDAQ',
    description: 'Apple designs and sells consumer electronics.',
    mktCap: 3000000000000,
    country: 'US',
    website: 'https://apple.com',
    price: 185.5,
    ...overrides,
  };
}

/**
 * Creates a mock FMP quote response.
 */
export function createMockFmpQuote(overrides: Partial<{
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
  volume: number;
  marketCap: number;
  pe: number;
  eps: number;
}> = {}) {
  return {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 185.5,
    change: 2.35,
    changesPercentage: 1.28,
    volume: 45000000,
    marketCap: 3000000000000,
    pe: 30.2,
    eps: 6.15,
    ...overrides,
  };
}

/**
 * Creates mock watchlist item.
 */
export function createMockWatchlistItem(overrides: Partial<{
  id: string;
  companyId: string;
  targetPrice: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: 'watchlist-123',
    companyId: 'cuid-123',
    targetPrice: 150.0,
    notes: 'Great company, waiting for pullback',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  };
}

// =============================================================================
// Mock Helpers
// =============================================================================

/**
 * Creates a chainable mock for Prisma query builder pattern.
 *
 * WHY: Prisma uses a fluent API like prisma.company.findUnique({}).include({})
 * We need to mock this chain pattern where each method returns an object
 * with more methods, ending with a promise that resolves to data.
 */
export function createMockPrismaChain<T>(resolvedValue: T) {
  const mock = {
    include: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((callback) => Promise.resolve(callback(resolvedValue))),
  };
  return mock;
}

/**
 * Reset all mocks between tests.
 * Call this in beforeEach or afterEach.
 */
export function resetMocks() {
  vi.clearAllMocks();
}
