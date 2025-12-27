/**
 * Yahoo Finance Client
 *
 * Uses yahoo-finance2 package for FREE stock quotes.
 *
 * WHY use Yahoo Finance?
 * - Completely FREE - no API key required
 * - Works for ALL tickers (unlike FMP free tier which limits quotes)
 * - Reliable and well-maintained
 *
 * We use this for:
 * - Real-time stock quotes (price, change, volume)
 * - Batch quotes for watchlist
 *
 * FMP is still used for:
 * - Company profiles (sector, industry, description)
 * - Company search
 */

import YahooFinance from 'yahoo-finance2';
import { logger } from '../../utils/logger.js';

// Create singleton instance with suppressed survey notice
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/**
 * Normalized quote interface
 * Matches the structure we use throughout the app
 */
export interface YahooQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  dayLow: number;
  dayHigh: number;
  yearLow: number;
  yearHigh: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  pe: number | null;
  eps: number | null;
  open: number;
  previousClose: number;
}

/**
 * Historical price data point
 *
 * WHY include adjClose (adjusted close)?
 * - Accounts for stock splits and dividends
 * - Example: A 4-for-1 split would make old prices appear 4x higher
 * - adjClose shows the "true" historical value for comparison
 */
export interface HistoricalPrice {
  date: string; // ISO date string (YYYY-MM-DD)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

/**
 * Supported time ranges for historical data
 */
export type PriceRange = '1M' | '6M' | '1Y' | '5Y';

/**
 * Yahoo Finance Client
 *
 * Provides free stock quotes for any ticker.
 */
class YahooClient {
  /**
   * Get quote for a single ticker
   */
  async getQuote(ticker: string): Promise<YahooQuote | null> {
    try {
      const quote = await yf.quote(ticker);

      if (!quote || !quote.regularMarketPrice) {
        logger.warn(`Yahoo Finance: No quote data for ${ticker}`);
        return null;
      }

      return {
        symbol: quote.symbol,
        name: quote.shortName || quote.longName || ticker,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange ?? 0,
        changePercent: quote.regularMarketChangePercent ?? 0,
        dayLow: quote.regularMarketDayLow ?? 0,
        dayHigh: quote.regularMarketDayHigh ?? 0,
        yearLow: quote.fiftyTwoWeekLow ?? 0,
        yearHigh: quote.fiftyTwoWeekHigh ?? 0,
        volume: quote.regularMarketVolume ?? 0,
        avgVolume: quote.averageDailyVolume10Day ?? quote.averageDailyVolume3Month ?? 0,
        marketCap: quote.marketCap ?? 0,
        pe: quote.trailingPE ?? null,
        eps: quote.epsTrailingTwelveMonths ?? null,
        open: quote.regularMarketOpen ?? 0,
        previousClose: quote.regularMarketPreviousClose ?? 0,
      };
    } catch (error) {
      logger.error(`Yahoo Finance: Failed to fetch quote for ${ticker}`, error);
      return null;
    }
  }

  /**
   * Get quotes for multiple tickers
   *
   * Yahoo Finance supports batch quotes via quoteCombine
   */
  async getBatchQuotes(tickers: string[]): Promise<YahooQuote[]> {
    if (tickers.length === 0) return [];

    try {
      // quoteCombine gets multiple quotes in parallel
      const results = await Promise.allSettled(tickers.map((t) => yf.quote(t)));

      const quotes: YahooQuote[] = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled' && result.value?.regularMarketPrice) {
          const quote = result.value;
          quotes.push({
            symbol: quote.symbol,
            name: quote.shortName || quote.longName || tickers[i],
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange ?? 0,
            changePercent: quote.regularMarketChangePercent ?? 0,
            dayLow: quote.regularMarketDayLow ?? 0,
            dayHigh: quote.regularMarketDayHigh ?? 0,
            yearLow: quote.fiftyTwoWeekLow ?? 0,
            yearHigh: quote.fiftyTwoWeekHigh ?? 0,
            volume: quote.regularMarketVolume ?? 0,
            avgVolume: quote.averageDailyVolume10Day ?? quote.averageDailyVolume3Month ?? 0,
            marketCap: quote.marketCap ?? 0,
            pe: quote.trailingPE ?? null,
            eps: quote.epsTrailingTwelveMonths ?? null,
            open: quote.regularMarketOpen ?? 0,
            previousClose: quote.regularMarketPreviousClose ?? 0,
          });
        } else {
          logger.warn(`Yahoo Finance: No data for ${tickers[i]}`);
        }
      }

      return quotes;
    } catch (error) {
      logger.error('Yahoo Finance: Failed to fetch batch quotes', error);
      return [];
    }
  }

  /**
   * Get historical price data for charting
   *
   * WHY fetch per-range instead of all 5Y at once?
   * - 5Y of daily data is ~1260 data points (large payload)
   * - Most users stick to one range
   * - React Query caching handles repeated requests efficiently
   *
   * @param ticker - Stock symbol (e.g., "AAPL")
   * @param range - Time range: 1M, 6M, 1Y, or 5Y
   */
  async getHistoricalPrices(
    ticker: string,
    range: PriceRange
  ): Promise<HistoricalPrice[]> {
    try {
      // Calculate start date based on range
      const now = new Date();
      let startDate: Date;

      switch (range) {
        case '1M':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '6M':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1Y':
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case '5Y':
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 5);
          break;
      }

      // Fetch historical data from Yahoo Finance
      const result = await yf.historical(ticker, {
        period1: startDate,
        period2: now,
      });

      if (!result || result.length === 0) {
        logger.warn(`Yahoo Finance: No historical data for ${ticker}`);
        return [];
      }

      // Transform to our normalized format
      // yahoo-finance2 returns data in chronological order (oldest first)
      return result.map((point) => ({
        date: point.date.toISOString().split('T')[0], // YYYY-MM-DD format
        open: point.open ?? 0,
        high: point.high ?? 0,
        low: point.low ?? 0,
        close: point.close ?? 0,
        volume: point.volume ?? 0,
        adjClose: point.adjClose ?? point.close ?? 0,
      }));
    } catch (error) {
      logger.error(
        `Yahoo Finance: Failed to fetch historical prices for ${ticker}`,
        error
      );
      return [];
    }
  }
}

// Export singleton instance
export const yahooClient = new YahooClient();
