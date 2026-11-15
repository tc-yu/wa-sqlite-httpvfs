import { FacadeVFS } from 'wa-sqlite/src/FacadeVFS.js'
import * as VFS from 'wa-sqlite/src/VFS.js'

export class HttpRangeVFS extends FacadeVFS {

  // Map of existing files, keyed by filename.
  mapNameToFile = new Map();

  // Map of open files, keyed by id (sqlite3_file pointer).
  mapIdToFile = new Map();

  static async create(name: string, module: object, baseUrl: string) {
    const vfs = new HttpRangeVFS(name, module, baseUrl);
    await vfs.isReady();
    return vfs;
  }

  private baseUrl: string
  private fileSizes: Map<any, any>

  constructor(name: string, module: object, baseUrl: string) {
    super(name, module);
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash 
    // if present
    this.fileSizes = new Map();

  }

  async close() {
    for (const fileId of this.mapIdToFile.keys()) {
      this.jClose(fileId);
    }
  }

  async jOpen(_filename: string | null, pFile: number, flags: number, pOutFlags: DataView): Promise<number> {

    // Check does remote sqlite DB exists
    const url = new URL(this.baseUrl);
    const response = await fetch(url, { method: 'HEAD' });

    if (!response.ok) {
      console.log('failed')
      return VFS.SQLITE_CANTOPEN;
    }

    const pathname = url.pathname;

    console.log(response.headers)

    const contentLength = response.headers.get('content-length');
    const size = contentLength ? parseInt(contentLength, 10) : 0;
    this.fileSizes.set(pathname, size);

    // if (!isCreating && fileSize >= 100) {
    //   try {
    //     // Read the 100-byte database file header
    //     // (For remote VFS, this is an HTTP Range request for bytes 0-99)
    //     const headerBuf = new Uint8Array(100);
    //     await this.readBytes(filename, headerBuf, 0, 0);

    //     // Page size is stored as a 16-bit big-endian integer at offset 16-17
    //     const rawPageSize = (headerBuf[16] << 8) | headerBuf[17];

    //     // SQLite special case: 1 represents 65536 bytes
    //     fileHandle.pageSize = rawPageSize === 1 ? 65536 : (rawPageSize || 4096);

    //   } catch (err) {
    //     console.warn("Failed to read database header in jOpen, falling back to default page size:", err);
    //   }
    // }

    this.mapIdToFile.set(pFile, {
      url,
      chunkSize: 4096,
      size: size,
      cache: new Map(),
    });

    // this.mapIdToFile.set(fileId, file);
    pOutFlags.setInt32(0, flags | VFS.SQLITE_OPEN_READONLY, true);

    return VFS.SQLITE_OK;
  }

  async jClose(fileId: number): Promise<number> {
    this.mapIdToFile.delete(fileId);
    return VFS.SQLITE_OK;
  }


  async jRead(pFile: number, pData: Uint8Array, iOffset: number): Promise<number> {

    console.log(pFile)
    console.log(this.mapIdToFile)

    const file = this.mapIdToFile.get(pFile);

    console.log(file)

    const fileSize = file.size

    console.log(iOffset)
    console.log(pData)
    // Handle out-of-bounds reads
    if (iOffset >= fileSize) {
      return VFS.SQLITE_IOERR_SHORT_READ;
    }

    const availableBytes = Math.min(pData.byteLength, fileSize - iOffset);
    const endOffset = iOffset + availableBytes - 1;

    // const readEnd = iOffset + availableBytes;

    try {
      const response = await fetch(file.url, {
        headers: {
          Range: `bytes=${iOffset}-${endOffset}`
        }
      });

      if (!response.ok && response.status !== 206) {
        return VFS.SQLITE_IOERR_READ;
      }

      const buffer = await response.arrayBuffer();

      // console.log(buffer)


      const bytes = new Uint8Array(buffer, 0, availableBytes);

      // console.log(bytes)

      // Copy fetched bytes directly into Wasm memory view
      // this.module.HEAP8.set(bytes, pData);
      pData.set(bytes);
      // if (bytes.length < 1024) {
      //   // Zero-fill the remainder if a short read occurs
      //   this.module.HEAP8.fill(0, pData + bytes.length, pData + iAmt);
      //   return VFS.SQLITE_IOERR_SHORT_READ;
      // }

      return VFS.SQLITE_OK;
    } catch (error) {
      console.error('Network error during xRead:', error);
      return VFS.SQLITE_IOERR_READ;
    }
  }

  async jFileSize(fileId: number, pSize64: DataView): Promise<number> {
    const file = this.mapIdToFile.get(fileId);

    pSize64.setBigInt64(0, BigInt(file.size), true);
    return VFS.SQLITE_OK;
  }

  async jAccess(name: string, _flags: number, pResOut: DataView): Promise<number> {
    const url = new URL(name, 'file://');
    const pathname = url.pathname;

    const file = this.mapNameToFile.get(pathname);
    pResOut.setInt32(0, file ? 1 : 0, true);
    return VFS.SQLITE_OK;
  }

}


