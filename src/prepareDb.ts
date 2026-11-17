/*!
 * Copyright (c) 2026 T.C YU
 * Licensed under the BSD-3-Clause License.
 *
 * Contains code derived from sql.js-httpvfs:
 * Copyright (c) phiresky
 * Licensed under Apache-2.0 (see Third-Party-License/Apache-License-2.0).
 *
 * * Modifications:
 * - Ported create_db.sh to TypeScript.
 *
 * SPDX-License-Identifier: BSD-3-Clause AND Apache-2.0
 */

import { DatabaseSync } from "node:sqlite";
import { mkdir, open, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const VALID_PAGE_SIZES = [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];

/**
 * Optimize DB from sql.js-httpvfs
 * pragma journal_mode = delete;
 * pragma page_size = 1024;
 * insert into ftstable(ftstable) values ('optimize');
 * vacuum;
 */
export function checkAndOptimizeDatabase(
  dbPath: string,
  pageSize: number,
  optimizeDb: boolean,
) {
  const db = new DatabaseSync(dbPath);

  db.close();
  // try {
  //   // 1. Switch out of WAL mode first (WAL ignores page_size changes and leaves -wal/-shm files)
  //   db.exec("PRAGMA journal_mode = DELETE;");

  //   // 2. Set the target page size
  //   db.exec(`PRAGMA page_size = ${pageSize};`);

  //
  //   db.exec("VACUUM;");
  // } finally {
  //   db.close();
  // }
}

function parseByteSize(input: string): number {
  const match = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i.exec(input.trim());
  if (!match) {
    throw new Error(
      `Invalid size format: "${input}". Examples: 65536, 512KB, 1MB`,
    );
  }

  const value = Number(match[1]);
  const unit = (match[2] ?? "B").toUpperCase();
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
  };

  return Math.floor(value * multipliers[unit]);
}

export async function runCli(argv: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      page_size: { type: "string", default: "1024" },
      chunk_size: { type: "string" },
      out_dir: { type: "string", short: "o", default: "./db_chunks" },
      optimize_db: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help || positionals.length === 0) {
    console.log(
      [
        "Usage: prepare-db <file-path> [options]",
        "",
        "--page_size <bytes|unit>  DB page size (e.g., 1024, 4096) [default: 1024]",
        "--chunk_size <bytes|unit> Needs to be a multiple of page_size [default: 10240 * page_size]",
        "--out_dir <dir>           Output directory [default: ./db_chunks]",
        "--optimize_db             Configure journal mode, page size and order data",
        "-h, --help                Show this help message`)",
      ].join("\n"),
    );

    process.exitCode = values.help ? 0 : 1;
    return;
  }

  const inputPath = resolve(positionals[0]);
  const fileInfo = await stat(inputPath);
  if (!fileInfo.isFile()) {
    throw new Error(`Path is not a regular file: ${inputPath}`);
  }

  const pageSize = parseByteSize(values.page_size);
  if (!VALID_PAGE_SIZES.includes(pageSize)) {
    throw new Error(
      `Page size is invalid, must be a power of two between 512 and 65536, inclusive`,
    );
  }

  let inputChunkSize: number;

  if (values.chunk_size === undefined) {
    inputChunkSize = 10240 * pageSize;
  } else {
    inputChunkSize = parseByteSize(values.chunk_size);
    if (inputChunkSize % pageSize != 0) {
      throw new Error(
        `chunk_size is invalid, must be a multiple of page_size: ${pageSize}`,
      );
    }
  }
  // const chunkSize = inputChunkSize;

  checkAndOptimizeDatabase(inputPath, pageSize, values.optimize_db);

  process.exitCode = 0;
  return;

  // const outDir = values.out ? resolve(values.out) : dirname(inputPath);
  // const baseName = basename(inputPath);
  // const totalChunks = Math.ceil(fileInfo.size / chunkSize);
  // const padWidth = Math.max(3, String(totalChunks).length);

  // await mkdir(outDir, { recursive: true });

  // let written = 0;
  // for await (const { index, data } of chunkFile(inputPath, chunkSize)) {
  //   const suffix = String(index).padStart(padWidth, "0");
  //   const chunkPath = join(outDir, `${baseName}.part${suffix}`);
  //   await writeFile(chunkPath, data);
  //   written++;
  // }

  // console.log(
  //   `Created ${written} chunks (${chunkSize} bytes max) in ${outDir}`,
  // );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runCli(process.argv.slice(2)).catch((err: unknown) => {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  });
}
