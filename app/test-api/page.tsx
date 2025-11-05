'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TestApiPage() {
  const [symbol, setSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState('5m');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. 단일 종목 데이터 조회
  const fetchStockPrice = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/stocks/${symbol}/price?timeframe=${timeframe}&collect=true`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. 여러 종목 데이터 수집
  const collectMultipleStocks = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/stocks/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: ['AAPL', 'MSFT', 'GOOGL', '005930.KS'],
          timeframe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to collect');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. 기본 관심 종목 수집
  const collectWatchlist = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/stocks/collect?timeframe=${timeframe}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to collect');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. 스케줄러 즉시 실행
  const runScheduler = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          timeframe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to run');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 5. 기술적 지표 계산
  const calculateIndicators = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/stocks/${symbol}/indicators?timeframe=${timeframe}&calculate=true&analyze=true`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to calculate');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 6. 여러 종목 지표 계산
  const calculateMultipleIndicators = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/indicators/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: ['AAPL', 'MSFT', 'GOOGL', '005930.KS'],
          timeframe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to calculate');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">API 테스트</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            실시간 주가 데이터 수집 및 저장 테스트
          </p>
        </div>

        {/* 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>설정</CardTitle>
            <CardDescription>종목 심볼과 시간 프레임을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symbol">종목 심볼</Label>
                <Input
                  id="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="예: AAPL, 005930.KS"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  미국 주식: AAPL, MSFT, GOOGL<br />
                  한국 주식: 005930.KS (삼성전자), 035420.KS (NAVER)
                </p>
              </div>

              <div>
                <Label htmlFor="timeframe">시간 프레임</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger id="timeframe">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1분봉</SelectItem>
                    <SelectItem value="5m">5분봉</SelectItem>
                    <SelectItem value="15m">15분봉</SelectItem>
                    <SelectItem value="1h">1시간봉</SelectItem>
                    <SelectItem value="1d">일봉</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 테스트 버튼들 */}
        <Card>
          <CardHeader>
            <CardTitle>1️⃣ 주가 데이터 수집</CardTitle>
            <CardDescription>실시간 주가 캔들 데이터 수집</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={fetchStockPrice}
                disabled={loading}
                className="w-full"
              >
                1. 단일 종목 조회 ({symbol})
              </Button>

              <Button
                onClick={collectMultipleStocks}
                disabled={loading}
                variant="secondary"
                className="w-full"
              >
                2. 여러 종목 수집 (4개)
              </Button>

              <Button
                onClick={collectWatchlist}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                3. 관심 종목 전체 수집
              </Button>

              <Button
                onClick={runScheduler}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                4. 스케줄러 즉시 실행
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 기술적 지표 테스트 버튼들 */}
        <Card>
          <CardHeader>
            <CardTitle>2️⃣ 기술적 지표 계산</CardTitle>
            <CardDescription>RSI, MACD, 볼린저 밴드 등 계산 및 분석</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={calculateIndicators}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                5. 지표 계산 ({symbol})
              </Button>

              <Button
                onClick={calculateMultipleIndicators}
                disabled={loading}
                variant="secondary"
                className="w-full"
              >
                6. 여러 종목 지표 계산 (4개)
              </Button>
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-zinc-600 mt-2">데이터 수집 중...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 에러 */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">에러 발생</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-red-600">{error}</pre>
            </CardContent>
          </Card>
        )}

        {/* 결과 */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>결과</CardTitle>
              <CardDescription>
                {result.stock && `${result.stock.name} (${result.stock.symbol})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.currentPrice && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">현재 가격</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-600">가격</p>
                      <p className="text-lg font-bold">${result.currentPrice.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-600">변동</p>
                      <p className={`text-lg font-bold ${result.currentPrice.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.currentPrice.change >= 0 ? '+' : ''}{result.currentPrice.changePercent.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-600">거래량</p>
                      <p className="text-lg font-bold">{result.currentPrice.volume.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {result.analysis && (
                <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold mb-2">📈 기술적 분석</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">시장 심리:</span>
                      <span className={`px-2 py-1 rounded ${
                        result.analysis.sentiment === 'bullish'
                          ? 'bg-green-100 text-green-700'
                          : result.analysis.sentiment === 'bearish'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {result.analysis.sentiment === 'bullish' ? '🔥 강세' : result.analysis.sentiment === 'bearish' ? '❄️ 약세' : '➡️ 중립'}
                      </span>
                      <span className="text-sm text-zinc-600">신뢰도: {result.analysis.strength}%</span>
                    </div>
                    {result.analysis.signals && result.analysis.signals.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">신호:</p>
                        <ul className="text-sm space-y-1">
                          {result.analysis.signals.map((signal: string, i: number) => (
                            <li key={i} className="text-zinc-700">• {signal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.latest && result.latest.rsi14 && (
                <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold mb-2">📊 최신 지표 값</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {result.latest.rsi14 && (
                      <div>
                        <p className="text-zinc-600">RSI(14)</p>
                        <p className={`text-lg font-bold ${
                          result.latest.rsi14 > 70 ? 'text-red-600' : result.latest.rsi14 < 30 ? 'text-green-600' : 'text-zinc-900'
                        }`}>
                          {result.latest.rsi14.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {result.latest.macd && (
                      <div>
                        <p className="text-zinc-600">MACD</p>
                        <p className="text-lg font-bold">{result.latest.macd.toFixed(4)}</p>
                      </div>
                    )}
                    {result.latest.sma20 && (
                      <div>
                        <p className="text-zinc-600">SMA(20)</p>
                        <p className="text-lg font-bold">{result.latest.sma20.toFixed(2)}</p>
                      </div>
                    )}
                    {result.latest.bbUpper && (
                      <div>
                        <p className="text-zinc-600">볼린저 상단</p>
                        <p className="text-lg font-bold">{result.latest.bbUpper.toFixed(2)}</p>
                      </div>
                    )}
                    {result.latest.bbLower && (
                      <div>
                        <p className="text-zinc-600">볼린저 하단</p>
                        <p className="text-lg font-bold">{result.latest.bbLower.toFixed(2)}</p>
                      </div>
                    )}
                    {result.latest.stochK && (
                      <div>
                        <p className="text-zinc-600">Stochastic K</p>
                        <p className={`text-lg font-bold ${
                          result.latest.stochK > 80 ? 'text-red-600' : result.latest.stochK < 20 ? 'text-green-600' : 'text-zinc-900'
                        }`}>
                          {result.latest.stochK.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.candles && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">
                    캔들 데이터 ({result.count}개)
                  </h3>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-100 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">시간</th>
                          <th className="p-2 text-right">시가</th>
                          <th className="p-2 text-right">고가</th>
                          <th className="p-2 text-right">저가</th>
                          <th className="p-2 text-right">종가</th>
                          <th className="p-2 text-right">거래량</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.candles.slice(0, 20).map((candle: any, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="p-2">{new Date(candle.timestamp).toLocaleString()}</td>
                            <td className="p-2 text-right">{candle.open.toFixed(2)}</td>
                            <td className="p-2 text-right">{candle.high.toFixed(2)}</td>
                            <td className="p-2 text-right">{candle.low.toFixed(2)}</td>
                            <td className="p-2 text-right">{candle.close.toFixed(2)}</td>
                            <td className="p-2 text-right">{candle.volume.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer font-semibold mb-2">전체 JSON 결과 보기</summary>
                <pre className="text-xs bg-zinc-100 p-4 rounded overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
