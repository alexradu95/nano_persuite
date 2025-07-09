import { z } from "zod";
import { TransactionSchema } from "./transaction";
import { TaskSchema } from "./task";

// Dashboard overview schema
export const DashboardOverviewSchema = z.object({
  recentTransactions: z.array(TransactionSchema).max(5),
  pendingTasks: z.array(TaskSchema).max(5),
  financialSummary: z.object({
    totalSpent: z.number(),
    transactionCount: z.number(),
    averageTransactionAmount: z.number(),
  }),
  taskSummary: z.object({
    total: z.number(),
    completed: z.number(),
    pending: z.number(),
    overdue: z.number(),
  }),
});

// Derived types
export type DashboardOverview = z.infer<typeof DashboardOverviewSchema>;