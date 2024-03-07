import { Projects } from "@prisma/client";
import { CustomRequest } from "../middleware/authMiddleware";
import {
  createProject,
  createProjectBody,
  runNewTask,
} from "../services/projectService";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/db";
import NotFoundError from "../errors/NotFoundError";
import UnauthorizedError from "../errors/UnauthorizedError";

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

export const getProjectsByUser = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const id = req?.user?.id;

  if (!id) {
    throw new UnauthorizedError({
      message: "Unauthorized",
    });
  }

  try {
    const projects = await prisma.projects.findMany({
      where: {
        authorId: id,
      },
    });

    return res.json(projects);
  } catch (e: any) {
    next(e);
  }
};

export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const project = await prisma.projects.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!project) {
      throw new NotFoundError({
        message: "Project not found",
      });
    }

    return res.json(project);
  } catch (e: any) {
    next(e);
  }
};
