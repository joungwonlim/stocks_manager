'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface IndicatorData {
  timestamp: string;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  stochK?: number;
  stochD?: number;
}

interface TechnicalIndicatorChartProps {
  data: IndicatorData[];
  type: 'rsi' | 'macd' | 'stochastic';
  height?: number;
}

export default function TechnicalIndicatorChart({ data, type, height = 200 }: TechnicalIndicatorChartProps) {
  // 타임스탬프 포맷팅
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // RSI 차트
  if (type === 'rsi') {
    return (
      <div className="w-full">
        <h3 className="text-sm font-semibold mb-2 text-zinc-700">RSI (Relative Strength Index)</h3>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke="#999"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#999"
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
              labelFormatter={(label) => `시간: ${formatTime(label)}`}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />

            {/* 과매수/과매도 기준선 */}
            <ReferenceLine y={70} stroke="#ef5350" strokeDasharray="3 3" label="과매수" />
            <ReferenceLine y={30} stroke="#26a69a" strokeDasharray="3 3" label="과매도" />
            <ReferenceLine y={50} stroke="#999" strokeDasharray="2 2" />

            <Line
              type="monotone"
              dataKey="rsi"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
              name="RSI"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // MACD 차트
  if (type === 'macd') {
    return (
      <div className="w-full">
        <h3 className="text-sm font-semibold mb-2 text-zinc-700">MACD (Moving Average Convergence Divergence)</h3>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke="#999"
              tick={{ fontSize: 11 }}
            />
            <YAxis stroke="#999" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
              labelFormatter={(label) => `시간: ${formatTime(label)}`}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />

            <ReferenceLine y={0} stroke="#999" strokeDasharray="2 2" />

            <Line
              type="monotone"
              dataKey="macd"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="MACD"
            />
            <Line
              type="monotone"
              dataKey="macdSignal"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Signal"
            />
            <Line
              type="monotone"
              dataKey="macdHistogram"
              stroke="#10b981"
              strokeWidth={1}
              dot={false}
              name="Histogram"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Stochastic 차트
  if (type === 'stochastic') {
    return (
      <div className="w-full">
        <h3 className="text-sm font-semibold mb-2 text-zinc-700">Stochastic Oscillator</h3>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke="#999"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#999"
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
              }}
              labelFormatter={(label) => `시간: ${formatTime(label)}`}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />

            {/* 과매수/과매도 기준선 */}
            <ReferenceLine y={80} stroke="#ef5350" strokeDasharray="3 3" label="과매수" />
            <ReferenceLine y={20} stroke="#26a69a" strokeDasharray="3 3" label="과매도" />

            <Line
              type="monotone"
              dataKey="stochK"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              name="%K"
            />
            <Line
              type="monotone"
              dataKey="stochD"
              stroke="#ec4899"
              strokeWidth={2}
              dot={false}
              name="%D"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}
