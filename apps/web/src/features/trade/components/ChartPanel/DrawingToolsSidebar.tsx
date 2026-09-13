import { Crosshair, PenTool, Hash, Type, Ruler, Trash2, Smile } from 'lucide-react';

export function DrawingToolsSidebar() {
  return (
    <div className="w-8 shrink-0 border-r border-border-subtle bg-[#0C1018] flex flex-col items-center py-2 gap-2 text-[#6A788E]">
      <button type="button" className="p-1 text-info bg-[#141C2B] rounded hover:text-white transition-colors cursor-pointer" title="Crosshair">
        <Crosshair className="h-3.5 w-3.5" />
      </button>
      <button type="button" className="p-1 hover:text-white rounded transition-colors cursor-pointer" title="Draw Line">
        <PenTool className="h-3.5 w-3.5" />
      </button>
      <button type="button" className="p-1 hover:text-white rounded transition-colors cursor-pointer" title="Fibonacci">
        <Hash className="h-3.5 w-3.5" />
      </button>
      <button type="button" className="p-1 hover:text-white rounded transition-colors cursor-pointer" title="Text Note">
        <Type className="h-3.5 w-3.5" />
      </button>
      <button type="button" className="p-1 hover:text-white rounded transition-colors cursor-pointer" title="Patterns">
        <Smile className="h-3.5 w-3.5" />
      </button>
      <button type="button" className="p-1 hover:text-white rounded transition-colors cursor-pointer" title="Measure Ruler">
        <Ruler className="h-3.5 w-3.5" />
      </button>
      <div className="mt-auto">
        <button type="button" className="p-1 hover:text-loss rounded transition-colors cursor-pointer" title="Remove Drawings">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
