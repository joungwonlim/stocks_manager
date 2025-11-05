/**
 * 주식 투자 전략 설정
 *
 * AI 분석 시 활용할 다양한 투자 전략들을 정의합니다.
 */

export interface TradingStrategyConfig {
  code: string;
  nameKo: string;
  nameEn: string;
  category: 'fundamental' | 'technical' | 'portfolio' | 'derivatives';
  description: string;
  keyIndicators: string[];
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: 'short' | 'medium' | 'long';
  suitableFor: string[];
  isActive: boolean;
  priority: number;
}

export const TRADING_STRATEGIES: TradingStrategyConfig[] = [
  // ============================================
  // 기본적 분석 (Fundamental Analysis) 기반 전략
  // ============================================
  {
    code: 'value_investing',
    nameKo: '가치 투자',
    nameEn: 'Value Investing',
    category: 'fundamental',
    description: '기업의 내재 가치보다 주가가 저평가되었을 때 매수하여 장기 보유하는 가장 기본적인 투자 철학. 워렌 버핏으로 대표되는 전략으로, PER, PBR, PCR 등 밸류에이션 지표를 활용하여 저평가된 우량 기업을 발굴합니다.',
    keyIndicators: ['PER', 'PBR', 'PCR', 'EV/EBITDA', 'ROE', 'ROA', 'Debt Ratio', 'Current Ratio'],
    riskLevel: 'low',
    timeHorizon: 'long',
    suitableFor: ['장기 투자자', '안정 지향 투자자', '펀더멘털 중시 투자자'],
    isActive: true,
    priority: 10,
  },
  {
    code: 'growth_investing',
    nameKo: '성장 투자',
    nameEn: 'Growth Investing',
    category: 'fundamental',
    description: '현재의 실적보다 미래의 폭발적인 성장 잠재력을 보고 투자하는 전략. 혁신 기술주, 신산업 섹터 등에 적용되며 높은 변동성을 수반합니다. 매출 성장률, 영업이익 증가율 등을 중점적으로 분석합니다.',
    keyIndicators: ['Revenue Growth', 'EPS Growth', 'Operating Margin', 'Forward P/E', 'PEG Ratio'],
    riskLevel: 'high',
    timeHorizon: 'medium',
    suitableFor: ['적극적 투자자', '성장주 선호 투자자', '높은 변동성 수용 투자자'],
    isActive: true,
    priority: 9,
  },
  {
    code: 'dividend_growth',
    nameKo: '배당 성장 투자',
    nameEn: 'Dividend Growth Investing',
    category: 'fundamental',
    description: '꾸준히 배당금을 인상해 온 기업에 투자하여 안정적인 배당 수익과 자본 차익을 동시에 추구하는 전략. 배당 수익률, 배당 성장률, 배당 지속성 등을 분석합니다.',
    keyIndicators: ['Dividend Yield', 'Dividend Growth Rate', 'Payout Ratio', 'Dividend Coverage Ratio', 'Free Cash Flow'],
    riskLevel: 'low',
    timeHorizon: 'long',
    suitableFor: ['소득 투자자', '은퇴 준비 투자자', '안정성 중시 투자자'],
    isActive: true,
    priority: 8,
  },

  // ============================================
  // 기술적 분석 (Technical Analysis) 기반 전략
  // ============================================
  {
    code: 'trend_following',
    nameKo: '추세 추종 전략',
    nameEn: 'Trend Following',
    category: 'technical',
    description: '주가가 형성된 추세(상승 또는 하락)를 따라 매매하며, 추세가 전환되기 전까지 포지션을 유지하는 전략. 이동평균선, 추세선, MACD 등을 활용하여 추세를 파악합니다.',
    keyIndicators: ['SMA20', 'SMA50', 'SMA200', 'EMA12', 'EMA26', 'MACD', 'ADX', 'Trend Line'],
    riskLevel: 'medium',
    timeHorizon: 'medium',
    suitableFor: ['트렌드 트레이더', '중기 투자자', '기술적 분석 선호 투자자'],
    isActive: true,
    priority: 9,
  },
  {
    code: 'momentum_investing',
    nameKo: '모멘텀 투자',
    nameEn: 'Momentum Investing',
    category: 'technical',
    description: '최근 가장 강한 상승세를 보인 종목이 그 상승세를 이어갈 것이라는 가정 하에 투자하는 전략. 단기적인 시장 힘(모멘텀)을 활용하며, RSI, 거래량, 상대 강도 등을 분석합니다.',
    keyIndicators: ['RSI', 'Stochastic', 'Volume', 'Rate of Change (ROC)', 'Relative Strength'],
    riskLevel: 'high',
    timeHorizon: 'short',
    suitableFor: ['단기 트레이더', '적극적 투자자', '고위험 수용 투자자'],
    isActive: true,
    priority: 8,
  },
  {
    code: 'mean_reversion',
    nameKo: '역추세/평균 회귀 전략',
    nameEn: 'Mean Reversion',
    category: 'technical',
    description: '주가가 일시적으로 과매수/과매도 영역에 진입하여 평균 수준으로 되돌아갈 것을 기대하고 매매하는 전략. 볼린저 밴드, RSI 과매수/과매도 등을 활용합니다.',
    keyIndicators: ['Bollinger Bands', 'RSI', 'Stochastic', 'CCI', 'Williams %R'],
    riskLevel: 'medium',
    timeHorizon: 'short',
    suitableFor: ['역발상 투자자', '단기 트레이더', '변동성 활용 투자자'],
    isActive: true,
    priority: 7,
  },

  // ============================================
  // 포트폴리오 및 리스크 관리 전략
  // ============================================
  {
    code: 'asset_allocation',
    nameKo: '자산 배분 전략',
    nameEn: 'Asset Allocation',
    category: 'portfolio',
    description: '투자 자금을 주식, 채권, 현금, 부동산 등 서로 다른 자산군에 나누어 투자하여 시장 충격에 대한 위험을 분산하는 전략. 상관관계 분석, 리밸런싱 등을 통해 최적 포트폴리오를 구성합니다.',
    keyIndicators: ['Correlation', 'Beta', 'Sharpe Ratio', 'Portfolio Variance', 'Diversification Ratio'],
    riskLevel: 'low',
    timeHorizon: 'long',
    suitableFor: ['보수적 투자자', '장기 투자자', '리스크 관리 중시 투자자'],
    isActive: true,
    priority: 8,
  },
  {
    code: 'dollar_cost_averaging',
    nameKo: '분할 매수/매도',
    nameEn: 'Dollar-Cost Averaging',
    category: 'portfolio',
    description: '매매 시점을 나누어 정기적으로 일정 금액을 투자하는 방법. 감정적인 매매를 줄이고 매수 단가 평균 위험을 낮춥니다. 시장 타이밍 리스크를 회피하는 효과적인 방법입니다.',
    keyIndicators: ['Average Cost', 'Investment Period', 'Market Volatility', 'Total Investment Amount'],
    riskLevel: 'low',
    timeHorizon: 'long',
    suitableFor: ['초보 투자자', '정기 투자자', '감정 제어 필요 투자자'],
    isActive: true,
    priority: 7,
  },

  // ============================================
  // 파생 상품 활용 전략 (옵션/선물)
  // ============================================
  {
    code: 'covered_call',
    nameKo: '옵션 커버드 콜',
    nameEn: 'Covered Call',
    category: 'derivatives',
    description: '이미 보유한 주식을 담보로 콜 옵션을 매도하여, 주가가 크게 오르지 않을 때 추가적인 옵션 프리미엄 수익을 얻는 전략. 횡보장이나 약한 상승장에서 유리합니다.',
    keyIndicators: ['Option Premium', 'Strike Price', 'Implied Volatility', 'Time Decay (Theta)', 'Annualized Return'],
    riskLevel: 'medium',
    timeHorizon: 'short',
    suitableFor: ['옵션 경험자', '수익 증대 투자자', '보유 주식 활용 투자자'],
    isActive: true,
    priority: 6,
  },
  {
    code: 'wheel_strategy',
    nameKo: '휠 전략',
    nameEn: 'Wheel Strategy',
    category: 'derivatives',
    description: '옵션 매도(풋)와 주식 인수, 그리고 옵션 매도(콜)를 반복적으로 순환하며 지속적인 프리미엄 수익을 창출하는 옵션 기반 전략. 횡보장에서 가장 효과적입니다.',
    keyIndicators: ['Put Premium', 'Call Premium', 'Assignment Risk', 'Implied Volatility', 'Return on Capital'],
    riskLevel: 'medium',
    timeHorizon: 'short',
    suitableFor: ['고급 옵션 투자자', '적극적 수익 추구 투자자', '시간 투자 가능 투자자'],
    isActive: true,
    priority: 5,
  },
];

