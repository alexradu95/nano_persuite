import { DashboardService } from "./dashboard.service";
import { handleError } from "../../shared/errors/handlers";

export class DashboardHandlers {
  private service = new DashboardService();

  async getDashboardOverview(userId: string): Promise<Response> {
    const result = await this.service.getDashboardOverview(userId);
    
    if (!result.success) {
      const errorResponse = handleError(result.error);
      return Response.json(errorResponse.body, { status: errorResponse.status });
    }

    return Response.json({ overview: result.data });
  }
}