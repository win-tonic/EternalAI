import { pgTable, serial, varchar, integer, timestamp, smallint } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 1000 }).unique().notNull(),
  passwordHash: varchar("passwordHash", { length: 1000 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 1000 }).default("").notNull(),
  name: varchar("name", { length: 1000 }).default("").notNull(),
  subscribed: smallint("subscribed").default(0).notNull(),
  nextPayment: timestamp("nextPayment")
});

export const questions = pgTable("questions", {
  userId: integer("userId").notNull().primaryKey(),
  questionsLeft: integer("questionsLeft").default(5).notNull()
});

export const chatHistory = pgTable("chatHistory", {
  id: serial("id").primaryKey(),
  chatId: integer("chatId").notNull(),
  message: varchar("message", { length: 1000 }).notNull(),
  role: varchar("role", { length: 10 }).notNull()
});

export const chats = pgTable("chats", {
  chatId: serial("chatId").primaryKey(),
  userId: integer("userId").notNull(),
  actLike: varchar("actLike", { length: 100 }).notNull()
});

export const paymentIntents = pgTable("paymentIntents", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: integer("userId").notNull(),
  clientSecret: varchar("clientSecret", { length: 100 }).notNull(),
  subscriptionId: varchar("subscriptionId", { length: 100 }).notNull(),
  timeCreated: timestamp("timeCreated").notNull(),
  status: varchar("status", { length: 100 }).notNull()
});