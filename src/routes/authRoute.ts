import express, { Request, Response } from "express";
import {
  loginUser,
  registerUser,
  getMe,
  logoutUser,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticateToken, getMe);
router.post("/logout", logoutUser);

export default router;
