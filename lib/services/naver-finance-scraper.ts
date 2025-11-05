/**
 * Naver Finance Web Scraper Service
 * 네이버 금융에서 실시간 주식 데이터 수집
 *
 * Puppeteer를 사용하여 동적 페이지 스크래핑
 */

import puppeteer from 'puppeteer';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: Date;
}

class NaverFinanceScraper {
  private browser: any = null;

  /**
   * 브라우저 초기화
   */
  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
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
   * 네이버 금융에서 주식 데이터 가져오기
   * URL: https://finance.naver.com/item/main.naver?code=005930
   */
  async getStockQuote(code: string): Promise<StockQuote> {
    await this.init();

    const page = await this.browser.newPage();

    try {
      // 한국 주식 코드 정규화 (6자리 숫자만)
      const stockCode = code.replace(/\.(KS|KQ)$/, '');
      const url = `https://finance.naver.com/item/main.naver?code=${stockCode}`;

      console.log(`📊 Scraping Naver Finance: ${url}`);

      // 페이지 로드
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // 데이터 추출
      const data = await page.evaluate(() => {
        // 종목명
        const nameElement = document.querySelector('.wrap_company h2 a');
        const name = nameElement?.textContent?.trim() || '';

        // 현재가
        const priceElement = document.querySelector('.no_today .blind');
        const priceText = priceElement?.textContent?.replace(/,/g, '') || '0';
        const price = parseFloat(priceText);

        // 전일대비
        const changeElement = document.querySelector('.no_exday .blind');
        const changeText = changeElement?.textContent?.replace(/,/g, '') || '0';
        const change = parseFloat(changeText);

        // 등락률
        const changePercentElement = document.querySelector('.no_exday em .blind');
        const changePercentText = changePercentElement?.textContent?.replace(/[%,]/g, '') || '0';
        const changePercent = parseFloat(changePercentText);

        // 시가, 고가, 저가, 거래량
        const tableCells = document.querySelectorAll('.first table tr td .blind');
        const values: string[] = [];
        tableCells.forEach(cell => {
          const text = cell.textContent?.replace(/,/g, '').trim() || '0';
          values.push(text);
        });

        // 시가 (첫 번째 행의 두 번째 값)
        const open = parseFloat(values[0] || '0');

        // 고가 (두 번째 행의 첫 번째 값)
        const high = parseFloat(values[1] || '0');

        // 저가 (세 번째 행의 첫 번째 값)
        const low = parseFloat(values[2] || '0');

        // 거래량 (네 번째 행)
        const volumeText = values[3] || '0';
        const volume = parseInt(volumeText);

        return {
          name,
          price,
          change,
          changePercent,
          open,
          high,
          low,
          volume,
        };
      });

      await page.close();

      console.log(`✅ Scraped data for ${data.name} (${stockCode})`);

      return {
        symbol: stockCode,
        name: data.name,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        open: data.open,
        high: data.high,
        low: data.low,
        volume: data.volume,
        timestamp: new Date(),
      };
    } catch (error) {
      await page.close();
      console.error(`❌ Error scraping ${code}:`, error);
      throw error;
    }
  }

  /**
   * 여러 종목 동시 스크래핑
   */
  async getMultipleQuotes(codes: string[]): Promise<StockQuote[]> {
    const results: StockQuote[] = [];

    for (const code of codes) {
      try {
        const quote = await this.getStockQuote(code);
        results.push(quote);

        // Rate limiting: 1초 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to scrape ${code}:`, error);
      }
    }

    return results;
  }
}

// Singleton instance
const naverFinanceScraper = new NaverFinanceScraper();

// 프로세스 종료 시 브라우저 정리
process.on('exit', () => {
  naverFinanceScraper.close().catch(console.error);
});

process.on('SIGINT', async () => {
  await naverFinanceScraper.close();
  process.exit(0);
});

export default naverFinanceScraper;
