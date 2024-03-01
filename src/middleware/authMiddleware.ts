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
  const accessToken =
    req.headers["authorization"] || req.headers["Authorization"];
  // If there is no cookie, return an error
  if (accessToken === null) return res.sendStatus(401);
  // If there is a cookie, verify it
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
    return res.sendStatus(403);
  }
}
