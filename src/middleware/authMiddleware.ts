import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { checkUserExists } from "../services/authService";

export interface CustomRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

const verifyToken = (token: any) =>
  new Promise((resolve, reject) => {
    console.log("I am here3");
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string,
      (error: any, payload: any) => {
        if (error) {
          console.log("I am here4");
          console.log(`error: ${error}`);
          reject(error);
        } else {
          resolve(payload);
        }
      }
    );
  });

export async function authenticateToken(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  const authCookie = req.cookies["authcookie"];
  // If there is no cookie, return an error
  if (authCookie === null) return res.sendStatus(401);
  // If there is a cookie, verify it
  try {
    const payload: any = await verifyToken(authCookie);
    const user = await checkUserExists(payload.userId);
    if (!user) {
      return res.sendStatus(403);
    }
    req.user = {
      id: payload.userId as number,
      username: user.username as string,
    };

    next();
  } catch (e) {
    return res.sendStatus(403);
  }
}
