import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity, Plus } from "lucide-react";

export default function DashboardPage() {
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
            <Link href="/portfolio">
              <Button variant="ghost">포트폴리오</Button>
            </Link>
            <Link href="/transactions">
              <Button variant="ghost">거래내역</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
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
