import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv"

dotenv.config({ path: "../../.env" });

export default defineConfig({
  schema: "./src/lots",
  out: "./drizzle",

  // ✅ New syntax
  dialect: "postgresql",

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
