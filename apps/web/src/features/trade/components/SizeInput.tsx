import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseFormRegisterReturn } from "react-hook-form";

interface SizeInputProps {
  error?: string;
  register: UseFormRegisterReturn;
}

export function SizeInput({ error, register }: SizeInputProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="order-size" className="text-xs text-text-secondary">
        Size (contracts)
      </Label>
      <div className="relative">
        <Input
          {...register}
          id="order-size"
          placeholder="0.00"
          className="pr-14 tabular-nums"
          aria-describedby={error ? "size-error" : "size-hint"}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary/60 pointer-events-none select-none">
          BTC
        </span>
      </div>
      <p id="size-hint" className="text-[11px] text-text-secondary/70">
        1 contract = 1 BTC. Small sizes recommended while learning.
      </p>
      {error && (
        <span id="size-error" role="alert" className="text-xs text-loss">{error}</span>
      )}
    </div>
  );
}
