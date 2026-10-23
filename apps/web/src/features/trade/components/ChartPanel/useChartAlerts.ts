import { useEffect, useRef, type RefObject } from 'react';
import { LineStyle, type ISeriesApi, type IPriceLine } from 'lightweight-charts';
import { useChartSettingsStore } from '@/stores/chartSettings.store';

interface UseAlertsProps {
  seriesRef: RefObject<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>;
  market: string;
  livePrice: number;
}

export function useChartAlerts({ seriesRef, market, livePrice }: UseAlertsProps) {
  const alerts = useChartSettingsStore(s => s.alerts);
  const markAlertTriggered = useChartSettingsStore(s => s.markAlertTriggered);
  const linesRef = useRef<Map<string, IPriceLine>>(new Map());

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    const currentMap = linesRef.current;
    const activeMarketAlerts = alerts.filter(a => a.market === market && !a.triggered);
    const activeIds = new Set(activeMarketAlerts.map(a => a.id));

    for (const [id, line] of currentMap.entries()) {
      if (!activeIds.has(id)) {
        series.removePriceLine(line);
        currentMap.delete(id);
      }
    }

    for (const alert of activeMarketAlerts) {
      if (!currentMap.has(alert.id)) {
        const line = series.createPriceLine({
          price: alert.price,
          color: alert.condition === 'ABOVE' ? '#F59E0B' : '#FF4D5A',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `ALERT ${alert.condition === 'ABOVE' ? '▲' : '▼'}`,
        });
        currentMap.set(alert.id, line);
      }
    }

    return () => {
      for (const line of currentMap.values()) {
        series.removePriceLine(line);
      }
      currentMap.clear();
    };
  }, [seriesRef, alerts, market]);

  useEffect(() => {
    if (livePrice <= 0) return;

    for (const alert of alerts) {
      if (alert.market !== market || alert.triggered) continue;

      const hit =
        (alert.condition === 'ABOVE' && livePrice >= alert.price) ||
        (alert.condition === 'BELOW' && livePrice <= alert.price);

      if (hit) {
        markAlertTriggered(alert.id);
      }
    }
  }, [livePrice, alerts, market, markAlertTriggered]);
}
