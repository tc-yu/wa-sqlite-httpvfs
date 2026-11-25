import SQLiteESMFactory from "wa-sqlite/dist/wa-sqlite-async.mjs";
import * as SQLite from "wa-sqlite";
import { HttpRangeVFS } from "../dist/";
// import { HttpRangeVFS } from "../src/HttpRangeVFS";
let sqlite3: SQLiteAPI;
let db: number;

async function init() {
  const module = await SQLiteESMFactory();
  sqlite3 = SQLite.Factory(module);

  const vfs = await HttpRangeVFS.create("http_range_vfs", module, {
    serverMode: "full",
    url: "http://localhost:5173/northwind.db",
  });

  sqlite3.vfs_register(vfs, true);

  db = await sqlite3.open_v2("test", SQLite.SQLITE_OPEN_READONLY);
}

// Start initialization right away
const ready = init();

self.onmessage = async (event) => {
  await ready;
  const { id, payload } = event.data;
  // const result: (string | null)[] = [];
  const result: Record<string, SQLiteCompatibleType>[] = [];
  console.log(payload);

  // await sqlite3.exec(db, payload, (row) => {
  //   result.push(row[0] as string | null);
  // });

  await sqlite3.exec(
    db,
    payload,
    (row: SQLiteCompatibleType[], columns: string[]) => {
      const rowObject: Record<string, SQLiteCompatibleType> = {};
      columns.forEach((col, index) => {
        rowObject[col] = row[index];
      });
      result.push(rowObject);
    },
  );

  console.log(result);

  self.postMessage({ id, result });
};

// TODO: handle db close logic
// if (event.data.type === 'SHUTDOWN') {
//     clearInterval(timer);
//     socket.close();
//     self.postMessage({ type: 'CLOSED' });
//     self.close(); // Terminates the worker from the inside
//     return;
//   }

// worker.postMessage({ type: 'SHUTDOWN' });
