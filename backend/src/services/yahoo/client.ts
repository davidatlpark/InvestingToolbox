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
}

// Export singleton instance
export const yahooClient = new YahooClient();
