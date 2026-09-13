import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Prisma 7 keeps the connection URL out of schema.prisma; the CLI reads it here.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: { seed: "tsx prisma/seed.ts" },
  datasource: { url: env("DATABASE_URL") },
});
