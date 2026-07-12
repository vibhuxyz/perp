import express from "express";
import { createMarket } from "../controller/auth.controller";
const router = express();

router.post("/admin/market", createMarket);

export default router;
