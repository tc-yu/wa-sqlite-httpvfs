import { createHash } from "node:crypto";
import { open } from "node:fs/promises";

export interface FileChunk {
  index: number;
  data: Buffer;
}

export async function* chunkFile(
  filePath: string,
  chunkSize: number,
): AsyncGenerator<FileChunk> {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error(
      `Invalid chunk size: ${chunkSize}. Must be a positive integer.`,
    );
  }

  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.allocUnsafe(chunkSize);
    let index = 0;

    while (true) {
      const { bytesRead } = await handle.read(buffer, 0, chunkSize, null);
      if (bytesRead === 0) break;

      yield {
        index: index++,
        data: Buffer.from(buffer.subarray(0, bytesRead)),
      };
    }
  } finally {
    await handle.close();
  }
}

export async function* chunkFileWithHash(
  filePath: string,
  chunkSize: number,
): AsyncGenerator<FileChunk, string> {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error(
      `Invalid chunk size: ${chunkSize}. Must be a positive integer.`,
    );
  }

  // Initialize the SHA-256 hasher
  const hasher = createHash("sha256");
  const handle = await open(filePath, "r");

  try {
    const buffer = Buffer.allocUnsafe(chunkSize);
    let index = 0;

    while (true) {
      const { bytesRead } = await handle.read(buffer, 0, chunkSize, null);
      if (bytesRead === 0) break;

      // Slice the valid bytes from the reused buffer
      const slice = buffer.subarray(0, bytesRead);

      // Update the running hash with this chunk's bytes
      hasher.update(slice);

      yield {
        index: index++,
        // Copy the slice to prevent consumer overwrites
        data: Buffer.from(slice),
      };
    }

    // Once the loop breaks (EOF), finalize and return the hash as a hex string
    return hasher.digest("hex");
  } finally {
    await handle.close();
  }
}
