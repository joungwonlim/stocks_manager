import { NextRequest, NextResponse } from 'next/server';
import { calculateIndicatorsForMultipleStocks } from '@/lib/services/technical-indicators-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/indicators/calculate
 * 여러 종목의 기술적 지표를 한 번에 계산
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

    if (symbols.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 symbols allowed' },
        { status: 400 }
      );
    }

    console.log(`📊 Calculating indicators for ${symbols.length} stocks...`);
    const startTime = Date.now();

    await calculateIndicatorsForMultipleStocks(symbols, timeframe);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Successfully calculated indicators for ${symbols.length} stocks`,
      symbols,
      timeframe,
      duration: `${duration}ms`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/indicators/calculate:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/indicators/calculate
 * 기본 관심 종목의 기술적 지표 계산
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '5m';

    // 기본 관심 종목 리스트
    const defaultSymbols = [
      'AAPL',
      'MSFT',
      'GOOGL',
      'AMZN',
      'TSLA',
      'NVDA',
      'META',
      '005930.KS',
      '000660.KS',
      '035420.KS',
      '051910.KS',
      '035720.KS',
    ];

    console.log(`📊 Calculating indicators for default watchlist (${defaultSymbols.length} stocks)...`);
    const startTime = Date.now();

    await calculateIndicatorsForMultipleStocks(defaultSymbols, timeframe);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Successfully calculated indicators for ${defaultSymbols.length} stocks`,
      symbols: defaultSymbols,
      timeframe,
      duration: `${duration}ms`,
    });
  } catch (error: any) {
    console.error('Error in GET /api/indicators/calculate:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
