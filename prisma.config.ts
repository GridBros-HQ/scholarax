import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts", // ◄ Changed from ts-node to tsx here
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});