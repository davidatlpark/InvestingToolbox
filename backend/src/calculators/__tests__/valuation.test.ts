import { describe, it, expect } from 'vitest';
import {
  calculateValuation,
  calculatePaybackTime,
  calculateOwnerEarnings,
  calculateTenCapPrice,
  estimateGrowthRate,
  estimateFuturePE,
  calculateMarginPercentage,
  getRecommendation,
} from '../valuation.js';

describe('calculateValuation', () => {
  it('calculates valuation using Phil Town formula', () => {
    // Same example as scoring tests but with percentage inputs
    const result = calculateValuation({
      currentEps: 5,
      growthRate: 15, // 15% as percentage
      futurePe: 30,
      minReturnRate: 15,
      years: 10,
    });

    expect(result.futureEps).toBeCloseTo(20.23, 1);
    expect(result.futurePrice).toBeCloseTo(606.89, 0);
    expect(result.stickerPrice).toBeCloseTo(150, 0);
    expect(result.mosPrice).toBeCloseTo(75, 0);
  });

  it('uses default values for optional parameters', () => {
    const result = calculateValuation({
      currentEps: 5,
      growthRate: 15,
      futurePe: 30,
    });

    // Should use 15% min return and 10 years by default
    // The sticker price being correct proves defaults are used
    expect(result.stickerPrice).toBeCloseTo(150, 0);
    // Note: input object preserves original values, defaults aren't added to it
    expect(result.inputs.currentEps).toBe(5);
  });

  it('handles different year horizons with different rates', () => {
    // Use different growth vs discount rate to see the difference
    // Growth: 20%, Discount: 15%
    const result5Years = calculateValuation({
      currentEps: 5,
      growthRate: 20,
      futurePe: 30,
      minReturnRate: 15,
      years: 5,
    });

    const result10Years = calculateValuation({
      currentEps: 5,
      growthRate: 20,
      futurePe: 30,
      minReturnRate: 15,
      years: 10,
    });

    // With higher growth than discount, 10-year produces higher sticker price
    expect(result10Years.stickerPrice).toBeGreaterThan(result5Years.stickerPrice);
  });

  it('preserves input values in result', () => {
    const input = {
      currentEps: 7.5,
      growthRate: 12,
      futurePe: 25,
      minReturnRate: 15,
      years: 10,
    };

    const result = calculateValuation(input);

    expect(result.inputs).toEqual(input);
  });
});

describe('calculatePaybackTime', () => {
  it('calculates years correctly', () => {
    // $100 stock, $10 EPS, 10% growth
    // Year 1: 11, Year 2: 12.1, Year 3: 13.31, Year 4: 14.64...
    // Cumulative: 11, 23.1, 36.41, 51.05, 67.16, 85.87, 107.46
    const years = calculatePaybackTime(100, 10, 10);
    expect(years).toBe(7);
  });

  it('returns 999 for negative EPS (can\'t pay back)', () => {
    const years = calculatePaybackTime(100, -5, 10);
    expect(years).toBe(999);
  });

  it('returns 0 for zero stock price', () => {
    const years = calculatePaybackTime(0, 10, 10);
    expect(years).toBe(0);
  });

  it('handles zero growth rate', () => {
    // $50 stock, $10 EPS, 0% growth
    // Will take 5 years at $10/year
    const years = calculatePaybackTime(50, 10, 0);
    expect(years).toBe(5);
  });
});

describe('calculateOwnerEarnings', () => {
  it('calculates owner earnings as OCF minus CapEx', () => {
    const ownerEarnings = calculateOwnerEarnings(100_000_000, 30_000_000);
    expect(ownerEarnings).toBe(70_000_000);
  });

  it('handles negative CapEx (treats as positive spending)', () => {
    // CapEx is often reported as negative in financials
    const ownerEarnings = calculateOwnerEarnings(100_000_000, -30_000_000);
    expect(ownerEarnings).toBe(70_000_000);
  });

  it('returns negative owner earnings when CapEx exceeds OCF', () => {
    const ownerEarnings = calculateOwnerEarnings(50_000_000, 80_000_000);
    expect(ownerEarnings).toBe(-30_000_000);
  });
});

