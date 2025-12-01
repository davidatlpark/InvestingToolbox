import { Router } from 'express';
import { z } from 'zod';
import { validateParams, validateQuery } from '../middleware/validateRequest.js';
import { yahooClient } from '../services/yahoo/client.js';
import { ApiError } from '../middleware/errorHandler.js';

export const quotesRouter = Router();

// Validation schemas
const tickerParamsSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
});

const batchQuerySchema = z.object({
  tickers: z.string().min(1), // Comma-separated list
});

// GET /api/quotes/:ticker - Get quote for a single ticker
// Uses Yahoo Finance for FREE quotes (FMP free tier limits quotes to major stocks)
quotesRouter.get('/:ticker', validateParams(tickerParamsSchema), async (req, res) => {
  const { ticker } = req.params;

  const quote = await yahooClient.getQuote(ticker);

  if (!quote) {
    throw ApiError.notFound(`Quote not found for ${ticker}`);
  }

  res.json({
    success: true,
    data: {
      ticker: quote.symbol,
      name: quote.name,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      dayLow: quote.dayLow,
      dayHigh: quote.dayHigh,
      yearLow: quote.yearLow,
      yearHigh: quote.yearHigh,
      volume: quote.volume,
      avgVolume: quote.avgVolume,
      marketCap: quote.marketCap,
      pe: quote.pe,
      eps: quote.eps,
      open: quote.open,
      previousClose: quote.previousClose,
      fetchedAt: new Date().toISOString(),
    },
  });
});

// GET /api/quotes/batch - Get quotes for multiple tickers
// Uses Yahoo Finance for FREE quotes (FMP free tier limits quotes to major stocks)
quotesRouter.get('/', validateQuery(batchQuerySchema), async (req, res) => {
  const { tickers } = req.query as { tickers: string };

  // Parse comma-separated tickers
  const tickerList = tickers
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t.length > 0)
    .slice(0, 50); // Limit to 50 tickers

  if (tickerList.length === 0) {
    return res.json({ success: true, data: [] });
  }

  const quotes = await yahooClient.getBatchQuotes(tickerList);

  res.json({
    success: true,
    data: quotes.map((q) => ({
      ticker: q.symbol,
      name: q.name,
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
      volume: q.volume,
      marketCap: q.marketCap,
      pe: q.pe,
      fetchedAt: new Date().toISOString(),
    })),
  });
});
