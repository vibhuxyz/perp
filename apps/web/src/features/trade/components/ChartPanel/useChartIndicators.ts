import { useEffect, useRef, type RefObject } from 'react';
import { LineSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import type { IndicatorState } from '@/stores/chartSettings.store';
import type { CandlestickData } from '../chartData';
import { calculateSMA, calculateEMA, calculateBollingerBands } from './indicators';

interface UseIndicatorsProps {
  chartRef: RefObject<IChartApi | null>;
  candles: CandlestickData[];
  indicators: IndicatorState;
  volumeSeriesRef: RefObject<ISeriesApi<'Histogram'> | null>;
}

export function useChartIndicators({ chartRef, candles, indicators, volumeSeriesRef }: UseIndicatorsProps) {
  const ma7Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ma25Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ma99Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ema20Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbMidRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    volumeSeriesRef.current?.applyOptions({ visible: indicators.volume });
  }, [indicators.volume, volumeSeriesRef]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candles.length === 0) return;

    const syncLine = (
      ref: React.MutableRefObject<ISeriesApi<'Line'> | null>,
      isActive: boolean,
      color: string,
      data: Array<{ time: CandlestickData['time']; value: number }>,
    ) => {
      if (!isActive) {
        if (ref.current) {
          chart.removeSeries(ref.current);
          ref.current = null;
        }
        return;
      }
      if (!ref.current) {
        ref.current = chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
      }
      ref.current.setData(data);
    };

    syncLine(ma7Ref, indicators.ma7, '#F59E0B', calculateSMA(candles, 7));
    syncLine(ma25Ref, indicators.ma25, '#06B6D4', calculateSMA(candles, 25));
    syncLine(ma99Ref, indicators.ma99, '#8B5CF6', calculateSMA(candles, 99));
    syncLine(ema20Ref, indicators.ema20, '#10B981', calculateEMA(candles, 20));

    const bb = indicators.bollinger ? calculateBollingerBands(candles, 20, 2) : null;
    syncLine(bbUpperRef, indicators.bollinger, '#3B82F6', bb?.upper ?? []);
    syncLine(bbMidRef, indicators.bollinger, '#3B82F6', bb?.middle ?? []);
    syncLine(bbLowerRef, indicators.bollinger, '#3B82F6', bb?.lower ?? []);
  }, [chartRef, candles, indicators]);
}
