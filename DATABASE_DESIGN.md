# 데이터베이스 설계 문서

## 📊 시스템 개요

**목적**: 실시간 주가 데이터 수집 및 AI 기반 매매 신호 생성 시스템

**핵심 기능**:
1. ✅ 1분/5분 단위 실시간 주가 캔들 데이터 수집 및 저장
2. ✅ 기술적 지표 (RSI, MACD, 볼린저 밴드 등) 계산 및 저장
3. ✅ Claude AI 기반 차트 분석 및 추천
4. ✅ 매수가, 손절가, 익절가, 목표가 자동 계산
5. ✅ 매매 신호 생성 및 알림
6. ✅ 포트폴리오 관리 및 거래 내역 추적

---

## 🗂️ 데이터베이스 구조

### 1️⃣ **기본 테이블**

#### `users` - 사용자
```sql
- id: 사용자 고유 ID
- email: 이메일 (고유)
- name: 이름
- created_at, updated_at
```

#### `portfolios` - 포트폴리오
```sql
- id: 포트폴리오 ID
- user_id: 사용자 ID (FK)
- name: 포트폴리오 이름
- description: 설명
- created_at, updated_at
```

#### `stocks` - 주식 정보
```sql
- id: 주식 ID
- symbol: 티커 심볼 (AAPL, 005930 등) - 고유
- name: 종목명
- market: 시장 (KOSPI, KOSDAQ, NASDAQ 등)
- currency: 통화 (KRW, USD)
- exchange: 거래소 (KRX, NYSE 등)
- sector: 섹터 (기술, 금융 등)
- is_active: 활성화 여부
- created_at, updated_at
```

---

### 2️⃣ **실시간 주가 데이터**

#### `price_candles` - 캔들 차트 데이터 ⭐
```sql
- id: 캔들 ID
- stock_id: 주식 ID (FK)
- timeframe: 시간프레임 ('1m', '5m', '15m', '1h', '1d')
- timestamp: 캔들 시작 시간
- open: 시가
- high: 고가
- low: 저가
- close: 종가
- volume: 거래량
- created_at

인덱스:
- UNIQUE INDEX: (stock_id, timeframe, timestamp)
- INDEX: (timestamp)
```

**사용 예시**:
- 1분봉: 실시간 분석용
- 5분봉: 단기 트레이딩 신호
- 1시간봉: 중기 추세 분석
- 일봉: 장기 추세 분석

#### `technical_indicators` - 기술적 지표 ⭐
```sql
- id: 지표 ID
- stock_id: 주식 ID (FK)
- timeframe: 시간프레임
- timestamp: 시간

이동평균선:
- sma_20, sma_50, sma_200: 단순이동평균
- ema_12, ema_26: 지수이동평균

RSI:
- rsi_14: 14일 RSI (0-100)

MACD:
- macd: MACD 라인
- macd_signal: 시그널 라인
- macd_histogram: 히스토그램

볼린저 밴드:
- bb_upper: 상단 밴드
- bb_middle: 중간 밴드
- bb_lower: 하단 밴드

스토캐스틱:
- stoch_k: %K
- stoch_d: %D

인덱스:
- UNIQUE INDEX: (stock_id, timeframe, timestamp)
```

**분석 활용**:
- RSI > 70: 과매수 (매도 고려)
- RSI < 30: 과매도 (매수 고려)
- MACD 골든크로스: 매수 신호
- MACD 데드크로스: 매도 신호
- 볼린저 밴드 하단 터치: 매수 기회
- 볼린저 밴드 상단 터치: 매도 기회

---

### 3️⃣ **AI 분석 및 신호**

