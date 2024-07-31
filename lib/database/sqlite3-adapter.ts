import { Database, DatabaseOpenOptions, Statement } from 'jsr:@db/sqlite@0.11';

function normalizeParams(params: any[]) {
  return params.map((param) => (param == null ? null : param));
}

class SqliteStatement<T> {
  constructor(private statement: Statement) {}

  get(...params: any[]) {
    return this.statement.get(...normalizeParams(params)) as T | undefined;
  }

  all(...params: any[]) {
    return this.statement.all(...normalizeParams(params)) as T[];
  }

  values(...params: any[]) {
    return this.statement.values(...normalizeParams(params)) as any[][];
  }
}

export class SqliteAdapter {
  private db: Database;

  constructor(path: string, options?: DatabaseOpenOptions) {
    this.db = new Database(path, options);
  }

  exec(sql: string, ...params: any[]) {
    this.db.run(sql, normalizeParams(params));
  }

  transaction(cb: () => void) {
    this.db.transaction(cb)();
  }

  prepare<T>(sql: string) {
    return new SqliteStatement<T>(this.db.prepare(sql));
  }

  queryRow<T>(sql: string, ...params: any[]) {
    return this.prepare<T>(sql).get(...params);
  }

  queryRows<T>(sql: string, ...params: any[]) {
    return this.prepare<T>(sql).all(...params);
  }

  queryValues(sql: string, ...params: any[]) {
    return this.prepare(sql).values(...params);
  }
}
