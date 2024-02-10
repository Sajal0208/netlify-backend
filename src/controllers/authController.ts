import { Request, Response } from "express";
import {
  createUser,
  generateHashedPassword,
  generateToken,
  getUserById,
  validateLoginData,
  validateRegisterData,
} from "../services/userService";
import { CustomRequest } from "../middleware/authMiddleware";

export const registerUser = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  const isValid = validateRegisterData({ email, username, password });

  if (!isValid) {
    return res.status(400).json({ error: "Invalid data" });
  }

  const hashedPassword = await generateHashedPassword(password);

  const user = await createUser(email, username, hashedPassword);

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
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await validateLoginData({ email, password });

  if (!user) {
    return res.status(400).json({ error: "Invalid data" });
  }

  const token = await generateToken(email);

  res.cookie("authcookie", token, { maxAge: 900000, httpOnly: true });

  res.send({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

export const getMe = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ error: "Invalid data" });
  }

  const user = await getUserById(userId);

  res.send(user);
};

export const logoutUser = async (req: Request, res: Response) => {
  res.clearCookie("authcookie");
  res.send("Logged out");
};
