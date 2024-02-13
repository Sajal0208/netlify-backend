import { ECSClient } from "@aws-sdk/client-ecs";

class ECSSingleton {
  private static instance: ECSClient;

  private constructor() {} // private constructor to prevent instantiation

  public static getInstance(): ECSClient {
    if (!ECSSingleton.instance) {
      ECSSingleton.instance = new ECSClient({
        region: "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY as string,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        },
      });
    }

    return ECSSingleton.instance;
  }
}

export const config = {
  CLUSTER: "arn:aws:ecs:us-east-1:802302705402:cluster/netlify-builder-cluster",
  TASK: "arn:aws:ecs:us-east-1:802302705402:task-definition/builder-task",
};

export default ECSSingleton;
