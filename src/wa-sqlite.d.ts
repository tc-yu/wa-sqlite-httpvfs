declare module 'wa-sqlite/src/FacadeVFS.js' {
  export class FacadeVFS {
    name: string;
    mxPathname: number;

    constructor(name: string, module: unknown);

    isReady(): Promise<void>;

    jOpen(
      zName: string | null,
      fileId: number,
      flags: number,
      pOutFlags: DataView
    ): number | Promise<number>;

    jClose(fileId: number): number | Promise<number>;

    jRead(
      fileId: number,
      pData: Uint8Array,
      iOffset: number
    ): number | Promise<number>;

    jWrite(
      fileId: number,
      pData: Uint8Array,
      iOffset: number
    ): number | Promise<number>;

    jTruncate(fileId: number, iSize: number): number | Promise<number>;
    jSync(fileId: number, flags: number): number | Promise<number>;
    jFileSize(fileId: number, pSize64: DataView): number | Promise<number>;
    jLock(fileId: number, flags: number): number | Promise<number>;
    jUnlock(fileId: number, flags: number): number | Promise<number>;
    jCheckReservedLock(fileId: number, pResOut: DataView): number | Promise<number>;
    jFileControl(fileId: number, op: number, pArg: DataView): number | Promise<number>;
    jSectorSize(fileId: number): number;
    jDeviceCharacteristics(fileId: number): number;
    jDelete(zName: string, syncDir: number): number | Promise<number>;
    jAccess(zName: string, flags: number, pResOut: DataView): number | Promise<number>;
    jFullPathname(zName: string, zOut: Uint8Array): number | Promise<number>;
  }
}