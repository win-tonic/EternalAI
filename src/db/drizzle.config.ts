import type { Config } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config();

export default {
    dialect: "postgresql",
    schema: "./src/db/schema.ts",
    out: "./src/db/migrations",
    dbCredentials: {
        url: process.env.DB_CONNECTION_STRING as string,
    },
    verbose: true,
    strict: true,
} satisfies Config;