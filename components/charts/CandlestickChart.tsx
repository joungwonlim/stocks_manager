'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';

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
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 차트 생성
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#D1D4DC',
      },
      rightPriceScale: {
        borderColor: '#D1D4DC',
      },
      crosshair: {
        vertLine: {
          color: '#9598A1',
          width: 1,
          style: 1,
          labelBackgroundColor: '#4682B4',
        },
        horzLine: {
          color: '#9598A1',
          width: 1,
          style: 1,
          labelBackgroundColor: '#4682B4',
        },
      },
    });

    chartRef.current = chart;

    // 캔들스틱 시리즈 추가
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#ef5350',
      downColor: '#26a69a',
      borderUpColor: '#ef5350',
      borderDownColor: '#26a69a',
      wickUpColor: '#ef5350',
      wickDownColor: '#26a69a',
    });

    candleSeriesRef.current = candleSeries;

    // 데이터 포맷 변환 (ISO string → Unix timestamp)
    const formattedData = data.map((d) => ({
      time: new Date(d.time).getTime() / 1000,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candleSeries.setData(formattedData);

    // 거래량 차트 추가 (옵션)
    if (volumeData && volumeData.length > 0) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      volumeSeriesRef.current = volumeSeries;

      const formattedVolumeData = volumeData.map((v) => ({
        time: new Date(v.time).getTime() / 1000,
        value: v.value,
        color: v.color || '#26a69a',
      }));

      volumeSeries.setData(formattedVolumeData);
    }

    // 차트를 데이터에 맞게 자동 피팅
    chart.timeScale().fitContent();

    // 윈도우 리사이즈 핸들러
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, height, volumeData]);

  return (
    <div className="relative">
      <div ref={chartContainerRef} className="rounded-lg border border-zinc-200" />
    </div>
  );
}
