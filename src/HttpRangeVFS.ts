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
import { FacadeVFS } from "wa-sqlite/src/FacadeVFS.js";
import * as VFS from "wa-sqlite/src/VFS.js";

import { SimpleBlockProvider } from "./BlockLayer";

export interface ChunkedDbConfig {
  serverChunkSize: number;
  serverMode: "chunked";
  suffixLength: number;
  urlPrefix: string; // Use urlPrefix instead of full url
  url: string;
}

export interface FullDbConfig {
  serverMode: "full";
  url: string;
}

export type DbConfig = ChunkedDbConfig | FullDbConfig;

export class HttpRangeVFS extends FacadeVFS {
  // Map of open files, keyed by id (sqlite3_file pointer).
  mapIdToFile: Map<number, any> = new Map();

  static async create(name: string, module: object, dbConfig: DbConfig) {
    const vfs = new HttpRangeVFS(name, module, dbConfig);
    await vfs.isReady();
    return vfs;
  }

  #_fileSize?: number;
  #_pageSize?: number;
  #blockProvider: SimpleBlockProvider;
  #dbConfig: DbConfig;

  constructor(name: string, module: object, dbConfig: DbConfig) {
    super(name, module);
    // if present
    this.#blockProvider = new SimpleBlockProvider();
    this.#dbConfig = dbConfig;
  }

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

  async close() {
    for (const pFile of this.mapIdToFile.keys()) {
      this.jClose(pFile);
    }
  }

  async jOpen(
    _filename: string | null,
    pFile: number,
    flags: number,
    pOutFlags: DataView,
  ): Promise<number> {
    // Check does remote sqlite DB exists

    const url = new URL(this.#dbConfig.url);

    this.mapIdToFile.set(pFile, url);

    if (this.#dbConfig.serverMode === "full") {
      this.#dbConfig as FullDbConfig;

      console.log(url);
      // console.log(_pFile)

      const response = await fetch(url, { method: "HEAD" });

      if (!response.ok) {
        console.log("failed");
        return VFS.SQLITE_CANTOPEN;
      }
      const contentLength = response.headers.get("content-length");
      const remoteFileSize = contentLength ? parseInt(contentLength, 10) : 0;

      // console.log(size);

      const headerSize = Math.min(remoteFileSize, 100);
      const response2 = await fetch(this.#dbConfig.url, {
        headers: {
          Range: `bytes=0-${headerSize - 1}`,
        },
      });

      const headerBuf = await response2.arrayBuffer();
      const bytes = new Uint8Array(headerBuf);
      // SQLITE store page size at byte 16-17
      const rawPageSize = (bytes[16] << 8) | bytes[17];
      this.#_pageSize = rawPageSize;

      // SQLITE store page count at byte 28-31
      const totalPages =
        (bytes[28] << 24) | (bytes[29] << 16) | (bytes[30] << 8) | bytes[31];

      if (totalPages === 0) {
        console.warn(
          "in-header database size is 0, this db is likely a pre-3.7.0 SQLite" +
            " DB, consider populating headers with a newer version of SQLite",
        );
        this.#_fileSize = remoteFileSize;
      } else if (rawPageSize * totalPages !== remoteFileSize) {
        console.warn(
          "Page count * page size not matching remote content-length, consider" +
            " checking DB integrity, using remote content-length as filesize",
        );
        this.#_fileSize = remoteFileSize;
      } else {
        this.#_fileSize = rawPageSize * totalPages;
      }
    }

    pOutFlags.setInt32(0, flags | VFS.SQLITE_OPEN_READONLY, true);
    return VFS.SQLITE_OK;
  }

  async jClose(pFile: number): Promise<number> {
    this.mapIdToFile.delete(pFile);
    return VFS.SQLITE_OK;
  }

  async jRead(
    _pFile: number,
    pData: Uint8Array,
    iOffset: number,
  ): Promise<number> {
    // console.log(pFile);
    // console.log(this.mapIdToFile);

    console.log(this.#blockProvider);

    const fileSize = this.fileSize;
    const { url } = this.#dbConfig;

    // console.log(iOffset);
    // console.log(pData);
    // Handle out-of-bounds reads
    if (iOffset >= fileSize) {
      return VFS.SQLITE_IOERR_SHORT_READ;
    }

    const availableBytes = Math.min(pData.byteLength, fileSize - iOffset);
    const endOffset = iOffset + availableBytes - 1;

    // const readEnd = iOffset + availableBytes;

    try {
      const response = await fetch(url, {
        headers: {
          Range: `bytes=${iOffset}-${endOffset}`,
        },
      });

      if (!response.ok && response.status !== 206) {
        return VFS.SQLITE_IOERR_READ;
      }

      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer, 0, availableBytes);
      pData.set(bytes);
      // if (bytes.length < 1024) {
      //   // Zero-fill the remainder if a short read occurs
      //   this.module.HEAP8.fill(0, pData + bytes.length, pData + iAmt);
      //   return VFS.SQLITE_IOERR_SHORT_READ;
      // }

      return VFS.SQLITE_OK;
    } catch (error) {
      console.error("Network error during xRead:", error);
      return VFS.SQLITE_IOERR_READ;
    }
  }

  async jFileSize(_fileId: number, pSize64: DataView): Promise<number> {
    const fileSize = this.fileSize;
    pSize64.setBigInt64(0, BigInt(fileSize), true);

    return VFS.SQLITE_OK;
  }

  async jAccess(
    name: string,
    flags: number,
    pResOut: DataView,
  ): Promise<number> {
    if (name.endsWith("-journal") || name.endsWith("-wal")) {
      // Short-circuit journal and WAL checks
      pResOut.setInt32(0, 0, true);
    } else if (flags === VFS.SQLITE_ACCESS_READWRITE) {
      // Strictly read-only
      pResOut.setInt32(0, 0, true);
    } else {
      // TODO: Extensions and ATTACH check?
      // const exists = bool;
      // pResOut.setInt32(0, exists ? 1 : 0, true);
    }
    return VFS.SQLITE_OK;
  }
}
