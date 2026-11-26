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
export declare class ChunkDbHttpLayer extends BaseHttpLayer {
    #private;
    get fileSize(): number;
    get pageSize(): number;
    constructor(dbConfig: ChunkedDbConfig);
    static create(dbConfig: ChunkedDbConfig): Promise<ChunkDbHttpLayer>;
    checkDB(url: URL): Promise<void>;
    openDb(): Promise<Uint8Array>;
    computeUrl(pageNumber: number): URL;
    getPage(pageNumber: number): Promise<Uint8Array>;
}
