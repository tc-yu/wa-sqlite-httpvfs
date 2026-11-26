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

import type { ChunkedDbConfig } from "../HttpRangeVFS.ts";
import { BaseHttpLayer } from "./BaseHttp.ts";

export class ChunkDbHttpLayer extends BaseHttpLayer {
  #_fileSize?: number;
  #_pageSize?: number;
  // url: URL;
  #dbConfig: ChunkedDbConfig;

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

  constructor(dbConfig: ChunkedDbConfig) {
    super();
    this.#dbConfig = dbConfig;
  }

  static async create(dbConfig: ChunkedDbConfig): Promise<ChunkDbHttpLayer> {
    const httpLayer = new ChunkDbHttpLayer(dbConfig);

    const firstBlockUrl = new URL(
      `${dbConfig.urlPrefix}${"0".repeat(dbConfig.suffixLength)}`,
    );

    await httpLayer.checkDB(firstBlockUrl);
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

    if (remoteFileSize !== this.#dbConfig.serverChunkSize) {
      console.warn(
        `Remote file size is ${remoteFileSize}, not matching provided ` +
          `serverChunkSize: ${this.#dbConfig.serverChunkSize}, using ` +
          `discovered value instead`,
      );

      this.#dbConfig.serverChunkSize = remoteFileSize;
    }
  }

  async openDb(): Promise<Uint8Array> {
    const url = new URL(
      `${this.#dbConfig.urlPrefix}${"0".repeat(this.#dbConfig.suffixLength)}`,
    );

    const response = await fetch(url, {
      headers: {
        Range: "bytes=0-99",
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

  computeUrl(pageNumber: number): URL {
    const pagePerChunk = this.#dbConfig.serverChunkSize / this.pageSize;
    const chunkNumber = Math.floor(pageNumber / pagePerChunk);
    const chunkString = String(chunkNumber).padStart(
      this.#dbConfig.suffixLength,
      "0",
    );

    return new URL(`${this.#dbConfig.urlPrefix}${chunkString}`);
  }

  async getPage(pageNumber: number): Promise<Uint8Array> {
    const iOffset =
      (pageNumber * this.pageSize) % this.#dbConfig.serverChunkSize;
    const endOffset = iOffset + this.pageSize - 1;

    const response = await fetch(this.computeUrl(pageNumber), {
      headers: {
        Range: `bytes=${iOffset}-${endOffset}`,
      },
    });

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer, 0, this.pageSize);
    return bytes;
  }
}
