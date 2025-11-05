'use client';

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  height?: number;
  volumeData?: { time: string; value: number; color?: string }[];
}

export default function CandlestickChart({ data, height = 400, volumeData }: CandlestickChartProps) {
  // 데이터 변환
  const chartData = data.map((d, idx) => {
    const volumeItem = volumeData?.[idx];
    return {
      time: new Date(d.time).toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      high: d.high,
      low: d.low,
      open: d.open,
      close: d.close,
      volume: volumeItem?.value || 0,
      // 캔들 색상 결정 (상승/하락)
      isUp: d.close >= d.open,
    };
  });

  // 커스텀 캔들 렌더링
  const CustomCandlestick = (props: any) => {
    const { x, y, width, height, high, low, open, close, isUp } = props;
    const color = isUp ? '#ef5350' : '#26a69a';

    // 가격 범위 계산
    const chartHeight = 400;
    const priceRange = Math.max(...data.map(d => d.high)) - Math.min(...data.map(d => d.low));
    const scale = chartHeight / priceRange;

    return (
      <g>
        {/* 심지 (High-Low) */}
        <line
          x1={x + width / 2}
          y1={y}
          x2={x + width / 2}
          y2={y + height}
          stroke={color}
          strokeWidth={1}
        />
        {/* 몸통 (Open-Close) */}
        <rect
          x={x}
          y={Math.min(y, y + height * ((open - close) / (high - low)))}
          width={width}
          height={Math.abs(height * ((close - open) / (high - low))) || 1}
          fill={color}
          stroke={color}
        />
      </g>
    );
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="time"
            stroke="#999"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            yAxisId="price"
            stroke="#999"
            tick={{ fontSize: 11 }}
            domain={['dataMin - 1000', 'dataMax + 1000']}
          />
          <YAxis
            yAxisId="volume"
            orientation="right"
            stroke="#999"
            tick={{ fontSize: 11 }}
            domain={[0, 'dataMax * 1.5']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
            }}
            formatter={(value: any, name: string) => {
              if (name === 'volume') return [value.toLocaleString(), '거래량'];
              return [value.toLocaleString(), name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />

          {/* High-Low 라인 */}
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="high"
            stroke="#999"
            strokeWidth={1}
            dot={false}
            name="고가"
            strokeDasharray="3 3"
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="low"
            stroke="#999"
            strokeWidth={1}
            dot={false}
            name="저가"
            strokeDasharray="3 3"
          />

          {/* 종가 라인 */}
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={false}
            name="종가"
          />

          {/* 거래량 */}
          {volumeData && volumeData.length > 0 && (
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="#26a69a"
              opacity={0.3}
              name="거래량"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
