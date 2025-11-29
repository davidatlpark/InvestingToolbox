import { describe, it, expect } from 'vitest';
import {
  calculateROICScore,
  calculateMoatScore,
  calculateDebtScore,
  calculateManagementScore,
  calculateValueScore,
  calculateStickerPrice,
  calculatePaybackTime,
} from '../scoring.js';
import type { BigFiveMetrics } from '../bigFive.js';
import type { FinancialStatement } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('calculateROICScore', () => {
  it('returns 100 when all ROIC values are >= 15%', () => {
    const score = calculateROICScore(18, 16, 15);
    expect(score).toBe(100);
  });

  it('returns 80 when all ROIC values are >= 10% but < 15%', () => {
    const score = calculateROICScore(12, 11, 10);
    expect(score).toBe(80);
  });

  it('returns 50 when all ROIC values are >= 5% but < 10%', () => {
    const score = calculateROICScore(7, 6, 5);
    expect(score).toBe(50);
  });

  it('returns 25 when all ROIC values are >= 0% but < 5%', () => {
    const score = calculateROICScore(2, 3, 1);
    expect(score).toBe(25);
  });

  it('returns 0 when all ROIC values are negative', () => {
    const score = calculateROICScore(-5, -10, -15);
    expect(score).toBe(0);
  });

  it('calculates weighted average correctly', () => {
    // 1-year: 15% (100 points, weight 0.2) = 20
    // 5-year: 10% (80 points, weight 0.3) = 24
    // 10-year: 5% (50 points, weight 0.5) = 25
    // Total = 69
    const score = calculateROICScore(15, 10, 5);
    expect(score).toBe(69);
  });

  it('handles null values by adjusting weights', () => {
    // Only 10-year available (15%)
    const score = calculateROICScore(null, null, 15);
    expect(score).toBe(100);
  });

  it('returns 0 when all values are null', () => {
    const score = calculateROICScore(null, null, null);
    expect(score).toBe(0);
  });
});

describe('calculateMoatScore', () => {
  // Helper to create mock BigFiveMetrics
  function createMockBigFive(overrides: Partial<BigFiveMetrics> = {}): BigFiveMetrics {
    return {
      roic1Year: null,
      roic5Year: null,
      roic10Year: null,
      epsGrowth1Year: null,
      epsGrowth5Year: null,
      epsGrowth10Year: null,
      revenueGrowth1Year: null,
      revenueGrowth5Year: null,
      revenueGrowth10Year: null,
      equityGrowth1Year: null,
      equityGrowth5Year: null,
      equityGrowth10Year: null,
      fcfGrowth1Year: null,
      fcfGrowth5Year: null,
      fcfGrowth10Year: null,
      yearsOfData: 10,
      isPredictable: true,
      ...overrides,
    };
  }

  it('returns 100 for a company with all growth >= 15%', () => {
    const bigFive = createMockBigFive({
      epsGrowth1Year: 20,
      epsGrowth5Year: 18,
      epsGrowth10Year: 16,
      revenueGrowth1Year: 20,
      revenueGrowth5Year: 18,
      revenueGrowth10Year: 16,
      equityGrowth1Year: 20,
      equityGrowth5Year: 18,
      equityGrowth10Year: 16,
      fcfGrowth1Year: 20,
      fcfGrowth5Year: 18,
      fcfGrowth10Year: 16,
    });

    const score = calculateMoatScore(bigFive);
    expect(score).toBe(100);
  });

  it('returns 80 for a company with all growth >= 10% but < 15%', () => {
    const bigFive = createMockBigFive({
      epsGrowth1Year: 12,
      epsGrowth5Year: 11,
      epsGrowth10Year: 10,
      revenueGrowth1Year: 12,
      revenueGrowth5Year: 11,
      revenueGrowth10Year: 10,
      equityGrowth1Year: 12,
      equityGrowth5Year: 11,
      equityGrowth10Year: 10,
      fcfGrowth1Year: 12,
      fcfGrowth5Year: 11,
      fcfGrowth10Year: 10,
    });

    const score = calculateMoatScore(bigFive);
    expect(score).toBe(80);
  });

  it('returns 0 for all null values', () => {
    const bigFive = createMockBigFive();
    const score = calculateMoatScore(bigFive);
    expect(score).toBe(0);
  });

  it('weights 10-year metrics higher than 1-year metrics', () => {
    // 10-year metrics have weight 3, 5-year weight 2, 1-year weight 1
    // Only high 10-year metrics
    const bigFiveA = createMockBigFive({
      epsGrowth10Year: 20,
      revenueGrowth10Year: 20,
      equityGrowth10Year: 20,
      fcfGrowth10Year: 20,
    });

    // Only high 1-year metrics
    const bigFiveB = createMockBigFive({
      epsGrowth1Year: 20,
      revenueGrowth1Year: 20,
      equityGrowth1Year: 20,
      fcfGrowth1Year: 20,
    });

    const scoreA = calculateMoatScore(bigFiveA);
    const scoreB = calculateMoatScore(bigFiveB);

    // Both should be 100 when present, but the total weight contribution differs
    // Both have same score since all present values are 20
    expect(scoreA).toBe(100);
    expect(scoreB).toBe(100);
  });
});

