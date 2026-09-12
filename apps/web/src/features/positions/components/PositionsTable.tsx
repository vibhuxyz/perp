import { useQuery } from "@tanstack/react-query";
import { fetchPositions } from "@/features/trade/api/tradeApi";
import { unrealisedPnl } from "@/shared/lib/decimal";
import { formatPrice, formatSigned, pnlTone } from "@/shared/lib/formatters";
import { useMarketStore } from "@/stores/market.store";

export function PositionsTable() {
  const markPrice = useMarketStore(s => s.indexPrice);
  const { data: positions = [], error } = useQuery({
    queryKey: ["positions"],
    queryFn: fetchPositions,
    refetchInterval: 1_000,
  });

  if (error) {
    return <p className="p-3 text-xs text-loss">Could not load positions — {error.message}</p>;
  }

  if (positions.length === 0) {
    return <p className="p-3 text-xs text-text-secondary">No open positions.</p>;
  }

  return (
    <table className="w-full text-left text-xs tabular-nums">
      <thead className="text-text-secondary">
        <tr>
          {["Market", "Side", "Size", "Entry", "Margin", "Liq.", "uPnL"].map(h => (
            <th key={h} className="px-3 py-2 font-normal">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {positions.map(position => {
          const pnl = markPrice
            ? unrealisedPnl(position.side, position.averagePrice, markPrice, position.quantity)
            : null;
          const tone = pnl ? pnlTone(pnl) : "flat";

          return (
            <tr key={position.market} className="border-t border-border-subtle">
              <td className="px-3 py-2 text-text-primary">{position.market}</td>
              <td className={`px-3 py-2 ${position.side === "LONG" ? "text-profit" : "text-loss"}`}>
                {position.side}
              </td>
              <td className="px-3 py-2">{position.quantity}</td>
              <td className="px-3 py-2">{formatPrice(position.averagePrice)}</td>
              <td className="px-3 py-2">{formatPrice(position.margin)}</td>
              <td className="px-3 py-2">{formatPrice(position.liquidationPrice)}</td>
              <td
                className={`px-3 py-2 ${
                  tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : ""
                }`}
              >
                {pnl ? formatSigned(pnl) : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
