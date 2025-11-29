/**
 * Scoring Engine
 *
 * Calculates scores based on Rule One / DecodeInvesting methodology:
 * - Value Score = 50% Moat + 40% ROIC + 10% Debt
 * - ROIC Score (0-100): Based on 10-year ROIC history
 * - Moat Score (0-100): Based on growth rate consistency
 * - Debt Score (0-100): Based on debt payoff ability
 * - Management Score = 80% ROIC + 20% Debt
 */

import type { FinancialStatement } from '@prisma/client';
import type { BigFiveMetrics } from './bigFive.js';

export interface ScoreResults {
  valueScore: number;
  roicScore: number;
  moatScore: number;
  debtScore: number;
  managementScore: number;
  stickerPrice: number | null;
  mosPrice: number | null;
  paybackTime: number | null;
}

/**
 * Calculate ROIC Score (0-100)
 *
 * Based on the average ROIC over time:
 * - ROIC >= 15%: 100 points
 * - ROIC >= 10%: 80 points
 * - ROIC >= 5%: 50 points
 * - ROIC >= 0%: 25 points
 * - ROIC < 0%: 0 points
 */
export function calculateROICScore(
  roic1Year: number | null,
  roic5Year: number | null,
  roic10Year: number | null
): number {
  // Weight: 10-year (50%), 5-year (30%), 1-year (20%)
  const weights = { y1: 0.2, y5: 0.3, y10: 0.5 };

  const scoreForROIC = (roic: number | null): number => {
    if (roic === null) return 0;
    if (roic >= 15) return 100;
    if (roic >= 10) return 80;
    if (roic >= 5) return 50;
    if (roic >= 0) return 25;
    return 0;
  };

  let totalWeight = 0;
  let weightedScore = 0;

  if (roic1Year !== null) {
    weightedScore += scoreForROIC(roic1Year) * weights.y1;
    totalWeight += weights.y1;
  }
  if (roic5Year !== null) {
    weightedScore += scoreForROIC(roic5Year) * weights.y5;
    totalWeight += weights.y5;
  }
  if (roic10Year !== null) {
    weightedScore += scoreForROIC(roic10Year) * weights.y10;
    totalWeight += weights.y10;
  }

  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
}

/**
 * Calculate Moat Score (0-100)
 *
 * Based on growth rate consistency across all Big Five metrics.
 * A strong moat is indicated by consistent 10%+ growth across all metrics.
 */
export function calculateMoatScore(bigFive: BigFiveMetrics): number {
  const growthMetrics = [
    { value: bigFive.epsGrowth10Year, weight: 3 },
    { value: bigFive.epsGrowth5Year, weight: 2 },
    { value: bigFive.epsGrowth1Year, weight: 1 },
    { value: bigFive.revenueGrowth10Year, weight: 3 },
    { value: bigFive.revenueGrowth5Year, weight: 2 },
    { value: bigFive.revenueGrowth1Year, weight: 1 },
    { value: bigFive.equityGrowth10Year, weight: 3 },
    { value: bigFive.equityGrowth5Year, weight: 2 },
    { value: bigFive.equityGrowth1Year, weight: 1 },
    { value: bigFive.fcfGrowth10Year, weight: 3 },
    { value: bigFive.fcfGrowth5Year, weight: 2 },
    { value: bigFive.fcfGrowth1Year, weight: 1 },
  ];

  const scoreForGrowth = (growth: number | null): number => {
    if (growth === null) return 0;
    if (growth >= 15) return 100;
    if (growth >= 10) return 80;
    if (growth >= 5) return 50;
    if (growth >= 0) return 25;
    return 0;
  };

  let totalWeight = 0;
  let weightedScore = 0;

  for (const metric of growthMetrics) {
    if (metric.value !== null) {
      weightedScore += scoreForGrowth(metric.value) * metric.weight;
      totalWeight += metric.weight;
    }
  }

  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
}

/**
 * Calculate Debt Score (0-100)
 *
 * Based on how quickly the company can pay off debt using Free Cash Flow.
 * - 0 years (no debt): 100
 * - 1-3 years: 80-100
 * - 3-5 years: 60-80
 * - 5-7 years: 40-60
 * - 7-10 years: 20-40
 * - 10+ years: 0-20
 */
export function calculateDebtScore(financials: FinancialStatement[]): number {
  if (financials.length === 0) return 0;

  // Get most recent financials
  const recent = financials[0];
  const longTermDebt = recent.longTermDebt ? Number(recent.longTermDebt) : 0;
  const shortTermDebt = recent.shortTermDebt ? Number(recent.shortTermDebt) : 0;
  const totalDebt = longTermDebt + shortTermDebt;
  const fcf = recent.freeCashFlow ? Number(recent.freeCashFlow) : 0;

  // No debt = perfect score
  if (totalDebt <= 0) return 100;

  // Negative or zero FCF = can't pay off debt
  if (fcf <= 0) return 0;

  const payoffYears = totalDebt / fcf;

  if (payoffYears <= 1) return 100;
  if (payoffYears <= 2) return 90;
  if (payoffYears <= 3) return 80;
  if (payoffYears <= 4) return 70;
  if (payoffYears <= 5) return 60;
  if (payoffYears <= 6) return 50;
  if (payoffYears <= 7) return 40;
  if (payoffYears <= 8) return 30;
  if (payoffYears <= 10) return 20;
  return 10;
}

