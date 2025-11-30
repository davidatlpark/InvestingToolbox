/**
 * SEC Filings Routes
 *
 * API endpoints for accessing SEC EDGAR filing data.
 * Provides access to 10-K and 10-Q filings for companies.
 *
 * WHY these endpoints?
 * - Users need to read SEC filings for due diligence
 * - 10-K (annual) and 10-Q (quarterly) are essential
 * - Provides links to official SEC documents
 *
 * Endpoints:
 * - GET /api/filings/:ticker - Get list of filings for a company
 * - GET /api/filings/:ticker/:accessionNumber - Get specific filing details
 */

import { Router } from 'express';
import { z } from 'zod';
import { secEdgarClient } from '../services/edgar';
import { validateParams } from '../middleware/validateRequest';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const filingsRouter = Router();

// Validation schemas
const tickerParamsSchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(5)
    .transform((val) => val.toUpperCase()),
});

const filingParamsSchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(5)
    .transform((val) => val.toUpperCase()),
  accessionNumber: z.string().min(10),
});

/**
 * GET /api/filings/:ticker
 *
 * Get list of SEC filings for a company.
 *
 * Query params:
 * - forms: Comma-separated list of form types (default: "10-K,10-Q")
 * - limit: Max number of filings to return (default: 20, max: 50)
 *
 * Response:
 * {
 *   ticker: "AAPL",
 *   companyName: "Apple Inc.",
 *   cik: "0000320193",
 *   filings: [
 *     {
 *       accessionNumber: "0000320193-23-000077",
 *       filingDate: "2023-11-03",
 *       form: "10-K",
 *       documentUrl: "https://...",
 *       ...
 *     }
 *   ]
 * }
 */
filingsRouter.get(
  '/:ticker',
  validateParams(tickerParamsSchema),
  async (req, res) => {
    const { ticker } = req.params;

    // Parse query params manually to avoid Zod type issues
    const formsParam = req.query.forms;
    const limitParam = req.query.limit;

    const forms = typeof formsParam === 'string' ? formsParam.split(',') : ['10-K', '10-Q'];
    const limit = Math.min(Number(limitParam) || 20, 50);

    logger.info(`Fetching SEC filings for ${ticker}`, { forms, limit });

    try {
      const filings = await secEdgarClient.getFilings(ticker, { forms, limit });

      res.json({
        success: true,
        data: filings,
      });
    } catch (error) {
      // Check if it's a "not found" error
      if (error instanceof Error && error.message.includes('No SEC data found')) {
        throw ApiError.notFound(`No SEC filings found for ticker ${ticker}`);
      }
      throw error;
    }
  }
);

/**
 * GET /api/filings/:ticker/:accessionNumber
 *
 * Get details for a specific filing, including document URLs.
 *
 * Response:
 * {
 *   filing: { ... },
 *   viewerUrl: "https://www.sec.gov/cgi-bin/viewer?...",
 *   documentUrl: "https://www.sec.gov/Archives/...",
 *   indexUrl: "https://www.sec.gov/Archives/.../index.json"
 * }
 */
filingsRouter.get(
  '/:ticker/:accessionNumber',
  validateParams(filingParamsSchema),
  async (req, res) => {
    const { ticker, accessionNumber } = req.params;

    logger.info(`Fetching SEC filing ${accessionNumber} for ${ticker}`);

    try {
      // Get company CIK
      const cikData = await secEdgarClient.getCikForTicker(ticker);
      if (!cikData) {
        throw ApiError.notFound(`No SEC data found for ticker ${ticker}`);
      }

      // Get filings to find the specific one
      const filingsData = await secEdgarClient.getFilings(ticker, { limit: 50 });
      const filing = filingsData.filings.find(
        (f) => f.accessionNumber === accessionNumber
      );

      if (!filing) {
        throw ApiError.notFound(`Filing ${accessionNumber} not found for ${ticker}`);
      }

      // Generate URLs
      const viewerUrl = secEdgarClient.getViewerUrl(accessionNumber);
      const indexUrl = secEdgarClient.getFilingIndexUrl(cikData.cik, accessionNumber);

      res.json({
        success: true,
        data: {
          ticker,
          companyName: filingsData.companyName,
          cik: cikData.cik,
          filing,
          viewerUrl,
          indexUrl,
        },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Error fetching filing ${accessionNumber}:`, error);
      throw ApiError.internal('Failed to fetch SEC filing');
    }
  }
);

/**
 * GET /api/filings/search/:query
 *
 * Search for companies in SEC database by name or ticker.
 *
 * Response:
 * {
 *   results: [
 *     { ticker: "AAPL", cik: "0000320193", name: "Apple Inc." },
 *     ...
 *   ]
 * }
 */
filingsRouter.get('/search/:query', async (req, res) => {
  const { query } = req.params;

  if (!query || query.length < 1) {
    throw ApiError.badRequest('Search query is required');
  }

  logger.info(`Searching SEC for: ${query}`);

  try {
    const results = await secEdgarClient.searchCompany(query);

    res.json({
      success: true,
      data: {
        query,
        results,
      },
    });
  } catch (error) {
    logger.error(`SEC search error:`, error);
    throw ApiError.internal('Failed to search SEC database');
  }
});
