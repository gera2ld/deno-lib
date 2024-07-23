import { Database, DatabaseOpenOptions } from 'jsr:@db/sqlite@0.11';

export class SqliteAdapter {
  private db: Database;

  constructor(path: string, options?: DatabaseOpenOptions) {
    this.db = new Database(path, options);
  }

  private normalizeParams(params: any[]) {
    return params.map((param) => (param == null ? null : param));
  }

  exec(sql: string, ...params: any[]) {
    this.db.run(sql, this.normalizeParams(params));
  }

  queryRow<T>(sql: string, ...params: any[]): T | undefined {
    return this.db.prepare(sql).get(...this.normalizeParams(params)) as
      | T
      | undefined;
  }

  queryRows<T>(sql: string, ...params: any[]): T[] {
    return this.db.prepare(sql).all(...this.normalizeParams(params)) as T[];
  }

  queryValues(sql: string, ...params: any[]) {
    return this.db.prepare(sql).values(...this.normalizeParams(params));
  }
}
