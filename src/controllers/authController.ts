import { NextFunction, Request, Response } from "express";
import {
  createUser,
  generateHashedPassword,
  generateToken,
  getUserById,
  validateLoginData,
  validateRegisterData,
} from "../services/authService";
import { CustomRequest } from "../middleware/authMiddleware";
import BadRequestError from "../errors/BadRequestError";

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

    const token = await generateToken(user.id);
    console.log(token);

    res.cookie("authcookie", token, { maxAge: 900000, httpOnly: true });

    res.send({
      id: user.id,
      email: user.email,
      username: user.username,
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

    const token = await generateToken(email);

    res.cookie("authcookie", token, { maxAge: 900000, httpOnly: true });

    res.send({
      id: user!.id,
      email: user!.email,
      username: user!.username,
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
