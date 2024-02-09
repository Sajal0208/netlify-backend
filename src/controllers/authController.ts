import jwt from "jsonwebtoken";
import { Request, Response } from "express";

export const registerUser = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  // Check if email and username exists and blah blah validation steps...

  // If every validation passes, store it in the Database

  // Create a JWT Token
  const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET as string);

  // Store the token in the cookie
  res.cookie("authcookie", token, { maxAge: 900000, httpOnly: true });
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check if email exists and match passwords

  // If every validation passes, create a JWT token
  const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET as string);

  // Store the token in the cookie
  res.cookie("authcookie", token, { maxAge: 900000, httpOnly: true });
};

export const getMe = async (req: Request, res: Response) => {
  // Get the user from the JWT token
  const user = req.user;
  res.send(user);
};
