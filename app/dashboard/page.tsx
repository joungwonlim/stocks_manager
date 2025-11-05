'use client';

import { useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, DollarSign, Activity, Plus, Search, CheckCircle2, XCircle, Loader2, Sparkles, Target, AlertCircle, Bell, BarChart3 } from "lucide-react";
import { normalizeStockSymbol } from '@/lib/utils/stock-symbol-mapper';
import dynamic from 'next/dynamic';

// 차트 컴포넌트를 동적 import (SSR 방지)
const CandlestickChart = dynamic(() => import('@/components/charts/CandlestickChart'), { ssr: false });
const TechnicalIndicatorChart = dynamic(() => import('@/components/charts/TechnicalIndicatorChart'), { ssr: false });
const PortfolioChart = dynamic(() => import('@/components/charts/PortfolioChart'), { ssr: false });
const PriceComparisonChart = dynamic(() => import('@/components/charts/PriceComparisonChart'), { ssr: false });

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);

  // 샘플 데이터
  const portfolioStats = {
    totalValue: 15420000,
    totalInvested: 12000000,
    totalProfit: 3420000,
    profitRate: 28.5,
  };

  const recentStocks = [
    { symbol: "005930", name: "삼성전자", quantity: 50, avgPrice: 71000, currentPrice: 75000, profit: 200000, profitRate: 5.63 },
    { symbol: "035420", name: "NAVER", quantity: 10, avgPrice: 245000, currentPrice: 268000, profit: 230000, profitRate: 9.39 },
  ];

  // 포트폴리오 차트 샘플 데이터
  const portfolioPerformanceData = [
    { date: '11/01', value: 12500000, invested: 12000000 },
    { date: '11/02', value: 13200000, invested: 12000000 },
    { date: '11/03', value: 14100000, invested: 12000000 },
    { date: '11/04', value: 14800000, invested: 12000000 },
    { date: '11/05', value: 15420000, invested: 12000000 },
  ];

  const stockAllocationData = [
    { name: '삼성전자', value: 3750000, percentage: 24.3 },
    { name: 'NAVER', value: 2680000, percentage: 17.4 },
    { name: 'SK하이닉스', value: 3200000, percentage: 20.8 },
    { name: 'LG화학', value: 2890000, percentage: 18.7 },
    { name: '카카오', value: 2900000, percentage: 18.8 },
  ];

  const stockProfitData = [
    { name: '삼성전자', value: 200000 },
    { name: 'NAVER', value: 230000 },
    { name: 'SK하이닉스', value: -150000 },
    { name: 'LG화학', value: 320000 },
    { name: '카카오', value: -100000 },
  ];

  // AI 분석 실행
  const handleAIAnalyze = async (symbol: string) => {
    setAnalyzing(true);
    setError(null);

    try {
      console.log(`🤖 AI 분석 시작: ${symbol}`);
      const aiRes = await fetch(`/api/stocks/${symbol}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframe: '5m' }),
      });

      const aiData = await aiRes.json();

      if (!aiRes.ok) {
        throw new Error(aiData.error || 'AI 분석 실패');
      }

      setAiAnalysis(aiData);
      console.log('✅ AI 분석 완료!');
    } catch (err: any) {
      console.error('❌ AI 분석 실패:', err);
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // 주식 분석 실행
  const handleAnalyze = async () => {
    if (!searchQuery.trim()) {
      setError('종목명 또는 심볼을 입력해주세요');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setAiAnalysis(null);

    try {
      const symbol = normalizeStockSymbol(searchQuery);
      console.log(`🔍 검색: ${searchQuery} → ${symbol}`);

      // 1. 주가 데이터 수집
      console.log('📊 Step 1: 주가 데이터 수집 중...');
      const priceRes = await fetch(`/api/stocks/${symbol}/price?timeframe=5m&limit=500&collect=true`);
      const priceData = await priceRes.json();

      if (!priceRes.ok) {
        throw new Error(priceData.error || '주가 데이터 수집 실패');
      }

      // 2. 기술적 지표 계산
      console.log('📈 Step 2: 기술적 지표 계산 중...');
      const indicatorsRes = await fetch(`/api/stocks/${symbol}/indicators?timeframe=5m&calculate=true&analyze=true`);
      const indicatorsData = await indicatorsRes.json();

      if (!indicatorsRes.ok) {
        throw new Error(indicatorsData.error || '기술적 지표 계산 실패');
      }

      // 3. AI 분석
      console.log('🤖 Step 3: AI 분석 중...');
      await handleAIAnalyze(symbol);

      // 4. 차트 데이터 준비
      const candleChartData = priceData.candles?.map((c: any) => ({
        time: c.timestamp,
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
      })) || [];

      const volumeChartData = priceData.candles?.map((c: any) => ({
        time: c.timestamp,
        value: parseFloat(c.volume),
        color: parseFloat(c.close) >= parseFloat(c.open) ? '#ef5350' : '#26a69a',
      })) || [];

      const indicatorChartData = indicatorsData.indicators?.map((ind: any) => ({
        timestamp: ind.timestamp,
        rsi: parseFloat(ind.rsi14),
        macd: parseFloat(ind.macd),
        macdSignal: parseFloat(ind.macdSignal),
        macdHistogram: parseFloat(ind.macdHistogram),
        stochK: parseFloat(ind.stochK),
        stochD: parseFloat(ind.stochD),
      })) || [];

      setChartData({
        candles: candleChartData.slice(-100), // 최근 100개
        volume: volumeChartData.slice(-100),
        indicators: indicatorChartData.slice(-100),
      });

      // 5. 결과 표시
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  // 알림 생성 - 목표가 도달 시
  const handleCreatePriceTargetAlert = async () => {
    if (!aiAnalysis || !aiAnalysis.stock) {
      setAlertMessage('❌ AI 분석 결과가 없습니다. 먼저 종목을 분석해주세요.');
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    setAlertLoading(true);
    setAlertMessage(null);

    try {
      const stockId = aiAnalysis.stock.id;
      const tradingSignalId = aiAnalysis.signal?.id;

      // 목표가 1, 2, 3에 대한 알림 생성
      const targets = [
        { type: 'target_price_1', price: aiAnalysis.signal?.targets?.target1, label: '1차 목표가' },
        { type: 'target_price_2', price: aiAnalysis.signal?.targets?.target2, label: '2차 목표가' },
        { type: 'target_price_3', price: aiAnalysis.signal?.targets?.target3, label: '3차 목표가' },
      ];

      for (const target of targets) {
        if (target.price) {
          await fetch('/api/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stockId,
              tradingSignalId,
              alertType: target.type,
              title: `🎯 ${aiAnalysis.stock.name} ${target.label} 도달!`,
              message: `${aiAnalysis.stock.name}(${aiAnalysis.stock.symbol})의 ${target.label} ${target.price.toLocaleString()}원에 도달했습니다.`,
              priority: 'normal',
            }),
          });
        }
      }

      setAlertMessage('✅ 목표가 알림이 설정되었습니다!');
      setTimeout(() => setAlertMessage(null), 3000);
      fetchAlerts(); // 알림 목록 갱신
    } catch (error: any) {
      console.error('Alert creation failed:', error);
      setAlertMessage('❌ 알림 설정에 실패했습니다: ' + error.message);
      setTimeout(() => setAlertMessage(null), 3000);
    } finally {
      setAlertLoading(false);
    }
  };

  // 알림 생성 - 매매 신호
  const handleCreateTradingSignalAlert = async () => {
    if (!aiAnalysis || !aiAnalysis.stock) {
      setAlertMessage('❌ AI 분석 결과가 없습니다. 먼저 종목을 분석해주세요.');
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    setAlertLoading(true);
    setAlertMessage(null);

    try {
      const stockId = aiAnalysis.stock.id;
      const tradingSignalId = aiAnalysis.signal?.id;

      // 진입가 알림
      if (aiAnalysis.signal?.entry_price) {
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stockId,
            tradingSignalId,
            alertType: 'entry_price',
            title: `🎯 ${aiAnalysis.stock.name} 진입가 도달!`,
            message: `${aiAnalysis.stock.name}(${aiAnalysis.stock.symbol})의 진입가 ${aiAnalysis.signal.entry_price.toLocaleString()}원에 도달했습니다.`,
            priority: 'high',
          }),
        });
      }

      // 손절가 알림
      if (aiAnalysis.signal?.stop_loss) {
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stockId,
            tradingSignalId,
            alertType: 'stop_loss',
            title: `⚠️ ${aiAnalysis.stock.name} 손절가 도달!`,
            message: `${aiAnalysis.stock.name}(${aiAnalysis.stock.symbol})의 손절가 ${aiAnalysis.signal.stop_loss.toLocaleString()}원에 도달했습니다.`,
            priority: 'high',
          }),
        });
      }

      setAlertMessage('✅ 매매 신호 알림이 설정되었습니다!');
      setTimeout(() => setAlertMessage(null), 3000);
      fetchAlerts(); // 알림 목록 갱신
    } catch (error: any) {
      console.error('Alert creation failed:', error);
      setAlertMessage('❌ 알림 설정에 실패했습니다: ' + error.message);
      setTimeout(() => setAlertMessage(null), 3000);
    } finally {
      setAlertLoading(false);
    }
  };

  // 알림 목록 가져오기
  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts?limit=10&isRead=false');
      const data = await res.json();
      if (res.ok) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  // 알림 읽음 표시
  const markAlertAsRead = async (alertId: number) => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-black">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">주식투자관리 AI</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/">
              <Button variant="ghost">홈</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">대시보드</Button>
            </Link>
            <Button variant="ghost" className="gap-2">
              <Bell className="h-4 w-4" />
              알림 <span className="bg-red-500 text-white text-xs rounded-full px-2">3</span>
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* AI 분석 섹션 */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI 주식 분석 (Claude AI)
            </CardTitle>
            <CardDescription>
              종목을 입력하면 Claude AI가 기술적 지표를 분석하여 매수/매도 추천을 제공합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="예: 삼성전자, 005930, NAVER, 035420"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={analyzing}
                  className="text-lg"
                />
                <p className="text-sm text-zinc-600 mt-2">
                  💡 테스트 가능: 삼성전자(005930), SK하이닉스(000660), NAVER(035420), LG화학(051910), 카카오(035720)
                </p>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || !searchQuery.trim()}
                className="px-8 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI 분석
                  </>
                )}
              </Button>
            </div>

            {/* 분석 진행 상황 */}
            {analyzing && (
              <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 flex items-center gap-2 font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Claude AI가 주식을 분석하고 있습니다...
                </p>
                <div className="mt-2 space-y-1 text-xs text-blue-700">
                  <div>✓ 주가 데이터 수집</div>
                  <div>✓ 기술적 지표 계산 (RSI, MACD, 볼린저밴드)</div>
                  <div className="animate-pulse">→ AI 분석 및 추천 생성 중...</div>
                </div>
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

            {/* AI 분석 결과 */}
            {aiAnalysis && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 text-green-600 font-semibold text-lg">
                  <CheckCircle2 className="h-6 w-6" />
                  AI 분석 완료!
                </div>

                {/* AI 추천 */}
                <Card className="border-2 border-green-500">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      {aiAnalysis.stock?.name} AI 투자 추천
                    </CardTitle>
                    <CardDescription>
                      {aiAnalysis.stock?.symbol} • {aiAnalysis.stock?.market || 'KRX'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* 추천 및 신뢰도 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-white rounded-lg border-2 border-green-200">
                        <p className="text-sm text-zinc-600 mb-2">AI 추천</p>
                        <p className={`text-2xl font-bold ${
                          aiAnalysis.analysis?.recommendation?.includes('buy') ? 'text-green-600' :
                          aiAnalysis.analysis?.recommendation?.includes('sell') ? 'text-red-600' :
                          'text-zinc-600'
                        }`}>
                          {aiAnalysis.analysis?.recommendation === 'strong_buy' ? '🔥 강력 매수' :
                           aiAnalysis.analysis?.recommendation === 'buy' ? '✅ 매수' :
                           aiAnalysis.analysis?.recommendation === 'hold' ? '➡️ 보유' :
                           aiAnalysis.analysis?.recommendation === 'sell' ? '⚠️ 매도' :
                           aiAnalysis.analysis?.recommendation === 'strong_sell' ? '❌ 강력 매도' :
                           '➡️ 관망'}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-white rounded-lg border-2 border-blue-200">
                        <p className="text-sm text-zinc-600 mb-2">시장 심리</p>
                        <p className={`text-2xl font-bold ${
                          aiAnalysis.analysis?.sentiment === 'bullish' ? 'text-green-600' :
                          aiAnalysis.analysis?.sentiment === 'bearish' ? 'text-red-600' :
                          'text-zinc-600'
                        }`}>
                          {aiAnalysis.analysis?.sentiment === 'bullish' ? '🔥 강세장' :
                           aiAnalysis.analysis?.sentiment === 'bearish' ? '❄️ 약세장' :
                           '➡️ 중립'}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-white rounded-lg border-2 border-purple-200">
                        <p className="text-sm text-zinc-600 mb-2">신뢰도</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {aiAnalysis.analysis?.confidence}%
                        </p>
                      </div>
                    </div>

                    {/* 가격 비교 차트 */}
                    {aiAnalysis.signal && (
                      <Card className="mb-6 border-indigo-200">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Target className="h-5 w-5 text-indigo-600" />
                            가격 목표 분석
                          </CardTitle>
                          <CardDescription className="text-xs">
                            현재가 대비 매수가, 손절가, 목표가 위치를 시각화한 차트
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <PriceComparisonChart
                            prices={{
                              currentPrice: aiAnalysis.signal.current_price,
                              entryPrice: aiAnalysis.signal.entry_price,
                              stopLoss: aiAnalysis.signal.stop_loss,
                              target1: aiAnalysis.signal.targets.target1,
                              target2: aiAnalysis.signal.targets.target2,
                              target3: aiAnalysis.signal.targets.target3,
                            }}
                            height={300}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* 가격 정보 - 퍼센트 추가 */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                      {(() => {
                        const currentPrice = aiAnalysis.signal?.current_price || 0;
                        const calculatePercent = (price: number) => {
                          return ((price - currentPrice) / currentPrice * 100).toFixed(2);
                        };

                        return (
                          <>
                            <div className="p-3 bg-zinc-50 rounded-lg border-2 border-zinc-300">
                              <p className="text-xs text-zinc-600 mb-1">현재가</p>
                              <p className="text-lg font-bold">
                                {currentPrice.toLocaleString()}원
                              </p>
                              <p className="text-xs font-medium text-zinc-500 mt-1">
                                (0.00%)
                              </p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-xs text-blue-700 mb-1">추천 매수가</p>
                              <p className="text-lg font-bold text-blue-700">
                                {aiAnalysis.signal?.entry_price?.toLocaleString()}원
                              </p>
                              <p className={`text-xs font-medium mt-1 ${
                                parseFloat(calculatePercent(aiAnalysis.signal?.entry_price || 0)) < 0 ? 'text-blue-600' : 'text-blue-400'
                              }`}>
                                ({calculatePercent(aiAnalysis.signal?.entry_price || 0)}%)
                              </p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                              <p className="text-xs text-red-700 mb-1">손절가</p>
                              <p className="text-lg font-bold text-red-700">
                                {aiAnalysis.signal?.stop_loss?.toLocaleString()}원
                              </p>
                              <p className="text-xs font-medium text-red-600 mt-1">
                                ({calculatePercent(aiAnalysis.signal?.stop_loss || 0)}%)
                              </p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-xs text-green-700 mb-1">1차 목표가</p>
                              <p className="text-lg font-bold text-green-700">
                                {aiAnalysis.signal?.targets?.target1?.toLocaleString()}원
                              </p>
                              <p className="text-xs font-medium text-green-600 mt-1">
                                (+{calculatePercent(aiAnalysis.signal?.targets?.target1 || 0)}%)
                              </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg border border-green-300">
                              <p className="text-xs text-green-800 mb-1">2차 목표가</p>
                              <p className="text-lg font-bold text-green-800">
                                {aiAnalysis.signal?.targets?.target2?.toLocaleString()}원
                              </p>
                              <p className="text-xs font-medium text-green-700 mt-1">
                                (+{calculatePercent(aiAnalysis.signal?.targets?.target2 || 0)}%)
                              </p>
                            </div>
                            <div className="p-3 bg-green-200 rounded-lg border border-green-400">
                              <p className="text-xs text-green-900 mb-1">3차 목표가</p>
                              <p className="text-lg font-bold text-green-900">
                                {aiAnalysis.signal?.targets?.target3?.toLocaleString()}원
                              </p>
                              <p className="text-xs font-medium text-green-800 mt-1">
                                (+{calculatePercent(aiAnalysis.signal?.targets?.target3 || 0)}%)
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* AI 분석 내용 */}
                    {aiAnalysis.analysis?.analysis && (
                      <div className="p-4 bg-zinc-50 rounded-lg mb-4">
                        <p className="text-sm font-medium text-zinc-700 mb-2">📝 AI 분석 내용:</p>
                        <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                          {aiAnalysis.analysis.analysis}
                        </p>
                      </div>
                    )}

                    {/* 분석 근거 */}
                    {aiAnalysis.analysis?.reasoning && aiAnalysis.analysis.reasoning.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-2">💡 분석 근거:</p>
                        <ul className="space-y-1">
                          {aiAnalysis.analysis.reasoning.map((reason: string, i: number) => (
                            <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 기대 수익 */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-zinc-600 mb-1">기대 수익률</p>
                          <p className="text-2xl font-bold text-purple-700">
                            +{aiAnalysis.signal?.expected_return}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-zinc-600 mb-1">위험 수준</p>
                          <p className={`text-lg font-bold ${
                            aiAnalysis.signal?.risk_level === 'high' ? 'text-red-600' :
                            aiAnalysis.signal?.risk_level === 'low' ? 'text-green-600' :
                            'text-yellow-600'
                          }`}>
                            {aiAnalysis.signal?.risk_level === 'high' ? '⚠️ 높음' :
                             aiAnalysis.signal?.risk_level === 'low' ? '✅ 낮음' :
                             '⚡ 중간'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-zinc-600 mb-1">투자 기간</p>
                          <p className="text-lg font-bold text-zinc-700">
                            {aiAnalysis.signal?.time_horizon === 'short' ? '🏃 단기' :
                             aiAnalysis.signal?.time_horizon === 'long' ? '🚶 장기' :
                             '🚴 중기'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 알림 설정 버튼 */}
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={handleCreatePriceTargetAlert}
                        disabled={alertLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {alertLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Bell className="h-4 w-4 mr-2" />
                        )}
                        목표가 도달 시 알림 받기
                      </Button>
                      <Button
                        onClick={handleCreateTradingSignalAlert}
                        disabled={alertLoading}
                        variant="outline"
                        className="flex-1"
                      >
                        {alertLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Target className="h-4 w-4 mr-2" />
                        )}
                        매매 신호 알림 설정
                      </Button>
                    </div>

                    {/* 알림 피드백 메시지 */}
                    {alertMessage && (
                      <div className={`mt-3 p-3 rounded-lg ${
                        alertMessage.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
                        'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        <p className="text-sm font-medium">{alertMessage}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 기술적 지표 */}
                {aiAnalysis.indicators && (
                  <Card className="border-purple-200">
                    <CardHeader>
                      <CardTitle>📊 기술적 지표 상세</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {aiAnalysis.indicators.rsi && (
                          <div className="p-3 bg-zinc-50 rounded-lg">
                            <p className="text-xs text-zinc-600 mb-1">RSI(14)</p>
                            <p className={`text-lg font-bold ${
                              parseFloat(aiAnalysis.indicators.rsi) > 70 ? 'text-red-600' :
                              parseFloat(aiAnalysis.indicators.rsi) < 30 ? 'text-green-600' :
                              'text-zinc-900'
                            }`}>
                              {parseFloat(aiAnalysis.indicators.rsi).toFixed(2)}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {parseFloat(aiAnalysis.indicators.rsi) > 70 ? '과매수' :
                               parseFloat(aiAnalysis.indicators.rsi) < 30 ? '과매도' : '중립'}
                            </p>
                          </div>
                        )}
                        {aiAnalysis.indicators.macd && (
                          <div className="p-3 bg-zinc-50 rounded-lg">
                            <p className="text-xs text-zinc-600 mb-1">MACD</p>
                            <p className="text-lg font-bold">{parseFloat(aiAnalysis.indicators.macd).toFixed(2)}</p>
                          </div>
                        )}
                        {aiAnalysis.indicators.bollinger_upper && (
                          <>
                            <div className="p-3 bg-zinc-50 rounded-lg">
                              <p className="text-xs text-zinc-600 mb-1">볼린저 상단</p>
                              <p className="text-lg font-bold">{parseFloat(aiAnalysis.indicators.bollinger_upper).toFixed(0)}</p>
                            </div>
                            <div className="p-3 bg-zinc-50 rounded-lg">
                              <p className="text-xs text-zinc-600 mb-1">볼린저 하단</p>
                              <p className="text-lg font-bold">{parseFloat(aiAnalysis.indicators.bollinger_lower).toFixed(0)}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 차트 섹션 */}
                {chartData && (
                  <div className="space-y-6">
                    {/* 가격 차트 */}
                    <Card className="border-blue-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          {analysisResult?.stock?.name} 주가 차트
                        </CardTitle>
                        <CardDescription>
                          캔들스틱 차트 및 거래량 (최근 100개 데이터)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CandlestickChart
                          data={chartData.candles}
                          height={400}
                          volumeData={chartData.volume}
                        />
                      </CardContent>
                    </Card>

                    {/* 기술적 지표 차트 */}
                    <Card className="border-purple-200">
                      <CardHeader>
                        <CardTitle>📈 기술적 지표 차트</CardTitle>
                        <CardDescription>
                          RSI, MACD, Stochastic 지표를 시각화한 차트
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-8">
                          {/* RSI 차트 */}
                          <TechnicalIndicatorChart
                            data={chartData.indicators}
                            type="rsi"
                            height={200}
                          />

                          {/* MACD 차트 */}
                          <TechnicalIndicatorChart
                            data={chartData.indicators}
                            type="macd"
                            height={200}
                          />

                          {/* Stochastic 차트 */}
                          <TechnicalIndicatorChart
                            data={chartData.indicators}
                            type="stochastic"
                            height={200}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 포트폴리오 차트 */}
        <Card className="mb-8 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              포트폴리오 분석
            </CardTitle>
            <CardDescription>
              자산 배분, 수익률, 종목별 손익을 한눈에 확인
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* 포트폴리오 수익률 추이 */}
              <div>
                <PortfolioChart
                  type="performance"
                  performanceData={portfolioPerformanceData}
                  height={300}
                />
              </div>

              {/* 자산 배분 */}
              <div>
                <PortfolioChart
                  type="allocation"
                  allocationData={stockAllocationData}
                  height={300}
                />
              </div>

              {/* 종목별 수익/손실 */}
              <div className="md:col-span-2">
                <PortfolioChart
                  type="profit"
                  allocationData={stockProfitData}
                  height={300}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 포트폴리오 통계 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">포트폴리오 현황</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 자산 가치</CardTitle>
                <DollarSign className="h-4 w-4 text-zinc-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₩{portfolioStats.totalValue.toLocaleString()}
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  투자금: ₩{portfolioStats.totalInvested.toLocaleString()}
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
                <p className="text-xs text-zinc-600 mt-1">
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
                <p className="text-xs text-zinc-600 mt-1">
                  평균 수익률
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 보유 종목 */}
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
                    <th className="text-center py-3 px-4 font-medium">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStocks.map((stock) => (
                    <tr key={stock.symbol} className="border-b hover:bg-zinc-50">
                      <td className="py-3 px-4 font-medium">{stock.name}</td>
                      <td className="py-3 px-4 text-zinc-600">{stock.symbol}</td>
                      <td className="py-3 px-4 text-right">{stock.quantity}</td>
                      <td className="py-3 px-4 text-right">
                        ₩{stock.avgPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        ₩{stock.currentPrice.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${stock.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.profit > 0 ? '+' : ''}₩{stock.profit.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${stock.profitRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="flex items-center justify-end gap-1">
                          {stock.profitRate > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {stock.profitRate > 0 ? '+' : ''}{stock.profitRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSearchQuery(stock.symbol);
                            handleAnalyze();
                          }}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI 분석
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 알림 목록 */}
        {alerts.length > 0 && (
          <Card className="mt-8 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                활성 알림 ({alerts.length})
              </CardTitle>
              <CardDescription>
                설정된 알림 목록입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.priority === 'high'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-zinc-900 mb-1">{alert.title}</p>
                        <p className="text-sm text-zinc-600">{alert.message}</p>
                        <p className="text-xs text-zinc-500 mt-2">
                          {new Date(alert.createdAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAlertAsRead(alert.id)}
                        className="ml-4"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
