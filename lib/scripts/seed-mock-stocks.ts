import dotenv from 'dotenv';
import path from 'path';

// .env.local 파일 로드
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { db } from '@/lib/db';
import { stocks, priceCandles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Mock 주식 데이터
const mockStocks = [
  {
    symbol: '005930',
    name: '삼성전자',
    market: 'KOSPI',
    currency: 'KRW',
    exchange: 'KRX',
    sector: '전기전자',
  },
  {
    symbol: '000660',
    name: 'SK하이닉스',
    market: 'KOSPI',
    currency: 'KRW',
    exchange: 'KRX',
    sector: '전기전자',
  },
  {
    symbol: '035420',
    name: 'NAVER',
    market: 'KOSPI',
    currency: 'KRW',
    exchange: 'KRX',
    sector: '서비스업',
  },
  {
    symbol: '051910',
    name: 'LG화학',
    market: 'KOSPI',
    currency: 'KRW',
    exchange: 'KRX',
    sector: '화학',
  },
  {
    symbol: '035720',
    name: '카카오',
    market: 'KOSPI',
    currency: 'KRW',
    exchange: 'KRX',
    sector: '서비스업',
  },
];

/**
 * 랜덤 가격 변동을 생성하는 함수
 */
function generateRandomPrice(basePrice: number, volatility: number = 0.02): number {
  const change = basePrice * volatility * (Math.random() - 0.5) * 2;
  return Math.round((basePrice + change) * 100) / 100;
}

/**
 * 캔들 데이터 생성 (시가, 고가, 저가, 종가)
 */
function generateCandle(basePrice: number, volatility: number = 0.01) {
  const open = generateRandomPrice(basePrice, volatility);
  const close = generateRandomPrice(open, volatility);
  const high = Math.max(open, close) * (1 + Math.random() * volatility);
  const low = Math.min(open, close) * (1 - Math.random() * volatility);
  const volume = Math.floor(Math.random() * 1000000) + 100000;

  return {
    open: Math.round(open),
    high: Math.round(high),
    low: Math.round(low),
    close: Math.round(close),
    volume,
  };
}

/**
 * 시간별 캔들 데이터 생성
 */
function generateHistoricalCandles(
  basePrice: number,
  count: number = 100,
  intervalMinutes: number = 5
) {
  const candles = [];
  let currentPrice = basePrice;
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
    const candle = generateCandle(currentPrice, 0.015);

    candles.push({
      timestamp,
      ...candle,
    });

    currentPrice = candle.close;
  }

  return candles;
}

async function seedMockStocks() {
  console.log('🌱 Seeding mock stock data...\n');

  let totalStocks = 0;
  let totalCandles = 0;

  for (const stockData of mockStocks) {
    try {
      // 1. 주식 정보 생성 또는 조회
      let stock = await db.query.stocks.findFirst({
        where: eq(stocks.symbol, stockData.symbol),
      });

      if (!stock) {
        const [newStock] = await db.insert(stocks).values(stockData).returning();
        stock = newStock;
        console.log(`✅ Created: ${stockData.name} (${stockData.symbol})`);
        totalStocks++;
      } else {
        console.log(`⚠️  Already exists: ${stockData.name} (${stockData.symbol})`);
      }

      // 2. 기준 가격 설정 (실제 주식 가격과 유사하게)
      const basePrices: { [key: string]: number } = {
        '005930': 71000, // 삼성전자
        '000660': 128000, // SK하이닉스
        '035420': 215000, // NAVER
        '051910': 380000, // LG화학
        '035720': 48000, // 카카오
      };

      const basePrice = basePrices[stockData.symbol] || 50000;

      // 3. 5분봉 데이터 생성 (최근 500개 = 약 41시간)
      const candles5m = generateHistoricalCandles(basePrice, 500, 5);

      for (const candle of candles5m) {
        try {
          await db.insert(priceCandles).values({
            stockId: stock.id,
            timeframe: '5m',
            timestamp: candle.timestamp,
            open: candle.open.toString(),
            high: candle.high.toString(),
            low: candle.low.toString(),
            close: candle.close.toString(),
            volume: candle.volume.toString(),
          });
          totalCandles++;
        } catch (error: any) {
          // 중복 데이터 무시
          if (!error?.message?.includes('UNIQUE constraint')) {
            console.error(`Error inserting candle: ${error.message}`);
          }
        }
      }

      console.log(`  📊 Generated ${candles5m.length} candles (5m) for ${stockData.name}`);

    } catch (error) {
      console.error(`❌ Error processing ${stockData.symbol}:`, error);
    }
  }

  console.log('\n📊 Seeding complete:');
  console.log(`  ✅ Stocks created: ${totalStocks}`);
  console.log(`  📈 Candles created: ${totalCandles}`);
  console.log('\n✨ Done!');
}

seedMockStocks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
