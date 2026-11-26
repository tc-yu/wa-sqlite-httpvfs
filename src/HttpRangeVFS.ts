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
import * as SQLite from "wa-sqlite";

import { SimpleBlockProvider } from "./BlockLayer";

export interface ChunkedDbConfig {
  serverChunkSize: number;
  serverMode: "chunked";
  suffixLength: number;
  urlPrefix: string; // Use urlPrefix instead of full url
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
    const blockProvider = await SimpleBlockProvider.create(dbConfig);

    const vfs = new HttpRangeVFS(name, module, blockProvider);
    await vfs.isReady();
    return vfs;
  }

  #blockProvider: SimpleBlockProvider;

  constructor(
    name: string,
    module: object,
    blockProvider: SimpleBlockProvider,
  ) {
    super(name, module);
    this.#blockProvider = blockProvider;
  }

  async close() {
    for (const pFile of this.mapIdToFile.keys()) {
      this.jClose(pFile);
    }
  }

  async jOpen(
    _filename: string | null,
    _pFile: number,
    flags: number,
    pOutFlags: DataView,
  ): Promise<number> {
    try {
      await this.#blockProvider.openDb();
    } catch (error) {
      return SQLite.SQLITE_CANTOPEN;
    }

    pOutFlags.setInt32(0, flags | SQLite.SQLITE_OPEN_READONLY, true);
    return SQLite.SQLITE_OK;
  }

  async jClose(_pFile: number): Promise<number> {
    return SQLite.SQLITE_OK;
  }

  async jRead(
    _pFile: number,
    pData: Uint8Array,
    iOffset: number,
  ): Promise<number> {
    const fileSize = this.#blockProvider.fileSize;

    if (iOffset >= fileSize) {
      return SQLite.SQLITE_IOERR_SHORT_READ;
    }

    const buffer = await this.#blockProvider.getBlock(
      iOffset,
      pData.byteLength,
    );

    pData.set(buffer);

    return SQLite.SQLITE_OK;

    // const availableBytes = Math.min(pData.byteLength, fileSize - iOffset);
    // const endOffset = iOffset + availableBytes - 1;

    // // const readEnd = iOffset + availableBytes;

    // try {
    //   const response = await fetch(url, {
    //     headers: {
    //       Range: `bytes=${iOffset}-${endOffset}`,
    //     },
    //   });

    //   if (!response.ok && response.status !== 206) {
    //     return SQLite.SQLITE_IOERR_READ;
    //   }

    //   const buffer = await response.arrayBuffer();
    //   const bytes = new Uint8Array(buffer, 0, availableBytes);
    //   pData.set(bytes);

    //   return SQLite.SQLITE_OK;
    // } catch (error) {
    //   console.error("Network error during xRead:", error);
    //   return SQLite.SQLITE_IOERR_READ;
    // }
  }

  async jFileSize(_fileId: number, pSize64: DataView): Promise<number> {
    const fileSize = this.#blockProvider.fileSize;
    pSize64.setBigInt64(0, BigInt(fileSize), true);

    return SQLite.SQLITE_OK;
  }

  async jAccess(
    name: string,
    flags: number,
    pResOut: DataView,
  ): Promise<number> {
    if (name.endsWith("-journal") || name.endsWith("-wal")) {
      // Short-circuit journal and WAL checks
      pResOut.setInt32(0, 0, true);
    } else if (flags === SQLite.SQLITE_ACCESS_READWRITE) {
      // Strictly read-only
      pResOut.setInt32(0, 0, true);
    } else {
      // TODO: Extensions and ATTACH check?
      // const exists = bool;
      // pResOut.setInt32(0, exists ? 1 : 0, true);
    }
    return SQLite.SQLITE_OK;
  }
}
