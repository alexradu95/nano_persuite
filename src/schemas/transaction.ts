import { z } from "zod";

// Transaction categories based on current implementation
export const TransactionCategorySchema = z.enum([
  "groceries",
  "transport", 
  "utilities",
  "entertainment",
  "health",
  "other"
]);

// Transaction schema
export const TransactionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  amount: z.number().positive(),
  category: TransactionCategorySchema,
  description: z.string().optional(),
  date: z.string().date(),
  createdAt: z.string().datetime(),
});

// Input schema for creating transactions
export const CreateTransactionSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().positive(),
  category: TransactionCategorySchema,
  description: z.string().optional(),
  date: z.string().date(),
});

// Input schema for updating transactions
export const UpdateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  category: TransactionCategorySchema.optional(),
  description: z.string().optional(),
  date: z.string().date().optional(),
});

// Schema for transaction analysis
export const TransactionAnalysisSchema = z.object({
  category: TransactionCategorySchema,
  totalAmount: z.number(),
  transactionCount: z.number(),
  averageAmount: z.number(),
});

// Derived types
export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionCategory = z.infer<typeof TransactionCategorySchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type TransactionAnalysis = z.infer<typeof TransactionAnalysisSchema>;