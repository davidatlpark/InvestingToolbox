import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validateRequest.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { yahooClient } from '../services/yahoo/client.js';
import {
  calculateValuation,
  calculatePaybackTime,
  estimateGrowthRate,
  estimateFuturePE,
  getRecommendation,
} from '../calculators/valuation.js';
import type { ApiResponse, ValuationResult } from '../types/api.js';

export const valuationRouter = Router();

// Validation schemas
const valuationInputSchema = z.object({
  currentEps: z.number().positive('EPS must be positive'),
  growthRate: z.number().min(0).max(100).default(10),
  futurePe: z.number().min(1).max(100).default(20),
  minReturnRate: z.number().min(1).max(50).default(15),
  years: z.number().min(1).max(20).default(10),
  // Optional: current stock price for payback time and recommendation
  currentPrice: z.number().positive().optional(),
});

const tickerParamsSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
});

// POST /api/valuation/calculate - Calculate valuation with custom inputs
valuationRouter.post('/calculate', validateBody(valuationInputSchema), async (req, res) => {
  const input = req.body as z.infer<typeof valuationInputSchema>;

  const result = calculateValuation(input);

  // Also calculate payback time if we have a price
  // Now currentPrice comes from validated input, not raw body
  let paybackTime = null;
  let recommendation = null;

  if (input.currentPrice && input.currentPrice > 0) {
    paybackTime = calculatePaybackTime(input.currentPrice, input.currentEps, input.growthRate);
    recommendation = getRecommendation(input.currentPrice, result.mosPrice, result.stickerPrice);
  }

  const response: ApiResponse<ValuationResult & { paybackTime: number | null; recommendation: string | null }> = {
    success: true,
    data: {
      ...result,
      paybackTime,
      recommendation,
    },
  };

  res.json(response);
});

// GET /api/valuation/:ticker/default - Get default valuation for a ticker
valuationRouter.get(
  '/:ticker/default',
  validateParams(tickerParamsSchema),
  async (req, res) => {
    const { ticker } = req.params;

    // Get company scores (which include pre-calculated valuation)
    const company = await prisma.company.findUnique({
      where: { ticker },
      include: {
        scores: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
        financials: {
          where: { fiscalQuarter: null },
          orderBy: { fiscalYear: 'desc' },
          take: 10,
        },
      },
    });

    if (!company) {
      throw ApiError.notFound(`Company ${ticker} not found`);
    }

    const score = company.scores[0];
    const recentFinancial = company.financials[0];

    if (!recentFinancial || !recentFinancial.eps) {
      throw ApiError.badRequest(`No EPS data available for ${ticker}`);
    }

    // Get current price from Yahoo Finance (FREE for all tickers)
    const quote = await yahooClient.getQuote(ticker);
    const currentPrice = quote?.price ?? null;

    // Extract historical growth rates for estimation
    const growthRates = [
      score?.epsGrowth10Year,
      score?.epsGrowth5Year,
      score?.equityGrowth10Year,
      score?.equityGrowth5Year,
    ].filter((r): r is number => r !== null);

    const estimatedGrowth = estimateGrowthRate(growthRates);
    const estimatedPE = estimateFuturePE(estimatedGrowth);

    // Calculate valuation
    const result = calculateValuation({
      currentEps: Number(recentFinancial.eps),
      growthRate: estimatedGrowth,
      futurePe: estimatedPE,
    });

    // Calculate payback time and recommendation
    let paybackTime = null;
    let recommendation = null;

    if (currentPrice && currentPrice > 0) {
      paybackTime = calculatePaybackTime(currentPrice, Number(recentFinancial.eps), estimatedGrowth);
      recommendation = getRecommendation(currentPrice, result.mosPrice, result.stickerPrice);
    }

    res.json({
      success: true,
      data: {
        ticker,
        currentPrice,
        currentEps: Number(recentFinancial.eps),
        estimatedGrowthRate: estimatedGrowth,
        estimatedFuturePE: estimatedPE,
        ...result,
        paybackTime,
        recommendation,
        upside:
          currentPrice && result.mosPrice
            ? Math.round(((result.mosPrice - currentPrice) / currentPrice) * 100 * 100) / 100
            : null,
      },
    });
  }
);
