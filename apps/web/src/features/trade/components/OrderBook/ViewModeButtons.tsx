import { Lock } from 'lucide-react';

export type ViewMode = 'all' | 'asks' | 'bids';

export function ViewModeButtons({ viewMode, onSelect }: { viewMode: ViewMode; onSelect: (mode: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={`p-1 rounded transition-colors ${viewMode === 'all' ? 'bg-[#161E2E] text-profit' : 'text-text-secondary hover:text-white'}`}
        title="Default (Asks & Bids)"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <rect y="1" width="16" height="2" rx="1" fill="#FF4D5A" />
          <rect y="5" width="16" height="2" rx="1" fill="#FF4D5A" />
          <rect y="9" width="16" height="2" rx="1" fill="#00F29D" />
          <rect y="13" width="16" height="2" rx="1" fill="#00F29D" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => onSelect('bids')}
        className={`p-1 rounded transition-colors ${viewMode === 'bids' ? 'bg-[#161E2E] text-profit' : 'text-text-secondary hover:text-white'}`}
        title="Bids Only"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <rect y="1" width="16" height="2" rx="1" fill="#00F29D" />
          <rect y="5" width="16" height="2" rx="1" fill="#00F29D" />
          <rect y="9" width="16" height="2" rx="1" fill="#00F29D" />
          <rect y="13" width="16" height="2" rx="1" fill="#00F29D" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => onSelect('asks')}
        className={`p-1 rounded transition-colors ${viewMode === 'asks' ? 'bg-[#161E2E] text-loss' : 'text-text-secondary hover:text-white'}`}
        title="Asks Only"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <rect y="1" width="16" height="2" rx="1" fill="#FF4D5A" />
          <rect y="5" width="16" height="2" rx="1" fill="#FF4D5A" />
          <rect y="9" width="16" height="2" rx="1" fill="#FF4D5A" />
          <rect y="13" width="16" height="2" rx="1" fill="#FF4D5A" />
        </svg>
      </button>

      <button type="button" className="p-1 rounded text-text-secondary hover:text-white transition-colors" title="Lock view">
        <Lock className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
