import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { checkUserExists } from "../services/authService";

export interface CustomRequest extends Request {
  user?: {
    id: number;
  };
}

export const verifyToken = (token: any, type: string) =>
  new Promise((resolve, reject) => {
    jwt.verify(
      token,
      type === "access"
        ? (process.env.ACCESS_TOKEN_SECRET as string)
        : (process.env.REFRESH_TOKEN_SECRET as string),
      (error: any, payload: any) => {
        if (error) {
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
  const token = req.headers["authorization"];

  const accessToken = token?.split(" ")[1];

  if (accessToken === null) return res.sendStatus(401);

  try {
    const payload: any = await verifyToken(accessToken, "access");
    const user = await checkUserExists(payload.userId);
    if (!user) {
      return res.sendStatus(403);
    }
    req.user = {
      id: payload.userId as number,
    };

    next();
  } catch (e) {
    console.log(e);
    return res.sendStatus(403);
  }
}
