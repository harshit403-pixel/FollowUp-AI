import { createApp } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

async function main() {
  await connectDb();
  createApp().listen(env.PORT, () => {
    console.log(`FollowUp AI API listening on http://localhost:${env.PORT}/api/v1`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
