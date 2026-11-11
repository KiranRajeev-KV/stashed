import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

export function localD1(args, { persistTo } = {}) {
  const result = spawnSync(
    pnpm,
    [
      "exec",
      "wrangler",
      "d1",
      ...args,
      "stashed-db",
      "--local",
      ...(persistTo ? ["--persist-to", resolve(persistTo)] : []),
    ],
    {
      cwd: projectRoot,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `Local D1 command failed:\n${result.stdout}\n${result.stderr}`,
    );
  return result.stdout;
}

export function executeFile(file, options) {
  return localD1(["execute", "--file", file, "--json"], options);
}
