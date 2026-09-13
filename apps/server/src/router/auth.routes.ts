import express from "express";
import { signIn, signUp, getMe } from "../controller/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/signup", signUp);
router.post("/register", signUp);

router.post("/signin", signIn);
router.post("/login", signIn);

router.get("/me", authMiddleware, getMe);

export default router;

