'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

interface PriceData {
  currentPrice: number;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  target3: number;
}

interface PriceComparisonChartProps {
  prices: PriceData;
  height?: number;
}

export default function PriceComparisonChart({ prices, height = 300 }: PriceComparisonChartProps) {
  const { currentPrice, entryPrice, stopLoss, target1, target2, target3 } = prices;

  // 현재가 대비 퍼센트 계산
  const calculatePercent = (price: number) => {
    return ((price - currentPrice) / currentPrice * 100).toFixed(2);
  };

  // 차트 데이터 준비
  const chartData = [
    {
      name: '손절가',
      price: stopLoss,
      percent: parseFloat(calculatePercent(stopLoss)),
      color: '#ef4444', // red-500
      label: `${stopLoss.toLocaleString()}원 (${calculatePercent(stopLoss)}%)`,
    },
    {
      name: '매수가',
      price: entryPrice,
      percent: parseFloat(calculatePercent(entryPrice)),
      color: '#3b82f6', // blue-500
      label: `${entryPrice.toLocaleString()}원 (${calculatePercent(entryPrice)}%)`,
    },
    {
      name: '현재가',
      price: currentPrice,
      percent: 0,
      color: '#6b7280', // gray-500
      label: `${currentPrice.toLocaleString()}원 (0.00%)`,
    },
    {
      name: '1차 목표',
      price: target1,
      percent: parseFloat(calculatePercent(target1)),
      color: '#22c55e', // green-500
      label: `${target1.toLocaleString()}원 (+${calculatePercent(target1)}%)`,
    },
    {
      name: '2차 목표',
      price: target2,
      percent: parseFloat(calculatePercent(target2)),
      color: '#16a34a', // green-600
      label: `${target2.toLocaleString()}원 (+${calculatePercent(target2)}%)`,
    },
    {
      name: '3차 목표',
      price: target3,
      percent: parseFloat(calculatePercent(target3)),
      color: '#15803d', // green-700
      label: `${target3.toLocaleString()}원 (+${calculatePercent(target3)}%)`,
    },
  ];

  // 가격 순서대로 정렬
  const sortedData = [...chartData].sort((a, b) => a.price - b.price);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-sm mb-1">{data.name}</p>
          <p className="text-lg font-bold" style={{ color: data.color }}>
            {data.price.toLocaleString()}원
          </p>
          <p className={`text-sm font-medium ${
            data.percent > 0 ? 'text-green-600' :
            data.percent < 0 ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {data.percent > 0 ? '+' : ''}{data.percent.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[Math.min(...sortedData.map(d => d.price)) * 0.95, Math.max(...sortedData.map(d => d.price)) * 1.05]}
            tickFormatter={(value) => `${Math.round(value / 1000)}K`}
          />
          <YAxis dataKey="name" type="category" width={90} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="price" radius={[0, 8, 8, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList
              dataKey="label"
              position="right"
              style={{ fontSize: '12px', fontWeight: 'bold' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>손절가</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>추천 매수가</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span>현재가</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>목표가</span>
        </div>
      </div>
    </div>
  );
}
