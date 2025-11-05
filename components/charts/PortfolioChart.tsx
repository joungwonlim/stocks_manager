'use client';

import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PortfolioPerformanceData {
  date: string;
  value: number;
  invested: number;
}

interface StockAllocationData {
  name: string;
  value: number;
  percentage: number;
}

interface PortfolioChartProps {
  type: 'performance' | 'allocation' | 'profit';
  performanceData?: PortfolioPerformanceData[];
  allocationData?: StockAllocationData[];
  height?: number;
}

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export default function PortfolioChart({
  type,
  performanceData,
  allocationData,
  height = 300,
}: PortfolioChartProps) {
  // 포트폴리오 수익률 차트
  if (type === 'performance' && performanceData) {
    return (
      <div className="w-full">
        <h3 className="text-sm font-semibold mb-2 text-zinc-700">포트폴리오 수익률 추이</h3>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              stroke="#999"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              stroke="#999"
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `₩${(value / 10000).toFixed(0)}만`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`₩${value.toLocaleString()}`, '']}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#4f46e5"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              name="평가금액"
            />
            <Area
              type="monotone"
              dataKey="invested"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInvested)"
              name="투자금액"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 자산 배분 파이 차트
  if (type === 'allocation' && allocationData) {
    return (
      <div className="w-full">
        <h3 className="text-sm font-semibold mb-2 text-zinc-700">종목별 자산 배분</h3>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={allocationData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {allocationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`₩${value.toLocaleString()}`, '평가금액']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 종목별 수익/손실 바 차트
  if (type === 'profit' && allocationData) {
    const profitData = allocationData.map((stock) => ({
      name: stock.name,
      profit: stock.value,
      color: stock.value >= 0 ? '#10b981' : '#ef4444',
    }));

    return (
      <div className="w-full">
        <h3 className="text-sm font-semibold mb-2 text-zinc-700">종목별 수익/손실</h3>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={profitData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#999" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="#999"
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `₩${(value / 10000).toFixed(0)}만`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`₩${value.toLocaleString()}`, '평가손익']}
            />
            <Bar dataKey="profit" name="평가손익">
              {profitData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}
