import { Clock, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function HistoryPage() {
  return (
    <div className="p-4 flex flex-col gap-4 max-w-2xl">
      <div>
        <h1 className="text-base font-bold text-text-primary">Trade history</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Review your past practice trades, fills, and cancelled orders.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-elevated">
            <Clock className="h-6 w-6 text-text-secondary/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-secondary">Trade history coming soon</p>
            <p className="mt-1 text-xs text-text-secondary/60 max-w-xs leading-relaxed">
              A paginated order and fill history requires an endpoint on the engine.
              This page will populate automatically once it's available.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary/50 mt-2">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Review past trades to learn from your decisions</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
