/**
 * Middle layer to receive block read request from VFS and create http
 * query or fetch from cache
 */
export interface BlockProvider {
  getBlock(index: number): Promise<Uint8Array>;
}

export class SimpleBlockProvider implements BlockProvider {
  async getBlock(index: number): Promise<Uint8Array> {
    console.log(index);
    return new Uint8Array();
  }
}
