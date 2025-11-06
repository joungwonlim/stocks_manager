import { NextRequest, NextResponse } from 'next/server';
import { fetchStockQuote, collectRealTimeData } from '@/lib/services/stock-price-service';
import { db } from '@/lib/db';
import { priceCandles, stocks } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { normalizeStockSymbol, normalizeStockSymbolWithSearch } from '@/lib/utils/stock-symbol-mapper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stocks/[symbol]/price
 * 특정 종목의 실시간 가격 조회
 *
 * Query params:
 * - timeframe: 1m, 5m, 15m, 1h, 1d (기본값: 5m)
 * - limit: 반환할 캔들 개수 (기본값: 100)
 * - collect: true이면 실시간 데이터 수집 (기본값: false)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '5m';
    const limit = parseInt(searchParams.get('limit') || '100');
    const shouldCollect = searchParams.get('collect') === 'true';

    // 1. 심볼 정규화 (자동 검색 포함)
    console.log(`🔍 Normalizing symbol: ${symbol}`);
    const normalizedSymbol = await normalizeStockSymbolWithSearch(symbol);
    console.log(`✅ Normalized: ${symbol} → ${normalizedSymbol}`);

    // 2. 실시간 데이터 수집 (Puppeteer 사용 - 네이버 금융 스크래핑)
    if (shouldCollect) {
      try {
        console.log(`🔄 Collecting real-time data for ${normalizedSymbol}...`);
        await collectRealTimeData(normalizedSymbol.toUpperCase(), timeframe as any);
      } catch (error) {
        console.error('Error collecting data:', error);
      }
    }

    // 3. 현재 가격 조회 (Puppeteer 사용 - 네이버 금융 스크래핑)
    let currentQuote = null;
    try {
      currentQuote = await fetchStockQuote(normalizedSymbol.toUpperCase());
    } catch (error) {
      console.error('Error fetching current quote:', error);
    }

    // 4. 주식 정보 조회
    const stock = await db.query.stocks.findFirst({
      where: eq(stocks.symbol, normalizedSymbol),
    });

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock not found. Try with ?collect=true to fetch data.' },
        { status: 404 }
      );
    }

    // 4. 최근 캔들 데이터 조회
    const candles = await db.query.priceCandles.findMany({
      where: and(
        eq(priceCandles.stockId, stock.id),
        eq(priceCandles.timeframe, timeframe)
      ),
      orderBy: [desc(priceCandles.timestamp)],
      limit: limit,
    });

    // 5. 현재가는 실시간 스크래핑 데이터 우선, 없으면 DB 사용
    const currentPrice = currentQuote
      ? currentQuote.price
      : (candles.length > 0 ? parseFloat(candles[0].close) : null);

    return NextResponse.json({
      stock: {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market,
        currency: stock.currency,
        exchange: stock.exchange,
      },
      currentPrice: currentPrice,
      quote: currentQuote ? {
        price: currentQuote.price,
        change: currentQuote.change,
        changePercent: currentQuote.changePercent,
        volume: currentQuote.volume,
        open: currentQuote.open,
        high: currentQuote.high,
        low: currentQuote.low,
      } : null,
      candles: candles.map((c) => ({
        timestamp: c.timestamp,
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
        volume: parseFloat(c.volume),
      })).reverse(), // 시간 순서대로 정렬
      timeframe,
      count: candles.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/stocks/[symbol]/price:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
