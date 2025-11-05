import cron, { ScheduledTask } from 'node-cron';
import { collectMultipleStocks } from './stock-price-service';

// 관심 종목 리스트 (환경변수나 DB에서 가져올 수 있음)
const WATCHLIST_SYMBOLS = [
  // 미국 주식
  'AAPL',   // Apple
  'MSFT',   // Microsoft
  'GOOGL',  // Google
  'AMZN',   // Amazon
  'TSLA',   // Tesla
  'NVDA',   // NVIDIA
  'META',   // Meta

  // 한국 주식
  '005930.KS',  // 삼성전자
  '000660.KS',  // SK하이닉스
  '035420.KS',  // NAVER
  '051910.KS',  // LG화학
  '035720.KS',  // 카카오
];

let isRunning = false;
let scheduledJobs: ScheduledTask[] = [];

/**
 * 1분마다 실행: 1분봉 데이터 수집
 */
function schedule1MinuteCollection() {
  const job = cron.schedule('*/1 * * * *', async () => {
    if (isRunning) {
      console.log('⏭️ Previous job still running, skipping...');
      return;
    }

    try {
      isRunning = true;
      console.log('🕐 [1분봉] Starting scheduled collection...');
      await collectMultipleStocks(WATCHLIST_SYMBOLS, '1m');
      console.log('✅ [1분봉] Collection completed');
    } catch (error) {
      console.error('❌ [1분봉] Collection failed:', error);
    } finally {
      isRunning = false;
    }
  });

  console.log('✅ Scheduled: 1분봉 수집 (매 1분마다)');
  return job;
}

/**
 * 5분마다 실행: 5분봉 데이터 수집
 */
function schedule5MinuteCollection() {
  const job = cron.schedule('*/5 * * * *', async () => {
    if (isRunning) {
      console.log('⏭️ Previous job still running, skipping...');
      return;
    }

    try {
      isRunning = true;
      console.log('🕐 [5분봉] Starting scheduled collection...');
      await collectMultipleStocks(WATCHLIST_SYMBOLS, '5m');
      console.log('✅ [5분봉] Collection completed');
    } catch (error) {
      console.error('❌ [5분봉] Collection failed:', error);
    } finally {
      isRunning = false;
    }
  });

  console.log('✅ Scheduled: 5분봉 수집 (매 5분마다)');
  return job;
}

/**
 * 15분마다 실행: 15분봉 데이터 수집
 */
function schedule15MinuteCollection() {
  const job = cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('🕐 [15분봉] Starting scheduled collection...');
      await collectMultipleStocks(WATCHLIST_SYMBOLS, '15m');
      console.log('✅ [15분봉] Collection completed');
    } catch (error) {
      console.error('❌ [15분봉] Collection failed:', error);
    }
  });

  console.log('✅ Scheduled: 15분봉 수집 (매 15분마다)');
  return job;
}

/**
 * 1시간마다 실행: 1시간봉 데이터 수집
 */
function schedule1HourCollection() {
  const job = cron.schedule('0 * * * *', async () => {
    try {
      console.log('🕐 [1시간봉] Starting scheduled collection...');
      await collectMultipleStocks(WATCHLIST_SYMBOLS, '1h');
      console.log('✅ [1시간봉] Collection completed');
    } catch (error) {
      console.error('❌ [1시간봉] Collection failed:', error);
    }
  });

  console.log('✅ Scheduled: 1시간봉 수집 (매 시간마다)');
  return job;
}

/**
 * 스케줄러 시작
 */
export function startScheduler() {
  if (scheduledJobs.length > 0) {
    console.log('⚠️ Scheduler is already running');
    return;
  }

  console.log('🚀 Starting stock data collection scheduler...');

  // 환경변수로 제어 (프로덕션에서만 실행)
  const enableScheduler = process.env.ENABLE_SCHEDULER === 'true';

  if (!enableScheduler) {
    console.log('ℹ️ Scheduler disabled (set ENABLE_SCHEDULER=true to enable)');
    return;
  }

  // 각 시간 프레임별 스케줄 등록
  scheduledJobs = [
    schedule1MinuteCollection(),
    schedule5MinuteCollection(),
    schedule15MinuteCollection(),
    schedule1HourCollection(),
  ];

  console.log('✅ Scheduler started successfully');
  console.log(`📊 Monitoring ${WATCHLIST_SYMBOLS.length} stocks`);
}

/**
 * 스케줄러 중지
 */
export function stopScheduler() {
  console.log('🛑 Stopping scheduler...');

  scheduledJobs.forEach((job) => job.stop());
  scheduledJobs = [];

  console.log('✅ Scheduler stopped');
}

/**
 * 수동으로 즉시 수집 실행
 */
export async function runImmediateCollection(timeframe: '1m' | '5m' | '15m' | '1h' = '5m') {
  console.log(`🔄 Running immediate collection (${timeframe})...`);
  try {
    await collectMultipleStocks(WATCHLIST_SYMBOLS, timeframe);
    console.log(`✅ Immediate collection completed`);
  } catch (error) {
    console.error(`❌ Immediate collection failed:`, error);
    throw error;
  }
}

/**
 * 관심 종목 리스트 조회
 */
export function getWatchlist() {
  return WATCHLIST_SYMBOLS;
}

/**
 * 관심 종목 추가
 */
export function addToWatchlist(symbol: string) {
  const upperSymbol = symbol.toUpperCase();
  if (!WATCHLIST_SYMBOLS.includes(upperSymbol)) {
    WATCHLIST_SYMBOLS.push(upperSymbol);
    console.log(`✅ Added ${upperSymbol} to watchlist`);
  }
}

/**
 * 관심 종목 제거
 */
export function removeFromWatchlist(symbol: string) {
  const upperSymbol = symbol.toUpperCase();
  const index = WATCHLIST_SYMBOLS.indexOf(upperSymbol);
  if (index > -1) {
    WATCHLIST_SYMBOLS.splice(index, 1);
    console.log(`✅ Removed ${upperSymbol} from watchlist`);
  }
}
