# 🚀 주식투자관리 AI 시스템 - 로컬 설치 가이드

## 📋 시스템 요구사항

- **Node.js**: v18.0.0 이상
- **npm**: v9.0.0 이상
- **Git**: 최신 버전

## 🔧 설치 방법

### 1. 리포지토리 클론

```bash
# GitHub에서 클론 (실제 리포지토리 URL로 변경)
git clone https://github.com/joungwonlim/stocks_manager.git

# 또는 특정 브랜치 클론
git clone -b claude/stock-investment-site-011CUpMYydks5QYaymZsfenv https://github.com/joungwonlim/stocks_manager.git

# 디렉토리 이동
cd stocks_manager
```

### 2. 의존성 패키지 설치

```bash
npm install
```

설치되는 주요 패키지:
- Next.js 16.0.1
- React 19
- TypeScript
- Tailwind CSS
- Shadcn/ui
- Drizzle ORM
- Better-SQLite3
- Anthropic AI SDK
- Recharts (차트 라이브러리)
- Lightweight-charts (TradingView 차트)

### 3. 환경 변수 설정

`.env.local` 파일이 이미 포함되어 있습니다:

```bash
# .env.local 내용 확인
cat .env.local
```

기본 내용:
```env
# SQLite Database Path (로컬 개발용)
DATABASE_PATH=./sqlite.db

# Claude AI API Key (선택사항)
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your_api_key_here
```

