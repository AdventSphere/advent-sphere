import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("user", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  name: text("name").notNull(),
});

export const roomTable = sqliteTable("room", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),

  ownerId: text("owner_id")
    .notNull()
    .references(() => usersTable.id),

  password: text("password"),
  isAnonymous: integer("is_anonymous", { mode: "boolean" })
    .notNull()
    .default(false),
  startAt: integer("start_at", { mode: "timestamp" }).notNull(),

  generateCount: integer("generate_count").notNull().default(0),
});

export const itemTable = sqliteTable("item", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
});

export const calendarItemTable = sqliteTable("calendar_item", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  roomId: integer("room_id")
    .notNull()
    .references(() => roomTable.id),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id),
  openDate: integer("open_date", { mode: "timestamp" }).notNull(),
  position: text("position"),
  rotation: integer("rotation"),
  isOpened: integer("is_opened", { mode: "boolean" }).notNull().default(false),
  itemId: integer("item_id")
    .notNull()
    .references(() => itemTable.id),
  imageId: integer("image_id"),
});
