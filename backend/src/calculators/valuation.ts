/**
 * Valuation Calculator
 *
 * Implements Rule One Investing valuation methods:
 * - Sticker Price (DCF-based)
 * - Margin of Safety Price
 * - Payback Time
 */

import type { ValuationInput, ValuationResult } from '../types/api.js';

/**
 * Calculate valuation using Sticker Price formula
 *
 * Phil Town's Formula:
 * 1. Future EPS = Current EPS × (1 + Growth Rate)^Years
 * 2. Future Price = Future EPS × Future PE
 * 3. Sticker Price = Future Price ÷ (1 + Min Return)^Years
 * 4. MOS Price = Sticker Price × 0.50
 *
 * @param input - Valuation input parameters
 * @returns ValuationResult with all calculated values
 */
export function calculateValuation(input: ValuationInput): ValuationResult {
  const {
    currentEps,
    growthRate, // as percentage (e.g., 15 for 15%)
    futurePe,
    minReturnRate = 15, // as percentage
    years = 10,
  } = input;

  // Convert percentages to decimals
  const growthDecimal = growthRate / 100;
  const returnDecimal = minReturnRate / 100;

  // Step 1: Calculate Future EPS
  const futureEps = currentEps * Math.pow(1 + growthDecimal, years);

  // Step 2: Calculate Future Price
  const futurePrice = futureEps * futurePe;

  // Step 3: Discount back to present (Sticker Price)
  const stickerPrice = futurePrice / Math.pow(1 + returnDecimal, years);

  // Step 4: Apply 50% Margin of Safety
  const mosPrice = stickerPrice * 0.5;

  return {
    futureEps: roundTo(futureEps, 2),
    futurePrice: roundTo(futurePrice, 2),
    stickerPrice: roundTo(stickerPrice, 2),
    mosPrice: roundTo(mosPrice, 2),
    inputs: input,
  };
}

/**
 * Calculate Payback Time
 *
 * How many years until cumulative earnings equal the stock price.
 * Target: 8 years or less is attractive.
 *
 * @param stockPrice - Current stock price
 * @param currentEps - Current earnings per share
 * @param growthRate - Expected annual growth rate (as percentage)
 * @returns Number of years for payback
 */
export function calculatePaybackTime(
  stockPrice: number,
  currentEps: number,
  growthRate: number
): number {
  if (currentEps <= 0) return 999; // Can't pay back with negative earnings
  if (stockPrice <= 0) return 0;

  const growthDecimal = growthRate / 100;
  let cumulativeEps = 0;
  let year = 0;
  let eps = currentEps;

  // Max 50 years to prevent infinite loops
  while (cumulativeEps < stockPrice && year < 50) {
    year++;
    eps = eps * (1 + growthDecimal);
    cumulativeEps += eps;
  }

  return year;
}

/**
 * Calculate Owner Earnings (Buffett's preferred metric)
 *
 * Owner Earnings = Net Income + Depreciation - Maintenance CapEx
 *
 * Since maintenance CapEx is hard to determine, we use a simplified version:
 * Owner Earnings = Operating Cash Flow - Capital Expenditures
 * (This is essentially Free Cash Flow)
 *
 * @param operatingCashFlow - Cash from operations
 * @param capitalExpenditures - Capital expenditures
 * @returns Owner earnings
 */
export function calculateOwnerEarnings(
  operatingCashFlow: number,
  capitalExpenditures: number
): number {
  return operatingCashFlow - Math.abs(capitalExpenditures);
}

/**
 * Calculate Ten Cap Price
 *
 * Buy price for 10% cash-on-cash return from owner earnings.
 * Ten Cap Price = Owner Earnings × 10
 *
 * @param ownerEarnings - Annual owner earnings
 * @returns Ten cap price
 */
export function calculateTenCapPrice(ownerEarnings: number): number {
  return ownerEarnings * 10;
}

/**
 * Estimate reasonable growth rate from historical data
 *
 * Uses conservative approach:
 * - Take the lower of EPS growth and equity growth
 * - Cap at 30% (overly optimistic otherwise)
 * - Floor at 0%
 *
 * @param historicalGrowthRates - Array of historical growth rates
 * @returns Estimated future growth rate
 */
export function estimateGrowthRate(historicalGrowthRates: number[]): number {
  const validRates = historicalGrowthRates.filter((r) => r !== null && !isNaN(r));

  if (validRates.length === 0) return 10; // Default 10%

  // Use median to reduce impact of outliers
  const sorted = [...validRates].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // Cap between 0% and 30%
  return Math.min(Math.max(median, 0), 30);
}

/**
 * Estimate future PE ratio
 *
 * Rule of thumb: PE = 2 × Growth Rate
 * Capped between 10 and 50
 *
 * @param growthRate - Expected growth rate (as percentage)
 * @returns Estimated future PE
 */
export function estimateFuturePE(growthRate: number): number {
  const pe = growthRate * 2;
  return Math.min(Math.max(pe, 10), 50);
}

/**
 * Calculate margin percentage between current price and target
 *
 * @param currentPrice - Current stock price
 * @param targetPrice - Target price (MOS price or sticker price)
 * @returns Percentage difference (negative = undervalued, positive = overvalued)
 */
export function calculateMarginPercentage(currentPrice: number, targetPrice: number): number {
  if (targetPrice === 0) return 0;
  return roundTo(((currentPrice - targetPrice) / targetPrice) * 100, 2);
}

/**
 * Determine investment recommendation based on price vs. MOS
 *
 * @param currentPrice - Current stock price
 * @param mosPrice - Margin of Safety price
 * @param stickerPrice - Sticker (fair value) price
 * @returns 'BUY' | 'HOLD' | 'AVOID'
 */
export function getRecommendation(
  currentPrice: number,
  mosPrice: number,
  stickerPrice: number
): 'BUY' | 'HOLD' | 'AVOID' {
  if (currentPrice <= mosPrice) {
    return 'BUY'; // Below MOS = great opportunity
  } else if (currentPrice <= stickerPrice) {
    return 'HOLD'; // Between MOS and Sticker = fair value
  } else {
    return 'AVOID'; // Above Sticker = overvalued
  }
}

// Utility function
function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}
