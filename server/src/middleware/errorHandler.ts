import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.path}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: "Invalid identifier" });
  }
  if (typeof err === "object" && err && (err as { code?: number }).code === 11000) {
    return res.status(409).json({ error: "A record with that value already exists" });
  }
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Malformed JSON body" });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
