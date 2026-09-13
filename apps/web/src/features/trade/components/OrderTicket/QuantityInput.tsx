import type { UseFormRegister } from 'react-hook-form';
import type { OrderFormValues } from '../../hooks/useOrderForm';

export function QuantityInput({ register }: { register: UseFormRegister<OrderFormValues> }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-secondary">Quantity</span>
      <div className="flex items-center justify-between rounded-xl bg-[#141924] border border-[#1E2638]/70 px-3.5 py-2.5 focus-within:border-[#3B82F6] transition-colors">
        <input
          id="order-size"
          {...register('quantity')}
          placeholder="0"
          className="w-full bg-transparent text-base font-semibold text-white font-mono tabular-nums placeholder:text-text-muted focus:outline-none"
        />
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F7931A] text-white font-bold text-xs shadow-xs ml-2 select-none">
          ₿
        </div>
      </div>
    </div>
  );
}
