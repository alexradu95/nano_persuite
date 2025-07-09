import { DashboardService } from "./dashboard.service";
import { handleError } from "../../shared/errors/handlers";
import { renderDashboardOverview } from "./dashboard.templates";
import { layout } from "../../shared/templates/layout";

type ResponseFormat = 'json' | 'html' | 'htmx';

interface RequestContext {
  isHTMXRequest: boolean;
  format: ResponseFormat;
}

export class DashboardHandlers {
  private service = new DashboardService();

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

  async getDashboardOverview(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    const result = await this.service.getDashboardOverview(userId);
    
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
      return Response.json({ overview: result.data });
    } else {
      const html = renderDashboardOverview(result.data);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }

  async getDashboardPage(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    
    try {
      const result = await this.service.getDashboardOverview(userId);
      
      if (!result.success) {
        throw new Error("Failed to load dashboard data");
      }
      
      const content = renderDashboardOverview(result.data);
      
      if (context.format === 'htmx') {
        return new Response(`
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          ${content}
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      return new Response(layout(content, "Dashboard"), {
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
}