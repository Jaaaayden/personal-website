import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Browser IDs of everyone who has opened the unlocked secret page, kept in
 * arrival order so a visitor's number is their index + 1. Lives in a JSON
 * file on the `app_data` volume — fine for one replica (see DEPLOYMENT.md).
 */
interface VisitorFile {
  ids: string[];
}

type State = { ids: string[]; index: Map<string, number> };

/** One shared read: concurrent first requests must not each build their own
 *  copy, or a later copy would overwrite a registration made on an earlier one. */
let loading: Promise<State> | null = null;
/** Serializes writes so two simultaneous first visits can't share a number. */
let queue: Promise<unknown> = Promise.resolve();

function filePath(): string {
  return path.join(process.env.DATA_DIR || "data", "secret-visitors.json");
}

async function readState(): Promise<State> {
  let ids: string[] = [];
  try {
    const parsed = JSON.parse(await readFile(filePath(), "utf8")) as VisitorFile;
    if (Array.isArray(parsed.ids)) ids = parsed.ids;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  return { ids, index: new Map(ids.map((id, i) => [id, i + 1])) };
}

function load(): Promise<State> {
  // A failed read (e.g. a corrupt file) is retried on the next request.
  loading ??= readState().catch((err) => {
    loading = null;
    throw err;
  });
  return loading;
}

async function save(ids: string[]) {
  const file = filePath();
  await mkdir(path.dirname(file), { recursive: true });
  // Write-then-rename so a crash mid-write never leaves a truncated file.
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify({ ids } satisfies VisitorFile));
  await rename(tmp, file);
}

export async function isKnownVisitor(id: string): Promise<boolean> {
  return (await load()).index.has(id);
}

export function registerVisitor(
  id: string
): Promise<{ number: number; total: number }> {
  const run = queue.then(async () => {
    const state = await load();
    const existing = state.index.get(id);
    if (existing) return { number: existing, total: state.ids.length };

    const ids = [...state.ids, id];
    await save(ids);
    state.ids = ids;
    state.index.set(id, ids.length);
    return { number: ids.length, total: ids.length };
  });
  // Keep the chain alive after a failed write so later visits still run.
  queue = run.catch(() => {});
  return run;
}
