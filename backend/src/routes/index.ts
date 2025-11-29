import { Router } from 'express';
import { companiesRouter } from './companies.js';
import { screenerRouter } from './screener.js';
import { valuationRouter } from './valuation.js';
import { watchlistRouter } from './watchlist.js';
import { quotesRouter } from './quotes.js';

export const routes = Router();

// Mount route modules
routes.use('/companies', companiesRouter);
routes.use('/screener', screenerRouter);
routes.use('/valuation', valuationRouter);
routes.use('/watchlist', watchlistRouter);
routes.use('/quotes', quotesRouter);

// API info endpoint
routes.get('/', (_req, res) => {
  res.json({
    name: 'Value Investing Toolbox API',
    version: '1.0.0',
    endpoints: {
      companies: '/api/companies/:ticker',
      screener: '/api/screener',
      leaderboard: '/api/screener/leaderboard',
      valuation: '/api/valuation',
      watchlist: '/api/watchlist',
      quotes: '/api/quotes/:ticker',
    },
  });
});
