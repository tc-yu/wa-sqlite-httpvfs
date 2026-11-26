import type { DbConfig } from "../HttpRangeVFS.ts";
import { ChunkDbHttpLayer, FullDbHttpLayer } from "../HttpLayer";
/**
 * Middle layer to receive block read request from VFS and create http
 * query or fetch from cache
 */
export interface BlockProvider {
    openDb(): Promise<void>;
    getBlock(index: number, byteLength: number): Promise<Uint8Array>;
}
export declare class SimpleBlockProvider implements BlockProvider {
    #private;
    constructor(httpLayer: FullDbHttpLayer | ChunkDbHttpLayer);
    static create(dbConfig: DbConfig): Promise<SimpleBlockProvider>;
    get fileSize(): number;
    get pageSize(): number;
    openDb(): Promise<void>;
    getBlock(iOffset: number, byteLength: number): Promise<Uint8Array>;
}
