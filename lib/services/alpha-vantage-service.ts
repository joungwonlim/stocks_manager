/**
 * Alpha Vantage API Service
 * 실시간 주식 데이터 수집 서비스
 *
 * API Documentation: https://www.alphavantage.co/documentation/
 * Free tier: 500 requests/day, 5 requests/minute
 */

interface AlphaVantageQuote {
  '01. symbol': string;
  '02. open': string;
  '03. high': string;
  '04. low': string;
  '05. price': string;
  '06. volume': string;
  '07. latest trading day': string;
  '08. previous close': string;
  '09. change': string;
  '10. change percent': string;
}

interface AlphaVantageTimeSeriesData {
  [timestamp: string]: {
    '1. open': string;
    '2. high': string;
    '3. low': string;
    '4. close': string;
    '5. volume': string;
  };
}

interface AlphaVantageIntradayResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Interval': string;
    '5. Output Size': string;
    '6. Time Zone': string;
  };
  [key: string]: any; // 'Time Series (5min)' etc.
}

export interface StockQuote {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

export interface CandleData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class AlphaVantageService {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly rateLimit = {
    requestsPerMinute: 5,
    minDelayMs: 12000, // 12 seconds between requests (5 per minute)
  };

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    if (!this.apiKey || this.apiKey === 'your_alpha_vantage_api_key_here') {
      console.warn('⚠️  Alpha Vantage API key not configured');
    }
  }

  /**
   * Rate limiting to respect API limits (5 requests/minute)
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimit.minDelayMs) {
      const waitTime = this.rateLimit.minDelayMs - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * 심볼을 Alpha Vantage 형식으로 변환
   * 한국 주식: 005930 → 005930.KS
   * 미국 주식: AAPL → AAPL
   */
  private formatSymbol(symbol: string): string {
    // 이미 .KS, .KQ가 있으면 그대로 반환
    if (symbol.includes('.KS') || symbol.includes('.KQ')) {
      return symbol;
    }

    // 한국 주식 코드 (6자리 숫자)
    if (/^\d{6}$/.test(symbol)) {
      // KOSPI는 .KS, KOSDAQ는 .KQ
      // 간단하게 .KS로 시도하고, 실패하면 .KQ 시도
      return `${symbol}.KS`;
    }

    // 미국 주식은 그대로
    return symbol;
  }

  /**
   * 실시간 주식 가격 조회
   * Function: GLOBAL_QUOTE
   */
  async getQuote(symbol: string): Promise<StockQuote> {
    if (!this.apiKey || this.apiKey === 'your_alpha_vantage_api_key_here') {
      throw new Error('Alpha Vantage API key is not configured');
    }

    await this.waitForRateLimit();

    const formattedSymbol = this.formatSymbol(symbol);
    const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${formattedSymbol}&apikey=${this.apiKey}`;

    console.log(`📊 Fetching quote for ${formattedSymbol}...`);

    try {
      const response = await fetch(url);
      const data = await response.json();

      // API 에러 체크
      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API Error: ${data['Error Message']}`);
      }

      if (data['Note']) {
        throw new Error(`Alpha Vantage Rate Limit: ${data['Note']}`);
      }

      const quote = data['Global Quote'] as AlphaVantageQuote;
      if (!quote || !quote['05. price']) {
        // .KS로 실패했으면 .KQ 시도 (한국 주식인 경우)
        if (formattedSymbol.endsWith('.KS')) {
          const kqSymbol = formattedSymbol.replace('.KS', '.KQ');
          console.log(`🔄 Retrying with ${kqSymbol}...`);
          return this.getQuote(kqSymbol);
        }
        throw new Error(`No quote data available for ${formattedSymbol}`);
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        volume: parseInt(quote['06. volume']),
        previousClose: parseFloat(quote['08. previous close']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        timestamp: new Date(quote['07. latest trading day']),
      };
    } catch (error) {
      console.error(`❌ Error fetching quote for ${formattedSymbol}:`, error);
      throw error;
    }
  }

  /**
   * 5분봉 캔들 데이터 조회
   * Function: TIME_SERIES_INTRADAY
   * Interval: 5min
   */
  async getIntradayCandles(
    symbol: string,
    limit: number = 100
  ): Promise<CandleData[]> {
    if (!this.apiKey || this.apiKey === 'your_alpha_vantage_api_key_here') {
      throw new Error('Alpha Vantage API key is not configured');
    }

    await this.waitForRateLimit();

    const formattedSymbol = this.formatSymbol(symbol);
    const url = `${this.baseUrl}?function=TIME_SERIES_INTRADAY&symbol=${formattedSymbol}&interval=5min&outputsize=full&apikey=${this.apiKey}`;

    console.log(`📈 Fetching intraday candles for ${formattedSymbol}...`);

    try {
      const response = await fetch(url);
      const data: AlphaVantageIntradayResponse = await response.json();

      // API 에러 체크
      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API Error: ${data['Error Message']}`);
      }

      if (data['Note']) {
        throw new Error(`Alpha Vantage Rate Limit: ${data['Note']}`);
      }

      // Time Series 데이터 추출
      const timeSeriesKey = Object.keys(data).find(key =>
        key.startsWith('Time Series')
      );

      if (!timeSeriesKey) {
        // .KS로 실패했으면 .KQ 시도 (한국 주식인 경우)
        if (formattedSymbol.endsWith('.KS')) {
          const kqSymbol = formattedSymbol.replace('.KS', '.KQ');
          console.log(`🔄 Retrying with ${kqSymbol}...`);
          return this.getIntradayCandles(kqSymbol, limit);
        }
        throw new Error(`No time series data available for ${formattedSymbol}`);
      }

      const timeSeries = data[timeSeriesKey] as AlphaVantageTimeSeriesData;
      const candles: CandleData[] = [];

      // 시간순으로 정렬된 캔들 데이터 생성
      const timestamps = Object.keys(timeSeries).sort().reverse(); // 최신순

      for (let i = 0; i < Math.min(timestamps.length, limit); i++) {
        const timestamp = timestamps[i];
        const candle = timeSeries[timestamp];

        candles.push({
          timestamp: new Date(timestamp),
          open: parseFloat(candle['1. open']),
          high: parseFloat(candle['2. high']),
          low: parseFloat(candle['3. low']),
          close: parseFloat(candle['4. close']),
          volume: parseInt(candle['5. volume']),
        });
      }

      console.log(`✅ Fetched ${candles.length} candles for ${formattedSymbol}`);
      return candles;
    } catch (error) {
      console.error(`❌ Error fetching candles for ${formattedSymbol}:`, error);
      throw error;
    }
  }

  /**
   * API 사용 통계
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: new Date(this.lastRequestTime),
      apiKeyConfigured: !!this.apiKey && this.apiKey !== 'your_alpha_vantage_api_key_here',
    };
  }
}

// Singleton instance
const alphaVantageService = new AlphaVantageService();
export default alphaVantageService;
