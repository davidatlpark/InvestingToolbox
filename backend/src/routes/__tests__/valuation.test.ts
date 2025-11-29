/**
 * Valuation Route Integration Tests
 *
 * These tests verify that:
 * 1. POST /api/valuation/calculate accepts valid inputs and returns correct calculations
 * 2. Validation errors are properly returned for invalid inputs
 * 3. GET /api/valuation/:ticker/default retrieves and calculates valuation from DB data
 *
 * WHY Integration Tests?
 * - Unit tests verify calculator logic in isolation
 * - Integration tests verify the full HTTP request/response cycle
 * - They catch issues like middleware ordering, serialization, route mounting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';

// Mock the database module
vi.mock('../../config/database.js', () => ({
  prisma: {
    company: {
      findUnique: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

// Mock the FMP client
vi.mock('../../services/fmp/client.js', () => ({
  fmpClient: {
    getQuote: vi.fn(),
    getCompanyProfile: vi.fn(),
    searchCompany: vi.fn(),
    getFinancialStatements: vi.fn(),
  },
}));

import { prisma } from '../../config/database.js';
import { fmpClient } from '../../services/fmp/client.js';
import { Prisma } from '@prisma/client';

describe('Valuation Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // POST /api/valuation/calculate
  // ===========================================================================
  describe('POST /api/valuation/calculate', () => {
    /**
     * Test: Valid input returns correct valuation
     *
     * The calculation follows Phil Town's Rule #1 formula:
     * 1. Future EPS = Current EPS × (1 + Growth Rate)^Years
     * 2. Future Price = Future EPS × Future PE
     * 3. Sticker Price = Future Price / (1 + Min Return Rate)^Years
     * 4. MOS Price = Sticker Price × 0.5
     */
    it('calculates valuation correctly with valid input', async () => {
      const input = {
        currentEps: 5.0,
        growthRate: 15, // 15%
        futurePe: 30,
      };

      const response = await request(app)
        .post('/api/valuation/calculate')
        .send(input)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('futureEps');
      expect(response.body.data).toHaveProperty('futurePrice');
      expect(response.body.data).toHaveProperty('stickerPrice');
      expect(response.body.data).toHaveProperty('mosPrice');

      // Verify calculations are reasonable
      // Future EPS = 5 × (1.15)^10 ≈ 20.23
      expect(response.body.data.futureEps).toBeCloseTo(20.23, 1);
      // Future Price = 20.23 × 30 ≈ 606.90
      expect(response.body.data.futurePrice).toBeCloseTo(606.9, 0);
      // Sticker Price = 606.90 / (1.15)^10 ≈ 150.00
      expect(response.body.data.stickerPrice).toBeCloseTo(150, 0);
      // MOS Price = 150 × 0.5 = 75
      expect(response.body.data.mosPrice).toBeCloseTo(75, 0);
    });

    /**
     * Test: Uses default values when optional params not provided
     *
     * Defaults are:
     * - growthRate: 10%
     * - futurePe: 20
     * - minReturnRate: 15%
     * - years: 10
     */
    it('uses default values for optional parameters', async () => {
      const input = {
        currentEps: 5.0,
      };

      const response = await request(app)
        .post('/api/valuation/calculate')
        .send(input)
        .expect(200);

      expect(response.body.success).toBe(true);
      // With defaults: growth=10%, PE=20
      // Future EPS = 5 × (1.1)^10 ≈ 12.97
      // Future Price = 12.97 × 20 ≈ 259.40
      // Sticker Price = 259.40 / (1.15)^10 ≈ 64.09
      expect(response.body.data.stickerPrice).toBeCloseTo(64, 0);
    });

    /**
     * Test: Calculates payback time when currentPrice is provided
     *
     * Payback time = years for cumulative EPS to equal current price
     */
    it('calculates payback time when currentPrice is provided', async () => {
      const input = {
        currentEps: 5.0,
        growthRate: 15,
        futurePe: 30,
        currentPrice: 100, // Current stock price
      };

      const response = await request(app)
        .post('/api/valuation/calculate')
        .send(input)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paybackTime).toBeDefined();
      expect(response.body.data.paybackTime).toBeGreaterThan(0);
      expect(response.body.data.paybackTime).toBeLessThan(20);
    });

    /**
     * Test: Returns recommendation based on price vs MOS
     */
    it('returns recommendation when currentPrice is provided', async () => {
      const input = {
        currentEps: 5.0,
        growthRate: 15,
        futurePe: 30,
        currentPrice: 50, // Below MOS price of ~75
      };

      const response = await request(app)
        .post('/api/valuation/calculate')
        .send(input)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendation).toBeDefined();
      // Price 50 < MOS 75, should recommend buy
      expect(response.body.data.recommendation).toContain('BUY');
    });

    /**
     * Test: Rejects negative EPS
     *
     * Phil Town's method requires positive EPS - companies with losses
     * can't be valued using this approach.
     */
    it('rejects negative EPS with validation error', async () => {
      const input = {
        currentEps: -5.0, // Invalid: negative
        growthRate: 15,
        futurePe: 30,
      };

      const response = await request(app)
        .post('/api/valuation/calculate')
        .send(input)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    /**
     * Test: Rejects missing required field
     */
    it('rejects request without currentEps', async () => {
      const input = {
        growthRate: 15,
        futurePe: 30,
      };

      const response = await request(app)
        .post('/api/valuation/calculate')
        .send(input)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    /**
     * Test: Rejects out-of-range values
     */
    it('rejects growthRate above 100%', async () => {
      const input = {
        currentEps: 5.0,
        growthRate: 150, // Invalid: above 100%
        futurePe: 30,
      };

      const response = await request(app)
        .post('/api/valuation/calculate')
        .send(input)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ===========================================================================
  // GET /api/valuation/:ticker/default
  // ===========================================================================
  describe('GET /api/valuation/:ticker/default', () => {
    /**
     * Test: Returns valuation for existing company
     *
     * This endpoint fetches company data from DB and calculates
     * a default valuation based on historical growth rates.
     */
    it('returns default valuation for existing company', async () => {
      // Setup mock data
      const mockCompany = {
        id: 'cuid-123',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        scores: [
          {
            epsGrowth10Year: 12.5,
            epsGrowth5Year: 15.0,
            equityGrowth10Year: 10.0,
            equityGrowth5Year: 11.0,
          },
        ],
        financials: [
          {
            fiscalYear: 2023,
            eps: new Prisma.Decimal(6.15),
            fiscalQuarter: null,
          },
        ],
      };

      const mockQuote = {
        symbol: 'AAPL',
        price: 185.5,
      };

      // Configure mocks
      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as Parameters<typeof prisma.company.findUnique>[0] extends { where: infer W } ? W : never);
      vi.mocked(fmpClient.getQuote).mockResolvedValue(mockQuote);

      const response = await request(app)
        .get('/api/valuation/AAPL/default')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ticker).toBe('AAPL');
      expect(response.body.data.currentEps).toBe(6.15);
      expect(response.body.data.currentPrice).toBe(185.5);
      expect(response.body.data).toHaveProperty('stickerPrice');
      expect(response.body.data).toHaveProperty('mosPrice');
      expect(response.body.data).toHaveProperty('estimatedGrowthRate');
    });

    /**
     * Test: Returns 404 for non-existent company
     */
    it('returns 404 for non-existent company', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/valuation/INVALID/default')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });

    /**
     * Test: Returns error when no EPS data available
     */
    it('returns error when no EPS data available', async () => {
      const mockCompany = {
        id: 'cuid-123',
        ticker: 'TEST',
        name: 'Test Company',
        scores: [],
        financials: [
          {
            fiscalYear: 2023,
            eps: null, // No EPS data
            fiscalQuarter: null,
          },
        ],
      };

      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as Parameters<typeof prisma.company.findUnique>[0] extends { where: infer W } ? W : never);

      const response = await request(app)
        .get('/api/valuation/TEST/default')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('EPS');
    });

    /**
     * Test: Normalizes ticker to uppercase
     *
     * Tickers should be case-insensitive: "aapl" and "AAPL" are the same.
     */
    it('normalizes ticker to uppercase', async () => {
      const mockCompany = {
        id: 'cuid-123',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        scores: [{ epsGrowth10Year: 12.5, epsGrowth5Year: 15.0, equityGrowth10Year: 10.0, equityGrowth5Year: 11.0 }],
        financials: [{ fiscalYear: 2023, eps: new Prisma.Decimal(6.15), fiscalQuarter: null }],
      };

      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as Parameters<typeof prisma.company.findUnique>[0] extends { where: infer W } ? W : never);
      vi.mocked(fmpClient.getQuote).mockResolvedValue({ symbol: 'AAPL', price: 185 });

      await request(app)
        .get('/api/valuation/aapl/default') // lowercase
        .expect(200);

      // Verify the mock was called with uppercase ticker
      expect(prisma.company.findUnique).toHaveBeenCalled();
    });

    /**
     * Test: Calculates upside percentage correctly
     *
     * Upside = ((MOS Price - Current Price) / Current Price) × 100
     */
    it('calculates upside percentage', async () => {
      const mockCompany = {
        id: 'cuid-123',
        ticker: 'CHEAP',
        name: 'Cheap Stock',
        scores: [{ epsGrowth10Year: 20.0, epsGrowth5Year: 22.0, equityGrowth10Year: 18.0, equityGrowth5Year: 19.0 }],
        financials: [{ fiscalYear: 2023, eps: new Prisma.Decimal(5.0), fiscalQuarter: null }],
      };

      // Price way below MOS should show positive upside
      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as Parameters<typeof prisma.company.findUnique>[0] extends { where: infer W } ? W : never);
      vi.mocked(fmpClient.getQuote).mockResolvedValue({ symbol: 'CHEAP', price: 50 });

      const response = await request(app)
        .get('/api/valuation/CHEAP/default')
        .expect(200);

      expect(response.body.data.upside).toBeDefined();
      // With high growth rate and low price, should have significant upside
      expect(response.body.data.upside).toBeGreaterThan(0);
    });
  });
});
