import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import type { Role } from "../types/express";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw ApiError.unauthorized();
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(header.slice(7), env.JWT_SECRET) as jwt.JwtPayload;
    } catch {
      throw ApiError.unauthorized("Session expired or invalid");
    }
    const user = await User.findById(payload.sub).lean();
    if (!user) throw ApiError.unauthorized("User no longer exists");
    req.user = { id: String(user._id), name: user.name, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
