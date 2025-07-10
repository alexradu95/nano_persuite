import { createIncomeService } from "./income.factory";
import { CreateContractRequestSchema, CreateIncomeEntryRequestSchema } from "../../schemas/income";
import { validateRequestBody } from "../../shared/validation/middleware";
import { handleError } from "../../shared/errors/handlers";
import { renderIncomeCalendar, renderContractsList, renderIncomeOverview } from "./income.templates";
import { layout } from "../../shared/templates/layout";
import { renderErrorMessage } from "../../shared/templates/error";

type ResponseFormat = 'json' | 'html';

interface RequestContext {
  format: ResponseFormat;
}

export class IncomeHandlers {
  private service = createIncomeService();

  private getRequestContext(req: Request): RequestContext {
    const acceptHeader = req.headers.get('Accept') || '';
    
    let format: ResponseFormat = 'json';
    if (acceptHeader.includes('text/html')) {
      format = 'html';
    }
    
    return { format };
  }

  async getIncomePage(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());
    
    const [contractsResult, incomeResult] = await Promise.all([
      this.service.getContracts(userId),
      this.service.getMonthlyIncome(userId, year, month)
    ]);
    
    if (!contractsResult.success || !incomeResult.success) {
      const error = contractsResult.success ? incomeResult.error : contractsResult.error;
      const errorResponse = handleError(error);
      const errorContent = renderErrorMessage(errorResponse.body.message);
      return new Response(layout('Income Tracking - Error', errorContent), {
        headers: { 'Content-Type': 'text/html' },
        status: errorResponse.status
      });
    }

    const content = renderIncomeCalendar(
      contractsResult.data,
      incomeResult.data,
      year,
      month
    );

    return new Response(layout('Income Tracking', content), {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  async getContracts(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    const result = await this.service.getContracts(userId);
    
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
      return Response.json(result.data);
    } else {
      const content = renderContractsList(result.data);
      return new Response(content, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }

  async createContract(req: Request, userId: string): Promise<Response> {
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
        if (body.hourlyRate) {
          body.hourlyRate = parseFloat(body.hourlyRate);
        }
        if (body.isDefault) {
          body.isDefault = body.isDefault === 'true' || body.isDefault === 'on';
        }
        // Remove empty description
        if (body.description === '') {
          delete body.description;
        }
      }
      
      const validatedData = validateRequestBody(CreateContractRequestSchema, body);
      const result = await this.service.createContract(validatedData, userId);
      
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
        return Response.json(result.data, { status: 201 });
      } else {
        // Redirect to income page after successful contract creation
        return Response.redirect('/app/income', 302);
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

  async createIncomeEntry(req: Request, userId: string): Promise<Response> {
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
        if (body.hoursWorked) {
          body.hoursWorked = parseFloat(body.hoursWorked);
        }
        // Remove empty description
        if (body.description === '') {
          delete body.description;
        }
      }
      
      const validatedData = validateRequestBody(CreateIncomeEntryRequestSchema, body);
      const result = await this.service.createIncomeEntry(validatedData, userId);
      
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
        return Response.json(result.data, { status: 201 });
      } else {
        // Redirect to income page after successful entry creation
        return Response.redirect('/app/income', 302);
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

  async getMonthlyIncome(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());
    
    const result = await this.service.getMonthlyIncome(userId, year, month);
    
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
      return Response.json(result.data);
    } else {
      const content = renderIncomeOverview(result.data);
      return new Response(content, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }

  async createQuickEntry(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    
    // Handle both URL params (GET) and form data (POST)
    let date: string | null = null;
    let hours: number = 8;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      date = url.searchParams.get('date');
      hours = parseFloat(url.searchParams.get('hours') || '8');
    } else {
      const formData = await req.formData();
      date = formData.get('date') as string;
      hours = parseFloat(formData.get('hours') as string || '8');
    }
    
    if (!date) {
      if (context.format === 'json') {
        return Response.json({ error: 'Date is required' }, { status: 400 });
      } else {
        const errorContent = renderErrorMessage('Date is required');
        return new Response(errorContent, {
          headers: { 'Content-Type': 'text/html' },
          status: 400
        });
      }
    }

    const result = await this.service.createQuickEntry(userId, date, hours);
    
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
      return Response.json(result.data, { status: 201 });
    } else {
      // Redirect to income page after successful quick entry
      return Response.redirect('/app/income', 302);
    }
  }

  async deleteIncomeEntry(req: Request, entryId: string, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    const result = await this.service.deleteIncomeEntry(entryId, userId);
    
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
      return Response.json({ success: true });
    } else {
      // Redirect to income page after successful deletion
      return Response.redirect('/app/income', 302);
    }
  }

  async setDefaultContract(req: Request, contractId: string, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    const result = await this.service.setDefaultContract(contractId, userId);
    
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
      return Response.json({ success: true });
    } else {
      // Redirect to income page after setting default contract
      return Response.redirect('/app/income', 302);
    }
  }
}