import { ENV } from "@repo/env-config";
import express from "express";
import cors from "cors";
import authRouter from "./router/auth.routes";
import walletRouter from "./router/wallet.route";
import orderRouter from "./router/order.route";
import marketRouter from "./router/market.route";
import adminRouter from "./router/admin.route";
import { start } from "./exchange";

const app = express();

app.use(cors({ origin: ENV.WEB_URL, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/wallet", walletRouter);
app.use("/api", orderRouter);
app.use("/api", marketRouter);

app.use("/api/v1", authRouter);
app.use("/api/v1", walletRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1", marketRouter);
app.use("/admin", adminRouter);

start();

app.listen(ENV.PORT, () => {
  console.log(`server listening on http://localhost:${ENV.PORT}`);
});