/**
 * 카테고리별 전략 조회
 */
export function getStrategiesByCategory(
  category: 'fundamental' | 'technical' | 'portfolio' | 'derivatives'
): TradingStrategyConfig[] {
  return TRADING_STRATEGIES.filter(
    strategy => strategy.isActive && strategy.category === category
  );
}

/**
 * 리스크 레벨별 전략 조회
 */
export function getStrategiesByRiskLevel(
  riskLevel: 'low' | 'medium' | 'high'
): TradingStrategyConfig[] {
  return TRADING_STRATEGIES.filter(
    strategy => strategy.isActive && strategy.riskLevel === riskLevel
  );
}

/**
 * 투자 기간별 전략 조회
 */
export function getStrategiesByTimeHorizon(
  timeHorizon: 'short' | 'medium' | 'long'
): TradingStrategyConfig[] {
  return TRADING_STRATEGIES.filter(
    strategy => strategy.isActive && strategy.timeHorizon === timeHorizon
  );
}

/**
 * 활성화된 모든 전략 조회 (우선순위 순)
 */
export function getActiveStrategies(): TradingStrategyConfig[] {
  return TRADING_STRATEGIES
    .filter(strategy => strategy.isActive)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * 전략 코드로 조회
 */
export function getStrategyByCode(code: string): TradingStrategyConfig | undefined {
  return TRADING_STRATEGIES.find(strategy => strategy.code === code);
}
