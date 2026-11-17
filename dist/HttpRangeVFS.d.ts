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
export declare class HttpRangeVFS extends FacadeVFS {
    mapNameToFile: Map<any, any>;
    mapIdToFile: Map<any, any>;
    static create(name: string, module: object, baseUrl: string): Promise<HttpRangeVFS>;
    private baseUrl;
    private fileSizes;
    constructor(name: string, module: object, baseUrl: string);
    close(): Promise<void>;
    jOpen(_filename: string | null, pFile: number, flags: number, pOutFlags: DataView): Promise<number>;
    jClose(fileId: number): Promise<number>;
    jRead(pFile: number, pData: Uint8Array, iOffset: number): Promise<number>;
    jFileSize(fileId: number, pSize64: DataView): Promise<number>;
    jAccess(name: string, flags: number, pResOut: DataView): Promise<number>;
}
