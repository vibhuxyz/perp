import { useEffect, useState } from "react";
import { API_ROUTES, MARKET, WS_URL } from "../utils/constant";

interface Level {
  price: string;
  quantity: string;
}

interface Depth {
  bids: Level[];
  asks: Level[];
  lastTradePrice: string | null;
  indexPrice: string;
}

interface Position {
  market: string;
  side: string;
  quantity: string;
  averagePrice: string;
  margin: string;
  liquidationPrice: string;
}

export function TradingPage() {
  const [token, setToken] = useState(() => localStorage.getItem("token") ?? "");
  const [depth, setDepth] = useState<Depth | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [equity, setEquity] = useState<{ availableBalance: string; marginLocked: string } | null>(null);
  const [events, setEvents] = useState<string[]>([]);

  const [side, setSide] = useState("LONG");
  const [type, setType] = useState("LIMIT");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("50000");
  const [leverage, setLeverage] = useState("2");

  useEffect(() => {
    const socket = new WebSocket(WS_URL);

    socket.onmessage = event => {
      setEvents(prev => [event.data as string, ...prev].slice(0, 40));
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    const refresh = async () => {
      setDepth(await fetch(`${API_ROUTES.DEPTH}/${MARKET}`).then(r => r.json()).catch(() => null));

      if (!token) return;

      const auth = { headers: { token } };
      setPositions(await fetch(API_ROUTES.POSITIONS, auth).then(r => r.json()).catch(() => []));
      setEquity(await fetch(API_ROUTES.EQUITY, auth).then(r => r.json()).catch(() => null));
    };

    refresh();
    const timer = setInterval(refresh, 1000);

    return () => clearInterval(timer);
  }, [token]);

  const saveToken = (value: string) => {
    setToken(value);
    localStorage.setItem("token", value);
  };

  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify(body),
    });

    setEvents(prev => [`${url.split("/").pop()}: ${await res.text()}`, ...prev].slice(0, 40));
  };

  return (
    <div style={{ fontFamily: "monospace", padding: 16, display: "grid", gap: 16 }}>
      <h1>{MARKET}</h1>

      <div>
        <input
          style={{ width: 420 }}
          placeholder="JWT token"
          value={token}
          onChange={e => saveToken(e.target.value)}
        />
        <button onClick={() => post(API_ROUTES.DEPOSIT, { amount: "1000000" })}>deposit 1,000,000</button>
      </div>

      <div style={{ display: "flex", gap: 48 }}>
        <div>
          <h3>Order</h3>
          <select value={side} onChange={e => setSide(e.target.value)}>
            <option>LONG</option>
            <option>SHORT</option>
          </select>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option>LIMIT</option>
            <option>MARKET</option>
          </select>
          <input size={6} value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="qty" />
          <input size={8} value={price} onChange={e => setPrice(e.target.value)} placeholder="price" disabled={type === "MARKET"} />
          <input size={4} value={leverage} onChange={e => setLeverage(e.target.value)} placeholder="lev" />
          <button
            onClick={() =>
              post(API_ROUTES.ORDER, {
                market: MARKET,
                side,
                type,
                quantity,
                leverage,
                ...(type === "LIMIT" ? { price } : {}),
              })
            }
          >
            place
          </button>
        </div>

        <div>
          <h3>Equity</h3>
          <div>available: {equity?.availableBalance ?? "-"}</div>
          <div>locked: {equity?.marginLocked ?? "-"}</div>
          <div>index: {depth?.indexPrice ?? "-"}</div>
          <div>last trade: {depth?.lastTradePrice ?? "-"}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 48 }}>
        <div>
          <h3>Asks</h3>
          {depth?.asks.map(l => <div key={l.price}>{l.price} × {l.quantity}</div>)}
          <h3>Bids</h3>
          {depth?.bids.map(l => <div key={l.price}>{l.price} × {l.quantity}</div>)}
        </div>

        <div>
          <h3>Positions</h3>
          {positions.length === 0 && <div>none</div>}
          {positions.map(p => (
            <div key={p.market}>
              {p.side} {p.quantity} @ {p.averagePrice} · margin {p.margin} · liq {p.liquidationPrice}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3>Feed</h3>
        <pre style={{ maxHeight: 300, overflow: "auto" }}>{events.join("\n")}</pre>
      </div>
    </div>
  );
}
