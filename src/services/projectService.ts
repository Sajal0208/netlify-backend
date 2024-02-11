import simpleGit from "simple-git";
import { IDeployProjectData } from "../controllers/projectController";
import { prisma } from "../lib/db";
import axios from "axios";

const repoIsPublic = async (repoUrl: string) => {
  try {
    const response = await axios.get(repoUrl);
    return response.status === 200;
  } catch (e) {
    return false;
  }
};

export const createProjectBody = async (
  data: IDeployProjectData,
  username: string,
  randomId: string
) => {
  const projectBody = {
    ...data,
  };

  if (!data.authorId || !data.repoUrl) {
    throw new Error("AuthorId and repoUrl are required");
  }

  if (!data.title) {
    projectBody.title = username + "-" + randomId;
  }

  const isRepoPublic = await repoIsPublic(data.repoUrl);

  if (!isRepoPublic) {
    throw new Error("Repo is not public");
  }

  console.log(projectBody);

  return projectBody;
};

export const cloneProject = async (
  repoUrl: string,
  username: string,
  randomId: string
) => {
  try {
    await simpleGit().clone(repoUrl, `./projects/${username}/${randomId}`);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};