#### `ai_analysis` - Claude AI 분석 결과 ⭐
```sql
- id: 분석 ID
- stock_id: 주식 ID (FK)
- analysis_type: 분석 유형 ('technical', 'trend', 'pattern', 'recommendation')
- timeframe: 시간프레임
- timestamp: 분석 시간

AI 분석:
- sentiment: 시장 심리 ('bullish', 'bearish', 'neutral')
- confidence: 신뢰도 (0-100%)
- analysis: 상세 분석 내용 (텍스트)
- reasoning: 분석 근거 (JSON)

추천:
- recommendation: 추천 ('strong_buy', 'buy', 'hold', 'sell', 'strong_sell')

인덱스:
- INDEX: (stock_id, timestamp)
```

**Claude AI가 분석하는 내용**:
1. 기술적 지표 종합 분석
2. 차트 패턴 인식 (헤드앤숄더, 삼각수렴 등)
3. 추세 강도 평가
4. 지지/저항선 분석
5. 매수/매도 타이밍 추천

#### `trading_signals` - 매매 신호 ⭐⭐⭐
```sql
- id: 신호 ID
- stock_id: 주식 ID (FK)
- ai_analysis_id: AI 분석 ID (FK)

신호 정보:
- signal_type: 신호 유형 ('buy', 'sell', 'hold')
- signal_strength: 신호 강도 ('strong', 'moderate', 'weak')

가격 정보:
- current_price: 현재가
- entry_price: 진입 추천가

목표가 및 손절가:
- target_price_1: 1차 목표가 (예: +5%)
- target_price_2: 2차 목표가 (예: +10%)
- target_price_3: 3차 목표가 (예: +15%)
- stop_loss_price: 손절가 (예: -3%)

수익률:
- expected_return: 기대 수익률 (%)
- risk_reward_ratio: 위험/보상 비율 (예: 1:3)

상태:
- status: 신호 상태 ('active', 'executed', 'cancelled', 'expired')
- expires_at: 만료 시간
- reason: 신호 발생 이유

인덱스:
- INDEX: (stock_id, status)
- INDEX: (timestamp)
```

**신호 생성 로직 예시**:
```
매수 신호 조건:
1. RSI < 35 (과매도)
2. MACD 골든크로스
3. 가격이 볼린저 밴드 하단 근처
4. AI 신뢰도 > 70%
→ 신호: STRONG_BUY
→ 진입가: 현재가
→ 1차 목표: +5%, 2차: +10%, 3차: +15%
→ 손절: -3%
```

#### `price_targets` - 목표가 관리
```sql
- id: 목표가 ID
- stock_id: 주식 ID (FK)
- trading_signal_id: 매매 신호 ID (FK)
- target_type: 목표 유형 ('take_profit', 'stop_loss', 'entry')
- target_price: 목표 가격
- current_price: 현재 가격
- percentage: 현재가 대비 % 차이
- status: 상태 ('pending', 'reached', 'cancelled')
- reached_at: 도달 시간

인덱스:
- INDEX: (stock_id, status)
```

---

### 4️⃣ **감시 및 알림**

#### `watchlist` - 관심 종목
```sql
- id: 관심종목 ID
- user_id: 사용자 ID (FK)
- stock_id: 주식 ID (FK)
- priority: 우선순위 (0-10)
- notes: 메모
- enable_price_alert: 가격 알림 활성화
- enable_signal_alert: 신호 알림 활성화

인덱스:
- UNIQUE INDEX: (user_id, stock_id)
```

#### `alerts` - 알림
```sql
- id: 알림 ID
- user_id: 사용자 ID (FK)
- stock_id: 주식 ID (FK)
- trading_signal_id: 매매 신호 ID (FK)
- alert_type: 알림 유형 ('price_target', 'trading_signal', 'technical_indicator', 'ai_analysis')
- title: 제목
- message: 메시지
- priority: 우선순위 ('low', 'normal', 'high', 'urgent')
- is_read: 읽음 여부
- read_at: 읽은 시간

인덱스:
- INDEX: (user_id, is_read)
```

**알림 예시**:
- "삼성전자, 강력한 매수 신호 발생! 진입가: 75,000원"
- "AAPL, 1차 목표가 도달! (+5% 수익)"
- "비트코인, 손절가 근접 경고!"

