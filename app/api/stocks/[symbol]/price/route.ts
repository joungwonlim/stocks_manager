import { NextRequest, NextResponse } from 'next/server';
import { fetchStockQuote, collectRealTimeData } from '@/lib/services/stock-price-service';
import { db } from '@/lib/db';
import { priceCandles, stocks } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

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

    // 1. 실시간 데이터 수집 (옵션)
    if (shouldCollect) {
      try {
        await collectRealTimeData(symbol.toUpperCase(), timeframe as any);
      } catch (error) {
        console.error('Error collecting data:', error);
        // 수집 실패해도 계속 진행 (DB에 기존 데이터가 있을 수 있음)
      }
    }

    // 2. 현재 가격 조회
    const currentQuote = await fetchStockQuote(symbol.toUpperCase());

    // 3. 주식 정보 조회
    const stock = await db.query.stocks.findFirst({
      where: eq(stocks.symbol, symbol.toUpperCase()),
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

    return NextResponse.json({
      stock: {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market,
        currency: stock.currency,
        exchange: stock.exchange,
      },
      currentPrice: currentQuote,
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
