import { useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
} from 'lightweight-charts';
import { CHART_OPTIONS, CANDLE_OPTIONS } from '../../trade/components/ChartPanel/chartOptions';
import { useSimulationStore } from '../useSimulationStore';
import { generateCandlesFromPoints } from '../simulationEngine';

export function SimulationChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const entryLineRef = useRef<IPriceLine | null>(null);
  const liqLineRef = useRef<IPriceLine | null>(null);

  const scenario = useSimulationStore(s => s.activeScenario);
  const currentTimeSec = useSimulationStore(s => s.currentTimeSec);
  const baseTimestamp = useSimulationStore(s => s.baseTimestamp);
  const position = useSimulationStore(s => s.position);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;
    const chart = createChart(container, CHART_OPTIONS);
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, CANDLE_OPTIONS);
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          chart.resize(entry.contentRect.width, entry.contentRect.height);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !scenario) return;
    const candles = generateCandlesFromPoints(scenario.points, currentTimeSec, baseTimestamp, 5);
    if (candles.length > 0) {
      seriesRef.current.setData(candles);
    }
  }, [scenario, currentTimeSec, baseTimestamp]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    if (entryLineRef.current) {
      series.removePriceLine(entryLineRef.current);
      entryLineRef.current = null;
    }
    if (liqLineRef.current) {
      series.removePriceLine(liqLineRef.current);
      liqLineRef.current = null;
    }

    if (position) {
      entryLineRef.current = series.createPriceLine({
        price: position.entryPrice,
        color: position.side === 'LONG' ? '#00F29D' : '#06B6D4',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `ENTRY ${position.side}`,
      });

      liqLineRef.current = series.createPriceLine({
        price: position.liquidationPrice,
        color: '#FF4D5A',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: 'LIQUIDATION',
      });
    }
  }, [position]);

  return <div ref={chartContainerRef} className="flex-1 w-full h-full relative" />;
}
