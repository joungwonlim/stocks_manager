# Alpha Vantage 실시간 데이터 설정 가이드

## 1. API 키 받기

1. https://www.alphavantage.co/support/#api-key 접속
2. 이메일 주소 입력
3. API 키를 이메일로 받음 (즉시 발급)

## 2. API 키 설정

받은 API 키를 `.env.local` 파일에 추가:

```bash
# .env.local 파일 열기
nano .env.local

# 또는
vi .env.local
```

다음 줄을 찾아서 API 키로 교체:

```
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
```

예시:
```
ALPHA_VANTAGE_API_KEY=ABC123XYZ456DEF789
```

저장하고 종료.

## 3. 연결 테스트

API 키가 제대로 작동하는지 테스트:

```bash
npx tsx test-alpha-vantage.ts
```

성공하면 다음과 같이 표시됩니다:

```
🔍 Testing Alpha Vantage API...

API Key Configured: true
✅ API key found!

1️⃣  Testing Samsung Electronics (005930)...
✅ Success!
   Symbol: 005930.KS
   Price: 71,200 KRW
   ...

🎉 All tests passed!
```

## 4. 개발 서버 재시작

```bash
# 기존 서버 종료 (Ctrl+C)
# 서버 재시작
npm run dev
```

## 5. 실시간 데이터 확인

브라우저에서:
1. http://localhost:3002/dashboard 접속
2. 주식 검색 (예: "삼성전자", "005930", "AAPL")
3. "Analyze" 버튼 클릭
4. 실시간 데이터 확인!

## API 제한사항

무료 tier:
- ✅ 500 requests/day (하루 500번 요청)
- ✅ 5 requests/minute (분당 5번 요청)

5개 주식 x 100번 업데이트 = 충분합니다!

## 문제 해결

### "API key not configured" 오류

```bash
# .env.local 파일 확인
cat .env.local | grep ALPHA_VANTAGE

# API 키가 제대로 설정되었는지 확인
```

### "Rate Limit" 오류

1분에 5번 이상 요청하면 발생합니다. 1분 후 다시 시도하세요.

### "fetch failed" 오류

네트워크 연결을 확인하세요. Yahoo Finance와 달리 Alpha Vantage는 대부분의 환경에서 작동합니다.

## 다음 단계

테스트가 성공하면, 실제 API 라우트가 Alpha Vantage를 사용하도록 업데이트됩니다.

기존 mock 데이터 대신 실시간 데이터가 사용됩니다:
- ✅ 실시간 주식 가격
- ✅ 5분봉 캔들 데이터
- ✅ 거래량, 변동률 등

---

질문이나 문제가 있으면 알려주세요!
