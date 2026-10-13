import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";

export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  // Same message for unknown email and wrong password.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const token = jwt.sign({ role: user.role, name: user.name }, env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
  return {
    token,
    user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
  };
}
