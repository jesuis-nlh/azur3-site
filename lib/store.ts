import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ArchiveDB } from "./types";
import { seed } from "@/content/seed";

/**
 * File-based archive store.
 *
 * - Reads `DATA_DIR/archive.json`; falls back to the bundled seed when absent.
 * - Writes are serialised in-process and atomic (temp file + rename).
 * - On a read-only filesystem (e.g. serverless), reads still work from the
 *   seed and writes fail with a clear error. Swap this module for a database
 *   adapter for multi-instance production (see docs/ARCHITECTURE.md).
 */

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "archive.json");

let cache: { db: ArchiveDB; mtime: number } | null = null;
let queue: Promise<unknown> = Promise.resolve();

export class StoreWriteError extends Error {}

function clone<T>(v: T): T {
  return structuredClone(v);
}

export async function readDb(): Promise<ArchiveDB> {
  try {
    const stat = await fs.stat(DB_FILE);
    if (cache && cache.mtime === stat.mtimeMs) return cache.db;
    const db = JSON.parse(await fs.readFile(DB_FILE, "utf8")) as ArchiveDB;
    cache = { db, mtime: stat.mtimeMs };
    return db;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      if (!cache) cache = { db: clone(seed), mtime: -1 };
      return cache.db;
    }
    throw err;
  }
}

export async function mutate<T>(fn: (db: ArchiveDB) => T | Promise<T>, auditAction?: string, auditTarget = ""): Promise<T> {
  const run = async () => {
    const db = clone(await readDb());
    const result = await fn(db);
    if (auditAction) {
      db.audit.unshift({ at: new Date().toISOString(), action: auditAction, target: auditTarget });
      db.audit = db.audit.slice(0, 500);
    }
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
      await fs.rename(tmp, DB_FILE);
      const stat = await fs.stat(DB_FILE);
      cache = { db, mtime: stat.mtimeMs };
    } catch (err) {
      throw new StoreWriteError(
        `Không ghi được kho dữ liệu (${(err as Error).message}). Môi trường hiện tại có thể chỉ cho phép đọc.`,
      );
    }
    return result;
  };
  const p = queue.then(run, run);
  queue = p.catch(() => undefined);
  return p as Promise<T>;
}

export function uploadPath(rel: string): string {
  const full = path.resolve(UPLOAD_DIR, rel);
  if (!full.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) throw new Error("invalid path");
  return full;
}
