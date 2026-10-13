import { z } from "zod";

export const loginBody = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});
