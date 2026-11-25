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
export declare abstract class HttpLayer {
    abstract checkDB(url: URL): Promise<void>;
    abstract openDb(): Promise<Uint8Array>;
    abstract getPage(pageNumber: number): Promise<Uint8Array>;
}
export declare class FullDbHttpLayer extends HttpLayer {
    #private;
    url: URL;
    get fileSize(): number;
    get pageSize(): number;
    constructor(url: URL);
    static create(url: URL): Promise<FullDbHttpLayer>;
    checkDB(url: URL): Promise<void>;
    openDb(): Promise<Uint8Array>;
    getPage(pageNumber: number): Promise<Uint8Array>;
}
