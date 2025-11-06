/**
 * Auto Stock Search Service
 * 종목명으로 네이버 금융에서 종목 코드를 자동으로 검색하는 서비스
 */

import { chromium, Browser, Page } from 'playwright';

export interface StockSearchResult {
  name: string;
  code: string;
  market: 'KOSPI' | 'KOSDAQ' | 'KONEX' | 'UNKNOWN';
  exchange: string;
}

class AutoStockSearchService {
  private browser: Browser | null = null;
  private searchCache: Map<string, StockSearchResult> = new Map();

  /**
   * 브라우저 초기화
   */
  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  }

  /**
   * 브라우저 종료
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 네이버 금융에서 종목 검색
   * @param stockName 종목명 (예: "한국전력", "카카오")
   * @returns 종목 정보 또는 null
   */
  async searchStock(stockName: string): Promise<StockSearchResult | null> {
    // 캐시 확인
    if (this.searchCache.has(stockName)) {
      console.log(`📦 Cache hit for ${stockName}`);
      return this.searchCache.get(stockName)!;
    }

    await this.init();
    const page = await this.browser!.newPage();

    try {
      console.log(`🔍 Auto-searching stock: ${stockName}`);

      // 네이버 금융 검색 페이지
      const searchUrl = `https://finance.naver.com/search/searchList.naver?query=${encodeURIComponent(stockName)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 10000 });

      // 검색 결과에서 첫 번째 종목 추출
      const result = await page.evaluate(() => {
        // 검색 결과 테이블에서 첫 번째 종목 찾기
        const firstRow = document.querySelector('.tbl_search tbody tr');
        if (!firstRow) return null;

        // 종목명
        const nameElement = firstRow.querySelector('.tltle');
        const name = nameElement?.textContent?.trim();

        // 종목 링크에서 코드 추출 (예: /item/main.naver?code=015760)
        const linkElement = firstRow.querySelector('a');
        const href = linkElement?.getAttribute('href');
        const codeMatch = href?.match(/code=(\d{6})/);
        const code = codeMatch ? codeMatch[1] : null;

        // 시장 구분
        const marketElement = firstRow.querySelector('td:nth-child(3)'); // 시장 열
        const marketText = marketElement?.textContent?.trim();
        let market: 'KOSPI' | 'KOSDAQ' | 'KONEX' | 'UNKNOWN' = 'UNKNOWN';

        if (marketText?.includes('코스피')) market = 'KOSPI';
        else if (marketText?.includes('코스닥')) market = 'KOSDAQ';
        else if (marketText?.includes('코넥스')) market = 'KONEX';

        if (!name || !code) return null;

        return {
          name,
          code,
          market,
          exchange: market === 'KOSDAQ' ? '.KQ' : '.KS',
        };
      });

      await page.close();

      if (!result) {
        console.warn(`⚠️  No stock found for: ${stockName}`);
        return null;
      }

      console.log(`✅ Found: ${result.name} (${result.code}) [${result.market}]`);

      // 캐시에 저장
      this.searchCache.set(stockName, result);
      this.searchCache.set(result.name, result); // 정확한 이름으로도 캐싱

      return result;
    } catch (error) {
      console.error(`❌ Error searching stock ${stockName}:`, error);
      await page.close();
      return null;
    }
  }

  /**
   * 여러 종목 동시 검색
   */
  async searchMultipleStocks(stockNames: string[]): Promise<StockSearchResult[]> {
    const results: StockSearchResult[] = [];

    for (const name of stockNames) {
      try {
        const result = await this.searchStock(name);
        if (result) {
          results.push(result);
        }
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to search ${name}:`, error);
      }
    }

    return results;
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.searchCache.clear();
    console.log('🗑️  Search cache cleared');
  }

  /**
   * 캐시 통계
   */
  getCacheStats() {
    return {
      size: this.searchCache.size,
      entries: Array.from(this.searchCache.entries()).map(([key, value]) => ({
        searchTerm: key,
        result: `${value.name} (${value.code})`,
      })),
    };
  }
}

// Singleton instance
const autoStockSearchService = new AutoStockSearchService();

// 프로세스 종료 시 브라우저 정리
process.on('exit', () => {
  autoStockSearchService.close().catch(console.error);
});

process.on('SIGINT', async () => {
  await autoStockSearchService.close();
  process.exit(0);
});

export default autoStockSearchService;
