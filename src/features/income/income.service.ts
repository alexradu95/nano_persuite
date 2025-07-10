import { DatabaseError } from "../../shared/errors/handlers";
import { createId } from "../../shared/utils/id";
import { Result } from "../../shared/types/result";
import {
  Contract,
  CreateContractRequest,
  CreateIncomeEntryRequest,
  IncomeEntry,
  MonthlyIncomeSummary,
  ContractSchema,
  CreateContractRequestSchema,
  CreateIncomeEntryRequestSchema,
  IncomeEntrySchema,
} from "../../schemas/income";
import { IncomeRepository } from "./income.repository";

export class IncomeService {
  constructor(private repository: IncomeRepository) {}

  async createContract(
    request: CreateContractRequest,
    userId: string
  ): Promise<Result<Contract, DatabaseError>> {
    try {
      const validatedRequest = CreateContractRequestSchema.parse(request);
      
      const contract: Contract = {
        id: createId(),
        userId,
        ...validatedRequest,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.repository.createContract(contract);

      return { success: true, data: contract };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to create contract: ${error instanceof Error ? error.message : String(error)}`,
          "create_contract"
        ),
      };
    }
  }

  async getContracts(userId: string): Promise<Result<Contract[], DatabaseError>> {
    try {
      const contracts = await this.repository.getContracts(userId);
      return { success: true, data: contracts };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get contracts: ${error instanceof Error ? error.message : String(error)}`,
          "get_contracts"
        ),
      };
    }
  }

  async createIncomeEntry(
    request: CreateIncomeEntryRequest,
    userId: string
  ): Promise<Result<IncomeEntry, DatabaseError>> {
    try {
      const validatedRequest = CreateIncomeEntryRequestSchema.parse(request);
      
      // Get contract to calculate total amount
      const contract = await this.repository.getContractById(validatedRequest.contractId, userId);
      
      if (!contract) {
        return {
          success: false,
          error: new DatabaseError("Contract not found", "contract_not_found"),
        };
      }

      const totalAmount = contract.hourlyRate * validatedRequest.hoursWorked;
      
      const incomeEntry: IncomeEntry = {
        id: createId(),
        userId,
        contractId: validatedRequest.contractId,
        date: validatedRequest.date,
        hoursWorked: validatedRequest.hoursWorked,
        totalAmount,
        description: validatedRequest.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.repository.createIncomeEntry(incomeEntry);

      return { success: true, data: incomeEntry };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to create income entry: ${error instanceof Error ? error.message : String(error)}`,
          "create_income_entry"
        ),
      };
    }
  }

  async getMonthlyIncome(
    userId: string,
    year: number,
    month: number
  ): Promise<Result<MonthlyIncomeSummary, DatabaseError>> {
    try {
      const entries = await this.repository.getIncomeEntriesByMonth(userId, year, month);

      const totalAmount = entries.reduce((sum, entry) => sum + entry.totalAmount, 0);
      const totalHours = entries.reduce((sum, entry) => sum + entry.hoursWorked, 0);

      return {
        success: true,
        data: {
          year,
          month,
          totalAmount,
          totalHours,
          entries,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get monthly income: ${error instanceof Error ? error.message : String(error)}`,
          "get_monthly_income"
        ),
      };
    }
  }

  async getDefaultContract(userId: string): Promise<Result<Contract | null, DatabaseError>> {
    try {
      const contract = await this.repository.getDefaultContract(userId);
      return { success: true, data: contract };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get default contract: ${error instanceof Error ? error.message : String(error)}`,
          "get_default_contract"
        ),
      };
    }
  }

  async setDefaultContract(contractId: string, userId: string): Promise<Result<void, DatabaseError>> {
    try {
      // Verify the contract exists and belongs to the user
      const contract = await this.repository.getContractById(contractId, userId);
      if (!contract) {
        return {
          success: false,
          error: new DatabaseError("Contract not found", "contract_not_found"),
        };
      }

      await this.repository.setDefaultContract(contractId, userId);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to set default contract: ${error instanceof Error ? error.message : String(error)}`,
          "set_default_contract"
        ),
      };
    }
  }

  async createQuickEntry(
    userId: string,
    date: string,
    hoursWorked: number = 8
  ): Promise<Result<IncomeEntry, DatabaseError>> {
    try {
      // Get the default contract
      const defaultContract = await this.repository.getDefaultContract(userId);
      if (!defaultContract) {
        return {
          success: false,
          error: new DatabaseError("No default contract found", "no_default_contract"),
        };
      }

      const totalAmount = defaultContract.hourlyRate * hoursWorked;
      
      const incomeEntry: IncomeEntry = {
        id: createId(),
        userId,
        contractId: defaultContract.id,
        date,
        hoursWorked,
        totalAmount,
        description: "Quick entry",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.repository.createIncomeEntry(incomeEntry);

      return { success: true, data: incomeEntry };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to create quick entry: ${error instanceof Error ? error.message : String(error)}`,
          "create_quick_entry"
        ),
      };
    }
  }

  async deleteIncomeEntry(entryId: string, userId: string): Promise<Result<void, DatabaseError>> {
    try {
      const deleted = await this.repository.deleteIncomeEntry(entryId, userId);
      
      if (!deleted) {
        return {
          success: false,
          error: new DatabaseError("Income entry not found", "entry_not_found"),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to delete income entry: ${error instanceof Error ? error.message : String(error)}`,
          "delete_income_entry"
        ),
      };
    }
  }
}