/**
 * 뉴스 소스 설정
 *
 * 수집 방법:
 * - RSS: RSS 피드를 통한 자동 수집 (가장 간단하고 안정적)
 * - API: 공식 Open API 사용 (인증 필요, 안정적)
 * - SCRAPING: 웹 스크래핑 (robots.txt 확인 필요, 불안정)
 */

export interface NewsSourceConfig {
  name: string;
  url: string;
  category: 'disclosure' | 'news' | 'report' | 'research' | 'technical' | 'official';
  subcategory: string;
  collectionMethod: 'rss' | 'api' | 'scraping';
  rssUrl?: string;
  apiEndpoint?: string;
  apiKeyRequired?: boolean;
  language: 'ko' | 'en';
  country: 'KR' | 'US';
  collectionFrequency: 'realtime' | 'hourly' | 'daily';
  isActive: boolean;
  priority: number; // 1-10, 높을수록 중요
  notes?: string;
}

export const NEWS_SOURCES: NewsSourceConfig[] = [
  // ============================================
  // 필수 공시/공식 정보 (최우선)
  // ============================================
  {
    name: '금융감독원 전자공시시스템 (DART)',
    url: 'https://dart.fss.or.kr/',
    category: 'disclosure',
    subcategory: '공시',
    collectionMethod: 'api',
    apiEndpoint: 'https://opendart.fss.or.kr/api',
    apiKeyRequired: true,
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'hourly',
    isActive: true,
    priority: 10,
    notes: 'DART Open API 사용 (무료, 인증키 필요). 상장기업 공시 정보',
  },
  {
    name: '한국거래소 (KRX)',
    url: 'https://data.krx.co.kr/',
    category: 'official',
    subcategory: '거래소정보',
    collectionMethod: 'api',
    apiEndpoint: 'http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd',
    apiKeyRequired: false,
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'daily',
    isActive: true,
    priority: 9,
    notes: 'KRX 정보데이터시스템. 시장통계, 종목정보',
  },
  {
    name: '금융위원회',
    url: 'https://www.fsc.go.kr/',
    category: 'official',
    subcategory: '정책',
    collectionMethod: 'rss',
    rssUrl: 'https://www.fsc.go.kr/comm/getRss.do?bbsId=BBS0048',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'daily',
    isActive: true,
    priority: 8,
    notes: '금융정책, 규제 관련 보도자료',
  },
  {
    name: '한국은행',
    url: 'https://www.bok.or.kr/',
    category: 'official',
    subcategory: '통화정책',
    collectionMethod: 'rss',
    rssUrl: 'https://www.bok.or.kr/portal/bbs/B0000216/rss.do',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'daily',
    isActive: true,
    priority: 8,
    notes: '금리, 통화정책, 경제전망',
  },

  // ============================================
  // 주요 뉴스 포털 (실시간 뉴스)
  // ============================================
  {
    name: '네이버 금융',
    url: 'https://finance.naver.com/',
    category: 'news',
    subcategory: '종합뉴스',
    collectionMethod: 'rss',
    rssUrl: 'https://finance.naver.com/news/news_list.nhn?mode=LSS2D&section_id=101&section_id2=258&type=rss',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'hourly',
    isActive: true,
    priority: 9,
    notes: '국내 증시 뉴스, 종목 뉴스',
  },
  {
    name: '다음 금융',
    url: 'https://finance.daum.net/',
    category: 'news',
    subcategory: '종합뉴스',
    collectionMethod: 'scraping',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'hourly',
    isActive: false, // 초기에는 비활성화
    priority: 7,
    notes: 'RSS 없음. 스크래핑 필요',
  },
  {
    name: '연합뉴스 경제',
    url: 'https://www.yna.co.kr/economy',
    category: 'news',
    subcategory: '경제뉴스',
    collectionMethod: 'rss',
    rssUrl: 'https://www.yna.co.kr/rss/economy.xml',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'hourly',
    isActive: true,
    priority: 9,
    notes: '속보성 강한 경제 뉴스',
  },
  {
    name: '매일경제',
    url: 'https://www.mk.co.kr/',
    category: 'news',
    subcategory: '경제신문',
    collectionMethod: 'rss',
    rssUrl: 'https://www.mk.co.kr/rss/30100041/',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'hourly',
    isActive: true,
    priority: 8,
    notes: '증시 뉴스, 기업 분석',
  },
  {
    name: '한국경제신문',
    url: 'https://www.hankyung.com/',
    category: 'news',
    subcategory: '경제신문',
    collectionMethod: 'rss',
    rssUrl: 'https://www.hankyung.com/feed/stock',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'hourly',
    isActive: true,
    priority: 8,
    notes: '증시, 기업, 산업 뉴스',
  },
  {
    name: '팍스넷 (Paxnet)',
    url: 'https://www.paxnet.co.kr/',
    category: 'news',
    subcategory: '증권전문',
    collectionMethod: 'scraping',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'hourly',
    isActive: false,
    priority: 7,
    notes: '증권 전문 뉴스. RSS 제한적',
  },

  // ============================================
  // 해외 뉴스
  // ============================================
  {
    name: 'Bloomberg',
    url: 'https://www.bloomberg.com/',
    category: 'news',
    subcategory: '글로벌뉴스',
    collectionMethod: 'rss',
    rssUrl: 'https://feeds.bloomberg.com/markets/news.rss',
    language: 'en',
    country: 'US',
    collectionFrequency: 'hourly',
    isActive: true,
    priority: 9,
    notes: '글로벌 금융시장 뉴스',
  },
  {
    name: 'Reuters',
    url: 'https://www.reuters.com/',
    category: 'news',
    subcategory: '글로벌뉴스',
    collectionMethod: 'rss',
    rssUrl: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
    language: 'en',
    country: 'US',
    collectionFrequency: 'hourly',
    isActive: true,
    priority: 9,
    notes: '속보성 강한 글로벌 뉴스',
  },
  {
    name: 'Investing.com Korea',
    url: 'https://kr.investing.com/',
    category: 'news',
    subcategory: '글로벌뉴스',
    collectionMethod: 'rss',
    rssUrl: 'https://kr.investing.com/rss/news.rss',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'hourly',
    isActive: true,
    priority: 8,
    notes: '글로벌 시장 뉴스 한글 제공',
  },

  // ============================================
  // 리포트 통합 (유료/제한적)
  // ============================================
  {
    name: '한경 컨센서스',
    url: 'http://consensus.hankyung.com/',
    category: 'report',
    subcategory: '통합리포트',
    collectionMethod: 'scraping',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'daily',
    isActive: false,
    priority: 7,
    notes: '증권사 리포트 통합. 일부 무료, 대부분 유료',
  },
  {
    name: 'FnGuide',
    url: 'https://www.fnguide.com/',
    category: 'report',
    subcategory: '데이터/리포트',
    collectionMethod: 'api',
    apiKeyRequired: true,
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'daily',
    isActive: false,
    priority: 6,
    notes: '유료 서비스. API 제공하나 비용 발생',
  },

  // ============================================
  // 증권사 리서치 (제한적 - 로그인 필요)
  // ============================================
  {
    name: '미래에셋증권 리서치',
    url: 'https://securities.miraeasset.com/',
    category: 'research',
    subcategory: '증권사리서치',
    collectionMethod: 'scraping',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'daily',
    isActive: false,
    priority: 5,
    notes: '로그인 필요. 초기 단계에서는 제외',
  },
  {
    name: 'NH투자증권 리서치',
    url: 'https://www.nhqv.com/',
    category: 'research',
    subcategory: '증권사리서치',
    collectionMethod: 'scraping',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'daily',
    isActive: false,
    priority: 5,
    notes: '로그인 필요. 초기 단계에서는 제외',
  },
  {
    name: '삼성증권 리서치',
    url: 'https://www.samsungpop.com/',
    category: 'research',
    subcategory: '증권사리서치',
    collectionMethod: 'scraping',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'daily',
    isActive: false,
    priority: 5,
    notes: '로그인 필요. 초기 단계에서는 제외',
  },
  {
    name: '한국투자증권 리서치',
    url: 'https://www.truefriend.com/',
    category: 'research',
    subcategory: '증권사리서치',
    collectionMethod: 'scraping',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'daily',
    isActive: false,
    priority: 5,
    notes: '로그인 필요. 초기 단계에서는 제외',
  },
  {
    name: 'KB증권 리서치',
    url: 'https://www.kbsec.com/',
    category: 'research',
    subcategory: '증권사리서치',
    collectionMethod: 'scraping',
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'daily',
    isActive: false,
    priority: 5,
    notes: '로그인 필요. 초기 단계에서는 제외',
  },

  // ============================================
  // 기술적 분석 (차트 데이터)
  // ============================================
  {
    name: 'TradingView',
    url: 'https://kr.tradingview.com/',
    category: 'technical',
    subcategory: '차트분석',
    collectionMethod: 'api',
    apiKeyRequired: true,
    language: 'ko',
    country: 'KR',
    collectionFrequency: 'realtime',
    isActive: false,
    priority: 6,
    notes: 'WebSocket API 제공. 유료. 현재 Yahoo Finance 사용 중',
  },
  {
    name: 'FINVIZ',
    url: 'https://finviz.com/',
    category: 'technical',
    subcategory: '차트분석',
    collectionMethod: 'scraping',
    language: 'en',
    country: 'US',
    collectionFrequency: 'daily',
    isActive: false,
    priority: 5,
    notes: '미국 주식 전용. 스크린 스크래핑 제한적',
  },
];

