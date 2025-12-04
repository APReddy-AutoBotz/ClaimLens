/**
 * Minimal pg type declarations
 * For development without pg installed
 */

declare module 'pg' {
  export interface QueryResult<T = any> {
    rows: T[];
    rowCount: number | null;
  }

  export interface Pool {
    query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
    end(): Promise<void>;
  }

  export interface PoolConfig {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }
}
