import {
  RSI,
  MACD,
  BollingerBands,
  SMA,
  EMA,
  Stochastic,
} from 'technicalindicators';
import { db } from '@/lib/db';
import { priceCandles, technicalIndicators, stocks } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface CandleInput {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorResult {
  timestamp: Date;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema12?: number;
  ema26?: number;
  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  stochK?: number;
  stochD?: number;
}

/**
 * RSI (Relative Strength Index) 계산
 * 과매수/과매도 구간 판단
 * 70 이상: 과매수, 30 이하: 과매도
 */
export function calculateRSI(closes: number[], period: number = 14): number[] {
  try {
    const rsiInput = {
      values: closes,
      period: period,
    };

    const rsiValues = RSI.calculate(rsiInput);
    return rsiValues;
  } catch (error) {
    console.error('Error calculating RSI:', error);
    return [];
  }
}

/**
 * MACD (Moving Average Convergence Divergence) 계산
 * 추세 전환 및 모멘텀 판단
 * 골든크로스: 매수 신호, 데드크로스: 매도 신호
 */
export function calculateMACD(closes: number[]): {
  MACD: number;
  signal: number;
  histogram: number;
}[] {
  try {
    const macdInput = {
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    };

    const macdValues = MACD.calculate(macdInput);
    return macdValues;
  } catch (error) {
    console.error('Error calculating MACD:', error);
    return [];
  }
}

/**
 * 볼린저 밴드 (Bollinger Bands) 계산
 * 가격 변동성 및 과매수/과매도 판단
 * 가격이 상단 밴드 근처: 과매수, 하단 밴드 근처: 과매도
 */
export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: number;
  middle: number;
  lower: number;
  pb?: number;
}[] {
  try {
    const bbInput = {
      period: period,
      values: closes,
      stdDev: stdDev,
    };

    const bbValues = BollingerBands.calculate(bbInput);
    return bbValues;
  } catch (error) {
    console.error('Error calculating Bollinger Bands:', error);
    return [];
  }
}

/**
 * SMA (Simple Moving Average) 계산
 * 단순 이동평균선 - 추세 확인
 */
export function calculateSMA(closes: number[], period: number): number[] {
  try {
    const smaValues = SMA.calculate({
      period: period,
      values: closes,
    });
    return smaValues;
  } catch (error) {
    console.error('Error calculating SMA:', error);
    return [];
  }
}

/**
 * EMA (Exponential Moving Average) 계산
 * 지수 이동평균선 - 최근 가격에 더 큰 가중치
 */
export function calculateEMA(closes: number[], period: number): number[] {
  try {
    const emaValues = EMA.calculate({
      period: period,
      values: closes,
    });
    return emaValues;
  } catch (error) {
    console.error('Error calculating EMA:', error);
    return [];
  }
}

/**
 * 스토캐스틱 (Stochastic) 계산
 * 모멘텀 지표 - 현재 가격이 일정 기간의 가격 범위에서 어디에 위치하는지
 * 80 이상: 과매수, 20 이하: 과매도
 */
export function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14,
  signalPeriod: number = 3
): {
  k: number;
  d: number;
}[] {
  try {
    const stochInput = {
      high: highs,
      low: lows,
      close: closes,
      period: period,
      signalPeriod: signalPeriod,
    };

    const stochValues = Stochastic.calculate(stochInput);
    return stochValues;
  } catch (error) {
    console.error('Error calculating Stochastic:', error);
    return [];
  }
}

/**
 * 모든 기술적 지표를 한 번에 계산
 */
export function calculateAllIndicators(candles: CandleInput[]): IndicatorResult[] {
  if (candles.length < 200) {
    console.warn('Not enough data for all indicators (need at least 200 candles)');
  }

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  // 각 지표 계산
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const rsi14 = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const bb = calculateBollingerBands(closes, 20, 2);
  const stoch = calculateStochastic(highs, lows, closes, 14, 3);

  // 결과 병합 (가장 긴 배열 기준)
  const results: IndicatorResult[] = [];
  const maxLength = candles.length;

  for (let i = 0; i < maxLength; i++) {
    const result: IndicatorResult = {
      timestamp: candles[i].timestamp,
    };

    // 각 지표의 인덱스 계산 (지표마다 시작 위치가 다름)
    const sma20Idx = i - (maxLength - sma20.length);
    const sma50Idx = i - (maxLength - sma50.length);
    const sma200Idx = i - (maxLength - sma200.length);
    const ema12Idx = i - (maxLength - ema12.length);
    const ema26Idx = i - (maxLength - ema26.length);
    const rsi14Idx = i - (maxLength - rsi14.length);
    const macdIdx = i - (maxLength - macd.length);
    const bbIdx = i - (maxLength - bb.length);
    const stochIdx = i - (maxLength - stoch.length);

    if (sma20Idx >= 0) result.sma20 = sma20[sma20Idx];
    if (sma50Idx >= 0) result.sma50 = sma50[sma50Idx];
    if (sma200Idx >= 0) result.sma200 = sma200[sma200Idx];
    if (ema12Idx >= 0) result.ema12 = ema12[ema12Idx];
    if (ema26Idx >= 0) result.ema26 = ema26[ema26Idx];
    if (rsi14Idx >= 0) result.rsi14 = rsi14[rsi14Idx];

    if (macdIdx >= 0 && macd[macdIdx]) {
      result.macd = macd[macdIdx].MACD;
      result.macdSignal = macd[macdIdx].signal;
      result.macdHistogram = macd[macdIdx].histogram;
    }

    if (bbIdx >= 0 && bb[bbIdx]) {
      result.bbUpper = bb[bbIdx].upper;
      result.bbMiddle = bb[bbIdx].middle;
      result.bbLower = bb[bbIdx].lower;
    }

    if (stochIdx >= 0 && stoch[stochIdx]) {
      result.stochK = stoch[stochIdx].k;
      result.stochD = stoch[stochIdx].d;
    }

    results.push(result);
  }

  return results;
}

