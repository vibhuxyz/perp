import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseFormRegisterReturn } from "react-hook-form";
import { DollarSign } from "lucide-react";

interface PriceInputProps {
  isDisabled: boolean;
  error?: string;
  register: UseFormRegisterReturn;
}

export function PriceInput({ isDisabled, error, register }: PriceInputProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="order-price" className="text-xs text-text-secondary">
        Limit price
      </Label>
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary/60 pointer-events-none" aria-hidden />
        <Input
          {...register}
          id="order-price"
          disabled={isDisabled}
          placeholder={isDisabled ? "Market price" : "0.00"}
          className="pl-8 tabular-nums disabled:opacity-40"
          aria-describedby={error ? "price-error" : "price-hint"}
        />
      </div>
      {isDisabled ? (
        <p id="price-hint" className="text-[11px] text-text-secondary/70">
          Market orders execute at the best available price.
        </p>
      ) : (
        <p id="price-hint" className="text-[11px] text-text-secondary/70">
          Your order will only fill at this price or better.
        </p>
      )}
      {error && (
        <span id="price-error" role="alert" className="text-xs text-loss">{error}</span>
      )}
    </div>
  );
}
