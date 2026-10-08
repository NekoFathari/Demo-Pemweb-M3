import { promises as fs } from "node:fs";
import path from "node:path";
import type { AppState } from "@/lib/types";
import { seedState } from "@/lib/seed";

const DATA_DIR = path.join(process.cwd(), ".data");
const STATE_FILE = path.join(DATA_DIR, "state.json");

let queue: Promise<unknown> = Promise.resolve();

function run<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.catch(() => {});
  return next;
}

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STATE_FILE);
  } catch {
    await fs.writeFile(STATE_FILE, JSON.stringify(seedState(), null, 2), "utf8");
  }
}

export async function readState(): Promise<AppState> {
  await ensureFile();
  const raw = await fs.readFile(STATE_FILE, "utf8");
  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return seedState();
  }
}

export async function writeState(next: AppState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(next, null, 2), "utf8");
}

export function mutate<T>(
  fn: (state: AppState) => { state: AppState; result: T },
): Promise<T> {
  return run(async () => {
    const current = await readState();
    const { state, result } = fn(current);
    await writeState(state);
    return result;
  });
}
