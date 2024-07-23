import { Database } from 'jsr:@db/sqlite@0.11';

const initSql = `
CREATE TABLE IF NOT EXISTS kv (
  key VARCHAR UNIQUE,
  value VARCHAR
);
`;

export class KvDatabase {
  private db: Database;

  constructor(path = 'kv.db') {
    this.db = new Database(path);
    this.db.exec(initSql);
  }

  get(key: string) {
    const row = this.db
      .prepare(`SELECT value FROM kv WHERE key=?1`)
      .value<[string]>(key);
    return row?.[0];
  }

  set(key: string, value: string) {
    this.db.exec(
      `INSERT INTO kv(key, value) VALUES(?1, ?2) ON CONFLICT(key) DO UPDATE SET value=?2`,
      [key, value],
    );
  }

  keys() {
    const rows = this.db.prepare(`SELECT key FROM kv`).values<[string]>();
    return rows.map(([key]) => key);
  }

  del(key: string) {
    this.db.exec(`DELETE FROM kv WHERE key=?`, [key]);
  }

  rename(key: string, to: string) {
    this.db.exec(`UPDATE kv SET key=?1 WHERE key=?2`, [to, key]);
  }

  all() {
    const rows = this.db.prepare(`SELECT key, value FROM kv`).values<
      [string, string]
    >();
    return rows;
  }
}
