/**
 * Alpha Vantage API 테스트 스크립트
 *
 * 실행 방법:
 * 1. .env.local에 ALPHA_VANTAGE_API_KEY 추가
 * 2. npx tsx test-alpha-vantage.ts
 */

import 'dotenv/config';
import alphaVantageService from './lib/services/alpha-vantage-service';

async function testAlphaVantage() {
  console.log('🔍 Testing Alpha Vantage API...\n');

  // API 키 확인
  const stats = alphaVantageService.getStats();
  console.log('API Key Configured:', stats.apiKeyConfigured);

  if (!stats.apiKeyConfigured) {
    console.error('❌ API key not configured!');
    console.log('Please add ALPHA_VANTAGE_API_KEY to .env.local');
    console.log('Get your free API key at: https://www.alphavantage.co/support/#api-key');
    process.exit(1);
  }

  console.log('✅ API key found!\n');

  try {
    // Test 1: 삼성전자 실시간 가격
    console.log('1️⃣  Testing Samsung Electronics (005930)...');
    const samsungQuote = await alphaVantageService.getQuote('005930');
    console.log('✅ Success!');
    console.log('   Symbol:', samsungQuote.symbol);
    console.log('   Price:', samsungQuote.price.toLocaleString(), 'KRW');
    console.log('   Open:', samsungQuote.open.toLocaleString(), 'KRW');
    console.log('   High:', samsungQuote.high.toLocaleString(), 'KRW');
    console.log('   Low:', samsungQuote.low.toLocaleString(), 'KRW');
    console.log('   Volume:', samsungQuote.volume.toLocaleString());
    console.log('   Change:', samsungQuote.change.toFixed(2), `(${samsungQuote.changePercent.toFixed(2)}%)`);
    console.log('   Timestamp:', samsungQuote.timestamp.toISOString());
    console.log('');

    // Test 2: 네이버 실시간 가격
    console.log('2️⃣  Testing NAVER (035420)...');
    const naverQuote = await alphaVantageService.getQuote('035420');
    console.log('✅ Success!');
    console.log('   Symbol:', naverQuote.symbol);
    console.log('   Price:', naverQuote.price.toLocaleString(), 'KRW');
    console.log('   Change:', naverQuote.change.toFixed(2), `(${naverQuote.changePercent.toFixed(2)}%)`);
    console.log('');

    // Test 3: 5분봉 캔들 데이터
    console.log('3️⃣  Testing intraday candles (5min)...');
    const candles = await alphaVantageService.getIntradayCandles('005930', 10);
    console.log('✅ Success!');
    console.log(`   Candles received: ${candles.length}`);
    if (candles.length > 0) {
      console.log('   Latest 3 candles:');
      for (let i = 0; i < Math.min(3, candles.length); i++) {
        const candle = candles[i];
        console.log(`     [${i + 1}] ${candle.timestamp.toISOString()}`);
        console.log(`         O: ${candle.open}, H: ${candle.high}, L: ${candle.low}, C: ${candle.close}, V: ${candle.volume}`);
      }
    }
    console.log('');

    // Test 4: 미국 주식 (Apple)
    console.log('4️⃣  Testing Apple Inc. (AAPL)...');
    const appleQuote = await alphaVantageService.getQuote('AAPL');
    console.log('✅ Success!');
    console.log('   Symbol:', appleQuote.symbol);
    console.log('   Price:', appleQuote.price.toFixed(2), 'USD');
    console.log('   Change:', appleQuote.change.toFixed(2), `(${appleQuote.changePercent.toFixed(2)}%)`);
    console.log('');

    console.log('🎉 All tests passed!');
    console.log('');

    // 최종 통계
    const finalStats = alphaVantageService.getStats();
    console.log('📊 API Usage Stats:');
    console.log('   Total requests:', finalStats.requestCount);
    console.log('   Last request:', finalStats.lastRequestTime.toISOString());
    console.log('');
    console.log('⚠️  Remember: Free tier has 500 requests/day and 5 requests/minute limits');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('Rate Limit')) {
      console.log('\n💡 Tip: Wait a minute before trying again');
    }
    process.exit(1);
  }
}

testAlphaVantage();
