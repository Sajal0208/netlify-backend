import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface CustomRequest extends Request {
  userId?: number;
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
  console.log("cookies", req.cookies);
  console.log("request obj", req);
  const authCookie = req.cookies["authcookie"];
  console.log("authCookie", authCookie);
  console.log("I am here1");

  // If there is no cookie, return an error
  if (authCookie === null) return res.sendStatus(401);

  // If there is a cookie, verify it
  try {
    const payload: any = await verifyToken(authCookie);
    console.log(payload);
    console.log("I am here2");
    req.userId = payload.userId;
    next();
  } catch (e) {
    return res.sendStatus(403);
  }
}
