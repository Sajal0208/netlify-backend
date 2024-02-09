import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authCookie = req.cookies["authcookie"];

  // If there is no cookie, return an error
  if (authCookie == null) return res.sendStatus(401);

  // If there is a cookie, verify it
  jwt.verify(
    authCookie,
    process.env.ACCESS_TOKEN_SECRET as string,
    (err: any, user: any) => {
      // If there is an error, return an error
      if (err) return res.sendStatus(403);

      // If there is no error, continue the execution
      req["user"] = user;
      next();
    }
  );
}
