import { z } from "zod";

// Contract schemas
export const ContractSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1),
  hourlyRate: z.number().positive(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateContractRequestSchema = z.object({
  title: z.string().min(1),
  hourlyRate: z.number().positive(),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const UpdateContractRequestSchema = z.object({
  title: z.string().min(1).optional(),
  hourlyRate: z.number().positive().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

// Income entry schemas
export const IncomeEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  contractId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hoursWorked: z.number().positive(),
  totalAmount: z.number().positive(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateIncomeEntryRequestSchema = z.object({
  contractId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hoursWorked: z.number().positive(),
  description: z.string().optional(),
});

export const UpdateIncomeEntryRequestSchema = z.object({
  contractId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hoursWorked: z.number().positive().optional(),
  description: z.string().optional(),
});

// Monthly income summary schema
export const MonthlyIncomeSummarySchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12),
  totalAmount: z.number(),
  totalHours: z.number(),
  entries: z.array(IncomeEntrySchema.extend({
    contractTitle: z.string(),
    contractHourlyRate: z.number(),
  })),
});

// Derive types from schemas
export type Contract = z.infer<typeof ContractSchema>;
export type CreateContractRequest = z.infer<typeof CreateContractRequestSchema>;
export type UpdateContractRequest = z.infer<typeof UpdateContractRequestSchema>;
export type IncomeEntry = z.infer<typeof IncomeEntrySchema>;
export type CreateIncomeEntryRequest = z.infer<typeof CreateIncomeEntryRequestSchema>;
export type UpdateIncomeEntryRequest = z.infer<typeof UpdateIncomeEntryRequestSchema>;
export type MonthlyIncomeSummary = z.infer<typeof MonthlyIncomeSummarySchema>;