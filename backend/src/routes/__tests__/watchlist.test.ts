/**
 * Watchlist Route Integration Tests
 *
 * Tests the watchlist CRUD operations:
 * - GET /api/watchlist - List all items
 * - POST /api/watchlist/:ticker - Add item
 * - DELETE /api/watchlist/:ticker - Remove item
 * - PATCH /api/watchlist/:ticker - Update item
 *
 * WHY test watchlist operations?
 * - Core user-facing feature for tracking stocks
 * - Involves multiple database operations (company + watchlist)
 * - External API calls for pricing data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';

// Mock the database module
vi.mock('../../config/database.js', () => ({
  prisma: {
    watchlistItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

// Mock the FMP client
vi.mock('../../services/fmp/client.js', () => ({
  fmpClient: {
    getQuote: vi.fn(),
    getBatchQuotes: vi.fn(),
    getCompanyProfile: vi.fn(),
    searchCompany: vi.fn(),
    getFinancialStatements: vi.fn(),
  },
}));

import { prisma } from '../../config/database.js';
import { fmpClient } from '../../services/fmp/client.js';
import { Prisma } from '@prisma/client';

describe('Watchlist Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // GET /api/watchlist
  // ===========================================================================
  describe('GET /api/watchlist', () => {
    /**
     * Test: Returns empty array when watchlist is empty
     */
    it('returns empty array when watchlist is empty', async () => {
      vi.mocked(prisma.watchlistItem.findMany).mockResolvedValue([]);
      vi.mocked(fmpClient.getBatchQuotes).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/watchlist')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    /**
     * Test: Returns watchlist items with current prices
     *
     * This tests that:
     * 1. Items are fetched from the database
     * 2. Current prices are fetched from FMP
     * 3. Data is properly formatted in response
     */
    it('returns watchlist items with current prices', async () => {
      const mockItems = [
        {
          id: 'watchlist-1',
          companyId: 'company-1',
          targetPrice: 150.0,
          notes: 'Great company',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
          company: {
            id: 'company-1',
            ticker: 'AAPL',
            name: 'Apple Inc.',
            sector: 'Technology',
            industry: 'Consumer Electronics',
            scores: [
              {
                valueScore: 75,
                mosPrice: 125.0,
              },
            ],
          },
        },
      ];

      const mockQuotes = [
        {
          symbol: 'AAPL',
          price: 185.5,
          change: 2.35,
          changesPercentage: 1.28,
        },
      ];

      vi.mocked(prisma.watchlistItem.findMany).mockResolvedValue(mockItems as Parameters<typeof prisma.watchlistItem.findMany>[0] extends infer T ? T : never);
      vi.mocked(fmpClient.getBatchQuotes).mockResolvedValue(mockQuotes);

      const response = await request(app)
        .get('/api/watchlist')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);

      const item = response.body.data[0];
      expect(item.ticker).toBe('AAPL');
      expect(item.name).toBe('Apple Inc.');
      expect(item.currentPrice).toBe(185.5);
      expect(item.targetPrice).toBe(150.0);
      expect(item.valueScore).toBe(75);
      expect(item.percentToTarget).toBeDefined();
      // percentToTarget = ((150 - 185.5) / 185.5) * 100 ≈ -19.14%
      expect(item.percentToTarget).toBeCloseTo(-19.14, 1);
    });

    /**
     * Test: Handles null values gracefully
     *
     * Some companies might not have scores calculated yet,
     * or might not have target prices set.
     */
    it('handles null values gracefully', async () => {
      const mockItems = [
        {
          id: 'watchlist-1',
          companyId: 'company-1',
          targetPrice: null, // No target set
          notes: null,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
          company: {
            id: 'company-1',
            ticker: 'TSLA',
            name: 'Tesla Inc.',
            sector: 'Automotive',
            industry: 'Electric Vehicles',
            scores: [], // No scores yet
          },
        },
      ];

      vi.mocked(prisma.watchlistItem.findMany).mockResolvedValue(mockItems as Parameters<typeof prisma.watchlistItem.findMany>[0] extends infer T ? T : never);
      vi.mocked(fmpClient.getBatchQuotes).mockResolvedValue([
        { symbol: 'TSLA', price: 250, change: 0, changesPercentage: 0 },
      ]);

      const response = await request(app)
        .get('/api/watchlist')
        .expect(200);

      expect(response.body.success).toBe(true);
      const item = response.body.data[0];
      expect(item.targetPrice).toBeNull();
      expect(item.valueScore).toBeNull();
      expect(item.mosPrice).toBeNull();
      expect(item.percentToTarget).toBeNull();
    });
  });

  // ===========================================================================
  // POST /api/watchlist/:ticker
  // ===========================================================================
  describe('POST /api/watchlist/:ticker', () => {
    /**
     * Test: Adds existing company to watchlist
     *
     * When the company already exists in our database,
     * we just create the watchlist item.
     */
    it('adds existing company to watchlist', async () => {
      const mockCompany = {
        id: 'company-1',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        exchange: 'NASDAQ',
        description: 'Tech company',
        marketCap: new Prisma.Decimal(3000000000000),
        country: 'US',
        website: 'https://apple.com',
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockWatchlistItem = {
        id: 'watchlist-1',
        companyId: 'company-1',
        targetPrice: 150.0,
        notes: 'Buy on pullback',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        company: mockCompany,
      };

      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as Parameters<typeof prisma.company.findUnique>[0] extends infer T ? T : never);
      vi.mocked(prisma.watchlistItem.findUnique).mockResolvedValue(null); // Not already in watchlist
      vi.mocked(prisma.watchlistItem.create).mockResolvedValue(mockWatchlistItem as Parameters<typeof prisma.watchlistItem.create>[0] extends infer T ? T : never);

      const response = await request(app)
        .post('/api/watchlist/AAPL')
        .send({ targetPrice: 150.0, notes: 'Buy on pullback' })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ticker).toBe('AAPL');
      expect(response.body.data.targetPrice).toBe(150.0);
      expect(response.body.data.notes).toBe('Buy on pullback');
    });

    /**
     * Test: Creates company and adds to watchlist
     *
     * When the company doesn't exist in our database,
     * we fetch its profile from FMP first.
     */
    it('creates company and adds to watchlist when company not in database', async () => {
      const mockProfile = {
        symbol: 'NVDA',
        companyName: 'NVIDIA Corporation',
        sector: 'Technology',
        industry: 'Semiconductors',
        exchangeShortName: 'NASDAQ',
        description: 'GPU manufacturer',
        mktCap: 1500000000000,
        country: 'US',
        website: 'https://nvidia.com',
        price: 450,
      };

      const mockCreatedCompany = {
        id: 'company-new',
        ticker: 'NVDA',
        name: 'NVIDIA Corporation',
        sector: 'Technology',
        industry: 'Semiconductors',
        exchange: 'NASDAQ',
        description: 'GPU manufacturer',
        marketCap: new Prisma.Decimal(1500000000000),
        country: 'US',
        website: 'https://nvidia.com',
        lastUpdated: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockWatchlistItem = {
        id: 'watchlist-new',
        companyId: 'company-new',
        targetPrice: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        company: mockCreatedCompany,
      };

      // First findUnique returns null (company doesn't exist)
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);
      vi.mocked(fmpClient.getCompanyProfile).mockResolvedValue(mockProfile);
      vi.mocked(prisma.company.create).mockResolvedValue(mockCreatedCompany as Parameters<typeof prisma.company.create>[0] extends infer T ? T : never);
      vi.mocked(prisma.watchlistItem.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.watchlistItem.create).mockResolvedValue(mockWatchlistItem as Parameters<typeof prisma.watchlistItem.create>[0] extends infer T ? T : never);

      const response = await request(app)
        .post('/api/watchlist/NVDA')
        .send({})
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ticker).toBe('NVDA');
      expect(fmpClient.getCompanyProfile).toHaveBeenCalledWith('NVDA');
      expect(prisma.company.create).toHaveBeenCalled();
    });

    /**
     * Test: Returns 404 for unknown ticker
     */
    it('returns 404 for unknown ticker', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);
      vi.mocked(fmpClient.getCompanyProfile).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/watchlist/INVALID')
        .send({})
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });

    /**
     * Test: Returns 400 if already in watchlist
     */
    it('returns 400 if already in watchlist', async () => {
      const mockCompany = {
        id: 'company-1',
        ticker: 'AAPL',
        name: 'Apple Inc.',
      };

      const existingItem = {
        id: 'existing',
        companyId: 'company-1',
      };

      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as Parameters<typeof prisma.company.findUnique>[0] extends infer T ? T : never);
      vi.mocked(prisma.watchlistItem.findUnique).mockResolvedValue(existingItem as Parameters<typeof prisma.watchlistItem.findUnique>[0] extends infer T ? T : never);

      const response = await request(app)
        .post('/api/watchlist/AAPL')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already in your watchlist');
    });

    /**
     * Test: Validates notes length
     */
    it('validates notes length', async () => {
      const response = await request(app)
        .post('/api/watchlist/AAPL')
        .send({ notes: 'x'.repeat(1001) }) // Exceeds 1000 char limit
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ===========================================================================
  // DELETE /api/watchlist/:ticker
  // ===========================================================================
  describe('DELETE /api/watchlist/:ticker', () => {
    /**
     * Test: Removes item from watchlist
     */
    it('removes item from watchlist', async () => {
      const mockCompany = {
        id: 'company-1',
        ticker: 'AAPL',
        watchlistItem: {
          id: 'watchlist-1',
        },
      };

      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as Parameters<typeof prisma.company.findUnique>[0] extends infer T ? T : never);
      vi.mocked(prisma.watchlistItem.delete).mockResolvedValue({} as Parameters<typeof prisma.watchlistItem.delete>[0] extends infer T ? T : never);

      const response = await request(app)
        .delete('/api/watchlist/AAPL')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');
      expect(prisma.watchlistItem.delete).toHaveBeenCalledWith({
        where: { id: 'watchlist-1' },
      });
    });

    /**
     * Test: Returns 404 if not in watchlist
     */
    it('returns 404 if not in watchlist', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: 'company-1',
        ticker: 'AAPL',
        watchlistItem: null, // Not in watchlist
      } as Parameters<typeof prisma.company.findUnique>[0] extends infer T ? T : never);

      const response = await request(app)
        .delete('/api/watchlist/AAPL')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not in your watchlist');
    });

    /**
     * Test: Returns 404 if company doesn't exist
     */
    it('returns 404 if company does not exist', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/watchlist/UNKNOWN')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ===========================================================================
  // PATCH /api/watchlist/:ticker
  // ===========================================================================
  describe('PATCH /api/watchlist/:ticker', () => {
    /**
     * Test: Updates target price
     */
    it('updates target price', async () => {
      const mockCompany = {
        id: 'company-1',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        watchlistItem: {
          id: 'watchlist-1',
        },
      };

      const updatedItem = {
        id: 'watchlist-1',
        companyId: 'company-1',
        targetPrice: 175.0,
        notes: 'Updated target',
        updatedAt: new Date(),
        company: {
          ticker: 'AAPL',
          name: 'Apple Inc.',
        },
      };

      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as Parameters<typeof prisma.company.findUnique>[0] extends infer T ? T : never);
      vi.mocked(prisma.watchlistItem.update).mockResolvedValue(updatedItem as Parameters<typeof prisma.watchlistItem.update>[0] extends infer T ? T : never);

      const response = await request(app)
        .patch('/api/watchlist/AAPL')
        .send({ targetPrice: 175.0, notes: 'Updated target' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.targetPrice).toBe(175.0);
      expect(response.body.data.notes).toBe('Updated target');
    });

    /**
     * Test: Clears target price with null
     *
     * The PATCH endpoint allows explicitly setting fields to null
     * to clear them.
     */
    it('clears target price with null', async () => {
      const mockCompany = {
        id: 'company-1',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        watchlistItem: {
          id: 'watchlist-1',
        },
      };

      const updatedItem = {
        id: 'watchlist-1',
        companyId: 'company-1',
        targetPrice: null,
        notes: 'Keep notes',
        updatedAt: new Date(),
        company: {
          ticker: 'AAPL',
          name: 'Apple Inc.',
        },
      };

      vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as Parameters<typeof prisma.company.findUnique>[0] extends infer T ? T : never);
      vi.mocked(prisma.watchlistItem.update).mockResolvedValue(updatedItem as Parameters<typeof prisma.watchlistItem.update>[0] extends infer T ? T : never);

      const response = await request(app)
        .patch('/api/watchlist/AAPL')
        .send({ targetPrice: null })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.targetPrice).toBeNull();
    });

    /**
     * Test: Returns 404 if not in watchlist
     */
    it('returns 404 if not in watchlist', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: 'company-1',
        ticker: 'AAPL',
        watchlistItem: null,
      } as Parameters<typeof prisma.company.findUnique>[0] extends infer T ? T : never);

      const response = await request(app)
        .patch('/api/watchlist/AAPL')
        .send({ targetPrice: 100 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
