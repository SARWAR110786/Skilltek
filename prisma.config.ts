// Prisma 7 central configuration for the Prisma CLI.
// Docs: https://pris.ly/d/prisma7-client-config
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI (migrate/introspect) uses the DIRECT (unpooled) connection.
    // The app runtime keeps using the pooled DATABASE_URL via the driver adapter.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
