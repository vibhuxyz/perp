import express from "express";
import { createMarket } from "../controller/auth.controller";
const router = express();

router.post("/market", createMarket);

export default router;
