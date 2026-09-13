import { FlaskConical, ArrowLeft } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center bg-[#0A0D14] select-none">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#131824] border border-[#1A2333] mb-4 shadow-lg">
        <FlaskConical className="h-8 w-8 text-[#7052FF]" />
      </div>
      <h1 className="text-xl font-bold text-white mb-2">{title}</h1>
      <p className="text-sm text-[#8492A6] max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      <NavLink
        to="/"
        className="flex items-center gap-2 rounded-xl bg-[#7052FF] hover:bg-[#6042EE] text-white text-xs font-semibold px-4 py-2.5 transition-all shadow-md shadow-[#7052FF]/20 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Trading Terminal</span>
      </NavLink>
    </div>
  );
}
