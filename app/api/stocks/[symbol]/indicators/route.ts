import { NextRequest, NextResponse } from 'next/server';
import {
  calculateAndSaveIndicators,
  getLatestIndicators,
  analyzeIndicators,
} from '@/lib/services/technical-indicators-service';
import { normalizeStockSymbol } from '@/lib/utils/stock-symbol-mapper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stocks/[symbol]/indicators
 * 특정 종목의 기술적 지표 조회
 *
 * Query params:
 * - timeframe: 1m, 5m, 15m, 1h, 1d (기본값: 5m)
 * - limit: 반환할 데이터 개수 (기본값: 100)
 * - calculate: true이면 지표 재계산 (기본값: false)
 * - analyze: true이면 매매 신호 분석 포함 (기본값: true)
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
    const shouldCalculate = searchParams.get('calculate') === 'true';
    const shouldAnalyze = searchParams.get('analyze') !== 'false'; // 기본값 true

    // 심볼 정규화
    const normalizedSymbol = normalizeStockSymbol(symbol);

    // 1. 지표 재계산 (옵션)
    if (shouldCalculate) {
      try {
        await calculateAndSaveIndicators(normalizedSymbol, timeframe);
      } catch (error) {
        console.error('Error calculating indicators:', error);
        // 계산 실패해도 기존 데이터 조회는 계속 진행
      }
    }

    // 2. 최신 지표 데이터 조회
    const indicators = await getLatestIndicators(normalizedSymbol, timeframe, limit);

    if (indicators.length === 0) {
      return NextResponse.json(
        {
          error: 'No indicators found. Try with ?calculate=true to calculate indicators.',
        },
        { status: 404 }
      );
    }

    // 3. 최신 지표 분석 (옵션)
    let analysis = null;
    if (shouldAnalyze && indicators.length > 0) {
      const latestIndicator = indicators[indicators.length - 1];
      analysis = analyzeIndicators(latestIndicator);
    }

    // 4. 응답
    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      timeframe,
      count: indicators.length,
      latest: indicators[indicators.length - 1],
      analysis,
      indicators,
    });
  } catch (error: any) {
    console.error('Error in GET /api/stocks/[symbol]/indicators:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stocks/[symbol]/indicators
 * 특정 종목의 기술적 지표 계산 및 저장
 *
 * Body:
 * {
 *   "timeframe": "5m"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const body = await request.json();
    const { timeframe = '5m' } = body;

    console.log(`📊 Calculating indicators for ${symbol} (${timeframe})...`);
    const startTime = Date.now();

    await calculateAndSaveIndicators(symbol.toUpperCase(), timeframe);

    const duration = Date.now() - startTime;

    // 최신 지표 조회
    const indicators = await getLatestIndicators(symbol.toUpperCase(), timeframe, 1);
    const latestIndicator = indicators[0];
    const analysis = latestIndicator ? analyzeIndicators(latestIndicator) : null;

    return NextResponse.json({
      success: true,
      message: `Indicators calculated for ${symbol}`,
      symbol: symbol.toUpperCase(),
      timeframe,
      duration: `${duration}ms`,
      latest: latestIndicator,
      analysis,
    });
  } catch (error: any) {
    console.error('Error in POST /api/stocks/[symbol]/indicators:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
