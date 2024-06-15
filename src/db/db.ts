import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { users, questions, chatHistory, chats, paymentIntents } from "./schema";
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DB_CONNECTION_STRING as string;

class DB {
  pool: Pool;
  db: ReturnType<typeof drizzle>;
  users: ReturnType<typeof pgTable>;
  questions: ReturnType<typeof pgTable>;
  chatHistory: ReturnType<typeof pgTable>;
  chats: ReturnType<typeof pgTable>;
  paymentIntents: ReturnType<typeof pgTable>;

  constructor() {
    this.pool = new Pool({ connectionString });
    this.db = drizzle(this.pool);
    this.users = users;
    this.questions = questions;
    this.chatHistory = chatHistory;
    this.chats = chats;
    this.paymentIntents = paymentIntents;
  }
}

export const db = new DB();