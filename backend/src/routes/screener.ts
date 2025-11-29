import { Router } from 'express';
import { z } from 'zod';
import { validateQuery } from '../middleware/validateRequest.js';
import { prisma } from '../config/database.js';

export const screenerRouter = Router();

// Screener query schema
const screenerQuerySchema = z.object({
  // Score filters
  minValueScore: z.coerce.number().min(0).max(100).optional(),
  maxValueScore: z.coerce.number().min(0).max(100).optional(),
  minRoicScore: z.coerce.number().min(0).max(100).optional(),
  minMoatScore: z.coerce.number().min(0).max(100).optional(),
  minDebtScore: z.coerce.number().min(0).max(100).optional(),

  // Valuation filters
  maxPaybackTime: z.coerce.number().min(0).optional(),

  // Company filters
  sector: z.string().optional(),
  industry: z.string().optional(),
  minMarketCap: z.coerce.number().optional(),
  maxMarketCap: z.coerce.number().optional(),

  // Sorting
  sortBy: z
    .enum(['valueScore', 'roicScore', 'moatScore', 'debtScore', 'paybackTime', 'marketCap'])
    .default('valueScore'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Pagination
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
});

// GET /api/screener - Screen stocks
screenerRouter.get('/', validateQuery(screenerQuerySchema), async (req, res) => {
  const {
    minValueScore,
    maxValueScore,
    minRoicScore,
    minMoatScore,
    minDebtScore,
    maxPaybackTime,
    sector,
    industry,
    minMarketCap,
    maxMarketCap,
    sortBy,
    sortOrder,
    page,
    limit,
  } = req.query as z.infer<typeof screenerQuerySchema>;

  // Build where clause for scores
  const scoreWhere: Record<string, unknown> = {};
  if (minValueScore !== undefined) scoreWhere.valueScore = { gte: minValueScore };
  if (maxValueScore !== undefined)
    scoreWhere.valueScore = { ...scoreWhere.valueScore, lte: maxValueScore };
  if (minRoicScore !== undefined) scoreWhere.roicScore = { gte: minRoicScore };
  if (minMoatScore !== undefined) scoreWhere.moatScore = { gte: minMoatScore };
  if (minDebtScore !== undefined) scoreWhere.debtScore = { gte: minDebtScore };
  if (maxPaybackTime !== undefined) scoreWhere.paybackTime = { lte: maxPaybackTime };

  // Build where clause for company
  const companyWhere: Record<string, unknown> = {};
  if (sector) companyWhere.sector = sector;
  if (industry) companyWhere.industry = industry;
  if (minMarketCap !== undefined) companyWhere.marketCap = { gte: minMarketCap };
  if (maxMarketCap !== undefined)
    companyWhere.marketCap = { ...companyWhere.marketCap, lte: maxMarketCap };

  // Get total count
  const total = await prisma.companyScore.count({
    where: {
      ...scoreWhere,
      company: companyWhere,
    },
  });

  // Get paginated results
  const scores = await prisma.companyScore.findMany({
    where: {
      ...scoreWhere,
      company: companyWhere,
    },
    include: {
      company: {
        select: {
          ticker: true,
          name: true,
          sector: true,
          industry: true,
          marketCap: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  res.json({
    success: true,
    data: scores.map((s) => ({
      ticker: s.company.ticker,
      name: s.company.name,
      sector: s.company.sector,
      industry: s.company.industry,
      marketCap: s.company.marketCap ? Number(s.company.marketCap) : null,
      valueScore: s.valueScore,
      roicScore: s.roicScore,
      moatScore: s.moatScore,
      debtScore: s.debtScore,
      stickerPrice: s.stickerPrice,
      mosPrice: s.mosPrice,
      paybackTime: s.paybackTime,
      currentPrice: s.currentPrice,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /api/screener/leaderboard - Get top ranked stocks
screenerRouter.get('/leaderboard', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const index = req.query.index as string | undefined;

  // Build company filter based on index
  // In a real implementation, you'd have index membership data
  const companyWhere: Record<string, unknown> = {};

  const scores = await prisma.companyScore.findMany({
    where: {
      valueScore: { gte: 70 }, // Only show stocks with decent scores
      isPredictable: true,
      company: companyWhere,
    },
    include: {
      company: {
        select: {
          ticker: true,
          name: true,
          sector: true,
          marketCap: true,
        },
      },
    },
    orderBy: {
      valueScore: 'desc',
    },
    take: limit,
  });

  res.json({
    success: true,
    data: scores.map((s, index) => ({
      rank: index + 1,
      ticker: s.company.ticker,
      name: s.company.name,
      sector: s.company.sector,
      marketCap: s.company.marketCap ? Number(s.company.marketCap) : null,
      valueScore: s.valueScore,
      roicScore: s.roicScore,
      moatScore: s.moatScore,
      debtScore: s.debtScore,
      mosPrice: s.mosPrice,
      currentPrice: s.currentPrice,
    })),
  });
});

// GET /api/screener/sectors - Get list of sectors
screenerRouter.get('/sectors', async (_req, res) => {
  const sectors = await prisma.company.groupBy({
    by: ['sector'],
    where: {
      sector: { not: null },
    },
    _count: true,
    orderBy: {
      _count: {
        sector: 'desc',
      },
    },
  });

  res.json({
    success: true,
    data: sectors.map((s) => ({
      sector: s.sector,
      count: s._count,
    })),
  });
});
