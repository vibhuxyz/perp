import { Link } from 'react-router-dom';
import { Sun } from 'lucide-react';

export function PageHeader() {
  return (
    <header className="flex h-16 w-full items-center justify-between px-6 lg:px-12">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-info to-[#7152FF] shadow-md shadow-[#7152FF]/20 group-hover:scale-105 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 17L12 3L21 17L12 14L3 17Z" fill="white" fillOpacity="0.95" />
            <path d="M12 14V3L21 17L12 14Z" fill="white" fillOpacity="0.75" />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-tight text-white">PaperTrade</span>
      </Link>

      <button
        type="button"
        title="Toggle theme"
        className="p-2 rounded-xl text-text-secondary hover:text-white hover:bg-bg-elevated transition-colors cursor-pointer"
      >
        <Sun className="h-4 w-4" />
      </button>
    </header>
  );
}
