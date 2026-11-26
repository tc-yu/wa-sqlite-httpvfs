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

import { BaseHttpLayer } from "./BaseHttp.ts";

export class FullDbHttpLayer extends BaseHttpLayer {
  #_fileSize?: number;
  #_pageSize?: number;
  url: URL;

  get fileSize(): number {
    if (this.#_fileSize === undefined) {
      throw new Error("File size not properly discoverd");
    }

    return this.#_fileSize as number;
  }

  get pageSize(): number {
    if (this.#_pageSize === undefined) {
      throw new Error("Page size not properly discoverd");
    }

    return this.#_pageSize as number;
  }

  constructor(url: URL) {
    super();
    this.url = url;
  }

  static async create(url: URL): Promise<FullDbHttpLayer> {
    const httpLayer = new FullDbHttpLayer(url);
    await httpLayer.checkDB(url);
    return httpLayer;
  }

  async checkDB(url: URL): Promise<void> {
    const response = await fetch(url, { method: "HEAD" });

    if (!(
      (response.status >= 200 && response.status < 300) ||
      response.status === 304
    ))
      throw new Error("Couldn't load " + url + ". Status: " + response.status);

    const contentLength = response.headers.get("content-length");
    const remoteFileSize = contentLength ? parseInt(contentLength, 10) : 0;

    this.#_fileSize = remoteFileSize;

    // console.log(remoteFileSize);

    // var hasByteServing = response.headers.get("Accept-Ranges") === "bytes";
    // const encoding = response.headers.get("Content-Encoding");
    // var usesCompression = encoding && encoding !== "identity";

    // if (!hasByteServing) {
    //   const msg =
    //     "Warning: The server did not respond with Accept-Ranges=bytes. It either does not support byte serving or does not advertise it (`Accept-Ranges: bytes` header missing), or your database is hosted on CORS and the server doesn't mark the accept-ranges header as exposed. This may lead to incorrect results.";
    //   console.warn(msg, "(seen response headers:", response.headers, ")");
    //   // throw Error(msg);
    // }
    // if (usesCompression) {
    //   console.warn(
    //     `Warning: The server responded with ${encoding} encoding to a HEAD request. Ignoring since it may not do so for Range HTTP requests, but this will lead to incorrect results otherwise since the ranges will be based on the compressed data instead of the uncompressed data.`,
    //   );
    // }

    // if (usesCompression) {
    //   // can't use the given data length if there's compression
    //   datalength = null;
    // }

    // if (!this._length) {
    //   if (!datalength) {
    //     console.error("response headers", xhr.getAllResponseHeaders());
    //     throw Error(
    //       "Length of the file not known. It must either be supplied in the config or given by the HTTP server.",
    //     );
    //   }
    //   this._length = datalength;
    // }
    // this.serverChecked = true;
  }

  async openDb(): Promise<Uint8Array> {
    const url = this.url;

    const response = await fetch(url, {
      headers: {
        Range: `bytes=0-99`,
      },
    });

    const headerBuf = await response.arrayBuffer();
    const bytes = new Uint8Array(headerBuf);
    // SQLITE store page size at byte 16-17
    const rawPageSize = (bytes[16] << 8) | bytes[17];
    this.#_pageSize = rawPageSize;

    // SQLITE store page count at byte 28-31
    const totalPages =
      (bytes[28] << 24) | (bytes[29] << 16) | (bytes[30] << 8) | bytes[31];

    this.#_fileSize = totalPages * rawPageSize;

    if (totalPages === 0) {
      console.warn(
        "in-header database size is 0, this db is likely a pre-3.7.0 SQLite" +
          " DB, consider populating headers with a newer version of SQLite",
      );
      //   this.#_fileSize = remoteFileSize;
    } else if (rawPageSize * totalPages !== this.fileSize) {
      console.warn(
        "Page count * page size not matching remote content-length, consider" +
          " checking DB integrity, using remote content-length as filesize",
      );
      //   this.#_fileSize = remoteFileSize;
    }

    return bytes;
  }

  async getPage(pageNumber: number): Promise<Uint8Array> {
    const iOffset = pageNumber * this.pageSize;
    const endOffset = iOffset + this.pageSize - 1;

    const response = await fetch(this.url, {
      headers: {
        Range: `bytes=${iOffset}-${endOffset}`,
      },
    });

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer, 0, this.pageSize);
    return bytes;
  }
}
