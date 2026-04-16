import "dotenv/config";
import { defineConfig, env } from "prisma/config"; // Add 'env' to the import

export default defineConfig({
  schema: "prisma/schema.prisma",
  databaseUrl: process.env.DATABASE_URL,
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
