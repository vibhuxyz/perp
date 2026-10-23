import { useState, useMemo } from 'react';
import { X, Bell, Trash2, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { useChartSettingsStore } from '@/stores/chartSettings.store';

export function AlertModal({
  isOpen,
  onClose,
  currentPrice,
  market,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  market: string;
}) {
  const allAlerts = useChartSettingsStore(s => s.alerts);
  const addAlert = useChartSettingsStore(s => s.addAlert);
  const removeAlert = useChartSettingsStore(s => s.removeAlert);

  const alerts = useMemo(
    () => allAlerts.filter(a => a.market === market),
    [allAlerts, market]
  );

  const [priceInput, setPriceInput] = useState(() => (currentPrice > 0 ? currentPrice.toFixed(1) : ''));
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(priceInput);
    if (!priceNum || priceNum <= 0) return;

    addAlert({
      market,
      price: priceNum,
      condition,
    });

    setCreatedMessage(`Alert created for $${priceNum.toLocaleString()}`);
    setTimeout(() => setCreatedMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-md rounded-xl border border-border-subtle bg-[#0E131F] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 bg-[#111726]">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#F59E0B]" />
            <div>
              <h3 className="text-sm font-semibold text-white">Price Alerts</h3>
              <p className="text-xs text-text-secondary">{market} - Current: ${currentPrice.toLocaleString()}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-text-secondary hover:text-white hover:bg-[#1A2234] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-4 border-b border-border-subtle/70 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCondition('ABOVE')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                condition === 'ABOVE'
                  ? 'border-profit/50 bg-profit/10 text-profit'
                  : 'border-border-subtle bg-[#131A29] text-text-secondary hover:text-white'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Crosses Above</span>
            </button>
            <button
              type="button"
              onClick={() => setCondition('BELOW')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                condition === 'BELOW'
                  ? 'border-loss/50 bg-loss/10 text-loss'
                  : 'border-border-subtle bg-[#131A29] text-text-secondary hover:text-white'
              }`}
            >
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Crosses Below</span>
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-secondary mb-1">Target Price (USD)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
                className="flex-1 bg-[#141C2D] border border-border-subtle rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-primary"
                placeholder="Target Price"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-bg-primary text-xs font-semibold transition-colors cursor-pointer"
              >
                Set Alert
              </button>
            </div>
          </div>

          {createdMessage && (
            <div className="flex items-center gap-1.5 text-xs text-profit">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{createdMessage}</span>
            </div>
          )}
        </form>

        <div className="p-4">
          <h4 className="text-xs font-mono text-text-secondary mb-2">Active Alerts ({alerts.length})</h4>
          {alerts.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-secondary">
              No active alerts for {market}. Create one above!
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {alerts.map(a => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#141C2D] border border-border-subtle/50 text-xs"
                >
                  <div className="flex items-center gap-2 font-mono">
                    {a.condition === 'ABOVE' ? (
                      <TrendingUp className="h-3.5 w-3.5 text-profit" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-loss" />
                    )}
                    <span className="font-bold text-white">${a.price.toLocaleString()}</span>
                    <span className="text-text-secondary text-[10px]">
                      {a.condition === 'ABOVE' ? 'above' : 'below'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAlert(a.id)}
                    className="p-1 rounded text-text-secondary hover:text-loss transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
