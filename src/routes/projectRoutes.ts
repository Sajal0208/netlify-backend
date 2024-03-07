import express, { Request, Response } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  deployProject,
  deleteProject,
  getProjectsByUser,
  getProjectById,
} from "../controllers/projectController";
const router = express.Router();

router.get("/", authenticateToken, getProjectsByUser);
router.post("/", authenticateToken, deployProject);
router.get("/:id", authenticateToken, getProjectById);
router.delete("/:id", authenticateToken, deleteProject);

export default router;
