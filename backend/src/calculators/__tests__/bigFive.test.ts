import { describe, it, expect } from 'vitest';
import { calculateCAGR, calculateROIC, calculateBigFive } from '../bigFive.js';
import type { FinancialStatement } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('calculateCAGR', () => {
  it('calculates correct CAGR for positive growth', () => {
    // $100 growing to $200 over 10 years = ~7.18% CAGR
    const result = calculateCAGR(100, 200, 10);
    expect(result).toBeCloseTo(7.18, 1);
  });

  it('calculates correct CAGR for 100% growth over 10 years', () => {
    // $100 to $259.37 at 10% per year
    const result = calculateCAGR(100, 259.37, 10);
    expect(result).toBeCloseTo(10, 0);
  });

  it('calculates correct CAGR for 1 year', () => {
    // $100 to $115 in 1 year = 15%
    const result = calculateCAGR(100, 115, 1);
    expect(result).toBeCloseTo(15, 0);
  });

  it('returns null for zero start value', () => {
    const result = calculateCAGR(0, 100, 5);
    expect(result).toBeNull();
  });

  it('returns null for negative start value', () => {
    const result = calculateCAGR(-100, 100, 5);
    expect(result).toBeNull();
  });

  it('returns null for negative end value', () => {
    const result = calculateCAGR(100, -50, 5);
    expect(result).toBeNull();
  });

  it('returns null for null inputs', () => {
    expect(calculateCAGR(null, 100, 5)).toBeNull();
    expect(calculateCAGR(100, null, 5)).toBeNull();
  });

  it('returns null for zero years', () => {
    const result = calculateCAGR(100, 200, 0);
    expect(result).toBeNull();
  });

  it('returns null for negative years', () => {
    const result = calculateCAGR(100, 200, -5);
    expect(result).toBeNull();
  });
});

describe('calculateROIC', () => {
  it('calculates ROIC correctly with all inputs', () => {
    // Operating Income: $100M
    // Tax Rate: 21% (calculated from $21M tax / $100M pre-tax income)
    // Equity: $400M, Debt: $100M = $500M invested capital
    // NOPAT = $100M * (1 - 0.21) = $79M
    // ROIC = $79M / $500M = 15.8%
    const result = calculateROIC(
      100_000_000, // operating income
      21_000_000, // income tax expense
      100_000_000, // income before tax
      400_000_000, // total equity
      80_000_000, // long term debt
      20_000_000 // short term debt
    );
    expect(result).toBeCloseTo(15.8, 1);
  });

  it('uses default tax rate when tax calculation is invalid', () => {
    // When income before tax is 0, should use default 21% rate
    const result = calculateROIC(
      100_000_000,
      0,
      0, // Can't calculate tax rate
      400_000_000,
      100_000_000,
      0
    );
    // NOPAT = $100M * (1 - 0.21) = $79M
    // ROIC = $79M / $500M = 15.8%
    expect(result).toBeCloseTo(15.8, 1);
  });

  it('returns null when operating income is null', () => {
    const result = calculateROIC(null, 21_000_000, 100_000_000, 400_000_000, 100_000_000, 0);
    expect(result).toBeNull();
  });

  it('returns null when total equity is null', () => {
    const result = calculateROIC(100_000_000, 21_000_000, 100_000_000, null, 100_000_000, 0);
    expect(result).toBeNull();
  });

  it('returns null when invested capital is zero or negative', () => {
    // Equity of -$100M and no debt results in negative invested capital
    const result = calculateROIC(100_000_000, 21_000_000, 100_000_000, -100_000_000, null, null);
    expect(result).toBeNull();
  });

  it('handles null debt values gracefully', () => {
    // Should treat null debt as 0
    const result = calculateROIC(
      100_000_000,
      21_000_000,
      100_000_000,
      500_000_000,
      null, // null long term debt
      null // null short term debt
    );
    expect(result).toBeCloseTo(15.8, 1);
  });

  it('caps tax rate at reasonable bounds', () => {
    // Tax rate > 50% should fall back to default
    const result = calculateROIC(
      100_000_000,
      60_000_000, // 60% tax rate (unrealistic)
      100_000_000,
      500_000_000,
      0,
      0
    );
    // Should use default 21% instead of 60%
    expect(result).toBeCloseTo(15.8, 1);
  });
});

