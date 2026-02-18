import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { getDb, user, session, account } from "./../db/src";

const db = getDb();
import dotenv from "dotenv";

dotenv.config({
  path: "../../.env", 
});

const AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
const APP_URL = process.env.APP_URL;

console.log("🔐 AUTH_SECRET:", AUTH_SECRET);
console.log("🌐 APP_URL:", APP_URL);


if (!AUTH_SECRET) {
  throw new Error(
    "❌ BETTER_AUTH_SECRET is missing. Check your root .env file."
  );
}

if (!APP_URL) {
  throw new Error(
    "❌ APP_URL is missing. Check your root .env file."
  );
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",

    schema: {
      user,
      session,
      account,
    },
  }),

  // Use validated vars
  secret: AUTH_SECRET,
  baseURL: APP_URL,

  emailAndPassword: {
    enabled: true,
  },
});
