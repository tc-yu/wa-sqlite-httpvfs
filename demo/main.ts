import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import * as SQLite from 'wa-sqlite';
import { HttpRangeVFS as MyVFS } from '../src/HttpRangeVFS.js';

async function hello() {
  const module = await SQLiteESMFactory();
  const sqlite3 = SQLite.Factory(module);

  const vfs = await MyVFS.create('hello', module, 'http://localhost:5173/northwind.db');

  sqlite3.vfs_register(vfs, true);

  const db = await sqlite3.open_v2('test',
    SQLite.SQLITE_OPEN_READWRITE);



  const schemas: (string | null)[] = [];

  await sqlite3.exec(db, "SELECT * FROM Customer LIMIT 10;", (row) => {
    schemas.push(row[0] as string | null);
  });

  console.log(schemas);

  await sqlite3.close(db);

  return schemas
}

document.body.textContent = JSON.stringify(await hello());
// hello();

