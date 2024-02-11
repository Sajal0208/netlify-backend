import { CustomRequest } from "../middleware/authMiddleware";
import { createProjectBody } from "../services/projectService";
import { generateId } from "../utils";
import { Request, Response } from "express";
import simpleGit from "simple-git";

export interface IDeployProjectData {
  title?: string;
  authorId: number;
  repoUrl: string;
}

export const deployProject = async (req: CustomRequest, res: Response) => {
  const { title, repoUrl } = req.body;

  const user = req.user;

  if (!user) {
    return res.status(401).send("Unauthorized");
  }
  const { username, id } = user;

  const randomId = generateId();

  const projectBody = createProjectBody(
    { title, authorId: id, repoUrl },
    username,
    randomId
  );

  await simpleGit().clone(repoUrl, `./projects/${username}/${randomId}`);

  res.send("Hello World");
};

export const deleteProject = async (req: Request, res: Response) => {};

export const getProjects = async (req: Request, res: Response) => {};

export const getProjectById = async (req: Request, res: Response) => {};
