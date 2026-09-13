import { Lightbulb, Key, RefreshCw, Shield, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const CARDS = [
  {
    id: 'leverage',
    title: 'What is leverage?',
    desc: 'Learn how it amplifies both profits and losses.',
    icon: Key,
    iconColor: 'text-[#00D2FF]',
    iconBg: 'bg-[#00D2FF]/10',
  },
  {
    id: 'funding',
    title: 'Understanding funding rates',
    desc: 'Why you pay or receive funding in perpetuals.',
    icon: RefreshCw,
    iconColor: 'text-[#00D2FF]',
    iconBg: 'bg-[#00D2FF]/10',
  },
  {
    id: 'stop-loss',
    title: 'Set a stop loss',
    desc: 'Protect your position from large losses.',
    icon: Shield,
    iconColor: 'text-[#00F29D]',
    iconBg: 'bg-[#00F29D]/10',
  },
];

export function LearnCardsRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#0E121B] rounded-xl border border-[#1A2333] p-3 select-none">
      {/* Left intro box */}
      <div className="flex items-start gap-3 p-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5B942]/10 text-[#F5B942] shrink-0 mt-0.5">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white leading-tight">Learn while you trade</span>
          <span className="text-[11px] text-[#8492A6] leading-snug mt-0.5">
            Get real-time explanations, tips and risk insights for a better trading experience.
          </span>
        </div>
      </div>

      {/* 3 Actionable Lesson Cards */}
      {CARDS.map(card => {
        const Icon = card.icon;
        return (
          <NavLink
            key={card.id}
            to="/learn"
            className="flex items-center justify-between gap-2.5 rounded-xl border border-[#1A2333] bg-[#111622] hover:bg-[#151D2C] hover:border-[#28354B] p-3 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor} shrink-0`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate group-hover:text-[#00D2FF] transition-colors">
                  {card.title}
                </span>
                <span className="text-[10px] text-[#8492A6] truncate">
                  {card.desc}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#8492A6] group-hover:text-white shrink-0 group-hover:translate-x-0.5 transition-all" />
          </NavLink>
        );
      })}
    </div>
  );
}
