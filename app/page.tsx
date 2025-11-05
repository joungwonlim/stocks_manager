import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, TrendingUp, Wallet, BarChart3, PieChart } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">주식투자관리</h1>
          </div>
          <nav className="flex gap-4">
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
            스마트한 주식투자 관리
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            포트폴리오를 한눈에 관리하고, 투자 성과를 분석하며, 더 나은 투자 결정을 내리세요.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                시작하기 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button size="lg" variant="outline">
                포트폴리오 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Wallet className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>포트폴리오 관리</CardTitle>
              <CardDescription>
                모든 주식 투자를 한곳에서 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>• 다중 포트폴리오 지원</li>
                <li>• 실시간 수익률 계산</li>
                <li>• 자산 배분 현황</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>거래 내역</CardTitle>
              <CardDescription>
                모든 매수/매도 기록을 상세하게 추적
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>• 거래 기록 자동 계산</li>
                <li>• 평균 매입가 자동 산출</li>
                <li>• 수수료 포함 계산</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <PieChart className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>성과 분석</CardTitle>
              <CardDescription>
                투자 성과를 시각적으로 분석
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>• 수익률 차트</li>
                <li>• 종목별 수익 분석</li>
                <li>• 기간별 투자 성과</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-3xl">지금 바로 시작하세요</CardTitle>
            <CardDescription className="text-white/90 text-lg">
              무료로 포트폴리오를 만들고 투자를 관리해보세요
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="gap-2">
                대시보드로 이동 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>© 2025 주식투자관리. Built with Next.js, Drizzle ORM, and NeonDB.</p>
        </div>
      </footer>
    </div>
  );
}
