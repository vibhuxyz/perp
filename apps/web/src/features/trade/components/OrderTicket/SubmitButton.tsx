import type { OptimisticOrderStatus } from "@/stores/optimistic-orders.store";

function buttonColor(isAuthenticated: boolean, isLong: boolean, status: OptimisticOrderStatus | null) {
  if (!isAuthenticated) return "bg-[#7152FF] hover:bg-[#6042EE] text-white shadow-[#7152FF]/25";
  if (status === "Submitting") return "bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/20";
  if (status === "Accepted") return "bg-[#00DA8E] text-black shadow-md shadow-[#00DA8E]/20";
  if (status === "Rejected") return "bg-[#FF4D5A] text-white shadow-md shadow-[#FF4D5A]/20";
  return isLong
    ? "bg-[#00DA8E] hover:bg-[#00C57F] text-black shadow-md shadow-[#00DA8E]/20"
    : "bg-[#FF4D5A] hover:bg-[#EE404D] text-white shadow-md shadow-[#FF4D5A]/20";
}

function buttonLabel(
  isPending: boolean,
  isAuthenticated: boolean,
  isLong: boolean,
  status: OptimisticOrderStatus | null,
) {
  if (status === "Submitting" || isPending) return "Submitting…";
  if (status === "Accepted") return "Accepted (Resting on Book)";
  if (status === "Filled") return "Filled!";
  if (status === "Rejected") return "Order Rejected";
  if (!isAuthenticated) return "Log in to trade";
  return isLong ? "Open Long (Demo)" : "Open Short (Demo)";
}

export function SubmitButton({
  isAuthenticated,
  isLong,
  isPending,
  optimisticStatus,
  displayQuantity,
  baseAsset = "BTC",
  onClick,
}: {
  isAuthenticated: boolean;
  isLong: boolean;
  isPending: boolean;
  optimisticStatus?: OptimisticOrderStatus | null;
  displayQuantity: string;
  baseAsset?: string;
  onClick: () => void;
}) {
  const currentStatus = optimisticStatus ?? null;
  return (
    <div className="mt-auto pt-2">
      <button
        type="button"
        disabled={isPending || currentStatus === "Submitting"}
        onClick={onClick}
        className={[
          "w-full rounded-xl py-2.5 px-4 flex flex-col items-center justify-center transition-all cursor-pointer font-sans shadow-lg",
          buttonColor(isAuthenticated, isLong, currentStatus),
          isPending || currentStatus === "Submitting" ? "opacity-75 pointer-events-none" : "",
        ].join(" ")}
      >
        <span className="text-sm font-bold leading-tight">
          {buttonLabel(isPending, isAuthenticated, isLong, currentStatus)}
        </span>
        {isAuthenticated && Number(displayQuantity) > 0 && (
          <span className="text-xs font-medium opacity-80 font-mono leading-tight mt-0.5">
            ≈ {displayQuantity} {baseAsset}
          </span>
        )}
      </button>
    </div>
  );
}
