'use client';

import { useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, DollarSign, Activity, Plus, Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { normalizeStockSymbol } from '@/lib/utils/stock-symbol-mapper';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 샘플 데이터 (나중에 실제 DB에서 가져올 데이터)
  const portfolioStats = {
    totalValue: 15420000,
    totalInvested: 12000000,
    totalProfit: 3420000,
    profitRate: 28.5,
  };

  const recentStocks = [
    { symbol: "005930", name: "삼성전자", quantity: 50, avgPrice: 71000, currentPrice: 75000, profit: 200000, profitRate: 5.63 },
    { symbol: "035420", name: "NAVER", quantity: 10, avgPrice: 245000, currentPrice: 268000, profit: 230000, profitRate: 9.39 },
    { symbol: "AAPL", name: "Apple Inc.", quantity: 20, avgPrice: 175.5, currentPrice: 195.2, profit: 394, profitRate: 11.22 },
  ];

  // 주식 분석 실행
  const handleAnalyze = async () => {
    if (!searchQuery.trim()) {
      setError('종목명 또는 심볼을 입력해주세요');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // 1. 주식 이름/심볼 정규화
      const symbol = normalizeStockSymbol(searchQuery);
      console.log(`🔍 검색: ${searchQuery} → ${symbol}`);

      // 2. 주가 데이터 수집
      console.log('📊 Step 1: 주가 데이터 수집 중...');
      const priceRes = await fetch(`/api/stocks/${symbol}/price?timeframe=5m&limit=500&collect=true`);
      const priceData = await priceRes.json();

      if (!priceRes.ok) {
        throw new Error(priceData.error || '주가 데이터 수집 실패');
      }

      console.log(`✅ Step 1 완료: ${priceData.count}개의 캔들 데이터 수집됨`);

      // 3. 기술적 지표 계산
      console.log('📈 Step 2: 기술적 지표 계산 중...');
      const indicatorsRes = await fetch(`/api/stocks/${symbol}/indicators?timeframe=5m&calculate=true&analyze=true`);
      const indicatorsData = await indicatorsRes.json();

      if (!indicatorsRes.ok) {
        throw new Error(indicatorsData.error || '기술적 지표 계산 실패');
      }

      console.log(`✅ Step 2 완료: ${indicatorsData.count}개의 지표 계산됨`);

      // 4. 결과 표시
      setAnalysisResult({
        symbol: symbol,
        stock: priceData.stock,
        currentPrice: priceData.currentPrice,
        candlesCount: priceData.count,
        indicators: indicatorsData.latest,
        analysis: indicatorsData.analysis,
        indicatorsCount: indicatorsData.count,
      });

      console.log('✅ 전체 분석 완료!');
    } catch (err: any) {
      console.error('❌ 분석 실패:', err);
      setError(err.message || '분석 중 오류가 발생했습니다');
    } finally {
      setAnalyzing(false);
    }
  };

  // Enter 키로도 검색 가능
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-black">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">주식투자관리</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/">
              <Button variant="ghost">홈</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">대시보드</Button>
            </Link>
            <Link href="/test-api">
              <Button variant="ghost">API 테스트</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* 검색 및 분석 섹션 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              주식 검색 및 분석
            </CardTitle>
            <CardDescription>
              종목명 또는 심볼을 입력하고 "분석" 버튼을 클릭하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="예: 삼성전자, AAPL, 005930.KS"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={analyzing}
                  className="text-lg"
                />
                <p className="text-sm text-zinc-500 mt-2">
                  한국 주식: 삼성전자, 네이버, 카카오 등 / 미국 주식: AAPL, MSFT, GOOGL 등
                </p>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || !searchQuery.trim()}
                className="px-8"
                size="lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    분석
                  </>
                )}
              </Button>
            </div>

            {/* 분석 진행 상황 */}
            {analyzing && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  데이터를 수집하고 분석하는 중입니다...
                </p>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  {error}
                </p>
              </div>
            )}

            {/* 분석 결과 */}
            {analysisResult && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <CheckCircle2 className="h-5 w-5" />
                  분석 완료 및 DB 저장 확인
                </div>

                {/* 주식 정보 */}
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle>{analysisResult.stock?.name || analysisResult.symbol}</CardTitle>
                    <CardDescription>
                      {analysisResult.stock?.symbol} • {analysisResult.stock?.exchange} • {analysisResult.stock?.currency}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-zinc-600">현재가</p>
                        <p className="text-2xl font-bold">
                          {analysisResult.currentPrice?.price ? `$${analysisResult.currentPrice.price.toFixed(2)}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600">변동률</p>
                        <p className={`text-2xl font-bold ${
                          analysisResult.currentPrice?.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {analysisResult.currentPrice?.changePercent >= 0 ? '+' : ''}
                          {analysisResult.currentPrice?.changePercent?.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600">수집된 캔들</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {analysisResult.candlesCount}개
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600">계산된 지표</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {analysisResult.indicatorsCount}개
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 기술적 지표 */}
                {analysisResult.indicators && (
                  <Card className="border-purple-200">
                    <CardHeader>
                      <CardTitle>📊 기술적 지표</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {analysisResult.indicators.rsi14 && (
                          <div>
                            <p className="text-sm text-zinc-600">RSI(14)</p>
                            <p className={`text-lg font-bold ${
                              analysisResult.indicators.rsi14 > 70 ? 'text-red-600' :
                              analysisResult.indicators.rsi14 < 30 ? 'text-green-600' :
                              'text-zinc-900'
                            }`}>
                              {analysisResult.indicators.rsi14.toFixed(2)}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {analysisResult.indicators.rsi14 > 70 ? '과매수' :
                               analysisResult.indicators.rsi14 < 30 ? '과매도' : '중립'}
                            </p>
                          </div>
                        )}
                        {analysisResult.indicators.macd && (
                          <div>
                            <p className="text-sm text-zinc-600">MACD</p>
                            <p className="text-lg font-bold">{analysisResult.indicators.macd.toFixed(4)}</p>
                          </div>
                        )}
                        {analysisResult.indicators.sma20 && (
                          <div>
                            <p className="text-sm text-zinc-600">SMA(20)</p>
                            <p className="text-lg font-bold">{analysisResult.indicators.sma20.toFixed(2)}</p>
                          </div>
                        )}
                        {analysisResult.indicators.bbUpper && (
                          <div>
                            <p className="text-sm text-zinc-600">볼린저 상단</p>
                            <p className="text-lg font-bold">{analysisResult.indicators.bbUpper.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI 분석 */}
                {analysisResult.analysis && (
                  <Card className="border-yellow-200">
                    <CardHeader>
                      <CardTitle>🤖 AI 분석 결과</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">시장 심리:</span>
                          <span className={`px-3 py-1 rounded-full font-bold ${
                            analysisResult.analysis.sentiment === 'bullish'
                              ? 'bg-green-100 text-green-700'
                              : analysisResult.analysis.sentiment === 'bearish'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {analysisResult.analysis.sentiment === 'bullish' ? '🔥 강세 (상승)' :
                             analysisResult.analysis.sentiment === 'bearish' ? '❄️ 약세 (하락)' : '➡️ 중립'}
                          </span>
                          <span className="text-sm text-zinc-600">
                            신뢰도: {analysisResult.analysis.strength}%
                          </span>
                        </div>

                        {analysisResult.analysis.signals && analysisResult.analysis.signals.length > 0 && (
                          <div>
                            <p className="font-medium mb-2">매매 신호:</p>
                            <ul className="space-y-1">
                              {analysisResult.analysis.signals.map((signal: string, i: number) => (
                                <li key={i} className="text-sm text-zinc-700 flex items-start gap-2">
                                  <span className="text-blue-600">•</span>
                                  <span>{signal}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* DB 저장 확인 */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    ✅ 데이터베이스 저장 완료
                  </p>
                  <ul className="mt-2 text-sm text-green-600 space-y-1">
                    <li>• 주식 정보 (stocks 테이블)</li>
                    <li>• 가격 캔들 데이터 (price_candles 테이블) - {analysisResult.candlesCount}개</li>
                    <li>• 기술적 지표 (technical_indicators 테이블) - {analysisResult.indicatorsCount}개</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">대시보드</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              전체 투자 현황을 한눈에 확인하세요
            </p>
          </div>
          <Link href="/transactions/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> 거래 추가
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 자산 가치</CardTitle>
              <DollarSign className="h-4 w-4 text-zinc-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₩{portfolioStats.totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                총 투자금: ₩{portfolioStats.totalInvested.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 수익</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₩{portfolioStats.totalProfit.toLocaleString()}
              </div>
              <p className="text-xs text-green-600 mt-1">
                +{portfolioStats.profitRate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">보유 종목</CardTitle>
              <Activity className="h-4 w-4 text-zinc-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentStocks.length}</div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                개의 주식 보유 중
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">수익률</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {portfolioStats.profitRate}%
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                평균 수익률
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Holdings Table */}
        <Card>
          <CardHeader>
            <CardTitle>보유 종목</CardTitle>
            <CardDescription>
              현재 보유중인 주식 목록입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">종목명</th>
                    <th className="text-left py-3 px-4 font-medium">티커</th>
                    <th className="text-right py-3 px-4 font-medium">수량</th>
                    <th className="text-right py-3 px-4 font-medium">평균단가</th>
                    <th className="text-right py-3 px-4 font-medium">현재가</th>
                    <th className="text-right py-3 px-4 font-medium">평가손익</th>
                    <th className="text-right py-3 px-4 font-medium">수익률</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStocks.map((stock) => (
                    <tr key={stock.symbol} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <td className="py-3 px-4 font-medium">{stock.name}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{stock.symbol}</td>
                      <td className="py-3 px-4 text-right">{stock.quantity}</td>
                      <td className="py-3 px-4 text-right">
                        {stock.symbol.startsWith('0') ? '₩' : '$'}
                        {stock.avgPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {stock.symbol.startsWith('0') ? '₩' : '$'}
                        {stock.currentPrice.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${stock.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.profit > 0 ? '+' : ''}
                        {stock.symbol.startsWith('0') ? '₩' : '$'}
                        {stock.profit.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${stock.profitRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.profitRate > 0 ? (
                          <span className="flex items-center justify-end gap-1">
                            <TrendingUp className="h-4 w-4" />
                            +{stock.profitRate}%
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-1">
                            <TrendingDown className="h-4 w-4" />
                            {stock.profitRate}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
