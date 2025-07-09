import type { Result } from "../types/result";
import type { DatabaseError } from "../errors/handlers";

// Base repository interface
export interface BaseRepository<T, ID = string> {
  findById(id: ID): Promise<Result<T | null, DatabaseError>>;
  create(entity: T): Promise<Result<T, DatabaseError>>;
  update(id: ID, entity: Partial<T>): Promise<Result<T, DatabaseError>>;
  delete(id: ID): Promise<Result<boolean, DatabaseError>>;
}

// Query result interface for complex queries
export interface QueryResult<T> {
  data: T[];
  total: number;
}

// Filter and pagination interfaces
export interface FilterOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}