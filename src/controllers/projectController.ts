import { Projects } from "@prisma/client";
import { CustomRequest } from "../middleware/authMiddleware";
import { createProject, createProjectBody } from "../services/projectService";
import { generateId } from "../utils";
import { NextFunction, Request, Response } from "express";
import simpleGit from "simple-git";
import { generateSlug } from "random-word-slugs";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";

const ecsClient = new ECSClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const config = {
  CLUSTER: "arn:aws:ecs:us-east-1:802302705402:cluster/netlify-builder-cluster",
  TASK: "arn:aws:ecs:us-east-1:802302705402:task-definition/builder-task",
};
export interface IDeployProjectData {
  title?: string;
  authorId: number;
  repoUrl: string;
}

export const deployProject = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, repoUrl } = req.body;

    const user = req.user;

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

    const command = new RunTaskCommand({
      cluster: config.CLUSTER,
      taskDefinition: config.TASK,
      launchType: "FARGATE",
      count: 1,
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: [
            "subnet-0918fa5c23c248df1",
            "subnet-086e7048a68b94f75",
            "subnet-0d2e0f6b887848967",
            "subnet-0f9c7166f6c69cd8b",
            "subnet-013e74ae3378b569e",
            "subnet-00fe6acaea7fe3187",
          ],
          securityGroups: ["sg-00ccb6770ba771d45"],
          assignPublicIp: "ENABLED",
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: "builder-image",
            environment: [
              {
                name: "GIT_REPOSITORY_URL",
                value: repoUrl,
              },
              {
                name: "PROJECT_ID",
                value: newProject.id.toString(),
              },
              {
                name: "USER_ID",
                value: id.toString(),
              },
              {
                name: "AWS_ACCESS_KEY",
                value: process.env.AWS_ACCESS_KEY as string,
              },
              {
                name: "AWS_SECRET_ACCESS_KEY",
                value: process.env.AWS_SECRET_ACCESS_KEY as string,
              },
            ],
          },
        ],
      },
    });

    await ecsClient.send(command);

    return res.json({
      status: "queued",
      url: `http://${username}.${newProject.id}.localhost:8001`,
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

export const deleteProject = async (req: Request, res: Response) => {};

export const getProjects = async (req: Request, res: Response) => {};

export const getProjectById = async (req: Request, res: Response) => {};
