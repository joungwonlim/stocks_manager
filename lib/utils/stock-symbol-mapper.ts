/**
 * 한국 주식 이름을 심볼로 변환하는 매핑 테이블
 * Yahoo Finance 형식: 종목코드.KS (KOSPI) 또는 .KQ (KOSDAQ)
 */

export const KOREAN_STOCK_NAMES: Record<string, string> = {
  // KOSPI
  '삼성전자': '005930.KS',
  '삼성전자우': '005935.KS',
  'SK하이닉스': '000660.KS',
  'NAVER': '035420.KS',
  '네이버': '035420.KS',
  'LG화학': '051910.KS',
  '카카오': '035720.KS',
  '현대차': '005380.KS',
  '현대자동차': '005380.KS',
  'LG전자': '066570.KS',
  '삼성바이오로직스': '207940.KS',
  '삼성SDI': '006400.KS',
  '기아': '000270.KS',
  'POSCO홀딩스': '005490.KS',
  '포스코홀딩스': '005490.KS',
  '신한지주': '055550.KS',
  'KB금융': '105560.KS',
  '셀트리온': '068270.KS',
  'LG생활건강': '051900.KS',
  '삼성물산': '028260.KS',
  '현대모비스': '012330.KS',

  // KOSDAQ
  '에코프로비엠': '247540.KQ',
  '에코프로': '086520.KQ',
  '셀트리온헬스케어': '091990.KQ',
  '엔씨소프트': '036570.KQ',
  'NC소프트': '036570.KQ',
  '펄어비스': '263750.KQ',
  '카카오게임즈': '293490.KQ',
  '크래프톤': '259960.KQ',
};

/**
 * 미국 주식 이름 매핑
 */
export const US_STOCK_NAMES: Record<string, string> = {
  'Apple': 'AAPL',
  '애플': 'AAPL',
  'Microsoft': 'MSFT',
  '마이크로소프트': 'MSFT',
  'Google': 'GOOGL',
  '구글': 'GOOGL',
  'Alphabet': 'GOOGL',
  '알파벳': 'GOOGL',
  'Amazon': 'AMZN',
  '아마존': 'AMZN',
  'Tesla': 'TSLA',
  '테슬라': 'TSLA',
  'NVIDIA': 'NVDA',
  '엔비디아': 'NVDA',
  'Meta': 'META',
  '메타': 'META',
  'Facebook': 'META',
  '페이스북': 'META',
  'Netflix': 'NFLX',
  '넷플릭스': 'NFLX',
};

/**
 * 주식 이름 또는 심볼을 정규화된 심볼로 변환
 * @param input - 주식 이름 또는 심볼
 * @param removeExchange - .KS, .KQ 같은 거래소 접미사 제거 여부 (기본값: true)
 */
export function normalizeStockSymbol(input: string, removeExchange: boolean = true): string {
  const trimmed = input.trim();

  // 이미 심볼 형태인지 확인 (대문자로)
  const upperInput = trimmed.toUpperCase();

  // 1. 한국 주식 코드 형태인 경우 (예: 005930.KS, 005930)
  if (/^\d{6}(\.(KS|KQ))?$/.test(upperInput)) {
    // .KS, .KQ 제거 (데이터베이스에는 접미사 없이 저장)
    if (removeExchange) {
      return upperInput.replace(/\.(KS|KQ)$/, '');
    }
    // .KS/.KQ가 없으면 그대로 반환
    if (!/\.(KS|KQ)$/.test(upperInput)) {
      return upperInput;
    }
    return upperInput;
  }

  // 2. 이미 올바른 미국 주식 심볼 형태인 경우 (예: AAPL)
  if (/^[A-Z]{1,5}$/.test(upperInput)) {
    return upperInput;
  }

  // 3. 한국 주식 이름 검색
  if (KOREAN_STOCK_NAMES[trimmed]) {
    const symbol = KOREAN_STOCK_NAMES[trimmed];
    // .KS, .KQ 제거
    return removeExchange ? symbol.replace(/\.(KS|KQ)$/, '') : symbol;
  }

  // 4. 미국 주식 이름 검색 (대소문자 무시)
  const usSymbol = US_STOCK_NAMES[trimmed];
  if (usSymbol) {
    return usSymbol;
  }

  // 5. 그대로 반환 (대문자로)
  return upperInput;
}

/**
 * 여러 주식 이름/심볼을 한 번에 정규화
 */
export function normalizeStockSymbols(inputs: string[]): string[] {
  return inputs.map(normalizeStockSymbol);
}

/**
 * 주식 이름으로 검색 (자동완성용)
 */
export function searchStockNames(query: string): Array<{ name: string; symbol: string }> {
  const lowerQuery = query.toLowerCase();
  const results: Array<{ name: string; symbol: string }> = [];

  // 한국 주식 검색
  for (const [name, symbol] of Object.entries(KOREAN_STOCK_NAMES)) {
    if (name.toLowerCase().includes(lowerQuery) || symbol.toLowerCase().includes(lowerQuery)) {
      results.push({ name, symbol });
    }
  }

  // 미국 주식 검색
  for (const [name, symbol] of Object.entries(US_STOCK_NAMES)) {
    if (name.toLowerCase().includes(lowerQuery) || symbol.toLowerCase().includes(lowerQuery)) {
      results.push({ name, symbol });
    }
  }

  return results.slice(0, 10); // 최대 10개 결과만 반환
}
