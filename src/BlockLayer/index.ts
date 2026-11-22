// import type { DbConfig } from "../HttpRangeVFS";

/**
 * Middle layer to receive block read request from VFS and create http
 * query or fetch from cache
 */
export interface BlockProvider {
  openDb(): Promise<void>;
  getBlock(index: number): Promise<Uint8Array>;
}

// export class SimpleBlockProvider implements BlockProvider {
//   #_fileSize?: number;
//   #_pageSize?: number;
//   #dbConfig: DbConfig;

//   constructor(dbConfig: DbConfig) {
//     this.#dbConfig = dbConfig;
//   }

//   async getBlock(index: number): Promise<Uint8Array> {
//     console.log(index);
//     return new Uint8Array();
//   }
// }