/**
 * 특정 종목의 캔들 데이터 조회
 */
export async function getCandlesForStock(
  symbol: string,
  timeframe: string,
  limit: number = 500
): Promise<CandleInput[]> {
  try {
    const stock = await db.query.stocks.findFirst({
      where: eq(stocks.symbol, symbol.toUpperCase()),
    });

    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }

    const candles = await db.query.priceCandles.findMany({
      where: and(
        eq(priceCandles.stockId, stock.id),
        eq(priceCandles.timeframe, timeframe)
      ),
      orderBy: [desc(priceCandles.timestamp)],
      limit: limit,
    });

    // 오래된 순서로 정렬 (지표 계산은 시간 순서대로 해야 함)
    return candles
      .reverse()
      .map((c) => ({
        timestamp: c.timestamp,
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
        volume: parseFloat(c.volume),
      }));
  } catch (error) {
    console.error(`Error getting candles for ${symbol}:`, error);
    throw error;
  }
}

/**
 * 기술적 지표를 계산하고 데이터베이스에 저장
 */
export async function calculateAndSaveIndicators(
  symbol: string,
  timeframe: string
): Promise<void> {
  try {
    console.log(`📊 Calculating indicators for ${symbol} (${timeframe})...`);

    // 1. 주식 정보 조회
    const stock = await db.query.stocks.findFirst({
      where: eq(stocks.symbol, symbol.toUpperCase()),
    });

    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }

    // 2. 캔들 데이터 조회 (최대 500개)
    const candles = await getCandlesForStock(symbol, timeframe, 500);

    if (candles.length < 50) {
      console.warn(`⚠️ Not enough candles for ${symbol} (need at least 50, got ${candles.length})`);
      return;
    }

    // 3. 기술적 지표 계산
    const indicators = calculateAllIndicators(candles);

    // 4. 데이터베이스에 저장 (최근 100개만)
    const recentIndicators = indicators.slice(-100);
    let savedCount = 0;

    for (const indicator of recentIndicators) {
      // 최소한 하나 이상의 지표 값이 있는 경우만 저장
      if (
        indicator.rsi14 ||
        indicator.macd ||
        indicator.sma20 ||
        indicator.bbMiddle
      ) {
        try {
          await db.insert(technicalIndicators).values({
            stockId: stock.id,
            timeframe,
            timestamp: indicator.timestamp,
            sma20: indicator.sma20?.toString(),
            sma50: indicator.sma50?.toString(),
            sma200: indicator.sma200?.toString(),
            ema12: indicator.ema12?.toString(),
            ema26: indicator.ema26?.toString(),
            rsi14: indicator.rsi14?.toString(),
            macd: indicator.macd?.toString(),
            macdSignal: indicator.macdSignal?.toString(),
            macdHistogram: indicator.macdHistogram?.toString(),
            bbUpper: indicator.bbUpper?.toString(),
            bbMiddle: indicator.bbMiddle?.toString(),
            bbLower: indicator.bbLower?.toString(),
            stochK: indicator.stochK?.toString(),
            stochD: indicator.stochD?.toString(),
          });
          savedCount++;
        } catch (error: any) {
          // 중복 키 에러는 무시 (SQLite: UNIQUE constraint, PostgreSQL: duplicate key)
          if (!error?.message?.includes('duplicate key') && !error?.message?.includes('UNIQUE constraint')) {
            console.error(`Error saving indicator:`, error);
          }
          // 중복이면 조용히 무시
        }
      }
    }

    console.log(`✅ Saved ${savedCount} indicators for ${symbol} (${timeframe})`);
  } catch (error) {
    console.error(`❌ Error calculating indicators for ${symbol}:`, error);
    throw error;
  }
}

/**
 * 여러 종목의 기술적 지표를 동시에 계산
 */
