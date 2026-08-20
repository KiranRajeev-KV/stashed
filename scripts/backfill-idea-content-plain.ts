import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { markdownToPlainText } from "../worker/ideas/markdown.ts";

const execFileAsync = promisify(execFile);
const batchSize = 25;
const target = process.argv.includes("--local") ? "--local" : "--remote";

type IdeaRow = {
  content: string;
  row_id: number;
};

type D1Result = Array<{
  results: IdeaRow[];
}>;

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

async function executeRemoteSql(command: string) {
  const { stdout } = await execFileAsync(
    "pnpm",
    [
      "exec",
      "wrangler",
      "d1",
      "execute",
      "stashed-db",
      target,
      "--json",
      "--command",
      command,
    ],
    { maxBuffer: 10 * 1024 * 1024 },
  );
  return JSON.parse(stdout) as D1Result;
}

let lastRowId = 0;
let processed = 0;

while (true) {
  const result = await executeRemoteSql(
    `SELECT row_id, content FROM ideas WHERE row_id > ${lastRowId} ORDER BY row_id LIMIT ${batchSize}`,
  );
  const rows = result[0]?.results ?? [];
  if (rows.length === 0) break;

  for (const row of rows) {
    const contentPlain = markdownToPlainText(row.content);
    await executeRemoteSql(
      `UPDATE ideas SET content_plain = ${sqlString(contentPlain)} WHERE row_id = ${row.row_id} AND content_plain <> ${sqlString(contentPlain)}`,
    );
    processed += 1;
  }

  lastRowId = rows.at(-1)?.row_id ?? lastRowId;
}

process.stdout.write(`Backfill complete. Processed ${processed} ideas.\n`);
