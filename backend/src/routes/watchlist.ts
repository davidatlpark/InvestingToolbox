import { Router } from 'express';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validateRequest.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { fmpClient } from '../services/fmp/client.js';

export const watchlistRouter = Router();

// Validation schemas
const tickerParamsSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
});

const addToWatchlistSchema = z.object({
  targetPrice: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
});

const updateWatchlistSchema = z.object({
  targetPrice: z.number().positive().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// GET /api/watchlist - Get all watchlist items
watchlistRouter.get('/', async (_req, res) => {
  const items = await prisma.watchlistItem.findMany({
    include: {
      company: {
        include: {
          scores: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get current prices for all tickers
  const tickers = items.map((i) => i.company.ticker);
  const quotes = tickers.length > 0 ? await fmpClient.getBatchQuotes(tickers) : [];
  const priceMap = new Map(quotes.map((q) => [q.symbol, q]));

  res.json({
    success: true,
    data: items.map((item) => {
      const quote = priceMap.get(item.company.ticker);
      const score = item.company.scores[0];

      return {
        id: item.id,
        ticker: item.company.ticker,
        name: item.company.name,
        sector: item.company.sector,
        targetPrice: item.targetPrice,
        notes: item.notes,
        currentPrice: quote?.price ?? null,
        change: quote?.change ?? null,
        changePercent: quote?.changesPercentage ?? null,
        valueScore: score?.valueScore ?? null,
        mosPrice: score?.mosPrice ?? null,
        percentToTarget:
          item.targetPrice && quote?.price
            ? Math.round(((item.targetPrice - quote.price) / quote.price) * 100 * 100) / 100
            : null,
        addedAt: item.createdAt.toISOString(),
      };
    }),
  });
});

// POST /api/watchlist/:ticker - Add to watchlist
watchlistRouter.post(
  '/:ticker',
  validateParams(tickerParamsSchema),
  validateBody(addToWatchlistSchema),
  async (req, res) => {
    const { ticker } = req.params;
    const { targetPrice, notes } = req.body as z.infer<typeof addToWatchlistSchema>;

    // Check if company exists, if not create it
    let company = await prisma.company.findUnique({
      where: { ticker },
    });

    if (!company) {
      // Fetch company info from FMP
      const profile = await fmpClient.getCompanyProfile(ticker);
      if (!profile) {
        throw ApiError.notFound(`Company ${ticker} not found`);
      }

      company = await prisma.company.create({
        data: {
          ticker,
          name: profile.companyName,
          sector: profile.sector,
          industry: profile.industry,
          exchange: profile.exchangeShortName,
          description: profile.description,
          marketCap: profile.mktCap,
          country: profile.country,
          website: profile.website,
        },
      });
    }

    // Check if already in watchlist
    const existing = await prisma.watchlistItem.findUnique({
      where: { companyId: company.id },
    });

    if (existing) {
      throw ApiError.badRequest(`${ticker} is already in your watchlist`);
    }

    // Add to watchlist
    const item = await prisma.watchlistItem.create({
      data: {
        companyId: company.id,
        targetPrice,
        notes,
      },
      include: {
        company: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: item.id,
        ticker: item.company.ticker,
        name: item.company.name,
        targetPrice: item.targetPrice,
        notes: item.notes,
        addedAt: item.createdAt.toISOString(),
      },
    });
  }
);

// DELETE /api/watchlist/:ticker - Remove from watchlist
watchlistRouter.delete('/:ticker', validateParams(tickerParamsSchema), async (req, res) => {
  const { ticker } = req.params;

  const company = await prisma.company.findUnique({
    where: { ticker },
    include: {
      watchlistItem: true,
    },
  });

  if (!company || !company.watchlistItem) {
    throw ApiError.notFound(`${ticker} is not in your watchlist`);
  }

  await prisma.watchlistItem.delete({
    where: { id: company.watchlistItem.id },
  });

  res.json({
    success: true,
    message: `${ticker} removed from watchlist`,
  });
});

// PATCH /api/watchlist/:ticker - Update watchlist item
watchlistRouter.patch(
  '/:ticker',
  validateParams(tickerParamsSchema),
  validateBody(updateWatchlistSchema),
  async (req, res) => {
    const { ticker } = req.params;
    const { targetPrice, notes } = req.body as z.infer<typeof updateWatchlistSchema>;

    const company = await prisma.company.findUnique({
      where: { ticker },
      include: {
        watchlistItem: true,
      },
    });

    if (!company || !company.watchlistItem) {
      throw ApiError.notFound(`${ticker} is not in your watchlist`);
    }

    const item = await prisma.watchlistItem.update({
      where: { id: company.watchlistItem.id },
      data: {
        targetPrice: targetPrice === null ? null : targetPrice,
        notes: notes === null ? null : notes,
      },
      include: {
        company: true,
      },
    });

    res.json({
      success: true,
      data: {
        id: item.id,
        ticker: item.company.ticker,
        name: item.company.name,
        targetPrice: item.targetPrice,
        notes: item.notes,
        updatedAt: item.updatedAt.toISOString(),
      },
    });
  }
);
