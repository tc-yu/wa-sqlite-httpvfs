import { FacadeVFS as e } from "wa-sqlite/src/FacadeVFS.js";
import * as t from "wa-sqlite/src/VFS.js";
// src/BlockLayer/index.ts
var n = class {
	async getBlock(e) {
		return console.log(e), /* @__PURE__ */ new Uint8Array();
	}
}, r = class r extends e {
	mapIdToFile = /* @__PURE__ */ new Map();
	static async create(e, t, n) {
		/*!
		* Copyright (c) 2026 T.C YU
		* Licensed under the BSD-3-Clause License.
		*
		* Modified from example VFS code from wa-sqlite:
		* Copyright (c) 2024 Roy T. Hashimoto
		* Licensed under the MIT License.
		*
		* SPDX-License-Identifier: BSD-3-Clause AND MIT
		*/
		let i = new r(e, t, n);
		return await i.isReady(), i;
	}
	#e;
	#t;
	#n;
	#r;
	constructor(e, t, r) {
		super(e, t), this.#n = new n(), this.#r = r;
	}
	get fileSize() {
		if (this.#e === void 0) throw Error("File size not properly discoverd");
		return this.#e;
	}
	get pageSize() {
		if (this.#t === void 0) throw Error("Page size not properly discoverd");
		return this.#t;
	}
	async close() {
		for (let e of this.mapIdToFile.keys()) this.jClose(e);
	}
	async jOpen(e, n, r, i) {
		let a = new URL(this.#r.url);
		if (this.mapIdToFile.set(n, a), this.#r.serverMode === "full") {
			this.#r, console.log(a);
			let e = await fetch(a, { method: "HEAD" });
			if (!e.ok) return console.log("failed"), t.SQLITE_CANTOPEN;
			let n = e.headers.get("content-length"), r = n ? parseInt(n, 10) : 0, i = Math.min(r, 100), o = await (await fetch(this.#r.url, { headers: { Range: `bytes=0-${i - 1}` } })).arrayBuffer(), s = new Uint8Array(o), c = s[16] << 8 | s[17];
			this.#t = c;
			let l = s[28] << 24 | s[29] << 16 | s[30] << 8 | s[31];
			l === 0 ? (console.warn("in-header database size is 0, this db is likely a pre-3.7.0 SQLite DB, consider populating headers with a newer version of SQLite"), this.#e = r) : c * l === r ? this.#e = c * l : (console.warn("Page count * page size not matching remote content-length, consider checking DB integrity, using remote content-length as filesize"), this.#e = r);
		}
		return i.setInt32(0, r | t.SQLITE_OPEN_READONLY, !0), t.SQLITE_OK;
	}
	async jClose(e) {
		return this.mapIdToFile.delete(e), t.SQLITE_OK;
	}
	async jRead(e, n, r) {
		console.log(this.#n);
		let i = this.fileSize, { url: a } = this.#r;
		if (r >= i) return t.SQLITE_IOERR_SHORT_READ;
		let o = Math.min(n.byteLength, i - r), s = r + o - 1;
		try {
			let e = await fetch(a, { headers: { Range: `bytes=${r}-${s}` } });
			if (!e.ok && e.status !== 206) return t.SQLITE_IOERR_READ;
			let i = await e.arrayBuffer(), c = new Uint8Array(i, 0, o);
			return n.set(c), t.SQLITE_OK;
		} catch (e) {
			return console.error("Network error during xRead:", e), t.SQLITE_IOERR_READ;
		}
	}
	async jFileSize(e, n) {
		let r = this.fileSize;
		return n.setBigInt64(0, BigInt(r), !0), t.SQLITE_OK;
	}
	async jAccess(e, n, r) {
		return (e.endsWith("-journal") || e.endsWith("-wal") || n === t.SQLITE_ACCESS_READWRITE) && r.setInt32(0, 0, !0), t.SQLITE_OK;
	}
};
export { r as HttpRangeVFS };