---

### 5️⃣ **거래 관리**

#### `transactions` - 거래 내역
```sql
- id: 거래 ID
- portfolio_id: 포트폴리오 ID (FK)
- stock_id: 주식 ID (FK)
- trading_signal_id: 매매 신호 ID (FK) - 신호 기반 거래인 경우
- type: 거래 유형 ('buy', 'sell')
- quantity: 수량
- price: 거래 단가
- total_amount: 총 거래금액
- fee: 수수료
- transaction_date: 거래일시
- notes: 메모
```

#### `holdings` - 현재 보유 주식
```sql
- id: 보유 ID
- portfolio_id: 포트폴리오 ID (FK)
- stock_id: 주식 ID (FK)
- quantity: 보유 수량
- average_price: 평균 매입가
- total_invested: 총 투자금액
- updated_at: 업데이트 시간
```

---

## 🔄 데이터 흐름

### 실시간 분석 프로세스

```
1. 주가 데이터 수집
   └─> price_candles에 1분/5분 캔들 저장

2. 기술적 지표 계산
   └─> technical_indicators에 RSI, MACD 등 저장

3. Claude AI 분석
   └─> 캔들 데이터 + 기술적 지표 분석
   └─> ai_analysis에 분석 결과 저장

4. 매매 신호 생성
   └─> AI 분석 결과 기반 신호 생성
   └─> trading_signals에 저장
   └─> 매수가, 손절가, 익절가, 목표가 계산

5. 알림 발송
   └─> alerts 테이블에 알림 생성
   └─> 사용자에게 푸시/이메일 알림

6. 실제 거래 (선택)
   └─> transactions에 거래 기록
   └─> holdings 업데이트
```

---

## 📈 쿼리 최적화

### 인덱스 전략
1. **시계열 데이터**: (stock_id, timestamp) 복합 인덱스
2. **고유성 보장**: UNIQUE 인덱스로 중복 방지
3. **빠른 조회**: 자주 조회되는 컬럼에 인덱스

### 성능 고려사항
- 1분봉 데이터는 매우 빠르게 증가 (하루 390개/종목)
- 주기적으로 오래된 데이터 아카이빙 필요
- 실시간 쿼리는 최근 N일 데이터만 조회
- 집계 데이터는 캐싱 권장

---

## 🚀 다음 단계

### 구현할 기능:
1. ✅ 데이터베이스 스키마 완성
2. ⬜ 실시간 주가 API 연동 (Alpha Vantage, Yahoo Finance, 한투 API 등)
3. ⬜ 기술적 지표 계산 로직 구현
4. ⬜ Claude AI 분석 엔진 구현
5. ⬜ 매매 신호 생성 알고리즘
6. ⬜ 알림 시스템 (WebSocket, Server-Sent Events)
7. ⬜ 대시보드 UI 구현

---

## 💡 기술 스택

- **Database**: PostgreSQL (NeonDB)
- **ORM**: Drizzle ORM
- **Real-time**: WebSocket / SSE
- **AI**: Claude API (Anthropic)
- **Stock API**: Yahoo Finance / Alpha Vantage / 한국투자증권 API
- **Backend**: Next.js API Routes
- **Frontend**: Next.js 14 + React
- **Charts**: Lightweight Charts (TradingView)

---

## 📊 예상 데이터 규모

**1개 종목 기준 (1년)**:
- 1분봉: 78,000개 (250일 × 6.5시간 × 60분)
- 5분봉: 15,600개
- 기술적 지표: 78,000개 (1분봉 기준)
- AI 분석: ~3,000개 (5분마다)
- 매매 신호: ~100개 (선별된 신호만)

**100개 종목 추적시**:
- 약 780만개의 1분봉 데이터/년
- PostgreSQL + 인덱스로 충분히 처리 가능
- Neon의 무료 플랜: 0.5GB (작은 규모 테스트용)
- 프로덕션: 유료 플랜 권장
