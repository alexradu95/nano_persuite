import { TransactionService } from "./finance.service";
import { CreateTransactionSchema } from "../../schemas";
import { validateRequestBody } from "../../shared/validation/middleware";
import { handleError } from "../../shared/errors/handlers";
import { renderTransactionsList, renderFinanceDashboard, renderSpendingAnalysis } from "./finance.templates";
import { layout } from "../../shared/templates/layout";
import { renderErrorMessage } from "../../shared/templates/error";

type ResponseFormat = 'json' | 'html' | 'htmx';

interface RequestContext {
  isHTMXRequest: boolean;
  format: ResponseFormat;
}

export class FinanceHandlers {
  private service = new TransactionService();

  private getRequestContext(req: Request): RequestContext {
    const isHTMXRequest = req.headers.get('HX-Request') === 'true';
    const acceptHeader = req.headers.get('Accept') || '';
    
    let format: ResponseFormat = 'json';
    if (isHTMXRequest) {
      format = 'htmx';
    } else if (acceptHeader.includes('text/html')) {
      format = 'html';
    }
    
    return { isHTMXRequest, format };
  }

  async getTransactions(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    const result = await this.service.getTransactionsByUser(userId);
    
    if (!result.success) {
      const errorResponse = handleError(result.error);
      if (context.format === 'json') {
        return Response.json(errorResponse.body, { status: errorResponse.status });
      } else {
        const errorContent = renderErrorMessage(errorResponse.body.message);
        return new Response(errorContent, {
          headers: { 'Content-Type': 'text/html' },
          status: errorResponse.status
        });
      }
    }

    if (context.format === 'json') {
      return Response.json({ transactions: result.data });
    } else {
      const html = renderTransactionsList(result.data);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }

  async getFinancePage(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    
    try {
      const transactionsResult = await this.service.getTransactionsByUser(userId);
      const analysisResult = await this.service.analyzeSpendingByCategory(userId, 30);
      
      if (!transactionsResult.success || !analysisResult.success) {
        throw new Error("Failed to load finance data");
      }
      
      const content = renderFinanceDashboard(transactionsResult.data, analysisResult.data);
      
      if (context.format === 'htmx') {
        return new Response(`
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Finance</h1>
          </div>
          ${content}
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      return new Response(layout(content, "Finance"), {
        headers: { 'Content-Type': 'text/html' }
      });
    } catch (error) {
      const errorResponse = handleError(error as Error);
      const errorContent = `
        <div class="bg-red-50 p-6 rounded-lg">
          <h2 class="text-red-800 font-semibold">Error</h2>
          <p class="text-red-600">${errorResponse.body.message}</p>
        </div>
      `;
      return new Response(layout(errorContent, "Error"), {
        headers: { 'Content-Type': 'text/html' },
        status: errorResponse.status
      });
    }
  }

  async createTransaction(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    
    try {
      let body: any;
      
      // Try to parse JSON first, fallback to form data
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await req.json();
      } else {
        const formData = await req.formData();
        body = Object.fromEntries(formData.entries());
        
        // Convert form data types to proper types
        if (body.amount) {
          body.amount = parseFloat(body.amount);
        }
        // Remove empty description
        if (body.description === '') {
          delete body.description;
        }
      }

      const validatedData = validateRequestBody(CreateTransactionSchema, {
        ...body,
        userId
      });

      const result = await this.service.createTransaction(validatedData);
      
      if (!result.success) {
        const errorResponse = handleError(result.error);
        if (context.format === 'json') {
          return Response.json(errorResponse.body, { status: errorResponse.status });
        } else {
          const errorContent = `
            <div class="bg-red-50 p-6 rounded-lg">
              <h2 class="text-red-800 font-semibold">Error</h2>
              <p class="text-red-600">${errorResponse.body.message}</p>
            </div>
          `;
          return new Response(errorContent, {
            headers: { 'Content-Type': 'text/html' },
            status: errorResponse.status
          });
        }
      }

      if (context.format === 'json') {
        return Response.json({ transaction: result.data }, { status: 201 });
      } else {
        // For HTML responses, return updated transactions list
        const transactionsResult = await this.service.getTransactionsByUser(userId);
        if (transactionsResult.success) {
          const html = renderTransactionsList(transactionsResult.data);
          return new Response(html, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        return new Response('Transaction created successfully', {
          headers: { 'Content-Type': 'text/html' }
        });
      }
    } catch (error) {
      const errorResponse = handleError(error as Error);
      if (context.format === 'json') {
        return Response.json(errorResponse.body, { status: errorResponse.status });
      } else {
        const errorContent = renderErrorMessage(errorResponse.body.message);
        return new Response(errorContent, {
          headers: { 'Content-Type': 'text/html' },
          status: errorResponse.status
        });
      }
    }
  }

  async getSpendingAnalysis(req: Request, userId: string, days: number = 30): Promise<Response> {
    const context = this.getRequestContext(req);
    const result = await this.service.analyzeSpendingByCategory(userId, days);
    
    if (!result.success) {
      const errorResponse = handleError(result.error);
      if (context.format === 'json') {
        return Response.json(errorResponse.body, { status: errorResponse.status });
      } else {
        const errorContent = renderErrorMessage(errorResponse.body.message);
        return new Response(errorContent, {
          headers: { 'Content-Type': 'text/html' },
          status: errorResponse.status
        });
      }
    }

    if (context.format === 'json') {
      return Response.json({ analysis: result.data });
    } else {
      // For HTML responses, return analysis component using template function
      const html = renderSpendingAnalysis(result.data);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }
}