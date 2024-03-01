import { NextFunction, Request, Response } from "express";
import {
  checkUserExists,
  createUser,
  generateHashedPassword,
  generateToken,
  getUserById,
  validateLoginData,
  validateRegisterData,
} from "../services/authService";
import { CustomRequest, verifyToken } from "../middleware/authMiddleware";
import BadRequestError from "../errors/BadRequestError";
import NotFoundError from "../errors/NotFoundError";
import { prisma } from "../lib/db";

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, username, password } = req.body;

    const isValid = validateRegisterData({ email, username, password }, next);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid data" });
    }

    const hashedPassword = await generateHashedPassword(password);

    const user = await createUser(email, username, hashedPassword, next);

    if (!user) {
      return res.status(500).json({ error: "Server error" });
    }

    const accessToken = await generateToken(user.id, "access", next);
    const refreshToken = await generateToken(user.id, "refresh", next);

    res.cookie("refreshToken", refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      signed: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.send({
      id: user.id,
      email: user.email,
      username: user.username,
      token: accessToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
  } catch (error: any) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await validateLoginData({ email, password }, next);

    if (!user) {
      throw new NotFoundError({
        message: "User Not Found",
      });
    }

    const accessToken = await generateToken(user.id, "access", next);
    const refreshToken = await generateToken(user.id, "refresh", next);

    res.cookie("refreshToken", refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      signed: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.send({
      id: user.id,
      email: user.email,
      username: user.username,
      token: accessToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
  } catch (e) {
    next(e);
  }
};

export const getMe = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new BadRequestError({ message: "Invalid user" });
    }

    const user = await getUserById(userId);

    if (!user) {
      throw new BadRequestError({ message: "User Not Found" });
    }

    res.send({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } catch (e) {
    next(e);
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  res.clearCookie("authcookie");
  res.send("Logged out");
};

export const getUserWithProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        username: req.body.username,
      },
      include: {
        projects: {
          where: {
            title: req.body.title,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundError({
        message: "User Not Found",
      });
    }

    return res.json({
      user,
      project: user.projects,
    });
  } catch (e) {
    next(e);
  }
};

export const getRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken = req.cookies["refreshToken"];

  console.log(refreshToken);
  if (!refreshToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log(refreshToken);

  try {
    const payload: any = await verifyToken(refreshToken, "refresh");
    const user = await checkUserExists(payload.userId);

    if (!user) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const accessToken = await generateToken(user.id, "access", next);

    res.send({
      token: accessToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
  } catch (e) {
    res.status(403).json({ error: "Forbidden" });
  }
};
