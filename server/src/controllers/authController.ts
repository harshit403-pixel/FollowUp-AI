import { loginBody } from "../schemas/auth";
import { login } from "../services/authService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const loginHandler = asyncHandler(async (req, res) => {
  const { email, password } = loginBody.parse(req.body);
  res.json(await login(email, password));
});

export const meHandler = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  res.json({ user: req.user });
});
