import { FacadeVFS as e } from "wa-sqlite/src/FacadeVFS.js";
import * as t from "wa-sqlite/src/VFS.js";
// src/HttpRangeVFS.ts
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
var n = class n extends e {
	mapNameToFile = /* @__PURE__ */ new Map();
	mapIdToFile = /* @__PURE__ */ new Map();
	static async create(e, t, r) {
		let i = new n(e, t, r);
		return await i.isReady(), i;
	}
	baseUrl;
	fileSizes;
	constructor(e, t, n) {
		super(e, t), this.baseUrl = n.replace(/\/$/, ""), this.fileSizes = /* @__PURE__ */ new Map();
	}
	async close() {
		for (let e of this.mapIdToFile.keys()) this.jClose(e);
	}
	async jOpen(e, n, r, i) {
		let a = new URL(this.baseUrl), o = await fetch(a, { method: "HEAD" });
		if (!o.ok) return console.log("failed"), t.SQLITE_CANTOPEN;
		let s = a.pathname, c = o.headers.get("content-length"), l = c ? parseInt(c, 10) : 0;
		return this.fileSizes.set(s, l), this.mapIdToFile.set(n, {
			url: a,
			chunkSize: 4096,
			size: l,
			cache: /* @__PURE__ */ new Map()
		}), i.setInt32(0, r | t.SQLITE_OPEN_READONLY, !0), t.SQLITE_OK;
	}
	async jClose(e) {
		return this.mapIdToFile.delete(e), t.SQLITE_OK;
	}
	async jRead(e, n, r) {
		let i = this.mapIdToFile.get(e), a = i.size;
		if (r >= a) return t.SQLITE_IOERR_SHORT_READ;
		let o = Math.min(n.byteLength, a - r), s = r + o - 1;
		try {
			let e = await fetch(i.url, { headers: { Range: `bytes=${r}-${s}` } });
			if (!e.ok && e.status !== 206) return t.SQLITE_IOERR_READ;
			let a = await e.arrayBuffer(), c = new Uint8Array(a, 0, o);
			return n.set(c), t.SQLITE_OK;
		} catch (e) {
			return console.error("Network error during xRead:", e), t.SQLITE_IOERR_READ;
		}
	}
	async jFileSize(e, n) {
		let r = this.mapIdToFile.get(e);
		return n.setBigInt64(0, BigInt(r.size), !0), t.SQLITE_OK;
	}
	async jAccess(e, n, r) {
		return (e.endsWith("-journal") || e.endsWith("-wal") || n === t.SQLITE_ACCESS_READWRITE) && r.setInt32(0, 0, !0), t.SQLITE_OK;
	}
};
export { n as HttpRangeVFS };
