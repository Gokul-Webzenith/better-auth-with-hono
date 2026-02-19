// src/index.ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import "@hono/node-server";
import "hono/cookie";
import "bcrypt";
import "jsonwebtoken";

// auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// ../db/src/index.ts
import "dotenv/config";
import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// ../db/src/schema.ts
import { pgTable as pgTable2, serial, varchar, text as text2, timestamp as timestamp2, integer } from "drizzle-orm/pg-core";

// ../db/src/loginschema.ts
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
var user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
});
var session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" })
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);
var account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);
var verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);
var userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account)
}));
var sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id]
  })
}));
var accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id]
  })
}));

// ../db/src/schema.ts
var todos = pgTable2("todos", {
  id: serial("id").primaryKey(),
  text: varchar("text").notNull(),
  description: text2("description").notNull(),
  status: varchar("status").notNull(),
  startAt: timestamp2("start_at").notNull(),
  endAt: timestamp2("end_at").notNull(),
  userId: integer("user_id").notNull().references(() => user.id)
});

// ../db/src/index.ts
var { Pool } = pkg;
var pool = null;
var db = null;
function getDb() {
  if (db) return db;
  const DATABASE_URL = process.env.DATABASE_URL;
  console.log("DB URL:", DATABASE_URL);
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  db = drizzle(pool);
  return db;
}

// auth.ts
import dotenv from "dotenv";
var db2 = getDb();
dotenv.config({
  path: "../../.env"
});
var AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
var APP_URL = process.env.APP_URL;
console.log("\u{1F510} AUTH_SECRET:", AUTH_SECRET);
console.log("\u{1F310} APP_URL:", APP_URL);
if (!AUTH_SECRET) {
  throw new Error(
    "\u274C BETTER_AUTH_SECRET is missing. Check your root .env file."
  );
}
if (!APP_URL) {
  throw new Error(
    "\u274C APP_URL is missing. Check your root .env file."
  );
}
var auth = betterAuth({
  database: drizzleAdapter(db2, {
    provider: "pg",
    schema: {
      user,
      session,
      account
    }
  }),
  // Use validated vars
  secret: AUTH_SECRET,
  baseURL: APP_URL,
  emailAndPassword: {
    enabled: true
  }
});

// src/index.ts
import {
  describeRoute,
  validator,
  openAPIRouteHandler
} from "hono-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { handle } from "hono/vercel";
import {
  patchTodoSchema
} from "@repo/schemas";
import { todoFormSchema } from "@repo/schemas";
var JWT_SECRET = process.env.JWT_SECRET;
var COOKIE_SECRET = process.env.COOKIE_SECRET;
var db3 = getDb();
var app = new Hono().basePath("/api");
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "https://your-frontend-domain.com",
    credentials: true
  })
);
app.on(["POST", "GET"], "auth/*", (c) => {
  return auth.handler(c.req.raw);
});
var idParamSchema = z.object({
  id: z.string()
});
app.get("/admin/user-count", async (c) => {
  const result = await db3.select({ count: sql`count(*)` }).from(user);
  return c.json({ totalUsers: result[0].count });
});
app.get("/me", (c) => {
  return c.json({
    id: c.get("userId"),
    role: c.get("role")
  });
});
app.get(
  "/",
  describeRoute({
    description: "Get all todos for current user",
    responses: {
      200: { description: "List of todos" },
      401: { description: "Unauthorized" }
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const data = await db3.select().from(todos).where(eq(todos.userId, userId));
    return c.json(data);
  }
);
app.post(
  "/",
  describeRoute({
    description: "Create todo",
    responses: {
      201: { description: "Created" },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" }
    }
  }),
  validator("json", todoFormSchema, (result, c) => {
    if (!result.success) {
      return c.json(result.error, 400);
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const startAt = /* @__PURE__ */ new Date(
      `${body.startDate}T${body.startTime}`
    );
    const endAt = /* @__PURE__ */ new Date(
      `${body.endDate}T${body.endTime}`
    );
    const [todo] = await db3.insert(todos).values({
      text: body.text,
      description: body.description,
      status: body.status,
      startAt,
      endAt,
      userId
    }).returning();
    return c.json({ success: true, data: todo }, 201);
  }
);
app.put(
  "/:id",
  describeRoute({
    description: "Update todo",
    responses: {
      200: { description: "Updated" },
      404: { description: "Not found" }
    }
  }),
  validator("param", idParamSchema),
  validator("json", todoFormSchema, (result, c) => {
    if (!result.success) {
      return c.json(result.error, 400);
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const startAt = /* @__PURE__ */ new Date(
      `${body.startDate}T${body.startTime}`
    );
    const endAt = /* @__PURE__ */ new Date(
      `${body.endDate}T${body.endTime}`
    );
    const [todo] = await db3.update(todos).set({
      ...body,
      startAt,
      endAt
    }).where(
      and(
        eq(todos.id, Number(id)),
        eq(todos.userId, userId)
      )
    ).returning();
    if (!todo) {
      return c.json({ message: "Not found" }, 404);
    }
    return c.json({ success: true, data: todo });
  }
);
app.delete(
  "/:id",
  describeRoute({
    description: "Delete todo",
    responses: {
      200: { description: "Deleted" },
      404: { description: "Not found" }
    }
  }),
  validator("param", idParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const result = await db3.delete(todos).where(
      and(
        eq(todos.id, Number(id)),
        eq(todos.userId, userId)
      )
    );
    if (!result.rowCount) {
      return c.json({ message: "Not found" }, 404);
    }
    return c.json({ message: "Deleted" });
  }
);
app.patch(
  "/:id",
  describeRoute({
    description: "Patch todo",
    responses: {
      200: { description: "Updated successfully" },
      400: { description: "Validation error" },
      404: { description: "Not found" }
    }
  }),
  validator("param", idParamSchema),
  validator("json", patchTodoSchema, (result, c) => {
    if (!result.success) {
      return c.json(result.error, 400);
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const [todo] = await db3.update(todos).set(body).where(
      and(
        eq(todos.id, Number(id)),
        eq(todos.userId, userId)
      )
    ).returning();
    if (!todo) {
      return c.json({ message: "Todo not found" }, 404);
    }
    return c.json({
      success: true,
      data: todo
    });
  }
);
app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "Todo API",
        version: "1.0.0",
        description: "Hono + Zod + OpenAPI + Scalar"
      },
      servers: [
        {
          url: "http://localhost:3000"
        }
      ]
    }
  })
);
app.get(
  "/docs",
  Scalar({
    url: "/api/openapi"
  })
);
var index_default = handle(app);
export {
  index_default as default
};
