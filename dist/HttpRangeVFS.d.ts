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
import { SimpleBlockProvider } from "./BlockLayer";
export interface ChunkedDbConfig {
    serverChunkSize: number;
    serverMode: "chunked";
    suffixLength: number;
    urlPrefix: string;
}
export interface FullDbConfig {
    serverMode: "full";
    url: string;
}
export type DbConfig = ChunkedDbConfig | FullDbConfig;
export declare class HttpRangeVFS extends FacadeVFS {
    #private;
    mapIdToFile: Map<number, any>;
    static create(name: string, module: object, dbConfig: DbConfig): Promise<HttpRangeVFS>;
    constructor(name: string, module: object, blockProvider: SimpleBlockProvider);
    close(): Promise<void>;
    jOpen(_filename: string | null, _pFile: number, flags: number, pOutFlags: DataView): Promise<number>;
    jClose(_pFile: number): Promise<number>;
    jRead(_pFile: number, pData: Uint8Array, iOffset: number): Promise<number>;
    jFileSize(_fileId: number, pSize64: DataView): Promise<number>;
    jAccess(name: string, flags: number, pResOut: DataView): Promise<number>;
}
