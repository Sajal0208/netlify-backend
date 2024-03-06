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
import jwt from "jsonwebtoken";
import ServerError from "../errors/ServerError";

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, username, password } = req.body;

    const isValid = await validateRegisterData(
      { email, username, password },
      next
    );

    if (!isValid) {
      throw new BadRequestError({
        message: "Invalid data",
      });
    }

    const hashedPassword = await generateHashedPassword(password);

    const user = await createUser(email, username, hashedPassword, next);

    if (!user) {
      throw new ServerError({
        message: "Failed to create user",
      });
    }

    const accessToken = await generateToken(user.id, "access", next);
    const newRefreshToken = await generateToken(user.id, "refresh", next);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: {
          push: newRefreshToken,
        },
      },
    });

    res.cookie("refreshToken", newRefreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.send({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token: {
        accessToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
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
  const cookies = req.cookies;
  try {
    const { email, password } = req.body;

    const user = await validateLoginData({ email, password }, next);

    if (!user) {
      throw new NotFoundError({
        message: "User Not Found",
      });
    }

    const accessToken = await generateToken(user.id, "access", next);
    const newRefreshToken = await generateToken(user.id, "refresh", next);

    let newRefreshTokenArray = !cookies?.refreshToken
      ? user.refreshToken
      : user.refreshToken.filter((rt) => rt !== cookies.refreshToken);

    if (cookies?.refreshToken) {
      const refreshToken = cookies.refreshToken;
      const foundToken = await prisma.user.findFirst({
        where: {
          refreshToken: {
            hasSome: [refreshToken],
          },
        },
      });

      if (!foundToken) {
        newRefreshTokenArray = [];
      }

      res.clearCookie("refreshToken");
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: {
          push: newRefreshToken,
          set: newRefreshTokenArray,
        },
      },
    });

    res.cookie("refreshToken", newRefreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.send({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token: {
        accessToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
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
      user: { id: user.id, email: user.email, username: user.username },
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

export const handleRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cookies = req.cookies;
  if (!cookies?.refreshToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const refreshToken = cookies.refreshToken;
  res.clearCookie("refreshToken");

  const foundUser = await prisma.user.findFirst({
    where: {
      refreshToken: {
        hasSome: [refreshToken],
      },
    },
  });

  if (!foundUser) {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
      async (err: any, decoded: any) => {
        if (err) return res.sendStatus(403); //Forbidden
        // Delete refresh tokens of hacked user
        const hackedUser = await prisma.user.update({
          where: {
            id: decoded.userId,
          },
          data: {
            refreshToken: {
              set: [],
            },
          },
        });
      }
    );
    return res.sendStatus(403); //Forbidden
  }

  const newRefreshTokenArray = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  );

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET as string,
    async (err: any, decoded: any) => {
      if (err) {
        // expired refresh token
        await prisma.user.update({
          where: {
            id: foundUser.id,
          },
          data: {
            refreshToken: {
              set: foundUser.refreshToken,
            },
          },
        });
      }
      if (err || foundUser.id !== decoded.userId) return res.sendStatus(403);

      const accessToken = await generateToken(foundUser.id, "access", next);
      const newRefreshToken = await generateToken(
        foundUser.id,
        "refresh",
        next
      );

      await prisma.user.update({
        where: {
          id: foundUser.id,
        },
        data: {
          refreshToken: [newRefreshToken!, ...newRefreshTokenArray],
        },
      });

      res.cookie("refreshToken", newRefreshToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      res.send({
        token: accessToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
    }
  );
};
