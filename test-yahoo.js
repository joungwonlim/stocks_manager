const yahooFinance = require('yahoo-finance2').default;

async function testYahooFinance() {
  console.log('🔍 Testing Yahoo Finance API...\n');

  try {
    // Test 1: 삼성전자 실시간 가격
    console.log('1️⃣ Testing Samsung Electronics (005930.KS) quote...');
    const samsungQuote = await yahooFinance.quote('005930.KS');
    console.log('✅ Success!');
    console.log('   Symbol:', samsungQuote.symbol);
    console.log('   Price:', samsungQuote.regularMarketPrice);
    console.log('   Currency:', samsungQuote.currency);
    console.log('   Market State:', samsungQuote.marketState);
    console.log('   Volume:', samsungQuote.regularMarketVolume);
    console.log('');

    // Test 2: 네이버 실시간 가격
    console.log('2️⃣ Testing NAVER (035420.KS) quote...');
    const naverQuote = await yahooFinance.quote('035420.KS');
    console.log('✅ Success!');
    console.log('   Symbol:', naverQuote.symbol);
    console.log('   Price:', naverQuote.regularMarketPrice);
    console.log('   Currency:', naverQuote.currency);
    console.log('');

    // Test 3: 5분봉 캔들 데이터
    console.log('3️⃣ Testing historical data (5m candles)...');
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    const history = await yahooFinance.chart('005930.KS', {
      period1: startDate,
      period2: endDate,
      interval: '5m'
    });

    console.log('✅ Success!');
    console.log('   Symbol:', history.meta.symbol);
    console.log('   Candles received:', history.quotes.length);
    if (history.quotes.length > 0) {
      const lastCandle = history.quotes[history.quotes.length - 1];
      console.log('   Last candle:');
      console.log('     Time:', new Date(lastCandle.date));
      console.log('     Open:', lastCandle.open);
      console.log('     High:', lastCandle.high);
      console.log('     Low:', lastCandle.low);
      console.log('     Close:', lastCandle.close);
      console.log('     Volume:', lastCandle.volume);
    }
    console.log('');

    console.log('🎉 All tests passed! Yahoo Finance is working!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.result) {
      console.error('Details:', error.result);
    }
  }
}

testYahooFinance();
