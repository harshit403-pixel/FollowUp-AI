import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";
import routes from "./routes";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api/v1", routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
