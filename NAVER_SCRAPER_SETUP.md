# Naver Finance Web Scraper 설정 가이드

## 개요

Alpha Vantage가 한국 주식을 지원하지 않아, 네이버 금융에서 직접 데이터를 스크래핑하는 방법으로 전환했습니다.

## 장점

✅ **한국 주식 완벽 지원** - 모든 KOSPI/KOSDAQ 종목
✅ **실시간 데이터** - 네이버 금융의 최신 데이터
✅ **API 키 불필요** - 무료로 사용
✅ **제한 없음** - API rate limit 걱정 없음
✅ **로컬 환경에서 작동** - 외부 API 서버 불필요

## 설치 방법

### 1. Puppeteer 설치

```bash
npm install puppeteer
```

설치 시 Chrome 브라우저가 자동으로 다운로드됩니다 (~300MB).

### 2. 테스트 실행

```bash
npx tsx test-naver-scraper.ts
```

성공하면 다음과 같이 표시됩니다:

```
🔍 Testing Naver Finance Scraper...

1️⃣  Testing Samsung Electronics (005930)...
📊 Scraping Naver Finance: https://finance.naver.com/item/main.naver?code=005930
✅ Scraped data for 삼성전자 (005930)
✅ Success!
   Name: 삼성전자
   Symbol: 005930
   Price: 71,200 KRW
   Open: 70,800 KRW
   High: 71,500 KRW
   Low: 70,600 KRW
   Volume: 12,345,678
   Change: 400.00 (0.56%)
   Timestamp: 2025-11-06T07:00:00.000Z

2️⃣  Testing NAVER (035420)...
✅ Success!
...

🎉 All tests passed!
```

## 작동 방식

1. **Puppeteer** - 헤드리스 Chrome 브라우저 자동화
2. **Naver Finance 접속** - `https://finance.naver.com/item/main.naver?code=005930`
3. **데이터 추출** - DOM에서 가격, 거래량 등 추출
4. **구조화된 데이터 반환** - StockQuote 인터페이스

## 스크래핑 코드

### lib/services/naver-finance-scraper.ts

주요 기능:
- `getStockQuote(code: string)` - 단일 종목 데이터 가져오기
- `getMultipleQuotes(codes: string[])` - 여러 종목 동시 스크래핑
- 자동 브라우저 관리 (초기화/종료)
- 에러 처리 및 재시도

### 사용 예시

```typescript
import naverFinanceScraper from './lib/services/naver-finance-scraper';

// 삼성전자 데이터 가져오기
const samsung = await naverFinanceScraper.getStockQuote('005930');
console.log(samsung.price); // 71200

// 여러 종목 가져오기
const quotes = await naverFinanceScraper.getMultipleQuotes([
  '005930', // 삼성전자
  '035420', // 네이버
  '000660', // SK하이닉스
]);

// 종료
await naverFinanceScraper.close();
```

## 다음 단계

테스트가 성공하면:
1. API 라우트를 업데이트하여 스크래퍼 사용
2. Mock 데이터 대신 실시간 데이터 사용
3. 기존 Alpha Vantage 코드 제거

## 주의사항

⚠️ **적절한 사용**
- Rate limiting 구현 (1초 간격)
- 과도한 요청 지양
- 네이버 금융 이용약관 준수

⚠️ **네트워크 요구사항**
- 인터넷 연결 필요
- 네이버 금융 접근 가능해야 함

## 문제 해결

### Puppeteer 설치 실패

```bash
# Chrome 다운로드 건너뛰기 (이미 설치된 Chrome 사용)
PUPPETEER_SKIP_DOWNLOAD=true npm install puppeteer

# 그 다음 환경변수로 Chrome 경로 지정
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome npx tsx test-naver-scraper.ts
```

### 스크래핑 실패

- 네이버 금융 페이지 구조가 변경되었을 수 있음
- CSS 선택자 업데이트 필요
- 에러 메시지와 함께 알려주세요

### 느린 속도

- 헤드리스 브라우저는 약간 느림 (종목당 2-3초)
- 캐싱 구현으로 개선 가능
- 여러 종목을 동시에 스크래핑하면 시간 절약

---

질문이나 문제가 있으면 알려주세요!
