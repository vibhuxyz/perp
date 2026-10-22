import type { UseFormRegister } from 'react-hook-form';
import type { OrderFormValues } from '../../hooks/useOrderForm';
import { formatPrice } from '@/shared/lib/formatters';

export function PriceInput({
  register,
  isMarketOrder,
  indexPrice,
  onMidClick,
  onBboClick,
}: {
  register: UseFormRegister<OrderFormValues>;
  isMarketOrder: boolean;
  indexPrice: string | null;
  onMidClick: () => void;
  onBboClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-text-secondary">Price</span>
        <div className="flex items-center gap-1.5 font-medium text-xs">
          <button
            type="button"
            onClick={onMidClick}
            className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors cursor-pointer"
          >
            Mid
          </button>
          <span className="text-[#2B384E]">|</span>
          <button
            type="button"
            onClick={onBboClick}
            className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors cursor-pointer"
          >
            BBO
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-[#141924] border border-[#1E2638]/70 px-3.5 py-2.5 focus-within:border-[#3B82F6] transition-colors">
        <input
          id="order-price"
          {...register('price')}
          disabled={isMarketOrder}
          placeholder={isMarketOrder ? 'Market price' : indexPrice ? formatPrice(indexPrice) : '0.0'}
          className="w-full bg-transparent text-base font-semibold text-white font-mono tabular-nums placeholder:text-text-muted border-none outline-none ring-0 shadow-none focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50"
        />
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white font-bold text-xs shadow-xs ml-2 select-none">
          $
        </div>
      </div>
    </div>
  );
}
