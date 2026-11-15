import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import * as SQLite from 'wa-sqlite';
import { HttpRangeVFS as MyVFS } from '../src/HttpRangeVFS.js';

async function hello(query: string) {
  const module = await SQLiteESMFactory();
  const sqlite3 = SQLite.Factory(module);

  const vfs = await MyVFS.create(
    'hello',
    module,
    'http://localhost:5173/northwind.db'
  );

  sqlite3.vfs_register(vfs, true);

  const db = await sqlite3.open_v2('test',
    SQLite.SQLITE_READONLY);

  const schemas: (string | null)[] = [];

  console.log(query)

  await sqlite3.exec(db, query, (row) => {
    schemas.push(row[0] as string | null);
  });

  console.log(schemas);

  await sqlite3.close(db);

  return schemas
}

// document.body.textContent = JSON.stringify(await hello());
// hello();

const input = document.querySelector<HTMLInputElement>('#text-input')!;
const button = document.querySelector<HTMLButtonElement>('#update-btn')!;
const result = document.querySelector<HTMLParagraphElement>('#result')!;

console.log(input.value)

button.addEventListener('click', async () => {
  button.disabled = true;
  result.textContent = 'Loading...';

  try {
    result.textContent = JSON.stringify(await hello(input.value));
  } catch (error) {
    result.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    button.disabled = false;
  }
});
