import yahooFinance from 'yahoo-finance2';
import { db } from '@/lib/db';
import { priceCandles, stocks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface CandleData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

/**
 * Yahoo Finance에서 실시간 주가 데이터 가져오기
 */
export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const quote = await yahooFinance.quote(symbol);

    if (!quote) {
      console.error(`No quote data for ${symbol}`);
      return null;
    }

    return {
      symbol: (quote as any).symbol || symbol,
      price: (quote as any).regularMarketPrice || 0,
      change: (quote as any).regularMarketChange || 0,
      changePercent: (quote as any).regularMarketChangePercent || 0,
      volume: (quote as any).regularMarketVolume || 0,
      marketCap: (quote as any).marketCap,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Yahoo Finance에서 과거 캔들 데이터 가져오기
 */
export async function fetchHistoricalData(
  symbol: string,
  period1: Date,
  period2: Date,
  interval: '1m' | '5m' | '15m' | '1h' | '1d' = '5m'
): Promise<CandleData[]> {
  try {
    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval,
    });

    if (!result || !result.quotes) {
      console.error(`No historical data for ${symbol}`);
      return [];
    }

    return result.quotes
      .filter((q: any) => q.open && q.high && q.low && q.close && q.volume)
      .map((quote: any) => ({
        timestamp: quote.date,
        open: quote.open!,
        high: quote.high!,
        low: quote.low!,
        close: quote.close!,
        volume: quote.volume!,
      }));
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
}

/**
 * 캔들 데이터를 데이터베이스에 저장
 */
export async function saveCandleData(
  symbol: string,
  timeframe: string,
  candles: CandleData[]
): Promise<void> {
  try {
    // 1. 주식 정보 조회 (없으면 생성)
    let stock = await db.query.stocks.findFirst({
      where: eq(stocks.symbol, symbol),
    });

    if (!stock) {
      // 주식 정보가 없으면 Yahoo Finance에서 가져와서 생성
      const quote = await yahooFinance.quote(symbol);
      if (!quote) {
        throw new Error(`Cannot fetch stock info for ${symbol}`);
      }

      const [newStock] = await db
        .insert(stocks)
        .values({
          symbol: symbol,
          name: quote.shortName || quote.longName || symbol,
          market: quote.market || 'UNKNOWN',
          currency: quote.currency || 'USD',
          exchange: quote.fullExchangeName || quote.exchange || 'UNKNOWN',
        })
        .returning();

      stock = newStock;
    }

    // 2. 캔들 데이터 저장 (중복 방지: ON CONFLICT DO NOTHING)
    for (const candle of candles) {
      try {
        await db.insert(priceCandles).values({
          stockId: stock.id,
          timeframe,
          timestamp: candle.timestamp,
          open: candle.open.toString(),
          high: candle.high.toString(),
          low: candle.low.toString(),
          close: candle.close.toString(),
          volume: candle.volume.toString(),
        });
      } catch (error: any) {
        // 중복 키 에러는 무시 (이미 저장된 데이터)
        if (!error?.message?.includes('duplicate key')) {
          console.error(`Error saving candle for ${symbol}:`, error);
        }
      }
    }

    console.log(`✅ Saved ${candles.length} candles for ${symbol} (${timeframe})`);
  } catch (error) {
    console.error(`Error saving candle data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * 실시간 데이터 수집 및 저장
 */
export async function collectRealTimeData(
  symbol: string,
  timeframe: '1m' | '5m' | '15m' | '1h' = '5m'
): Promise<void> {
  try {
    console.log(`🔄 Collecting ${timeframe} data for ${symbol}...`);

    // 타임프레임에 따라 적절한 기간 설정
    const period2 = new Date();
    let period1: Date;

    switch (timeframe) {
      case '1m':
        // 1분봉: 최근 1일 데이터 (시장 마감 시에도 데이터 확보)
        period1 = new Date(period2.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '5m':
        // 5분봉: 최근 5일 데이터 (주말 포함하여 충분한 데이터 확보)
        period1 = new Date(period2.getTime() - 5 * 24 * 60 * 60 * 1000);
        break;
      case '15m':
        // 15분봉: 최근 7일 데이터
        period1 = new Date(period2.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1h':
        // 1시간봉: 최근 30일 데이터
        period1 = new Date(period2.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        period1 = new Date(period2.getTime() - 5 * 24 * 60 * 60 * 1000);
    }

    const candles = await fetchHistoricalData(symbol, period1, period2, timeframe);

    if (candles.length === 0) {
      console.warn(`⚠️ No data received for ${symbol}`);
      return;
    }

    console.log(`📊 Received ${candles.length} candles for ${symbol}`);
    await saveCandleData(symbol, timeframe, candles);
  } catch (error) {
    console.error(`❌ Error collecting data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * 여러 종목의 데이터를 동시에 수집
 */
export async function collectMultipleStocks(
  symbols: string[],
  timeframe: '1m' | '5m' | '15m' | '1h' = '5m'
): Promise<void> {
  console.log(`📊 Starting data collection for ${symbols.length} stocks...`);

  const promises = symbols.map((symbol) =>
    collectRealTimeData(symbol, timeframe).catch((error) => {
      console.error(`Failed to collect ${symbol}:`, error);
    })
  );

  await Promise.all(promises);
  console.log(`✅ Data collection completed for ${symbols.length} stocks`);
}

/**
 * 주식 정보 생성 또는 업데이트
 */
export async function upsertStock(symbol: string): Promise<void> {
  try {
    const quote = await yahooFinance.quote(symbol);

    if (!quote) {
      throw new Error(`Cannot fetch stock info for ${symbol}`);
    }

    // 기존 주식 확인
    const existingStock = await db.query.stocks.findFirst({
      where: eq(stocks.symbol, symbol),
    });

    if (existingStock) {
      // 업데이트
      await db
        .update(stocks)
        .set({
          name: quote.shortName || quote.longName || symbol,
          market: quote.market || 'UNKNOWN',
          currency: quote.currency || 'USD',
          exchange: quote.fullExchangeName || quote.exchange || 'UNKNOWN',
          updatedAt: new Date(),
        })
        .where(eq(stocks.id, existingStock.id));

      console.log(`✅ Updated stock info for ${symbol}`);
    } else {
      // 생성
      await db.insert(stocks).values({
        symbol: symbol,
        name: quote.shortName || quote.longName || symbol,
        market: quote.market || 'UNKNOWN',
        currency: quote.currency || 'USD',
        exchange: quote.fullExchangeName || quote.exchange || 'UNKNOWN',
      });

      console.log(`✅ Created stock info for ${symbol}`);
    }
  } catch (error) {
    console.error(`Error upserting stock ${symbol}:`, error);
    throw error;
  }
}