export async function calculateIndicatorsForMultipleStocks(
  symbols: string[],
  timeframe: string = '5m'
): Promise<void> {
  console.log(`📊 Calculating indicators for ${symbols.length} stocks...`);

  const promises = symbols.map((symbol) =>
    calculateAndSaveIndicators(symbol, timeframe).catch((error) => {
      console.error(`Failed to calculate indicators for ${symbol}:`, error);
    })
  );

  await Promise.all(promises);
  console.log(`✅ Indicator calculation completed for ${symbols.length} stocks`);
}

/**
 * 특정 종목의 최신 기술적 지표 조회
 */
export async function getLatestIndicators(
  symbol: string,
  timeframe: string,
  limit: number = 100
): Promise<IndicatorResult[]> {
  try {
    const stock = await db.query.stocks.findFirst({
      where: eq(stocks.symbol, symbol.toUpperCase()),
    });

    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }

    const indicators = await db.query.technicalIndicators.findMany({
      where: and(
        eq(technicalIndicators.stockId, stock.id),
        eq(technicalIndicators.timeframe, timeframe)
      ),
      orderBy: [desc(technicalIndicators.timestamp)],
      limit: limit,
    });

    return indicators.reverse().map((ind) => ({
      timestamp: ind.timestamp,
      sma20: ind.sma20 ? parseFloat(ind.sma20) : undefined,
      sma50: ind.sma50 ? parseFloat(ind.sma50) : undefined,
      sma200: ind.sma200 ? parseFloat(ind.sma200) : undefined,
      ema12: ind.ema12 ? parseFloat(ind.ema12) : undefined,
      ema26: ind.ema26 ? parseFloat(ind.ema26) : undefined,
      rsi14: ind.rsi14 ? parseFloat(ind.rsi14) : undefined,
      macd: ind.macd ? parseFloat(ind.macd) : undefined,
      macdSignal: ind.macdSignal ? parseFloat(ind.macdSignal) : undefined,
      macdHistogram: ind.macdHistogram ? parseFloat(ind.macdHistogram) : undefined,
      bbUpper: ind.bbUpper ? parseFloat(ind.bbUpper) : undefined,
      bbMiddle: ind.bbMiddle ? parseFloat(ind.bbMiddle) : undefined,
      bbLower: ind.bbLower ? parseFloat(ind.bbLower) : undefined,
      stochK: ind.stochK ? parseFloat(ind.stochK) : undefined,
      stochD: ind.stochD ? parseFloat(ind.stochD) : undefined,
    }));
  } catch (error) {
    console.error(`Error getting indicators for ${symbol}:`, error);
    throw error;
  }
}

/**
 * 기술적 지표 분석 (매수/매도 시그널 판단)
 */
export function analyzeIndicators(indicator: IndicatorResult): {
  signals: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  strength: number;
} {
  const signals: string[] = [];
  let bullishCount = 0;
  let bearishCount = 0;

  // RSI 분석
  if (indicator.rsi14) {
    if (indicator.rsi14 > 70) {
      signals.push('RSI 과매수 (>70) - 매도 고려');
      bearishCount++;
    } else if (indicator.rsi14 < 30) {
      signals.push('RSI 과매도 (<30) - 매수 고려');
      bullishCount++;
    } else if (indicator.rsi14 > 50) {
      bullishCount += 0.5;
    } else {
      bearishCount += 0.5;
    }
  }

  // MACD 분석
  if (indicator.macd && indicator.macdSignal) {
    if (indicator.macd > indicator.macdSignal) {
      signals.push('MACD 골든크로스 - 매수 신호');
      bullishCount++;
    } else {
      signals.push('MACD 데드크로스 - 매도 신호');
      bearishCount++;
    }
  }

  // 볼린저 밴드 분석 (가격 데이터 필요)
  if (indicator.bbUpper && indicator.bbLower && indicator.bbMiddle) {
    // 볼린저 밴드 폭 분석
    const bbWidth = indicator.bbUpper - indicator.bbLower;
    if (bbWidth < indicator.bbMiddle * 0.05) {
      signals.push('볼린저 밴드 수축 - 큰 움직임 임박');
    }
  }

  // 스토캐스틱 분석
  if (indicator.stochK && indicator.stochD) {
    if (indicator.stochK > 80) {
      signals.push('스토캐스틱 과매수 (>80)');
      bearishCount++;
    } else if (indicator.stochK < 20) {
      signals.push('스토캐스틱 과매도 (<20)');
      bullishCount++;
    }
  }

  // 이동평균선 분석
  if (indicator.sma20 && indicator.sma50) {
    if (indicator.sma20 > indicator.sma50) {
      signals.push('단기 > 중기 이평선 - 상승 추세');
      bullishCount++;
    } else {
      signals.push('단기 < 중기 이평선 - 하락 추세');
      bearishCount++;
    }
  }

  // 종합 판단
  const totalSignals = bullishCount + bearishCount;
  const sentiment =
    bullishCount > bearishCount
      ? 'bullish'
      : bearishCount > bullishCount
      ? 'bearish'
      : 'neutral';

  const strength = totalSignals > 0 ? Math.abs(bullishCount - bearishCount) / totalSignals : 0;

  return {
    signals,
    sentiment,
    strength: Math.round(strength * 100),
  };
}
