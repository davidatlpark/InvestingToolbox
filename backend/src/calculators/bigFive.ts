/**
 * Big Five Calculator
 *
 * Calculates the "Big Five" numbers from Rule One Investing:
 * 1. ROIC (Return on Invested Capital)
 * 2. Equity/Book Value Per Share Growth
 * 3. EPS Growth
 * 4. Revenue/Sales Growth
 * 5. Free Cash Flow Growth
 *
 * All growth rates should be >= 10% for 10 years for a "wonderful business"
 */

import type { FinancialStatement } from '@prisma/client';

// Big Five metrics result
export interface BigFiveMetrics {
  // ROIC
  roic1Year: number | null;
  roic5Year: number | null;
  roic10Year: number | null;

  // EPS Growth
  epsGrowth1Year: number | null;
  epsGrowth5Year: number | null;
  epsGrowth10Year: number | null;

  // Revenue Growth
  revenueGrowth1Year: number | null;
  revenueGrowth5Year: number | null;
  revenueGrowth10Year: number | null;

  // Equity Growth
  equityGrowth1Year: number | null;
  equityGrowth5Year: number | null;
  equityGrowth10Year: number | null;

  // FCF Growth
  fcfGrowth1Year: number | null;
  fcfGrowth5Year: number | null;
  fcfGrowth10Year: number | null;

  // Max-year growth (fallback when 10-year isn't available)
  // These provide growth rates for the maximum years of data available
  epsGrowthMaxYear: number | null;
  epsGrowthMaxYearPeriod: number;
  revenueGrowthMaxYear: number | null;
  revenueGrowthMaxYearPeriod: number;
  equityGrowthMaxYear: number | null;
  equityGrowthMaxYearPeriod: number;
  fcfGrowthMaxYear: number | null;
  fcfGrowthMaxYearPeriod: number;

  // Meta
  yearsOfData: number;
  isPredictable: boolean;
}

/**
 * Calculate Compound Annual Growth Rate (CAGR)
 *
 * Formula: CAGR = (EndValue / StartValue)^(1/Years) - 1
 *
 * @param startValue - The value at the beginning of the period
 * @param endValue - The value at the end of the period
 * @param years - Number of years in the period
 * @returns CAGR as a percentage (e.g., 15 for 15%)
 */
export function calculateCAGR(
  startValue: number | null,
  endValue: number | null,
  years: number
): number | null {
  // Can't calculate if either value is missing, zero, or negative
  if (startValue === null || endValue === null) return null;
  if (startValue <= 0 || endValue <= 0) return null;
  if (years <= 0) return null;

  const cagr = Math.pow(endValue / startValue, 1 / years) - 1;
  return cagr * 100; // Convert to percentage
}

/**
 * Calculate ROIC (Return on Invested Capital)
 *
 * Formula: ROIC = NOPAT / Invested Capital
 * where NOPAT = Operating Income × (1 - Tax Rate)
 * and Invested Capital = Total Equity + Total Debt
 *
 * @param operatingIncome - Operating income
 * @param taxRate - Effective tax rate (decimal, e.g., 0.21 for 21%)
 * @param totalEquity - Total stockholders' equity
 * @param totalDebt - Total debt (short-term + long-term)
 * @returns ROIC as a percentage
 */
export function calculateROIC(
  operatingIncome: number | null,
  incomeTaxExpense: number | null,
  incomeBeforeTax: number | null,
  totalEquity: number | null,
  longTermDebt: number | null,
  shortTermDebt: number | null
): number | null {
  if (operatingIncome === null || totalEquity === null) return null;

  // Calculate effective tax rate
  let taxRate = 0.21; // Default to 21% if can't calculate
  if (incomeTaxExpense !== null && incomeBeforeTax !== null && incomeBeforeTax > 0) {
    taxRate = incomeTaxExpense / incomeBeforeTax;
    // Sanity check tax rate
    if (taxRate < 0 || taxRate > 0.5) {
      taxRate = 0.21;
    }
  }

  // Calculate NOPAT (Net Operating Profit After Tax)
  const nopat = operatingIncome * (1 - taxRate);

  // Calculate invested capital
  const debt = (longTermDebt || 0) + (shortTermDebt || 0);
  const investedCapital = totalEquity + debt;

  if (investedCapital <= 0) return null;

  return (nopat / investedCapital) * 100;
}

