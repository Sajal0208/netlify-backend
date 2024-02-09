import express from "express";
import { loginUser, registerUser, getMe } from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";
const router = express.Router();

router.get("/register", registerUser);
router.get("/login", loginUser);
router.get("/me", authenticateToken, getMe);

export default router;
