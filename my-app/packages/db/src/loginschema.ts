import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: serial("id").primaryKey(),
    email: varchar("email").notNull(),
    password: varchar("password").notNull(),    
     // ✅ ADD THIS
  role: varchar('role', { length: 20 })
    .default('user')
    .notNull(),
});
