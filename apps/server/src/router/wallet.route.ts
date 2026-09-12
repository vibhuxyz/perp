import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { createWallet } from "../controller/wallet.contoller";

const router = express();

router.post("/onramp", authMiddleware, createWallet);

export default router;
