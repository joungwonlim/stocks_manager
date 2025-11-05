import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { stocks, priceCandles, aiAnalysis, tradingSignals } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { calculateAllIndicators } from '@/lib/services/technical-indicators-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stocks/[symbol]/analyze
 * Claude AI를 사용하여 주가 분석 및 매매 신호 생성
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const body = await request.json();
    const { timeframe = '5m', strategies = [] } = body;

    // 1. 주식 정보 조회
    const stock = await db.query.stocks.findFirst({
      where: eq(stocks.symbol, symbol.toUpperCase()),
    });

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // 2. 최근 캔들 데이터 조회 (최근 100개)
    const candles = await db.query.priceCandles.findMany({
      where: eq(priceCandles.stockId, stock.id),
      orderBy: [desc(priceCandles.timestamp)],
      limit: 100,
    });

    if (candles.length === 0) {
      return NextResponse.json(
        { error: 'No price data available' },
        { status: 404 }
      );
    }

    // 3. 캔들 데이터를 지표 계산용 형식으로 변환
    const candleInputs = candles.reverse().map(c => ({
      timestamp: c.timestamp,
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close),
      volume: parseFloat(c.volume),
    }));

    // 4. 기술적 지표 계산
    const indicators = calculateAllIndicators(candleInputs);

    if (!indicators || indicators.length === 0) {
      return NextResponse.json(
        { error: 'Could not calculate indicators' },
        { status: 500 }
      );
    }

    const latestIndicator = indicators[indicators.length - 1];
    const latestCandle = candleInputs[candleInputs.length - 1];
    const currentPrice = latestCandle.close;

    // 5. 투자 전략 조회
    const allStrategies = await db.query.tradingStrategies.findMany({
      where: eq(stocks.isActive, true),
    });

    // 6. Claude AI 분석 프롬프트 생성
    const analysisPrompt = `
당신은 전문 주식 애널리스트입니다. 다음 주식을 분석하고 투자 추천을 제공해주세요.

## 주식 정보
- 종목명: ${stock.name}
- 종목코드: ${stock.symbol}
- 현재가: ${currentPrice.toLocaleString()}원
- 시장: ${stock.market}

## 기술적 지표 (최신)
- SMA20: ${latestIndicator.sma20}
- SMA50: ${latestIndicator.sma50}
- EMA12: ${latestIndicator.ema12}
- EMA26: ${latestIndicator.ema26}
- RSI(14): ${latestIndicator.rsi14}
- MACD: ${latestIndicator.macd}
- MACD Signal: ${latestIndicator.macdSignal}
- MACD Histogram: ${latestIndicator.macdHistogram}
- 볼린저밴드 상단: ${latestIndicator.bbUpper}
- 볼린저밴드 중간: ${latestIndicator.bbMiddle}
- 볼린저밴드 하단: ${latestIndicator.bbLower}
- Stochastic %K: ${latestIndicator.stochK}
- Stochastic %D: ${latestIndicator.stochD}

## 최근 가격 추이 (최근 10개 캔들)
${candleInputs.slice(-10).map((c, i) =>
  `${i + 1}. 시간: ${new Date(c.timestamp).toLocaleString('ko-KR')}, 시가: ${c.open}, 고가: ${c.high}, 저가: ${c.low}, 종가: ${c.close}, 거래량: ${c.volume}`
).join('\n')}

## 분석 요청
다음 형식으로 JSON 응답을 제공해주세요:

\`\`\`json
{
  "sentiment": "bullish|bearish|neutral",
  "confidence": 0-100 (숫자),
  "recommendation": "strong_buy|buy|hold|sell|strong_sell",
  "analysis": "상세 분석 내용 (한글, 300자 이상)",
  "reasoning": [
    "근거1: ...",
    "근거2: ...",
    "근거3: ..."
  ],
  "entry_price": 추천 매수가 (숫자),
  "stop_loss_price": 손절가 (숫자),
  "target_price_1": 1차 목표가 (숫자),
  "target_price_2": 2차 목표가 (숫자),
  "target_price_3": 3차 목표가 (숫자),
  "expected_return": 기대수익률 % (숫자),
  "risk_level": "low|medium|high",
  "time_horizon": "short|medium|long",
  "key_points": [
    "핵심 포인트1",
    "핵심 포인트2",
    "핵심 포인트3"
  ]
}
\`\`\`

## 주의사항
1. 현재가를 기준으로 합리적인 가격을 제시하세요
2. 손절가는 현재가의 3-7% 아래로 설정하세요
3. 목표가는 단계별로 5%, 10%, 15% 이상으로 설정하세요
4. RSI, MACD, 볼린저밴드 등 모든 지표를 종합적으로 고려하세요
5. 분석은 구체적이고 실용적이어야 합니다
`;

    // 6. Claude AI 호출 (환경변수 없으면 Mock 응답)
    let aiResponse;

    const hasValidApiKey = process.env.ANTHROPIC_API_KEY &&
                          process.env.ANTHROPIC_API_KEY !== 'your_api_key_here' &&
                          process.env.ANTHROPIC_API_KEY.startsWith('sk-');

    if (hasValidApiKey) {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      // JSON 추출
      const jsonMatch = responseText.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[1]);
      } else {
        // JSON 형식이 없으면 전체를 파싱 시도
        aiResponse = JSON.parse(responseText);
      }
    } else {
      // Mock AI 응답 (API 키 없을 때)
      const rsi = parseFloat(latestIndicator.rsi14 || '50');
      const macdHistogram = parseFloat(latestIndicator.macdHistogram || '0');

      let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' = 'hold';

      if (rsi < 30 && macdHistogram > 0) {
        sentiment = 'bullish';
        recommendation = 'buy';
      } else if (rsi > 70 && macdHistogram < 0) {
        sentiment = 'bearish';
        recommendation = 'sell';
      } else if (rsi < 40 || macdHistogram > 100) {
        sentiment = 'bullish';
        recommendation = 'buy';
      } else if (rsi > 60 || macdHistogram < -100) {
        sentiment = 'bearish';
        recommendation = 'sell';
      }

      aiResponse = {
        sentiment,
        confidence: 75,
        recommendation,
        analysis: `${stock.name} 종목에 대한 기술적 분석 결과입니다.\n\n현재 RSI는 ${rsi.toFixed(2)}로 ${rsi < 30 ? '과매도' : rsi > 70 ? '과매수' : '중립'} 구간에 있습니다. MACD 히스토그램은 ${macdHistogram > 0 ? '상승' : '하락'} 신호를 보이고 있습니다.\n\n볼린저밴드 기준으로 현재가는 ${currentPrice < parseFloat(latestIndicator.bbLower || '0') ? '하단 밴드 부근' : currentPrice > parseFloat(latestIndicator.bbUpper || '0') ? '상단 밴드 부근' : '중간 밴드 부근'}에 위치하고 있습니다.\n\n종합적으로 ${sentiment === 'bullish' ? '매수' : sentiment === 'bearish' ? '매도' : '관망'} 관점에서 접근하는 것이 적절해 보입니다.`,
        reasoning: [
          `RSI ${rsi.toFixed(2)} - ${rsi < 30 ? '과매도 구간으로 반등 가능성' : rsi > 70 ? '과매수 구간으로 조정 가능성' : '중립 구간'}`,
          `MACD 히스토그램 ${macdHistogram > 0 ? '양수' : '음수'} - ${macdHistogram > 0 ? '상승 모멘텀' : '하락 모멘텀'}`,
          `볼린저밴드 ${currentPrice < parseFloat(latestIndicator.bbLower || '0') ? '하단 이탈 - 과매도' : currentPrice > parseFloat(latestIndicator.bbUpper || '0') ? '상단 이탈 - 과매수' : '정상 범위'}`,
        ],
        entry_price: Math.round(currentPrice * (sentiment === 'bullish' ? 0.98 : 1.02)),
        stop_loss_price: Math.round(currentPrice * 0.95),
        target_price_1: Math.round(currentPrice * 1.05),
        target_price_2: Math.round(currentPrice * 1.10),
        target_price_3: Math.round(currentPrice * 1.15),
        expected_return: sentiment === 'bullish' ? 10 : sentiment === 'bearish' ? -5 : 0,
        risk_level: rsi < 30 || rsi > 70 ? 'high' : 'medium',
        time_horizon: 'short',
        key_points: [
          `현재가: ${currentPrice.toLocaleString()}원`,
          `추천: ${recommendation === 'buy' ? '매수' : recommendation === 'sell' ? '매도' : '관망'}`,
          `목표 수익률: ${sentiment === 'bullish' ? '+10%' : sentiment === 'bearish' ? '-5%' : '0%'}`,
        ],
      };
    }

    // 7. AI 분석 결과 저장
    const [analysis] = await db.insert(aiAnalysis).values({
      stockId: stock.id,
      analysisType: 'comprehensive',
      timeframe,
      timestamp: new Date(),
      sentiment: aiResponse.sentiment,
      confidence: aiResponse.confidence.toString(),
      analysis: aiResponse.analysis,
      reasoning: JSON.stringify(aiResponse.reasoning),
      recommendation: aiResponse.recommendation,
      appliedStrategies: JSON.stringify(strategies),
    }).returning();

    // 8. 매매 신호 생성
    const [signal] = await db.insert(tradingSignals).values({
      stockId: stock.id,
      aiAnalysisId: analysis.id,
      signalType: aiResponse.recommendation.includes('buy') ? 'buy' : aiResponse.recommendation.includes('sell') ? 'sell' : 'hold',
      signalStrength: aiResponse.recommendation.includes('strong') ? 'strong' : 'moderate',
      currentPrice: currentPrice.toString(),
      entryPrice: aiResponse.entry_price.toString(),
      targetPrice1: aiResponse.target_price_1.toString(),
      targetPrice2: aiResponse.target_price_2.toString(),
      targetPrice3: aiResponse.target_price_3.toString(),
      stopLossPrice: aiResponse.stop_loss_price.toString(),
      expectedReturn: aiResponse.expected_return.toString(),
      riskRewardRatio: ((aiResponse.target_price_1 - aiResponse.entry_price) / (aiResponse.entry_price - aiResponse.stop_loss_price)).toFixed(2),
      status: 'active',
      reason: aiResponse.analysis,
      timestamp: new Date(),
    }).returning();

    // 9. 응답 반환
    return NextResponse.json({
      success: true,
      stock: {
        symbol: stock.symbol,
        name: stock.name,
      },
      analysis: {
        id: analysis.id,
        sentiment: aiResponse.sentiment,
        confidence: aiResponse.confidence,
        recommendation: aiResponse.recommendation,
        analysis: aiResponse.analysis,
        reasoning: aiResponse.reasoning,
        key_points: aiResponse.key_points,
      },
      signal: {
        id: signal.id,
        type: signal.signalType,
        strength: signal.signalStrength,
        current_price: currentPrice,
        entry_price: aiResponse.entry_price,
        stop_loss: aiResponse.stop_loss_price,
        targets: {
          target1: aiResponse.target_price_1,
          target2: aiResponse.target_price_2,
          target3: aiResponse.target_price_3,
        },
        expected_return: aiResponse.expected_return,
        risk_level: aiResponse.risk_level,
        time_horizon: aiResponse.time_horizon,
      },
      indicators: {
        rsi: latestIndicator.rsi14,
        macd: latestIndicator.macd,
        macd_signal: latestIndicator.macdSignal,
        bollinger_upper: latestIndicator.bbUpper,
        bollinger_lower: latestIndicator.bbLower,
      },
    });

  } catch (error: any) {
    console.error('Error in POST /api/stocks/[symbol]/analyze:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stocks/[symbol]/analyze
 * 저장된 AI 분석 결과 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

    // 주식 정보 조회
    const stock = await db.query.stocks.findFirst({
      where: eq(stocks.symbol, symbol.toUpperCase()),
    });

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // 최근 분석 결과 조회
    const analyses = await db.query.aiAnalysis.findMany({
      where: eq(aiAnalysis.stockId, stock.id),
      orderBy: [desc(aiAnalysis.timestamp)],
      limit: 10,
    });

    // 최근 매매 신호 조회
    const signals = await db.query.tradingSignals.findMany({
      where: eq(tradingSignals.stockId, stock.id),
      orderBy: [desc(tradingSignals.timestamp)],
      limit: 10,
    });

    return NextResponse.json({
      stock: {
        symbol: stock.symbol,
        name: stock.name,
      },
      analyses: analyses.map(a => ({
        id: a.id,
        type: a.analysisType,
        timestamp: a.timestamp,
        sentiment: a.sentiment,
        confidence: a.confidence,
        recommendation: a.recommendation,
        analysis: a.analysis,
      })),
      signals: signals.map(s => ({
        id: s.id,
        type: s.signalType,
        strength: s.signalStrength,
        timestamp: s.timestamp,
        current_price: s.currentPrice,
        entry_price: s.entryPrice,
        stop_loss: s.stopLossPrice,
        targets: [s.targetPrice1, s.targetPrice2, s.targetPrice3],
        status: s.status,
      })),
    });

  } catch (error: any) {
    console.error('Error in GET /api/stocks/[symbol]/analyze:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
