import { IDeployProjectData } from "../controllers/projectController";
import { prisma } from "../lib/db";
import axios from "axios";
import { NextFunction } from "express";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import { config } from "../lib/aws";
import { generateSlug } from "random-word-slugs";

const ecsClient = new ECSClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const repoIsPublic = async (repoUrl: string, next: NextFunction) => {
  try {
    const response = await axios.get(repoUrl);
    return response.status === 200;
  } catch (e) {
    next(e);
  }
};

export const createProjectBody = async (
  data: {
    title?: string;
    authorId: number;
    repoUrl: string;
  },
  username: string,
  next: NextFunction
) => {
  try {
    const projectBody: IDeployProjectData = {
      ...data,
      deployedLink: "",
      title: data.title || "",
    };

    if (!data.authorId || !data.repoUrl) {
      throw new Error("AuthorId and repoUrl are required");
    }

    if (!data.title) {
      projectBody.title = generateSlug();
      projectBody.deployedLink = `http://${username}.${projectBody.title}.localhost:8001`;
    } else {
      projectBody.title = data.title;
      projectBody.deployedLink = `http://${username}.${projectBody.title}.localhost:8001`;
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
    const project = await prisma.projects.create({
      data: {
        title: projectBody.title,
        repoUrl: projectBody.repoUrl,
        author: {
          connect: {
            id: id,
          },
        },
        deployedLink: projectBody.deployedLink,
      },
    });

    return project;
  } catch (e) {
    next(e);
  }
};

export const runNewTask = async (
  {
    projectId,
    userId,
    repoUrl,
  }: {
    projectId: number;
    userId: number;
    repoUrl: string;
  },
  next: NextFunction
) => {
  try {
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
                value: projectId.toString(),
              },
              {
                name: "USER_ID",
                value: userId.toString(),
              },
              {
                name: "AWS_ACCESS_KEY",
                value: process.env.AWS_ACCESS_KEY as string,
              },
              {
                name: "AWS_SECRET_ACCESS_KEY",
                value: process.env.AWS_SECRET_ACCESS_KEY as string,
              },
              {
                name: "REDIS_URL",
                value: process.env.REDIS_URL as string,
              },
            ],
          },
        ],
      },
    });

    await ecsClient.send(command);
  } catch (e) {
    next(e);
  }
};
