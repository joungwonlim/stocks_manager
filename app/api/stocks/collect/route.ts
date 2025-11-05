import { NextRequest, NextResponse } from 'next/server';
import { collectMultipleStocks } from '@/lib/services/stock-price-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stocks/collect
 * 여러 종목의 데이터를 한 번에 수집
 *
 * Body:
 * {
 *   "symbols": ["AAPL", "MSFT", "GOOGL", "005930.KS"],
 *   "timeframe": "5m" // optional, default: 5m
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, timeframe = '5m' } = body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'symbols array is required' },
        { status: 400 }
      );
    }

    // 최대 50개 종목까지만 허용 (API 제한)
    if (symbols.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 symbols allowed' },
        { status: 400 }
      );
    }

    console.log(`📊 Starting collection for ${symbols.length} stocks...`);
    const startTime = Date.now();

    await collectMultipleStocks(symbols, timeframe);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Successfully collected data for ${symbols.length} stocks`,
      symbols,
      timeframe,
      duration: `${duration}ms`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/stocks/collect:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stocks/collect
 * 미리 정의된 관심 종목 리스트 수집
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '5m';

    // 기본 관심 종목 리스트 (데모용)
    const defaultSymbols = [
      // 미국 주식
      'AAPL',   // Apple
      'MSFT',   // Microsoft
      'GOOGL',  // Google
      'AMZN',   // Amazon
      'TSLA',   // Tesla
      'NVDA',   // NVIDIA
      'META',   // Meta (Facebook)

      // 한국 주식 (Yahoo Finance 형식: .KS = KOSPI, .KQ = KOSDAQ)
      '005930.KS',  // 삼성전자
      '000660.KS',  // SK하이닉스
      '035420.KS',  // NAVER
      '051910.KS',  // LG화학
      '035720.KS',  // 카카오
    ];

    console.log(`📊 Collecting default watchlist (${defaultSymbols.length} stocks)...`);
    const startTime = Date.now();

    await collectMultipleStocks(defaultSymbols, timeframe as any);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Successfully collected data for ${defaultSymbols.length} stocks`,
      symbols: defaultSymbols,
      timeframe,
      duration: `${duration}ms`,
    });
  } catch (error: any) {
    console.error('Error in GET /api/stocks/collect:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
