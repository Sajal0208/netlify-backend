import express from "express";
import {
  loginUser,
  registerUser,
  getMe,
  logoutUser,
  getUserWithProject,
  getRefreshToken,
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
router.post("/userWithProject", getUserWithProject);
router.get("/refresh", getRefreshToken);

export default router;
