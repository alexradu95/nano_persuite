// Custom error types for the application
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = "NotFoundError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public operation?: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

// Error handler for HTTP responses
export const handleError = (error: Error) => {
  if (error instanceof ValidationError) {
    return {
      status: 400,
      body: {
        error: "Validation Error",
        message: error.message,
        field: error.field,
      },
    };
  }

  if (error instanceof NotFoundError) {
    return {
      status: 404,
      body: {
        error: "Not Found",
        message: error.message,
      },
    };
  }

  if (error instanceof DatabaseError) {
    return {
      status: 500,
      body: {
        error: "Database Error",
        message: error.message,
      },
    };
  }

  // Generic error
  return {
    status: 500,
    body: {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    },
  };
};