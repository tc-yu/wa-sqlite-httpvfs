/**
 * Middle layer to receive block read request from VFS and create http
 * query or fetch from cache
 */
export interface BlockProvider {
    openDb(): Promise<void>;
    getBlock(index: number): Promise<Uint8Array>;
}
