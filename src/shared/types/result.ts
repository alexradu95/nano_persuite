// Result type for better error handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Helper functions for creating results
export const createSuccess = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

export const createError = <E = Error>(error: E): Result<never, E> => ({
  success: false,
  error,
});

// Type guards
export const isSuccess = <T, E>(result: Result<T, E>): result is { success: true; data: T } => {
  return result.success;
};

export const isError = <T, E>(result: Result<T, E>): result is { success: false; error: E } => {
  return !result.success;
};