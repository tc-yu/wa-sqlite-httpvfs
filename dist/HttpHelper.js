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
		let n = t.headers.get("content-length"), r = n ? parseInt(n, 10) : 0;
		this.#e = r;
	}
	async openDb() {
		let e = this.url, t = await (await fetch(e, { headers: { Range: "bytes=0-99" } })).arrayBuffer(), n = new Uint8Array(t), r = n[16] << 8 | n[17];
		this.#t = r;
		let i = n[28] << 24 | n[29] << 16 | n[30] << 8 | n[31];
		return this.#e = i * r, i === 0 ? console.warn("in-header database size is 0, this db is likely a pre-3.7.0 SQLite DB, consider populating headers with a newer version of SQLite") : r * i !== this.fileSize && console.warn("Page count * page size not matching remote content-length, consider checking DB integrity, using remote content-length as filesize"), n;
	}
	async getPage(e) {
		let t = e * this.pageSize, n = t + this.pageSize - 1, r = await (await fetch(this.url, { headers: { Range: `bytes=${t}-${n}` } })).arrayBuffer();
		return new Uint8Array(r, 0, this.pageSize);
	}
};
export { t as FullDbHttpLayer, e as HttpLayer };
