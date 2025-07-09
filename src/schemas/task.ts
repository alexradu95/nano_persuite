import { z } from "zod";

// Task schema
export const TaskSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(1),
  completed: z.boolean().default(false),
  dueDate: z.string().date().optional(),
  createdAt: z.string().datetime(),
});

// Input schema for creating tasks
export const CreateTaskSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  dueDate: z.string().date().optional(),
});

// Input schema for updating tasks
export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  dueDate: z.string().date().optional(),
});

// Schema for task completion toggle
export const ToggleTaskCompletionSchema = z.object({
  completed: z.boolean(),
});

// Schema for task summary
export const TaskSummarySchema = z.object({
  total: z.number(),
  completed: z.number(),
  pending: z.number(),
  overdue: z.number(),
});

// Derived types
export type Task = z.infer<typeof TaskSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type ToggleTaskCompletionInput = z.infer<typeof ToggleTaskCompletionSchema>;
export type TaskSummary = z.infer<typeof TaskSummarySchema>;