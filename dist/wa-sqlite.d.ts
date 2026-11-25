/*!
 * Copyright (c) 2026 T.C YU
 * Licensed under the BSD-3-Clause License.
 *
 * Type definitaions of FacadeVFS from wa-sqlite:
 * Copyright (c) 2024 Roy T. Hashimoto
 * Licensed under the MIT License.
 *
 * SPDX-License-Identifier: BSD-3-Clause AND MIT
 */

declare module "wa-sqlite/src/FacadeVFS.js" {
  export interface FacadeVFS extends SQLiteVFS {}
  export class FacadeVFS {
    constructor(name: string, module: object);

    jOpen(
      filename: string | null,
      pFile: number,
      flags: number,
      pOutFlags: DataView,
    ): number | Promise<number>;

    jClose(pFile: number): number | Promise<number>;

    jRead(
      pFile: number,
      pData: Uint8Array,
      iOffset: number,
    ): number | Promise<number>;

    jWrite(
      pFile: number,
      pData: Uint8Array,
      iOffset: number,
    ): number | Promise<number>;

    jTruncate(pFile: number, iSize: number): number | Promise<number>;
    jSync(pFile: number, flags: number): number | Promise<number>;
    jFileSize(pFile: number, pSize64: DataView): number | Promise<number>;
    jLock(pFile: number, flags: number): number | Promise<number>;
    jUnlock(pFile: number, flags: number): number | Promise<number>;
    jCheckReservedLock(
      pFile: number,
      pResOut: DataView,
    ): number | Promise<number>;
    jFileControl(
      pFile: number,
      op: number,
      pArg: DataView,
    ): number | Promise<number>;
    jSectorSize(pFile: number): number;
    jDeviceCharacteristics(pFile: number): number;
    jDelete(filename: string, syncDir: number): number | Promise<number>;
    jAccess(
      filename: string,
      flags: number,
      pResOut: DataView,
    ): number | Promise<number>;
    jFullPathname(filename: string, zOut: Uint8Array): number | Promise<number>;
  }
}
