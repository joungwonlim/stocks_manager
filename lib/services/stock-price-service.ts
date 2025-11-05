import axios from 'axios';
import * as cheerio from 'cheerio';
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
 * 한국 주식 코드인지 확인 (6자리 숫자)
 */
function isKoreanStock(symbol: string): boolean {
  return /^\d{6}$/.test(symbol.replace('.KS', '').replace('.KQ', ''));
}

/**
 * 심볼을 한국 주식 코드로 변환
 */
function toKoreanCode(symbol: string): string {
  return symbol.replace('.KS', '').replace('.KQ', '');
}

/**
 * 네이버 금융에서 실시간 시세 크롤링
 */
async function fetchNaverQuote(code: string): Promise<StockQuote | null> {
  try {
    const url = `https://finance.naver.com/item/main.naver?code=${code}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    // 현재가
    const price = parseFloat($('.rate_info .blind').first().text().replace(/,/g, ''));

    // 전일대비
    const changeText = $('.rate_info .blind').eq(1).text().replace(/,/g, '');
    const change = parseFloat(changeText);

    // 등락률
    const changePercentText = $('.rate_info .blind').eq(2).text().replace(/,/g, '').replace('%', '');
    const changePercent = parseFloat(changePercentText);

    // 거래량
    const volumeText = $('#_nowVal').parent().parent().next().find('td').eq(0).text().replace(/,/g, '');
    const volume = parseInt(volumeText) || 0;

    if (isNaN(price)) {
      console.error(`Failed to parse Naver quote for ${code}`);
      return null;
    }

    return {
      symbol: code,
      price,
      change: change || 0,
      changePercent: changePercent || 0,
      volume,
    };
  } catch (error) {
    console.error(`Error fetching Naver quote for ${code}:`, error);
    return null;
  }
}

/**
 * 다음 금융에서 실시간 시세 크롤링 (백업)
 */
async function fetchDaumQuote(code: string): Promise<StockQuote | null> {
  try {
    const url = `https://finance.daum.net/quotes/A${code}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    // 현재가
    const priceText = $('.price').first().text().replace(/,/g, '');
    const price = parseFloat(priceText);

    // 전일대비
    const changeText = $('.change').first().text().replace(/,/g, '').replace('+', '').replace('-', '');
    const change = parseFloat(changeText);

    // 등락률
    const changePercentText = $('.rate').first().text().replace(/,/g, '').replace('%', '').replace('+', '').replace('-', '');
    const changePercent = parseFloat(changePercentText);

    if (isNaN(price)) {
      console.error(`Failed to parse Daum quote for ${code}`);
      return null;
    }

    return {
      symbol: code,
      price,
      change: change || 0,
      changePercent: changePercent || 0,
      volume: 0,
    };
  } catch (error) {
    console.error(`Error fetching Daum quote for ${code}:`, error);
    return null;
  }
}

/**
 * 알파스퀘어에서 실시간 시세 크롤링 (백업)
 */
async function fetchAlphaSquareQuote(code: string): Promise<StockQuote | null> {
  try {
    const url = `https://alphasquare.co.kr/home/stock/stock-summary?code=${code}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    // 페이지 구조에 따라 파싱 로직 구현
    // 현재는 기본 구조만 작성
    const priceText = $('.price-now').text().replace(/,/g, '');
    const price = parseFloat(priceText);

    if (isNaN(price)) {
      console.error(`Failed to parse AlphaSquare quote for ${code}`);
      return null;
    }

    return {
      symbol: code,
      price,
      change: 0,
      changePercent: 0,
      volume: 0,
    };
  } catch (error) {
    console.error(`Error fetching AlphaSquare quote for ${code}:`, error);
    return null;
  }
}

/**
 * 순차적으로 여러 소스를 시도하여 주가 데이터 가져오기
 */
export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  const code = toKoreanCode(symbol);

  if (!isKoreanStock(code)) {
    console.warn(`${symbol} is not a Korean stock code. Skipping...`);
    return null;
  }

  // 1. 네이버 금융 시도
  console.log(`🔍 Trying Naver Finance for ${code}...`);
  let quote = await fetchNaverQuote(code);
  if (quote) {
    console.log(`✅ Success from Naver Finance`);
    return quote;
  }

  // 2. 다음 금융 시도
  console.log(`🔍 Trying Daum Finance for ${code}...`);
  quote = await fetchDaumQuote(code);
  if (quote) {
    console.log(`✅ Success from Daum Finance`);
    return quote;
  }

  // 3. 알파스퀘어 시도
  console.log(`🔍 Trying AlphaSquare for ${code}...`);
  quote = await fetchAlphaSquareQuote(code);
  if (quote) {
    console.log(`✅ Success from AlphaSquare`);
    return quote;
  }

  console.error(`❌ All sources failed for ${code}`);
  return null;
}

/**
 * 네이버 금융에서 분봉 데이터 크롤링
 */
async function fetchNaverCandles(code: string, pages: number = 5): Promise<CandleData[]> {
  try {
    const candles: CandleData[] = [];

    for (let page = 1; page <= pages; page++) {
      const url = `https://finance.naver.com/item/sise_time.naver?code=${code}&page=${page}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const $ = cheerio.load(response.data);

      $('table.type2 tbody tr').each((_, element) => {
        const $row = $(element);
        const cols = $row.find('td');

        if (cols.length < 7) return;

        const timeText = cols.eq(0).text().trim();
        const closeText = cols.eq(1).text().replace(/,/g, '');
        const changeText = cols.eq(2).text().replace(/,/g, '');
        const openText = cols.eq(3).text().replace(/,/g, '');
        const highText = cols.eq(4).text().replace(/,/g, '');
        const lowText = cols.eq(5).text().replace(/,/g, '');
        const volumeText = cols.eq(6).text().replace(/,/g, '');

        if (!timeText || !closeText) return;

        // 시간 파싱 (오늘 날짜 + 시:분)
        const [hours, minutes] = timeText.split(':');
        const timestamp = new Date();
        timestamp.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        candles.push({
          timestamp,
          open: parseFloat(openText) || 0,
          high: parseFloat(highText) || 0,
          low: parseFloat(lowText) || 0,
          close: parseFloat(closeText) || 0,
          volume: parseInt(volumeText) || 0,
        });
      });

      // 요청 간 딜레이 (크롤링 예의)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return candles;
  } catch (error) {
    console.error(`Error fetching Naver candles for ${code}:`, error);
    return [];
  }
}