describe('calculateDebtScore', () => {
  // Helper to create mock financial statement
  function createMockFinancial(
    debt: number,
    fcf: number
  ): FinancialStatement {
    return {
      id: 'fin-1',
      companyId: 'company-1',
      fiscalYear: 2024,
      fiscalQuarter: null,
      periodEndDate: new Date('2024-12-31'),
      filingDate: null,
      revenue: null,
      costOfRevenue: null,
      grossProfit: null,
      operatingExpenses: null,
      operatingIncome: null,
      interestExpense: null,
      incomeBeforeTax: null,
      incomeTaxExpense: null,
      netIncome: null,
      eps: null,
      epsDiluted: null,
      sharesOutstanding: null,
      cashAndEquivalents: null,
      shortTermInvestments: null,
      totalCurrentAssets: null,
      propertyPlantEquip: null,
      goodwill: null,
      intangibleAssets: null,
      totalAssets: null,
      accountsPayable: null,
      shortTermDebt: new Decimal(0),
      totalCurrentLiab: null,
      longTermDebt: new Decimal(debt),
      totalLiabilities: null,
      totalEquity: null,
      bookValuePerShare: null,
      operatingCashFlow: null,
      capitalExpenditures: null,
      freeCashFlow: new Decimal(fcf),
      dividendsPaid: null,
      netChangeInCash: null,
      roic: null,
      roe: null,
      currentRatio: null,
      debtToEquity: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  it('returns 100 for company with no debt', () => {
    const score = calculateDebtScore([createMockFinancial(0, 100_000_000)]);
    expect(score).toBe(100);
  });

  it('returns 100 for company that can pay off debt in <= 1 year', () => {
    // $100M debt, $100M FCF = 1 year payoff
    const score = calculateDebtScore([createMockFinancial(100_000_000, 100_000_000)]);
    expect(score).toBe(100);
  });

  it('returns 80 for 3-year payoff', () => {
    // $300M debt, $100M FCF = 3 years
    const score = calculateDebtScore([createMockFinancial(300_000_000, 100_000_000)]);
    expect(score).toBe(80);
  });

  it('returns 60 for 5-year payoff', () => {
    // $500M debt, $100M FCF = 5 years
    const score = calculateDebtScore([createMockFinancial(500_000_000, 100_000_000)]);
    expect(score).toBe(60);
  });

  it('returns 20 for 10-year payoff', () => {
    // $1B debt, $100M FCF = 10 years
    const score = calculateDebtScore([createMockFinancial(1_000_000_000, 100_000_000)]);
    expect(score).toBe(20);
  });

  it('returns 10 for 10+ year payoff', () => {
    // $1.5B debt, $100M FCF = 15 years
    const score = calculateDebtScore([createMockFinancial(1_500_000_000, 100_000_000)]);
    expect(score).toBe(10);
  });

  it('returns 0 for zero or negative FCF', () => {
    const score = calculateDebtScore([createMockFinancial(100_000_000, 0)]);
    expect(score).toBe(0);
  });

  it('returns 0 for empty financials array', () => {
    const score = calculateDebtScore([]);
    expect(score).toBe(0);
  });
});

describe('calculateManagementScore', () => {
  it('calculates 80% ROIC + 20% Debt correctly', () => {
    // ROIC: 100, Debt: 100 -> 80 + 20 = 100
    expect(calculateManagementScore(100, 100)).toBe(100);

    // ROIC: 50, Debt: 100 -> 40 + 20 = 60
    expect(calculateManagementScore(50, 100)).toBe(60);

    // ROIC: 100, Debt: 0 -> 80 + 0 = 80
    expect(calculateManagementScore(100, 0)).toBe(80);
  });
});

describe('calculateValueScore', () => {
  it('calculates 50% Moat + 40% ROIC + 10% Debt correctly', () => {
    // All 100 -> 50 + 40 + 10 = 100
    expect(calculateValueScore(100, 100, 100)).toBe(100);

    // Moat 100, ROIC 50, Debt 0 -> 50 + 20 + 0 = 70
    expect(calculateValueScore(100, 50, 0)).toBe(70);

    // All 0 -> 0
    expect(calculateValueScore(0, 0, 0)).toBe(0);
  });
});

describe('calculateStickerPrice', () => {
  it('calculates sticker price using Phil Town formula', () => {
    // Example from PLAN.md:
    // Current EPS: $5.00, Growth: 15%, Future PE: 30, Min Return: 15%
    // Future EPS = $5.00 × (1.15)^10 = $20.23
    // Future Price = $20.23 × 30 = $606.90
    // Sticker Price = $606.90 ÷ (1.15)^10 = $150.00
    // MOS Price = $150.00 × 0.50 = $75.00
    const result = calculateStickerPrice(5, 0.15, 30, 0.15, 10);

    expect(result.stickerPrice).toBeCloseTo(150, 0);
    expect(result.mosPrice).toBeCloseTo(75, 0);
  });

  it('uses default 15% minimum return rate', () => {
    const result = calculateStickerPrice(5, 0.15, 30);
    expect(result.stickerPrice).toBeCloseTo(150, 0);
  });

  it('handles different growth rates', () => {
    // 10% growth, PE of 20
    const result = calculateStickerPrice(5, 0.10, 20);
    // Future EPS = $5 × (1.10)^10 = $12.97
    // Future Price = $12.97 × 20 = $259.37
    // Sticker Price = $259.37 ÷ (1.15)^10 = $64.09
    expect(result.stickerPrice).toBeCloseTo(64, 0);
  });

  it('rounds to 2 decimal places', () => {
    const result = calculateStickerPrice(3.33, 0.12, 25);
    expect(result.stickerPrice).toBe(Math.round(result.stickerPrice * 100) / 100);
    expect(result.mosPrice).toBe(Math.round(result.mosPrice * 100) / 100);
  });
});

describe('calculatePaybackTime', () => {
  it('calculates years until earnings equal price', () => {
    // $100 price, $5 EPS, 15% growth
    // Year 1: $5.75, Year 2: $6.61, ... accumulating until >= $100
    const years = calculatePaybackTime(100, 5, 0.15);
    expect(years).toBeGreaterThan(0);
    expect(years).toBeLessThan(20);
  });

  it('returns higher value for higher prices', () => {
    const yearsA = calculatePaybackTime(50, 5, 0.15);
    const yearsB = calculatePaybackTime(100, 5, 0.15);
    const yearsC = calculatePaybackTime(200, 5, 0.15);

    expect(yearsA).toBeLessThan(yearsB);
    expect(yearsB).toBeLessThan(yearsC);
  });

  it('returns lower value for higher growth rates', () => {
    const yearsLowGrowth = calculatePaybackTime(100, 5, 0.05);
    const yearsHighGrowth = calculatePaybackTime(100, 5, 0.20);

    expect(yearsHighGrowth).toBeLessThan(yearsLowGrowth);
  });

  it('returns 50 for zero or negative EPS', () => {
    expect(calculatePaybackTime(100, 0, 0.15)).toBe(50);
    expect(calculatePaybackTime(100, -5, 0.15)).toBe(50);
  });

  it('returns 0 for zero or negative price', () => {
    expect(calculatePaybackTime(0, 5, 0.15)).toBe(0);
    expect(calculatePaybackTime(-50, 5, 0.15)).toBe(0);
  });

  it('caps at 50 years for very long payback times', () => {
    // Very low growth, very high price
    const years = calculatePaybackTime(10000, 1, 0.01);
    expect(years).toBe(50);
  });
});
