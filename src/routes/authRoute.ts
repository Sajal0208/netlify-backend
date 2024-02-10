import express, { Request, Response } from "express";
import { loginUser, registerUser, getMe } from "../controllers/authController";
import { CustomRequest, authenticateToken } from "../middleware/authMiddleware";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticateToken, getMe);

export default router;
