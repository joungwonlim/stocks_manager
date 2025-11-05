import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

// SQLite 데이터베이스 파일 경로
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "sqlite.db");

// SQLite 연결
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL"); // Write-Ahead Logging for better performance

export const db = drizzle(sqlite, { schema });
