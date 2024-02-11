import { NextFunction } from "express";
import BadRequestError from "../errors/BadRequestError";
import { prisma } from "../lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createUser = async (
  email: string,
  username: string,
  password: string,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password,
      },
    });

    return user;
  } catch (error: any) {
    next(error);
  }
};

export const isUsernameExists = async (
  username: string,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    return user;
  } catch (error: any) {
    next(error);
  }
};

export const isEmailExists = async (email: string, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user;
  } catch (error: any) {
    next(error);
  }
};

export const validateRegisterData = async (
  body: {
    email: string;
    username: string;
    password: string;
  },
  next: NextFunction
) => {
  try {
    const { email, username, password } = body;
    if (!email || !username || !password) {
      throw new BadRequestError({
        message: "Please provide all the required fields",
      });
    }
    const user = await isEmailExists(email, next);
    if (user) {
      throw new BadRequestError({
        message: "Email already exists",
      });
    }

    const userByUsername = await isUsernameExists(username, next);

    if (userByUsername) {
      throw new BadRequestError({
        message: "Username already exists",
      });
    }

    return true;
  } catch (error: any) {
    next(error);
  }
};

export const generateHashedPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
) => {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};

export const generateToken = async (userId: number) => {
  const token = await jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET as string
  );
  return token;
};

export const validateLoginData = async (
  body: {
    email: string;
    password: string;
  },
  next: NextFunction
) => {
  try {
    const { email, password } = body;
    if (!email || !password) {
      throw new BadRequestError({
        message: "Please provide all the required fields",
      });
    }
    const user = await isEmailExists(email, next);
    if (!user) {
      throw new BadRequestError({
        message: "Invalid credentials",
      });
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new BadRequestError({
        message: "Invalid credentials",
      });
    }
    return user;
  } catch (e: any) {
    next(e);
  }
};

export const getUserById = async (id: number) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const checkUserExists = async (id: number) => {
  const user = await getUserById(id);
  if (!user) {
    throw new BadRequestError({
      message: "User not found",
    });
  }
  return user;
};