/**
 * Calculate Management Score
 *
 * Primarily based on ROIC (shows capital allocation skill) with debt management
 * Management Score = 80% ROIC Score + 20% Debt Score
 */
export function calculateManagementScore(roicScore: number, debtScore: number): number {
  return Math.round(roicScore * 0.8 + debtScore * 0.2);
}

/**
 * Calculate Value Score
 *
 * Overall score combining Moat, ROIC, and Debt:
 * Value Score = 50% Moat + 40% ROIC + 10% Debt
 */
export function calculateValueScore(
  moatScore: number,
  roicScore: number,
  debtScore: number
): number {
  return Math.round(moatScore * 0.5 + roicScore * 0.4 + debtScore * 0.1);
}

/**
 * Calculate Sticker Price using Phil Town's formula
 *
 * 1. Future EPS = Current EPS × (1 + Growth Rate)^10
 * 2. Future Price = Future EPS × Future PE
 * 3. Sticker Price = Future Price ÷ (1 + Min Return Rate)^10
 * 4. MOS Price = Sticker Price × 0.50
 */
export function calculateStickerPrice(
  currentEps: number,
  growthRate: number, // as decimal (e.g., 0.15 for 15%)
  futurePe: number,
  minReturnRate: number = 0.15, // 15% default
  years: number = 10
): { stickerPrice: number; mosPrice: number } {
  const futureEps = currentEps * Math.pow(1 + growthRate, years);
  const futurePrice = futureEps * futurePe;
  const stickerPrice = futurePrice / Math.pow(1 + minReturnRate, years);
  const mosPrice = stickerPrice * 0.5;

  return {
    stickerPrice: Math.round(stickerPrice * 100) / 100,
    mosPrice: Math.round(mosPrice * 100) / 100,
  };
}

/**
 * Calculate Payback Time
 *
 * Years until cumulative earnings equal the purchase price.
 */
export function calculatePaybackTime(
  currentPrice: number,
  currentEps: number,
  growthRate: number // as decimal
): number {
  if (currentEps <= 0) return 50; // Can't calculate, return high number
  if (currentPrice <= 0) return 0;

  let cumulativeEps = 0;
  let year = 0;
  let eps = currentEps;

  while (cumulativeEps < currentPrice && year < 50) {
    year++;
    eps = eps * (1 + growthRate);
    cumulativeEps += eps;
  }

  return year;
}

/**
 * Estimate growth rate from historical data
 * Uses the lower of: 10-year equity growth or 10-year EPS growth
 * Capped at 30% (too optimistic otherwise)
 */
function estimateGrowthRate(bigFive: BigFiveMetrics): number {
  const candidates = [
    bigFive.equityGrowth10Year,
    bigFive.equityGrowth5Year,
    bigFive.epsGrowth10Year,
    bigFive.epsGrowth5Year,
  ].filter((r): r is number => r !== null && r > 0);

  if (candidates.length === 0) return 0.1; // Default 10%

  // Use the average of available rates, but be conservative
  const avg = candidates.reduce((sum, r) => sum + r, 0) / candidates.length;

  // Cap at 30%, floor at 0%
  return Math.min(Math.max(avg / 100, 0), 0.3);
}

/**
 * Estimate future PE ratio
 * Uses 2x growth rate, capped at 50
 */
function estimateFuturePE(growthRate: number): number {
  const pe = growthRate * 100 * 2; // 2x growth rate
  return Math.min(Math.max(pe, 10), 50); // Between 10 and 50
}

/**
 * Calculate all scores from financial statements
 */
export function calculateAllScores(
  financials: FinancialStatement[],
  bigFive: BigFiveMetrics
): ScoreResults {
  // Calculate component scores
  const roicScore = calculateROICScore(bigFive.roic1Year, bigFive.roic5Year, bigFive.roic10Year);

  const moatScore = calculateMoatScore(bigFive);
  const debtScore = calculateDebtScore(financials);
  const managementScore = calculateManagementScore(roicScore, debtScore);
  const valueScore = calculateValueScore(moatScore, roicScore, debtScore);

  // Calculate valuation
  let stickerPrice: number | null = null;
  let mosPrice: number | null = null;
  let paybackTime: number | null = null;

  if (financials.length > 0) {
    const recentEps = financials[0].eps ? Number(financials[0].eps) : null;

    if (recentEps && recentEps > 0) {
      const growthRate = estimateGrowthRate(bigFive);
      const futurePe = estimateFuturePE(growthRate);

      const valuation = calculateStickerPrice(recentEps, growthRate, futurePe);
      stickerPrice = valuation.stickerPrice;
      mosPrice = valuation.mosPrice;

      // We'd need current price to calculate payback time accurately
      // For now, use sticker price as proxy
      paybackTime = calculatePaybackTime(stickerPrice, recentEps, growthRate);
    }
  }

  return {
    valueScore,
    roicScore,
    moatScore,
    debtScore,
    managementScore,
    stickerPrice,
    mosPrice,
    paybackTime,
  };
}
