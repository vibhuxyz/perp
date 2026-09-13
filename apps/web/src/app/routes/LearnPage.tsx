import { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, TrendingUp, Target, Layers, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const LESSONS = [
  {
    id: 1,
    title: "What is a perpetual futures contract?",
    description: "Learn how perps work, why they never expire, and how funding rates keep them pegged to spot.",
    duration: "5 min",
    category: "Basics",
    icon: BookOpen,
  },
  {
    id: 2,
    title: "Understanding leverage and margin",
    description: "Discover how leverage amplifies gains and losses, and how initial margin protects the exchange.",
    duration: "7 min",
    category: "Risk",
    icon: Layers,
  },
  {
    id: 3,
    title: "How liquidation works",
    description: "Your position will be closed if mark price hits your liquidation price. Learn to manage the risk.",
    duration: "6 min",
    category: "Risk",
    icon: Target,
  },
  {
    id: 4,
    title: "Long vs Short positions",
    description: "Going Long means you profit when price rises. Going Short means you profit when price falls.",
    duration: "4 min",
    category: "Basics",
    icon: TrendingUp,
  },
];

export default function LearnPage() {
  const [completedIds, setCompletedIds] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('papertrade_learn_completed');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const percent = Math.round((completedIds.length / LESSONS.length) * 100);

  useEffect(() => {
    try {
      localStorage.setItem('papertrade_learn_completed', JSON.stringify(completedIds));
      localStorage.setItem('papertrade_learn_progress', String(percent));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // storage quota or private browsing
    }
  }, [completedIds, percent]);

  const handleToggleLesson = (id: number) => {
    setCompletedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      return [...prev, id];
    });
  };

  return (
    <div className="p-4 flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="h-5 w-5 text-brand" />
          <h1 className="text-base font-bold text-text-primary">Learn</h1>
        </div>
        <p className="text-sm text-text-secondary">
          Master trading mechanics with bite-sized lessons. Complete a lesson, then practise immediately with virtual money.
        </p>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">Your progress</span>
          <span className="text-xs text-text-secondary">
            {completedIds.length} of {LESSONS.length} complete ({percent}%)
          </span>
        </div>
        <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Learning progress"
          />
        </div>
        <p className="mt-2 text-[11px] text-text-secondary/60">
          Learning progress tracks your completed simulator lessons.
        </p>
      </div>

      {/* Lesson cards */}
      <div className="flex flex-col gap-3">
        {LESSONS.map((lesson, idx) => {
          const Icon = lesson.icon;
          const isDone = completedIds.includes(lesson.id);

          return (
            <Card
              key={lesson.id}
              className={`cursor-pointer transition-colors ${
                isDone ? 'border-profit/30 bg-profit/5' : 'hover:border-brand/30'
              }`}
            >
              <CardContent className="flex items-start gap-4 py-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    isDone ? 'bg-profit/15 text-profit' : 'bg-bg-elevated text-brand/70'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-text-primary">
                      {idx + 1}. {lesson.title}
                    </span>
                    <Badge variant="info">{lesson.category}</Badge>
                    {isDone && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-profit">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {lesson.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-text-secondary/60">{lesson.duration} read</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleLesson(lesson.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      isDone
                        ? 'bg-profit/20 text-profit hover:bg-profit/30'
                        : 'bg-brand/15 text-brand hover:bg-brand/25'
                    }`}
                  >
                    {isDone ? 'Done ✓' : 'Start'}
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
