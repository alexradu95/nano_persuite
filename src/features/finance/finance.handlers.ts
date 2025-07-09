import { TransactionService } from "./finance.service";
import { CreateTransactionSchema } from "../../schemas";
import { validateRequestBody } from "../../shared/validation/middleware";
import { handleError } from "../../shared/errors/handlers";

export class FinanceHandlers {
  private service = new TransactionService();

  async getTransactions(userId: string): Promise<Response> {
    const result = await this.service.getTransactionsByUser(userId);
    
    if (!result.success) {
      const errorResponse = handleError(result.error);
      return Response.json(errorResponse.body, { status: errorResponse.status });
    }

    return Response.json({ transactions: result.data });
  }

  async createTransaction(req: Request, userId: string): Promise<Response> {
    try {
      const body = await req.json();
      const validatedData = validateRequestBody(CreateTransactionSchema, {
        ...body,
        userId
      });

      const result = await this.service.createTransaction(validatedData);
      
      if (!result.success) {
        const errorResponse = handleError(result.error);
        return Response.json(errorResponse.body, { status: errorResponse.status });
      }

      return Response.json({ transaction: result.data }, { status: 201 });
    } catch (error) {
      const errorResponse = handleError(error as Error);
      return Response.json(errorResponse.body, { status: errorResponse.status });
    }
  }

  async getSpendingAnalysis(userId: string, days: number = 30): Promise<Response> {
    const result = await this.service.analyzeSpendingByCategory(userId, days);
    
    if (!result.success) {
      const errorResponse = handleError(result.error);
      return Response.json(errorResponse.body, { status: errorResponse.status });
    }

    return Response.json({ analysis: result.data });
  }
}