describe('calculateBigFive', () => {
  // Helper to create a mock financial statement
  // With 10% growth: older years have lower values, newer years have higher
  const BASE_YEAR = 2015;
  function createMockFinancial(
    year: number,
    overrides: Partial<FinancialStatement> = {}
  ): FinancialStatement {
    // Growth multiplier: for year 2015 = 1.0, for 2024 = 1.1^9 ≈ 2.36
    const growthMultiplier = Math.pow(1.1, year - BASE_YEAR);
    return {
      id: `fin-${year}`,
      companyId: 'company-1',
      fiscalYear: year,
      fiscalQuarter: null,
      periodEndDate: new Date(`${year}-12-31`),
      filingDate: new Date(`${year + 1}-02-15`),
      revenue: new Decimal(100_000_000 * growthMultiplier),
      costOfRevenue: null,
      grossProfit: null,
      operatingExpenses: null,
      operatingIncome: new Decimal(20_000_000 * growthMultiplier),
      interestExpense: null,
      incomeBeforeTax: new Decimal(18_000_000 * growthMultiplier),
      incomeTaxExpense: new Decimal(4_000_000 * growthMultiplier),
      netIncome: new Decimal(14_000_000 * growthMultiplier),
      eps: new Decimal(5 * growthMultiplier),
      epsDiluted: new Decimal(4.9 * growthMultiplier),
      sharesOutstanding: null,
      cashAndEquivalents: null,
      shortTermInvestments: null,
      totalCurrentAssets: null,
      propertyPlantEquip: null,
      goodwill: null,
      intangibleAssets: null,
      totalAssets: null,
      accountsPayable: null,
      shortTermDebt: new Decimal(10_000_000),
      totalCurrentLiab: null,
      longTermDebt: new Decimal(50_000_000),
      totalLiabilities: null,
      totalEquity: new Decimal(200_000_000 * growthMultiplier),
      bookValuePerShare: null,
      operatingCashFlow: null,
      capitalExpenditures: null,
      freeCashFlow: new Decimal(10_000_000 * growthMultiplier),
      dividendsPaid: null,
      netChangeInCash: null,
      roic: new Decimal(15),
      roe: null,
      currentRatio: null,
      debtToEquity: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  it('returns all null values for empty financials array', () => {
    const result = calculateBigFive([]);
    expect(result.yearsOfData).toBe(0);
    expect(result.isPredictable).toBe(false);
    expect(result.epsGrowth1Year).toBeNull();
  });

  it('calculates growth rates correctly with sufficient data', () => {
    // Create 10 years of data with 10% annual growth
    const financials: FinancialStatement[] = [];
    for (let year = 2024; year >= 2015; year--) {
      financials.push(createMockFinancial(year));
    }

    const result = calculateBigFive(financials);

    expect(result.yearsOfData).toBe(10);
    expect(result.isPredictable).toBe(true);

    // EPS growth should be around 10% (we created 10% growth rate)
    // Note: With 10 data points spanning 2015-2024, there are 9 growth periods
    // The CAGR calculation uses years=10, so actual result is slightly less than 10%
    expect(result.epsGrowth1Year).toBeCloseTo(10, 0);
    expect(result.epsGrowth5Year).toBeCloseTo(10, 0);
    // 10-year calculation: (1.1^9)^(1/10) - 1 ≈ 8.96%
    expect(result.epsGrowth10Year).toBeCloseTo(9, 0);
  });

  it('marks company as unpredictable with less than 5 years of data', () => {
    const financials = [
      createMockFinancial(2024),
      createMockFinancial(2023),
      createMockFinancial(2022),
    ];

    const result = calculateBigFive(financials);

    expect(result.yearsOfData).toBe(3);
    expect(result.isPredictable).toBe(false);
  });

  it('marks company as unpredictable when most growth rates are negative', () => {
    // Create 6 years of declining metrics
    // For -15% annual decline: older years have higher values
    const DECLINE_BASE = 2024;
    const financials: FinancialStatement[] = [];
    for (let year = 2024; year >= 2019; year--) {
      // Decline multiplier: for 2024 = 1.0, for 2019 = 1.15^5 ≈ 2.01 (older = higher)
      const declineMultiplier = Math.pow(1.15, DECLINE_BASE - year);
      financials.push(
        createMockFinancial(year, {
          eps: new Decimal(5 * declineMultiplier),
          revenue: new Decimal(100_000_000 * declineMultiplier),
          totalEquity: new Decimal(200_000_000 * declineMultiplier),
          freeCashFlow: new Decimal(10_000_000 * declineMultiplier),
        })
      );
    }

    const result = calculateBigFive(financials);

    // With declining values (older > newer), growth rates should be negative
    expect(result.epsGrowth5Year).toBeLessThan(0);
    expect(result.isPredictable).toBe(false);
  });

  it('calculates ROIC averages correctly', () => {
    const financials: FinancialStatement[] = [];
    // Create 10 years with varying ROIC
    for (let year = 2024; year >= 2015; year--) {
      financials.push(
        createMockFinancial(year, {
          roic: new Decimal(12 + (2024 - year)), // 12% to 21%
        })
      );
    }

    const result = calculateBigFive(financials);

    // roic1Year should be the most recent (12%)
    expect(result.roic1Year).toBe(12);

    // roic5Year should be average of first 5 years (12+13+14+15+16) / 5 = 14
    expect(result.roic5Year).toBeCloseTo(14, 0);

    // roic10Year should be average of all 10 years
    expect(result.roic10Year).toBeCloseTo(16.5, 0);
  });
});
