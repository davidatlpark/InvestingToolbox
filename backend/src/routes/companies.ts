import { Router } from 'express';
import { z } from 'zod';
import { validateParams, validateQuery } from '../middleware/validateRequest.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { fmpClient } from '../services/fmp/client.js';
import { calculateAllScores } from '../calculators/scoring.js';
import { calculateBigFive } from '../calculators/bigFive.js';
import type { ApiResponse, CompanyAnalysis } from '../types/api.js';

export const companiesRouter = Router();

// Validation schemas
const tickerParamsSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
});

const financialsQuerySchema = z.object({
  years: z.coerce.number().min(1).max(20).default(10),
  quarterly: z.coerce.boolean().default(false),
});

// GET /api/companies/:ticker - Get company analysis
companiesRouter.get(
  '/:ticker',
  validateParams(tickerParamsSchema),
  async (req, res) => {
    const { ticker } = req.params;

    // Try to get from database first
    let company = await prisma.company.findUnique({
      where: { ticker },
      include: {
        financials: {
          where: { fiscalQuarter: null }, // Annual only
          orderBy: { fiscalYear: 'desc' },
          take: 10,
        },
        scores: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    });

    // If not found or stale, fetch from API
    if (!company || !company.scores.length) {
      // Fetch from FMP
      const profile = await fmpClient.getCompanyProfile(ticker);
      if (!profile) {
        throw ApiError.notFound(`Company ${ticker} not found`);
      }

      const financials = await fmpClient.getFinancialStatements(ticker, 10);

      // Upsert company
      company = await prisma.company.upsert({
        where: { ticker },
        create: {
          ticker,
          name: profile.companyName,
          sector: profile.sector,
          industry: profile.industry,
          exchange: profile.exchangeShortName,
          description: profile.description,
          marketCap: profile.mktCap,
          country: profile.country,
          website: profile.website,
          lastUpdated: new Date(),
        },
        update: {
          name: profile.companyName,
          sector: profile.sector,
          industry: profile.industry,
          marketCap: profile.mktCap,
          lastUpdated: new Date(),
        },
        include: {
          financials: {
            where: { fiscalQuarter: null },
            orderBy: { fiscalYear: 'desc' },
            take: 10,
          },
          scores: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
        },
      });

      // Store financials
      for (const f of financials) {
        await prisma.financialStatement.upsert({
          where: {
            companyId_fiscalYear_fiscalQuarter: {
              companyId: company.id,
              fiscalYear: f.fiscalYear,
              fiscalQuarter: null,
            },
          },
          create: {
            companyId: company.id,
            ...f,
          },
          update: f,
        });
      }

      // Recalculate scores
      const freshFinancials = await prisma.financialStatement.findMany({
        where: { companyId: company.id, fiscalQuarter: null },
        orderBy: { fiscalYear: 'desc' },
        take: 10,
      });

      const bigFive = calculateBigFive(freshFinancials);
      const scores = calculateAllScores(freshFinancials, bigFive);

      // Get current price
      const quote = await fmpClient.getQuote(ticker);

      await prisma.companyScore.create({
        data: {
          companyId: company.id,
          ...scores,
          ...bigFive,
          currentPrice: quote?.price ?? null,
        },
      });

      // Refetch with scores
      company = await prisma.company.findUnique({
        where: { ticker },
        include: {
          financials: {
            where: { fiscalQuarter: null },
            orderBy: { fiscalYear: 'desc' },
            take: 10,
          },
          scores: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
        },
      });
    }

    if (!company) {
      throw ApiError.notFound(`Company ${ticker} not found`);
    }

    const score = company.scores[0];
    const quote = await fmpClient.getQuote(ticker);

    // Build response
    const response: ApiResponse<CompanyAnalysis> = {
      success: true,
      data: {
        company: {
          ticker: company.ticker,
          name: company.name,
          sector: company.sector,
          industry: company.industry,
          description: company.description,
          marketCap: company.marketCap ? Number(company.marketCap) : null,
          currentPrice: quote?.price ?? null,
        },
        scores: score
          ? {
              valueScore: score.valueScore,
              roicScore: score.roicScore,
              moatScore: score.moatScore,
              debtScore: score.debtScore,
              managementScore: score.managementScore,
              isPredictable: score.isPredictable,
            }
          : {
              valueScore: 0,
              roicScore: 0,
              moatScore: 0,
              debtScore: 0,
              managementScore: 0,
              isPredictable: false,
            },
        bigFive: score
          ? {
              roic: {
                year1: score.roic1Year,
                year5: score.roic5Year,
                year10: score.roic10Year,
              },
              epsGrowth: {
                year1: score.epsGrowth1Year,
                year5: score.epsGrowth5Year,
                year10: score.epsGrowth10Year,
              },
              revenueGrowth: {
                year1: score.revenueGrowth1Year,
                year5: score.revenueGrowth5Year,
                year10: score.revenueGrowth10Year,
              },
              equityGrowth: {
                year1: score.equityGrowth1Year,
                year5: score.equityGrowth5Year,
                year10: score.equityGrowth10Year,
              },
              fcfGrowth: {
                year1: score.fcfGrowth1Year,
                year5: score.fcfGrowth5Year,
                year10: score.fcfGrowth10Year,
              },
            }
          : {
              roic: { year1: null, year5: null, year10: null },
              epsGrowth: { year1: null, year5: null, year10: null },
              revenueGrowth: { year1: null, year5: null, year10: null },
              equityGrowth: { year1: null, year5: null, year10: null },
              fcfGrowth: { year1: null, year5: null, year10: null },
            },
        valuation: score
          ? {
              stickerPrice: score.stickerPrice,
              mosPrice: score.mosPrice,
              paybackTime: score.paybackTime,
              currentPrice: quote?.price ?? null,
              upside:
                score.mosPrice && quote?.price
                  ? ((score.mosPrice - quote.price) / quote.price) * 100
                  : null,
            }
          : {
              stickerPrice: null,
              mosPrice: null,
              paybackTime: null,
              currentPrice: null,
              upside: null,
            },
        meta: {
          lastUpdated: company.lastUpdated?.toISOString() ?? null,
          yearsOfData: score?.yearsOfData ?? 0,
        },
      },
    };

    res.json(response);
  }
);

// GET /api/companies/:ticker/financials - Get historical financials
companiesRouter.get(
  '/:ticker/financials',
  validateParams(tickerParamsSchema),
  validateQuery(financialsQuerySchema),
  async (req, res) => {
    const { ticker } = req.params;
    const { years, quarterly } = req.query as { years: number; quarterly: boolean };

    const company = await prisma.company.findUnique({
      where: { ticker },
    });

    if (!company) {
      throw ApiError.notFound(`Company ${ticker} not found`);
    }

    const financials = await prisma.financialStatement.findMany({
      where: {
        companyId: company.id,
        fiscalQuarter: quarterly ? { not: null } : null,
      },
      orderBy: { fiscalYear: 'desc' },
      take: quarterly ? years * 4 : years,
    });

    res.json({
      success: true,
      data: financials.map((f) => ({
        fiscalYear: f.fiscalYear,
        fiscalQuarter: f.fiscalQuarter,
        periodEndDate: f.periodEndDate,
        revenue: f.revenue ? Number(f.revenue) : null,
        netIncome: f.netIncome ? Number(f.netIncome) : null,
        eps: f.eps ? Number(f.eps) : null,
        totalEquity: f.totalEquity ? Number(f.totalEquity) : null,
        longTermDebt: f.longTermDebt ? Number(f.longTermDebt) : null,
        freeCashFlow: f.freeCashFlow ? Number(f.freeCashFlow) : null,
        operatingIncome: f.operatingIncome ? Number(f.operatingIncome) : null,
        roic: f.roic ? Number(f.roic) : null,
      })),
    });
  }
);

// POST /api/companies/:ticker/refresh - Force refresh data
companiesRouter.post(
  '/:ticker/refresh',
  validateParams(tickerParamsSchema),
  async (req, res) => {
    const { ticker } = req.params;

    // Delete existing scores to force recalculation
    const company = await prisma.company.findUnique({
      where: { ticker },
    });

    if (company) {
      await prisma.companyScore.deleteMany({
        where: { companyId: company.id },
      });
    }

    // Redirect to GET which will fetch fresh data
    res.redirect(`/api/companies/${ticker}`);
  }
);

// GET /api/companies/:ticker/scores/history - Get historical score data
companiesRouter.get(
  '/:ticker/scores/history',
  validateParams(tickerParamsSchema),
  async (req, res) => {
    const { ticker } = req.params;
    const limit = Math.min(Number(req.query.limit) || 30, 100); // Default 30 records, max 100

    const company = await prisma.company.findUnique({
      where: { ticker },
    });

    if (!company) {
      throw ApiError.notFound(`Company ${ticker} not found`);
    }

    // Fetch all historical scores ordered by date
    const scores = await prisma.companyScore.findMany({
      where: { companyId: company.id },
      orderBy: { calculatedAt: 'asc' }, // Oldest first for charting
      take: limit,
    });

    /**
     * WHY return simplified data structure?
     * - Optimized for charting (time-series format)
     * - Reduces payload size
     * - Frontend can easily map to chart data
     */
    res.json({
      success: true,
      data: scores.map((s) => ({
        date: s.calculatedAt.toISOString(),
        valueScore: s.valueScore,
        roicScore: s.roicScore,
        moatScore: s.moatScore,
        debtScore: s.debtScore,
        managementScore: s.managementScore,
        currentPrice: s.currentPrice,
        mosPrice: s.mosPrice,
        stickerPrice: s.stickerPrice,
      })),
      meta: {
        ticker,
        count: scores.length,
      },
    });
  }
);

// GET /api/companies/search - Search companies
companiesRouter.get('/search', async (req, res) => {
  const query = (req.query.q as string) || '';
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  if (!query || query.length < 2) {
    return res.json({ success: true, data: [] });
  }

  // Search FMP
  const results = await fmpClient.searchCompany(query, limit);

  res.json({
    success: true,
    data: results.map((r) => ({
      ticker: r.symbol,
      name: r.name,
      exchange: r.exchangeShortName,
    })),
  });
});