**Claude AI API 키 설정 (선택사항):**
- API 키가 없어도 Mock 데이터로 작동합니다
- 실제 AI 분석을 원하면 [Anthropic Console](https://console.anthropic.com/)에서 키 발급
- `ANTHROPIC_API_KEY=sk-ant-xxxxx` 형태로 변경

### 4. 데이터베이스 초기화

데이터베이스 파일(`sqlite.db`)이 이미 포함되어 있지만, 새로 생성하려면:

```bash
# 기존 데이터베이스 삭제 (선택사항)
rm -f sqlite.db sqlite.db-shm sqlite.db-wal

# 데이터베이스 스키마 생성
npm run db:push

# 초기 데이터 입력 (뉴스 소스, 투자 전략, 모의 주식 데이터)
npm run seed:all
```

**포함된 모의 데이터:**
- 5개 주요 한국 주식 (삼성전자, SK하이닉스, NAVER, LG화학, 카카오)
- 각 종목당 500개의 5분봉 캔들 데이터
- 22개 뉴스 소스
- 10개 투자 전략

### 5. 개발 서버 실행

```bash
npm run dev
```

서버가 시작되면:
- **로컬 URL**: http://localhost:3000
- **네트워크 URL**: http://[your-ip]:3000

## 🎯 주요 기능 사용법

### 1. 대시보드 접속

브라우저에서 http://localhost:3000/dashboard 접속

### 2. 주식 분석

1. **검색창에 종목명 또는 코드 입력**
   - 예: "삼성전자", "005930", "NAVER", "035420"

2. **"🔍 분석 시작" 버튼 클릭**

3. **3단계 자동 분석**:
   - 📊 주가 데이터 수집
   - 📈 기술적 지표 계산 (RSI, MACD, Bollinger Bands 등)
   - 🤖 AI 분석 (매수/매도 추천, 목표가 계산)

### 3. 차트 확인

분석 완료 후 자동으로 표시:
- **캔들스틱 차트**: 주가 움직임과 거래량
- **RSI 차트**: 과매수/과매도 확인
- **MACD 차트**: 매매 타이밍 신호
- **Stochastic 차트**: 추세 전환 포착
- **포트폴리오 차트**: 자산 배분 및 수익률

### 4. 알림 설정

AI 분석 결과에서:
- **"목표가 도달 시 알림 받기"**: 1차/2차/3차 목표가 알림 생성
- **"매매 신호 알림 설정"**: 진입가/손절가 알림 생성

## 📊 API 엔드포인트

시스템이 제공하는 주요 API:

### 주가 데이터
```bash
# 주가 데이터 조회
GET /api/stocks/[symbol]/price?timeframe=5m&limit=100

# 예시
curl http://localhost:3000/api/stocks/005930/price?timeframe=5m&limit=100
```

### 기술적 지표
```bash
# 지표 계산 및 조회
GET /api/stocks/[symbol]/indicators?timeframe=5m&calculate=true

# 예시
curl http://localhost:3000/api/stocks/005930/indicators?timeframe=5m&calculate=true
```

### AI 분석
```bash
# AI 분석 실행
POST /api/stocks/[symbol]/analyze
Content-Type: application/json

{
  "timeframe": "5m"
}

# 예시
curl -X POST http://localhost:3000/api/stocks/005930/analyze \
  -H "Content-Type: application/json" \
  -d '{"timeframe":"5m"}'
```

### 알림 관리
```bash
# 알림 목록 조회
GET /api/alerts?limit=10

# 알림 생성
POST /api/alerts
Content-Type: application/json

{
  "stockId": 1,
  "alertType": "target_price_1",
  "title": "삼성전자 목표가 도달",
  "message": "목표가에 도달했습니다",
  "priority": "high"
}

# 알림 읽음 처리
PATCH /api/alerts/[id]
Content-Type: application/json

{
  "isRead": true
}
```

## 🛠️ 개발 스크립트

```bash
# 개발 서버 실행 (Hot reload)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# TypeScript 타입 체크
npm run type-check

# 데이터베이스 스키마 푸시
npm run db:push

# 데이터베이스 스튜디오 (GUI)
npm run db:studio

# 뉴스 소스 시딩
npm run seed:news

# 투자 전략 시딩
npm run seed:strategies

# 모의 주식 데이터 시딩
npm run seed:mock

# 전체 데이터 시딩
npm run seed:all
```

## 📁 프로젝트 구조

```
stocks_manager/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── stocks/              # 주식 관련 API
│   │   │   └── [symbol]/
│   │   │       ├── price/       # 주가 데이터
│   │   │       ├── indicators/  # 기술적 지표
│   │   │       └── analyze/     # AI 분석
│   │   └── alerts/              # 알림 API
│   ├── dashboard/               # 대시보드 페이지
│   └── page.tsx                 # 홈페이지
├── components/                   # React 컴포넌트
│   ├── ui/                      # Shadcn/ui 컴포넌트
│   └── charts/                  # 차트 컴포넌트
│       ├── CandlestickChart.tsx # 캔들스틱 차트
│       ├── TechnicalIndicatorChart.tsx # 지표 차트
│       └── PortfolioChart.tsx   # 포트폴리오 차트
├── lib/                         # 라이브러리 및 유틸리티
│   ├── db/                      # 데이터베이스
│   │   ├── index.ts            # DB 연결
│   │   └── schema.ts           # 테이블 스키마
│   ├── services/                # 비즈니스 로직
│   │   ├── technical-indicators-service.ts
│   │   ├── stock-price-service.ts
│   │   └── alert-monitoring-service.ts
│   ├── scripts/                 # 데이터 시딩 스크립트
│   └── utils/                   # 유틸리티 함수
├── sqlite.db                    # SQLite 데이터베이스
├── .env.local                   # 환경 변수
├── package.json                 # 의존성 패키지
└── tsconfig.json               # TypeScript 설정
```

## 🎨 주요 기능

### ✅ 완성된 기능

1. **실시간 주가 분석**
   - 5분봉 캔들 차트
   - 거래량 분석
   - 500개 이상의 히스토리 데이터

2. **기술적 지표**
   - RSI (Relative Strength Index)
   - MACD (Moving Average Convergence Divergence)
   - Bollinger Bands
   - SMA/EMA (단순/지수 이동평균)
   - Stochastic Oscillator

3. **AI 투자 분석**
   - Claude AI 기반 종합 분석
   - 매수/매도/보유 추천
   - 진입가, 손절가, 목표가 계산
   - 기대 수익률 및 리스크 레벨 평가

4. **알림 시스템**
   - 목표가 도달 알림
   - 손절가 알림
   - 매매 신호 알림
   - 우선순위 관리 (normal/high)

5. **시각화 차트**
   - 캔들스틱 차트 (TradingView 스타일)
   - RSI/MACD/Stochastic 차트
   - 포트폴리오 수익률 차트
   - 자산 배분 파이 차트
   - 종목별 손익 바 차트

6. **포트폴리오 관리**
   - 보유 종목 현황
   - 수익률 추적
   - 자산 배분 분석

## 🔍 트러블슈팅

### 데이터베이스 오류
```bash
# 데이터베이스 재생성
rm -f sqlite.db sqlite.db-shm sqlite.db-wal
npm run db:push
npm run seed:all
```

### 패키지 설치 오류
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 포트 충돌
```bash
# 다른 포트로 실행
PORT=3001 npm run dev
```

### TypeScript 오류
```bash
# 타입 체크
npm run type-check

# 빌드 테스트
npm run build
```

## 📝 데이터베이스 스키마

주요 테이블:
- `stocks` - 주식 정보
- `price_candles` - 가격 캔들 데이터
- `technical_indicators` - 기술적 지표
- `ai_analysis` - AI 분석 결과
- `trading_signals` - 매매 신호
- `alerts` - 알림
- `news_sources` - 뉴스 소스
- `news_articles` - 뉴스 기사
- `trading_strategies` - 투자 전략

## 🌟 추가 개발 아이디어

- [ ] 실시간 주가 업데이트 (WebSocket)
- [ ] 백테스팅 시스템
- [ ] 포트폴리오 시뮬레이터
- [ ] 뉴스 감성 분석
- [ ] 멀티 종목 비교
- [ ] 모바일 앱 (React Native)

## 📞 지원

문제가 발생하면:
1. 콘솔 로그 확인 (브라우저 개발자 도구)
2. 서버 로그 확인 (터미널)
3. 데이터베이스 상태 확인 (`npm run db:studio`)

## 🎉 시작하기

```bash
# 1. 클론
git clone https://github.com/joungwonlim/stocks_manager.git
cd stocks_manager

# 2. 설치
npm install

# 3. 실행
npm run dev

# 4. 브라우저에서 http://localhost:3000/dashboard 접속
```

**즐거운 투자 분석 되세요!** 📈💰
