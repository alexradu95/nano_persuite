import { DashboardOverview } from "../../schemas";
import { Result, createSuccess, createError } from "../../shared/types/result";
import { DatabaseError } from "../../shared/errors/handlers";
import { TransactionService } from "../finance/finance.service";
import { TaskService } from "../tasks/tasks.service";

export class DashboardService {
  private transactionService = new TransactionService();
  private taskService = new TaskService();

  async getDashboardOverview(userId: string): Promise<Result<DashboardOverview, DatabaseError>> {
    try {
      // Get recent transactions (last 5)
      const transactionsResult = await this.transactionService.getTransactionsByUser(userId);
      if (!transactionsResult.success) {
        return createError(new DatabaseError(
          `Failed to get dashboard overview: ${transactionsResult.error.message}`,
          "dashboard_overview"
        ));
      }

      const recentTransactions = transactionsResult.data.slice(0, 5);

      // Get pending tasks (last 5)
      const pendingTasksResult = await this.taskService.getPendingTasks(userId);
      if (!pendingTasksResult.success) {
        return createError(new DatabaseError(
          `Failed to get dashboard overview: ${pendingTasksResult.error.message}`,
          "dashboard_overview"
        ));
      }

      const pendingTasks = pendingTasksResult.data.slice(0, 5);

      // Get task summary
      const taskSummaryResult = await this.taskService.getTaskSummary(userId);
      if (!taskSummaryResult.success) {
        return createError(new DatabaseError(
          `Failed to get dashboard overview: ${taskSummaryResult.error.message}`,
          "dashboard_overview"
        ));
      }

      // Calculate financial summary
      const totalSpent = transactionsResult.data.reduce((sum, transaction) => sum + transaction.amount, 0);
      const transactionCount = transactionsResult.data.length;
      const averageTransactionAmount = transactionCount > 0 ? totalSpent / transactionCount : 0;

      const financialSummary = {
        totalSpent,
        transactionCount,
        averageTransactionAmount
      };

      const dashboardOverview: DashboardOverview = {
        recentTransactions,
        pendingTasks,
        financialSummary,
        taskSummary: taskSummaryResult.data
      };

      return createSuccess(dashboardOverview);
    } catch (error) {
      return createError(new DatabaseError(
        `Failed to get dashboard overview: ${error instanceof Error ? error.message : String(error)}`,
        "dashboard_overview"
      ));
    }
  }
}