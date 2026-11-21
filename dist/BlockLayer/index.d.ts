/**
 * Middle layer to receive block read request from VFS and create http
 * query or fetch from cache
 */
export interface BlockProvider {
    getBlock(index: number): Promise<Uint8Array>;
}
export declare class SimpleBlockProvider implements BlockProvider {
    getBlock(index: number): Promise<Uint8Array>;
}
