import yahooFinance from 'yahoo-finance2';

async function testYahooFinance() {
  console.log('🔍 Testing Yahoo Finance API...\n');
  console.log('Type of yahooFinance:', typeof yahooFinance);
  console.log('');

  try {
    // Create instance
    const yf = new yahooFinance();
    console.log('Instance methods:', Object.keys(yf));
    console.log('');

    // Test 1: 삼성전자 실시간 가격
    console.log('1️⃣ Testing Samsung Electronics (005930.KS) quote...');
    const samsungQuote = await yf.quote('005930.KS');
    console.log('✅ Success!');
    console.log('   Symbol:', samsungQuote.symbol);
    console.log('   Price:', samsungQuote.regularMarketPrice);
    console.log('   Currency:', samsungQuote.currency);
    console.log('   Market State:', samsungQuote.marketState);
    console.log('   Volume:', samsungQuote.regularMarketVolume);
    console.log('');

    // Test 2: 네이버 실시간 가격
    console.log('2️⃣ Testing NAVER (035420.KS) quote...');
    const naverQuote = await yf.quote('035420.KS');
    console.log('✅ Success!');
    console.log('   Symbol:', naverQuote.symbol);
    console.log('   Price:', naverQuote.regularMarketPrice);
    console.log('   Currency:', naverQuote.currency);
    console.log('');

    console.log('🎉 All tests passed! Yahoo Finance is working!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testYahooFinance();
