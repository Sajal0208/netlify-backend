import express, { Request, Response } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  deployProject,
  deleteProject,
  getProjects,
  getProjectById,
} from "../controllers/projectController";
const router = express.Router();

router.post("/", authenticateToken, deployProject);
router.delete("/:id", authenticateToken, deleteProject);
router.get("/", authenticateToken, getProjects);
router.get("/:id", authenticateToken, getProjectById);

export default router;