/**
 * 과거 캔들 데이터 가져오기
 */
export async function fetchHistoricalData(
  symbol: string,
  period1: Date,
  period2: Date,
  interval: '1m' | '5m' | '15m' | '1h' | '1d' = '5m'
): Promise<CandleData[]> {
  const code = toKoreanCode(symbol);

  if (!isKoreanStock(code)) {
    console.warn(`${symbol} is not a Korean stock code. Skipping...`);
    return [];
  }

  console.log(`📊 Fetching historical data for ${code}...`);

  // 네이버 금융에서 분봉 데이터 가져오기 (약 5페이지 = 최근 ~250개 데이터)
  const candles = await fetchNaverCandles(code, 5);

  if (candles.length === 0) {
    console.warn(`⚠️ No candle data for ${code}`);
    return [];
  }

  console.log(`✅ Fetched ${candles.length} candles for ${code}`);
  return candles;
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
    const code = toKoreanCode(symbol);

    // 1. 주식 정보 조회 (없으면 생성)
    let stock = await db.query.stocks.findFirst({
      where: eq(stocks.symbol, code),
    });

    if (!stock) {
      // 네이버에서 종목명 가져오기
      const quote = await fetchNaverQuote(code);

      const [newStock] = await db
        .insert(stocks)
        .values({
          symbol: code,
          name: quote?.symbol || code,
          market: 'KRX',
          currency: 'KRW',
          exchange: 'KOSPI/KOSDAQ',
        })
        .returning();

      stock = newStock;
    }

    // 2. 캔들 데이터 저장 (중복 방지)
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
        // 중복 키 에러는 무시
        if (!error?.message?.includes('duplicate key')) {
          console.error(`Error saving candle for ${code}:`, error);
        }
      }
    }

    console.log(`✅ Saved ${candles.length} candles for ${code} (${timeframe})`);
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

    const period2 = new Date();
    const period1 = new Date(period2.getTime() - 24 * 60 * 60 * 1000); // 1일 전

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

  // 크롤링은 순차적으로 실행 (동시 요청은 차단될 수 있음)
  for (const symbol of symbols) {
    try {
      await collectRealTimeData(symbol, timeframe);
      // 요청 간 딜레이 (크롤링 예의)
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to collect ${symbol}:`, error);
    }
  }

  console.log(`✅ Data collection completed for ${symbols.length} stocks`);
}

/**
 * 주식 정보 생성 또는 업데이트
 */
export async function upsertStock(symbol: string): Promise<void> {
  try {
    const code = toKoreanCode(symbol);
    const quote = await fetchStockQuote(code);

    if (!quote) {
      throw new Error(`Cannot fetch stock info for ${code}`);
    }

    // 기존 주식 확인
    const existingStock = await db.query.stocks.findFirst({
      where: eq(stocks.symbol, code),
    });

    if (existingStock) {
      // 업데이트
      await db
        .update(stocks)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(stocks.id, existingStock.id));

      console.log(`✅ Updated stock info for ${code}`);
    } else {
      // 생성
      await db.insert(stocks).values({
        symbol: code,
        name: code,
        market: 'KRX',
        currency: 'KRW',
        exchange: 'KOSPI/KOSDAQ',
      });

      console.log(`✅ Created stock info for ${code}`);
    }
  } catch (error) {
    console.error(`Error upserting stock ${symbol}:`, error);
    throw error;
  }
}
