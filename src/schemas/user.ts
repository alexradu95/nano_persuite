import { z } from "zod";

// User schema
export const UserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  createdAt: z.string().datetime(),
});

// Input schema for creating users
export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
});

// Input schema for updating users
export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

// Derived types
export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;