/**
 * Get a value from financials at a specific year offset
 */
function getValueAtYear(
  financials: FinancialStatement[],
  yearsAgo: number,
  field: keyof FinancialStatement
): number | null {
  if (yearsAgo >= financials.length) return null;
  const value = financials[yearsAgo][field];
  if (value === null || value === undefined) return null;
  return Number(value);
}

/**
 * Calculate all Big Five metrics from financial statements
 *
 * @param financials - Array of financial statements, ordered by year descending (most recent first)
 * @returns BigFiveMetrics object with all calculated metrics
 */
export function calculateBigFive(financials: FinancialStatement[]): BigFiveMetrics {
  // Default result with nulls
  const result: BigFiveMetrics = {
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
    // Max-year growth (fallback when 10-year isn't available)
    epsGrowthMaxYear: null,
    epsGrowthMaxYearPeriod: 0,
    revenueGrowthMaxYear: null,
    revenueGrowthMaxYearPeriod: 0,
    equityGrowthMaxYear: null,
    equityGrowthMaxYearPeriod: 0,
    fcfGrowthMaxYear: null,
    fcfGrowthMaxYearPeriod: 0,
    yearsOfData: financials.length,
    isPredictable: true,
  };

  if (financials.length === 0) {
    result.isPredictable = false;
    return result;
  }

  // Sort by year descending (most recent first)
  const sorted = [...financials].sort((a, b) => b.fiscalYear - a.fiscalYear);

  // Calculate ROIC for most recent year
  const mostRecent = sorted[0];
  result.roic1Year = calculateROIC(
    mostRecent.operatingIncome ? Number(mostRecent.operatingIncome) : null,
    mostRecent.incomeTaxExpense ? Number(mostRecent.incomeTaxExpense) : null,
    mostRecent.incomeBeforeTax ? Number(mostRecent.incomeBeforeTax) : null,
    mostRecent.totalEquity ? Number(mostRecent.totalEquity) : null,
    mostRecent.longTermDebt ? Number(mostRecent.longTermDebt) : null,
    mostRecent.shortTermDebt ? Number(mostRecent.shortTermDebt) : null
  );

  // If we have pre-calculated ROIC, use it
  if (mostRecent.roic !== null) {
    result.roic1Year = Number(mostRecent.roic);
  }

  // Calculate 5-year average ROIC
  if (sorted.length >= 5) {
    const roicValues = sorted.slice(0, 5).map((f) => (f.roic ? Number(f.roic) : null));
    const validRoics = roicValues.filter((r): r is number => r !== null);
    if (validRoics.length >= 3) {
      result.roic5Year = validRoics.reduce((sum, r) => sum + r, 0) / validRoics.length;
    }
  }

  // Calculate 10-year average ROIC
  if (sorted.length >= 10) {
    const roicValues = sorted.slice(0, 10).map((f) => (f.roic ? Number(f.roic) : null));
    const validRoics = roicValues.filter((r): r is number => r !== null);
    if (validRoics.length >= 5) {
      result.roic10Year = validRoics.reduce((sum, r) => sum + r, 0) / validRoics.length;
    }
  }

  // Calculate growth rates
  // EPS Growth
  const currentEps = getValueAtYear(sorted, 0, 'eps');
  const eps1YearAgo = getValueAtYear(sorted, 1, 'eps');
  const eps5YearsAgo = getValueAtYear(sorted, 5, 'eps');
  const eps10YearsAgo = getValueAtYear(sorted, 9, 'eps');

  result.epsGrowth1Year = calculateCAGR(eps1YearAgo, currentEps, 1);
  result.epsGrowth5Year = calculateCAGR(eps5YearsAgo, currentEps, 5);
  result.epsGrowth10Year = calculateCAGR(eps10YearsAgo, currentEps, 10);

  // Revenue Growth
  const currentRevenue = getValueAtYear(sorted, 0, 'revenue');
  const revenue1YearAgo = getValueAtYear(sorted, 1, 'revenue');
  const revenue5YearsAgo = getValueAtYear(sorted, 5, 'revenue');
  const revenue10YearsAgo = getValueAtYear(sorted, 9, 'revenue');

  result.revenueGrowth1Year = calculateCAGR(revenue1YearAgo, currentRevenue, 1);
  result.revenueGrowth5Year = calculateCAGR(revenue5YearsAgo, currentRevenue, 5);
  result.revenueGrowth10Year = calculateCAGR(revenue10YearsAgo, currentRevenue, 10);

  // Equity Growth (Book Value)
  const currentEquity = getValueAtYear(sorted, 0, 'totalEquity');
  const equity1YearAgo = getValueAtYear(sorted, 1, 'totalEquity');
  const equity5YearsAgo = getValueAtYear(sorted, 5, 'totalEquity');
  const equity10YearsAgo = getValueAtYear(sorted, 9, 'totalEquity');

  result.equityGrowth1Year = calculateCAGR(equity1YearAgo, currentEquity, 1);
  result.equityGrowth5Year = calculateCAGR(equity5YearsAgo, currentEquity, 5);
  result.equityGrowth10Year = calculateCAGR(equity10YearsAgo, currentEquity, 10);

  // FCF Growth
  const currentFCF = getValueAtYear(sorted, 0, 'freeCashFlow');
  const fcf1YearAgo = getValueAtYear(sorted, 1, 'freeCashFlow');
  const fcf5YearsAgo = getValueAtYear(sorted, 5, 'freeCashFlow');
  const fcf10YearsAgo = getValueAtYear(sorted, 9, 'freeCashFlow');

  result.fcfGrowth1Year = calculateCAGR(fcf1YearAgo, currentFCF, 1);
  result.fcfGrowth5Year = calculateCAGR(fcf5YearsAgo, currentFCF, 5);
  result.fcfGrowth10Year = calculateCAGR(fcf10YearsAgo, currentFCF, 10);

  // Calculate max-year growth (fallback when 10-year isn't available)
  // Max years we can calculate = total data points - 1 (need start and end values)
  const maxYears = sorted.length - 1;

  // Only calculate max-year if:
  // 1. We have at least 6 years of data (otherwise 5-year already covers it)
  // 2. The 10-year value is null (otherwise 10-year already exists)
  if (maxYears >= 6) {
    // EPS max-year growth
    if (result.epsGrowth10Year === null) {
      const oldestEps = getValueAtYear(sorted, maxYears, 'eps');
      result.epsGrowthMaxYear = calculateCAGR(oldestEps, currentEps, maxYears);
      result.epsGrowthMaxYearPeriod = maxYears;
    }

    // Revenue max-year growth
    if (result.revenueGrowth10Year === null) {
      const oldestRevenue = getValueAtYear(sorted, maxYears, 'revenue');
      result.revenueGrowthMaxYear = calculateCAGR(oldestRevenue, currentRevenue, maxYears);
      result.revenueGrowthMaxYearPeriod = maxYears;
    }

    // Equity max-year growth
    if (result.equityGrowth10Year === null) {
      const oldestEquity = getValueAtYear(sorted, maxYears, 'totalEquity');
      result.equityGrowthMaxYear = calculateCAGR(oldestEquity, currentEquity, maxYears);
      result.equityGrowthMaxYearPeriod = maxYears;
    }

    // FCF max-year growth
    if (result.fcfGrowth10Year === null) {
      const oldestFCF = getValueAtYear(sorted, maxYears, 'freeCashFlow');
      result.fcfGrowthMaxYear = calculateCAGR(oldestFCF, currentFCF, maxYears);
      result.fcfGrowthMaxYearPeriod = maxYears;
    }
  }

  // Determine predictability
  // A company is unpredictable if:
  // - Less than 5 years of data
  // - Any Big Five metric is significantly negative
  // - High variance in earnings
  if (sorted.length < 5) {
    result.isPredictable = false;
  } else {
    const growthRates = [
      result.epsGrowth5Year,
      result.revenueGrowth5Year,
      result.equityGrowth5Year,
      result.fcfGrowth5Year,
    ].filter((r): r is number => r !== null);

    // If more than half of growth rates are negative, mark as unpredictable
    const negativeCount = growthRates.filter((r) => r < -10).length;
    if (negativeCount > growthRates.length / 2) {
      result.isPredictable = false;
    }
  }

  return result;
}
