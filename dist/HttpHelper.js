// src/HttpHelper.ts
/*!
* Copyright (c) 2026 T.C YU
* Licensed under the BSD-3-Clause License.
*
* Contains code derived from sql.js-httpvfs:
* Copyright (c) phiresky
* Licensed under Apache-2.0 (see Third-Party-License/Apache-License-2.0).
*
* * Modifications:
* - Convert the XHR requests to fetch API
* - Dynamic discover of DB size and page size
*
* SPDX-License-Identifier: BSD-3-Clause AND Apache-2.0
*/
var e = class {}, t = class t extends e {
	#e;
	#t;
	url;
	get fileSize() {
		if (this.#e === void 0) throw Error("File size not properly discoverd");
		return this.#e;
	}
	get pageSize() {
		if (this.#t === void 0) throw Error("Page size not properly discoverd");
		return this.#t;
	}
	constructor(e) {
		super(), this.url = e;
	}
	static async create(e) {
		let n = new t(e);
		return await n.checkDB(e), n;
	}
	async checkDB(e) {
		let t = await fetch(e, { method: "HEAD" });
		if (!(t.status >= 200 && t.status < 300 || t.status === 304)) throw Error("Couldn't load " + e + ". Status: " + t.status);
		console.log(t.headers);
		let n = t.headers.get("content-length"), r = n ? parseInt(n, 10) : 0;
		this.#e = r;
		var i = t.headers.get("Accept-Ranges") === "bytes";
		let a = t.headers.get("Content-Encoding");
		var o = a && a !== "identity";
		i || console.warn("Warning: The server did not respond with Accept-Ranges=bytes. It either does not support byte serving or does not advertise it (`Accept-Ranges: bytes` header missing), or your database is hosted on CORS and the server doesn't mark the accept-ranges header as exposed. This may lead to incorrect results.", "(seen response headers:", t.headers, ")"), o && console.warn(`Warning: The server responded with ${a} encoding to a HEAD request. Ignoring since it may not do so for Range HTTP requests, but this will lead to incorrect results otherwise since the ranges will be based on the compressed data instead of the uncompressed data.`);
	}
	async openDb() {
		let e = this.url, t = Math.min(this.fileSize, 100), n = await (await fetch(e, { headers: { Range: `bytes=0-${t - 1}` } })).arrayBuffer(), r = new Uint8Array(n), i = r[16] << 8 | r[17];
		this.#t = i;
		let a = r[28] << 24 | r[29] << 16 | r[30] << 8 | r[31];
		a === 0 ? console.warn("in-header database size is 0, this db is likely a pre-3.7.0 SQLite DB, consider populating headers with a newer version of SQLite") : i * a !== this.fileSize && console.warn("Page count * page size not matching remote content-length, consider checking DB integrity, using remote content-length as filesize");
	}
	async getBlock(e) {
		return console.log(e), /* @__PURE__ */ new Uint8Array();
	}
};
if (import.meta.main) {
	let e = await t.create(new URL("http://localhost:5173/northwind.db"));
	e.openDb(), console.log(e);
}
export { t as FullDbHttpLayer, e as HttpLayer };
