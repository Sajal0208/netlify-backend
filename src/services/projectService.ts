import simpleGit from "simple-git";
import { IDeployProjectData } from "../controllers/projectController";
import { prisma } from "../lib/db";
import axios from "axios";
import { generateId } from "../utils";
import { NextFunction } from "express";

const repoIsPublic = async (repoUrl: string, next: NextFunction) => {
  try {
    const response = await axios.get(repoUrl);
    return response.status === 200;
  } catch (e) {
    next(e);
  }
};

export const createProjectBody = async (
  data: IDeployProjectData,
  username: string,
  next: NextFunction
) => {
  try {
    const projectBody = {
      ...data,
    };

    if (!data.authorId || !data.repoUrl) {
      throw new Error("AuthorId and repoUrl are required");
    }

    if (!data.title) {
      projectBody.title = username + "-" + generateId();
    }

    const isRepoPublic = await repoIsPublic(data.repoUrl, next);

    if (!isRepoPublic) {
      throw new Error("Repo is not public");
    }

    console.log(projectBody);

    return projectBody;
  } catch (e) {
    next(e);
  }
};

export const createProject = async (
  projectBody: IDeployProjectData,
  id: number,
  next: NextFunction
) => {
  try {
    if (!projectBody.title) {
      return;
    }
    const project = await prisma.projects.create({
      data: {
        title: projectBody.title,
        repoUrl: projectBody.repoUrl,
        author: {
          connect: {
            id: id,
          },
        },
      },
    });

    return project;
  } catch (e) {
    next(e);
  }
};
