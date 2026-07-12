import express from "express";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { createWallet } from "../controller/wallet.contoller";

const router = express();

router.post("/onramp", AuthMiddleware, createWallet);

export default router;
