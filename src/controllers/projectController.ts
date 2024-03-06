import { Projects } from "@prisma/client";
import { CustomRequest } from "../middleware/authMiddleware";
import {
  createProject,
  createProjectBody,
  runNewTask,
} from "../services/projectService";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/db";

export interface IDeployProjectData {
  title: string;
  authorId: number;
  repoUrl: string;
  deployedLink: string;
}

export const deployProject = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, repoUrl } = req.body;

    if (!req.user) {
      return res.status(401).send("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return res.status(401).send("Unauthorized");
    }

    const { username, id } = user;

    const projectBody = await createProjectBody(
      { title, authorId: id, repoUrl },
      username,
      next
    );

    if (!projectBody) {
      throw new Error("Something Went Wrong");
    }

    const newProject: Projects | undefined = await createProject(
      projectBody,
      id,
      next
    );

    if (!newProject) {
      throw new Error("");
    }

    await runNewTask(
      {
        userId: id,
        projectId: newProject.id,
        repoUrl: repoUrl,
      },
      next
    );

    return res.json({
      status: "queued",
      url: newProject.deployedLink,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

export const deleteProject = async (req: Request, res: Response) => {};

export const getProjects = async (req: Request, res: Response) => {};

export const getProjectById = async (req: Request, res: Response) => {};
