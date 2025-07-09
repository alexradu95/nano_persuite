import { z } from "zod";
import { ValidationError } from "../errors/handlers";
import { type Result, createSuccess, createError } from "../types/result";

// Validation middleware function
export const validateSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Result<T, ValidationError> => {
  try {
    const parsedData = schema.parse(data);
    return createSuccess(parsedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      const field = error.errors[0]?.path.join('.') || undefined;
      return createError(new ValidationError(message, field));
    }
    
    return createError(new ValidationError("Unknown validation error"));
  }
};

// Helper for validating request body
export const validateRequestBody = <T>(
  schema: z.ZodSchema<T>,
  body: unknown
): T => {
  const result = validateSchema(schema, body);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.data;
};

// Helper for validating query parameters
export const validateQueryParams = <T>(
  schema: z.ZodSchema<T>,
  params: unknown
): T => {
  const result = validateSchema(schema, params);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.data;
};