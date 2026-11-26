export abstract class BaseHttpLayer {
  abstract checkDB(url: URL): Promise<void>;
  abstract openDb(): Promise<Uint8Array>;
  // abstract getBlock(index: number, byteLength: number): Promise<Uint8Array>;
  abstract getPage(pageNumber: number): Promise<Uint8Array>;
}