/**
 * 우선순위별 활성화된 뉴스 소스 목록
 */
export function getActiveNewsSources(): NewsSourceConfig[] {
  return NEWS_SOURCES
    .filter(source => source.isActive)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * 수집 방법별 뉴스 소스 목록
 */
export function getNewsSourcesByMethod(method: 'rss' | 'api' | 'scraping'): NewsSourceConfig[] {
  return NEWS_SOURCES.filter(
    source => source.isActive && source.collectionMethod === method
  );
}

/**
 * 카테고리별 뉴스 소스 목록
 */
export function getNewsSourcesByCategory(
  category: 'disclosure' | 'news' | 'report' | 'research' | 'technical' | 'official'
): NewsSourceConfig[] {
  return NEWS_SOURCES.filter(
    source => source.isActive && source.category === category
  );
}

/**
 * Phase 1 구현: RSS 기반 뉴스 소스만 우선 활성화
 */
export function getPhase1Sources(): NewsSourceConfig[] {
  return getNewsSourcesByMethod('rss');
}

/**
 * Phase 2 구현: DART API 추가
 */
export function getPhase2Sources(): NewsSourceConfig[] {
  return NEWS_SOURCES.filter(
    source =>
      source.isActive &&
      (source.collectionMethod === 'rss' ||
       (source.collectionMethod === 'api' && source.name.includes('DART')))
  );
}
