#!/usr/bin/env node
import { DatabaseSync } from "node:sqlite";
import { mkdir, open, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
// src/prepareDb.ts
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
var VALID_PAGE_SIZES = [
	512,
	1024,
	2048,
	4096,
	8192,
	16384,
	32768,
	65536
];
function checkAndOptimizeDatabase(dbPath, pageSize, optimizeDb) {
	let db;
	db = new DatabaseSync(dbPath, { readOnly: true });
	try {
		db.prepare("PRAGMA schema_version").get();
	} catch (err) {
		throw new Error(`Invalide sqlite file: ${err}`);
	} finally {
		db.close();
	}
	if (optimizeDb) {
		db = new DatabaseSync(dbPath);
		try {
			db.exec("PRAGMA journal_mode = DELETE;");
			db.exec(`PRAGMA page_size = ${pageSize};`);
			const ftsTables = db.prepare(`SELECT name FROM sqlite_schema
             WHERE type = 'table'
             AND (
               sql LIKE '%USING fts5%'
               OR sql LIKE '%USING fts4%'
               OR sql LIKE '%USING fts3%'
             )`).all();
			for (const { name } of ftsTables) {
				const escaped = `"${name.replaceAll("\"", "\"\"")}"`;
				db.exec(`INSERT INTO ${escaped}(${escaped}) VALUES ('optimize');`);
			}
			db.exec("VACUUM;");
		} finally {
			db.close();
		}
	}
}
function parseByteSize(input) {
	const match = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i.exec(input.trim());
	if (!match) throw new Error(`Invalid size format: "${input}". Examples: 65536, 512KB, 1MB`);
	const value = Number(match[1]);
	const unit = (match[2] ?? "B").toUpperCase();
	return Math.floor(value * {
		B: 1,
		KB: 1024,
		MB: 1024 ** 2,
		GB: 1024 ** 3
	}[unit]);
}
async function* chunkFile(filePath, chunkSize) {
	if (!Number.isInteger(chunkSize) || chunkSize <= 0) throw new Error(`Invalid chunk size: ${chunkSize}. Must be a positive integer.`);
	const handle = await open(filePath, "r");
	try {
		const buffer = Buffer.allocUnsafe(chunkSize);
		let index = 0;
		while (true) {
			const { bytesRead } = await handle.read(buffer, 0, chunkSize, null);
			if (bytesRead === 0) break;
			yield {
				index: index++,
				data: Buffer.from(buffer.subarray(0, bytesRead))
			};
		}
	} finally {
		await handle.close();
	}
}
async function runCli(argv) {
	const { values, positionals } = parseArgs({
		args: argv,
		allowPositionals: true,
		options: {
			page_size: {
				type: "string",
				default: "1024"
			},
			chunk_size: { type: "string" },
			out_dir: {
				type: "string",
				short: "o",
				default: "./db_chunks"
			},
			optimize_db: {
				type: "boolean",
				default: false
			},
			help: {
				type: "boolean",
				short: "h",
				default: false
			}
		}
	});
	if (values.help || positionals.length === 0) {
		console.log([
			"Usage: prepare-db <file-path> [options]",
			"",
			"--page_size <bytes|unit>  DB page size (e.g., 1024, 4096) [default: 1024]",
			"--chunk_size <bytes|unit> Needs to be a multiple of page_size [default: 10240 * page_size]",
			"--out_dir <dir>           Output directory [default: ./db_chunks]",
			"--optimize_db             Configure journal mode, page size and order data",
			"-h, --help                Show this help message`)"
		].join("\n"));
		process.exitCode = values.help ? 0 : 1;
		return;
	}
	const inputPath = resolve(positionals[0]);
	const fileInfo = await stat(inputPath);
	if (!fileInfo.isFile()) throw new Error(`Path is not a regular file: ${inputPath}`);
	const pageSize = parseByteSize(values.page_size);
	if (!VALID_PAGE_SIZES.includes(pageSize)) throw new Error(`Page size is invalid, must be a power of two between 512 and 65536, inclusive`);
	let inputChunkSize;
	if (values.chunk_size === void 0) inputChunkSize = 10240 * pageSize;
	else {
		inputChunkSize = parseByteSize(values.chunk_size);
		if (inputChunkSize % pageSize != 0) throw new Error(`chunk_size is invalid, must be a multiple of page_size: ${pageSize}`);
	}
	const chunkSize = inputChunkSize;
	checkAndOptimizeDatabase(inputPath, pageSize, values.optimize_db);
	const outDir = values.out_dir ? resolve(values.out_dir) : dirname(inputPath);
	const baseName = basename(inputPath);
	const totalChunks = Math.ceil(fileInfo.size / chunkSize);
	const padWidth = Math.max(3, String(totalChunks).length);
	await mkdir(outDir, { recursive: true });
	let written = 0;
	for await (const { index, data } of chunkFile(inputPath, chunkSize)) {
		const suffix = String(index).padStart(padWidth, "0");
		const chunkPath = join(outDir, `${baseName}.${suffix}`);
		await writeFile(chunkPath, data);
		written++;
	}
	console.log(`Created ${written} chunks (${chunkSize} bytes max) in ${outDir}`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli(process.argv.slice(2)).catch((err) => {
	console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
	process.exitCode = 1;
});
export { checkAndOptimizeDatabase, runCli };