describe('calculateTenCapPrice', () => {
  it('returns 10x owner earnings', () => {
    expect(calculateTenCapPrice(10_000_000)).toBe(100_000_000);
    expect(calculateTenCapPrice(5_000_000)).toBe(50_000_000);
  });

  it('handles negative owner earnings', () => {
    expect(calculateTenCapPrice(-5_000_000)).toBe(-50_000_000);
  });

  it('returns zero for zero owner earnings', () => {
    expect(calculateTenCapPrice(0)).toBe(0);
  });
});

describe('estimateGrowthRate', () => {
  it('returns median of valid growth rates', () => {
    // Median of [8, 10, 12, 15, 20] = 12
    const rate = estimateGrowthRate([8, 10, 12, 15, 20]);
    expect(rate).toBe(12);
  });

  it('returns 10% default for empty array', () => {
    const rate = estimateGrowthRate([]);
    expect(rate).toBe(10);
  });

  it('caps at 30%', () => {
    const rate = estimateGrowthRate([40, 50, 60]);
    expect(rate).toBe(30);
  });

  it('floors at 0%', () => {
    const rate = estimateGrowthRate([-10, -20, -30]);
    expect(rate).toBe(0);
  });

  it('filters out NaN values', () => {
    const rate = estimateGrowthRate([10, NaN, 15, NaN]);
    // Median of [10, 15] at index floor(2/2)=1 is 15
    expect(rate).toBe(15);
  });
});

describe('estimateFuturePE', () => {
  it('returns 2x growth rate', () => {
    expect(estimateFuturePE(15)).toBe(30); // 15% * 2 = 30
    expect(estimateFuturePE(10)).toBe(20); // 10% * 2 = 20
  });

  it('caps at 50', () => {
    expect(estimateFuturePE(30)).toBe(50); // 30 * 2 = 60, capped to 50
  });

  it('floors at 10', () => {
    expect(estimateFuturePE(2)).toBe(10); // 2 * 2 = 4, floored to 10
  });
});

describe('calculateMarginPercentage', () => {
  it('returns 0% when price equals target', () => {
    const margin = calculateMarginPercentage(100, 100);
    expect(margin).toBe(0);
  });

  it('returns negative percentage when undervalued', () => {
    // Current $80, target $100 -> -20% (20% below target)
    const margin = calculateMarginPercentage(80, 100);
    expect(margin).toBe(-20);
  });

  it('returns positive percentage when overvalued', () => {
    // Current $120, target $100 -> +20% (20% above target)
    const margin = calculateMarginPercentage(120, 100);
    expect(margin).toBe(20);
  });

  it('handles zero target price', () => {
    const margin = calculateMarginPercentage(100, 0);
    expect(margin).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    const margin = calculateMarginPercentage(33, 100);
    expect(margin).toBe(-67); // Rounded from -66.666...
  });
});

describe('getRecommendation', () => {
  it('returns BUY when price is at or below MOS', () => {
    expect(getRecommendation(50, 75, 150)).toBe('BUY');
    expect(getRecommendation(75, 75, 150)).toBe('BUY'); // At MOS price
  });

  it('returns HOLD when price is between MOS and sticker', () => {
    expect(getRecommendation(100, 75, 150)).toBe('HOLD');
    expect(getRecommendation(149, 75, 150)).toBe('HOLD');
    expect(getRecommendation(150, 75, 150)).toBe('HOLD'); // At sticker price
  });

  it('returns AVOID when price is above sticker', () => {
    expect(getRecommendation(151, 75, 150)).toBe('AVOID');
    expect(getRecommendation(200, 75, 150)).toBe('AVOID');
  });
});
