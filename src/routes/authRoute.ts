import express from "express";
import {
  loginUser,
  registerUser,
  getMe,
  logoutUser,
  getUserWithProject,
  handleRefreshToken,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticateToken, getMe);
router.post("/logout", logoutUser);
router.post("/userWithProject", getUserWithProject);
router.get("/refresh", handleRefreshToken);

export default router;
