/**
 * Naver Finance Scraper 테스트 스크립트
 *
 * 실행 방법:
 * 1. npm install puppeteer
 * 2. npx tsx test-naver-scraper.ts
 */

import naverFinanceScraper from './lib/services/naver-finance-scraper';

async function testNaverScraper() {
  console.log('🔍 Testing Naver Finance Scraper...\n');

  try {
    // Test 1: 삼성전자 (005930)
    console.log('1️⃣  Testing Samsung Electronics (005930)...');
    const samsung = await naverFinanceScraper.getStockQuote('005930');
    console.log('✅ Success!');
    console.log('   Name:', samsung.name);
    console.log('   Symbol:', samsung.symbol);
    console.log('   Price:', samsung.price.toLocaleString(), 'KRW');
    console.log('   Open:', samsung.open.toLocaleString(), 'KRW');
    console.log('   High:', samsung.high.toLocaleString(), 'KRW');
    console.log('   Low:', samsung.low.toLocaleString(), 'KRW');
    console.log('   Volume:', samsung.volume.toLocaleString());
    console.log('   Change:', samsung.change.toFixed(2), `(${samsung.changePercent.toFixed(2)}%)`);
    console.log('   Timestamp:', samsung.timestamp.toISOString());
    console.log('');

    // Test 2: 네이버 (035420)
    console.log('2️⃣  Testing NAVER (035420)...');
    const naver = await naverFinanceScraper.getStockQuote('035420');
    console.log('✅ Success!');
    console.log('   Name:', naver.name);
    console.log('   Symbol:', naver.symbol);
    console.log('   Price:', naver.price.toLocaleString(), 'KRW');
    console.log('   Change:', naver.change.toFixed(2), `(${naver.changePercent.toFixed(2)}%)`);
    console.log('');

    // Test 3: SK하이닉스 (000660)
    console.log('3️⃣  Testing SK Hynix (000660)...');
    const skhynix = await naverFinanceScraper.getStockQuote('000660');
    console.log('✅ Success!');
    console.log('   Name:', skhynix.name);
    console.log('   Symbol:', skhynix.symbol);
    console.log('   Price:', skhynix.price.toLocaleString(), 'KRW');
    console.log('   Change:', skhynix.change.toFixed(2), `(${skhynix.changePercent.toFixed(2)}%)`);
    console.log('');

    console.log('🎉 All tests passed!');
    console.log('');

    console.log('📊 Summary:');
    console.log('   ✅ Naver Finance scraper working!');
    console.log('   ✅ Real-time Korean stock data available');
    console.log('   ✅ No API key required');
    console.log('   ✅ No rate limits (use responsibly)');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // 브라우저 종료
    await naverFinanceScraper.close();
  }
}

testNaverScraper();
