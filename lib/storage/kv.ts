import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";

const initSql = `
CREATE TABLE IF NOT EXISTS kv (
  key VARCHAR UNIQUE,
  value VARCHAR
);
`;

export class KvDatabase {
  private db: DB;

  constructor(path = "kv.db") {
    this.db = new DB(path);
    this.db.execute(initSql);
  }

  get(key: string) {
    const [row] = this.db.query<[string]>(`SELECT value FROM kv WHERE key=?1`, [
      key,
    ]);
    return row?.[0];
  }

  set(key: string, value: string) {
    this.db.query(
      `INSERT INTO kv(key, value) VALUES(?1, ?2) ON CONFLICT(key) DO UPDATE SET value=?2`,
      [key, value],
    );
  }

  keys() {
    const rows = this.db.query<[string]>(`SELECT key FROM kv`);
    return rows.map(([key]) => key);
  }

  del(key: string) {
    this.db.query(`DELETE FROM kv WHERE key=?`, [key]);
  }

  rename(key: string, to: string) {
    this.db.query(`UPDATE kv SET key=?1 WHERE key=?2`, [to, key]);
  }

  all() {
    const rows = this.db.query<[string, string]>(`SELECT key, value FROM kv`);
    return rows;
  }
}
