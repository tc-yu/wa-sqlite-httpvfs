import type { DbConfig } from "../HttpRangeVFS.ts";
import { LRUCache } from "lru-cache";
import { FullDbHttpLayer } from "../HttpHelper.ts";

/**
 * Middle layer to receive block read request from VFS and create http
 * query or fetch from cache
 */
export interface BlockProvider {
  openDb(): Promise<void>;
  getBlock(index: number, byteLength: number): Promise<Uint8Array>;
}

export class SimpleBlockProvider implements BlockProvider {
  #cache: LRUCache<number, Uint8Array>;
  #httpLayer: FullDbHttpLayer;
  constructor(httpLayer: FullDbHttpLayer) {
    const options = {
      max: 500,

      // for use with tracking overall storage size
      // maxSize: 5000,
      // sizeCalculation: (value, key: string) => {
      //   return 1;
      // },

      // how long to live in ms
      ttl: 1000 * 60 * 5,

      // return stale items before removing from cache?
      allowStale: false,
      updateAgeOnGet: true,
      updateAgeOnHas: false,
    };

    this.#cache = new LRUCache(options);
    this.#httpLayer = httpLayer;
  }

  static async create(dbConfig: DbConfig): Promise<SimpleBlockProvider> {
    // console.log(dbConfig)

    const url = new URL(dbConfig.url);
    const httpLayer = await FullDbHttpLayer.create(url);

    return new SimpleBlockProvider(httpLayer);
  }

  get fileSize(): number {
    return this.#httpLayer.fileSize;
  }

  get pageSize(): number {
    return this.#httpLayer.pageSize;
  }

  async openDb(): Promise<void> {
    await this.#httpLayer.openDb();
  }

  async getBlock(iOffset: number, byteLength: number): Promise<Uint8Array> {
    // console.log(`iOffset: ${iOffset}, byteLength: ${byteLength}`);

    // Sometimes SQLite tries to read partial page
    const pageNumber = Math.floor(iOffset / this.pageSize);
    const blockOffset = iOffset % this.pageSize;

    // console.log(`pageNumber: ${pageNumber}, blockOffset: ${blockOffset}`);

    const cachedBuffer = this.#cache.get(pageNumber);
    if (cachedBuffer !== undefined) {
      // console.log("Cache hit");
      // console.log(cachedBuffer.subarray(iOffset, blockOffset + byteLength));

      return cachedBuffer.subarray(blockOffset, blockOffset + byteLength);
    } else {
      // Always fetch and cache full page and return approach slice when needed
      const fetchedBuffer = await this.#httpLayer.getPage(pageNumber);
      this.#cache.set(pageNumber, fetchedBuffer);

      if (byteLength === this.pageSize) {
        return fetchedBuffer;
      } else {
        return fetchedBuffer.subarray(iOffset, blockOffset + byteLength);
      }
    }
  }
}
