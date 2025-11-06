/**
 * Auto Stock Search 테스트 스크립트
 *
 * 실행 방법:
 * npx tsx test-auto-search.ts
 */

import autoStockSearchService from './lib/services/auto-stock-search-service';
import { normalizeStockSymbolWithSearch, addStockToMapping } from './lib/utils/stock-symbol-mapper';

async function testAutoSearch() {
  console.log('🔍 Testing Auto Stock Search Service...\n');

  try {
    // Test 1: 기존에 없는 종목 검색
    console.log('1️⃣  Testing unknown stock: 현대해상');
    const result1 = await autoStockSearchService.searchStock('현대해상');
    if (result1) {
      console.log('✅ Found:');
      console.log(`   Name: ${result1.name}`);
      console.log(`   Code: ${result1.code}`);
      console.log(`   Market: ${result1.market}`);
      console.log(`   Exchange: ${result1.exchange}`);
    } else {
      console.log('❌ Not found');
    }
    console.log('');

    // Test 2: 다른 종목 검색
    console.log('2️⃣  Testing unknown stock: 삼성화재');
    const result2 = await autoStockSearchService.searchStock('삼성화재');
    if (result2) {
      console.log('✅ Found:');
      console.log(`   Name: ${result2.name}`);
      console.log(`   Code: ${result2.code}`);
      console.log(`   Market: ${result2.market}`);
    }
    console.log('');

    // Test 3: 여러 종목 동시 검색
    console.log('3️⃣  Testing multiple stocks');
    const stocks = ['기업은행', 'NH투자증권', '코오롱'];
    const results = await autoStockSearchService.searchMultipleStocks(stocks);
    console.log(`✅ Found ${results.length} stocks:`);
    results.forEach(r => {
      console.log(`   - ${r.name} (${r.code}) [${r.market}]`);
    });
    console.log('');

    // Test 4: normalizeStockSymbolWithSearch 함수 테스트
    console.log('4️⃣  Testing normalizeStockSymbolWithSearch');
    const symbol1 = await normalizeStockSymbolWithSearch('롯데칠성');
    console.log(`   롯데칠성 → ${symbol1}`);

    const symbol2 = await normalizeStockSymbolWithSearch('삼성전자');
    console.log(`   삼성전자 → ${symbol2} (should use cache)`);
    console.log('');

    // Test 5: 캐시 통계
    console.log('5️⃣  Cache statistics');
    const stats = autoStockSearchService.getCacheStats();
    console.log(`   Cached entries: ${stats.size}`);
    if (stats.size > 0) {
      console.log('   Entries:');
      stats.entries.slice(0, 5).forEach(e => {
        console.log(`     - "${e.searchTerm}" → ${e.result}`);
      });
    }
    console.log('');

    console.log('🎉 All tests completed!');
    console.log('');
    console.log('💡 Now you can use any Korean stock name in the dashboard!');
    console.log('   Example: "현대해상", "기업은행", "NH투자증권"');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // 브라우저 종료
    await autoStockSearchService.close();
  }
}

testAutoSearch();
