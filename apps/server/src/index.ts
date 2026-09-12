import "./load-env";
import express from "express";
import cors from "cors";
import authRouter from "./router/auth.routes";
import walletRouter from "./router/wallet.route";
import orderRouter from "./router/order.route";
import marketRouter from "./router/market.route";
import adminRouter from "./router/admin.route";
import { start } from "./exchange";

const app = express();
const port = Number(process.env.PORT ?? 6000);

app.use(cors());
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

app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`);
});
