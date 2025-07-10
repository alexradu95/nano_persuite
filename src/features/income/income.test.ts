import { IncomeService } from "./income.service";
import type { Contract, IncomeEntry, CreateContractRequest, CreateIncomeEntryRequest } from "../../schemas/income";
import type { IncomeRepository } from "./income.repository";

// Test Data Factories
const getMockContract = (
  overrides?: Partial<CreateContractRequest>
): CreateContractRequest => {
  return {
    title: "Default Contract",
    hourlyRate: 40,
    description: "Default contract description",
    isDefault: false,
    ...overrides,
  };
};

const getMockIncomeEntry = (
  overrides?: Partial<CreateIncomeEntryRequest>
): CreateIncomeEntryRequest => {
  return {
    contractId: "contract-1",
    date: "2024-01-01",
    hoursWorked: 8,
    description: "Work description",
    ...overrides,
  };
};

// Mock Repository Implementation
class MockIncomeRepository implements IncomeRepository {
  private contracts: Contract[] = [];
  private incomeEntries: IncomeEntry[] = [];

  async createContract(contract: Contract): Promise<void> {
    // If this contract is being set as default, unset all other defaults first
    if (contract.isDefault) {
      this.contracts.forEach(c => {
        if (c.userId === contract.userId) {
          c.isDefault = false;
        }
      });
    }
    this.contracts.push(contract);
  }

  async getContracts(userId: string): Promise<Contract[]> {
    return this.contracts
      .filter(contract => contract.userId === userId && contract.isActive)
      .sort((a, b) => {
        // Sort by isDefault first (defaults first), then by creation date
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getContractById(contractId: string, userId: string): Promise<Contract | null> {
    return this.contracts.find(contract => 
      contract.id === contractId && contract.userId === userId
    ) || null;
  }

  async getDefaultContract(userId: string): Promise<Contract | null> {
    return this.contracts.find(contract => 
      contract.userId === userId && contract.isDefault && contract.isActive
    ) || null;
  }

  async setDefaultContract(contractId: string, userId: string): Promise<void> {
    // Unset all defaults for this user
    this.contracts.forEach(contract => {
      if (contract.userId === userId) {
        contract.isDefault = false;
      }
    });

    // Set the specified contract as default
    const contract = this.contracts.find(c => c.id === contractId && c.userId === userId);
    if (contract) {
      contract.isDefault = true;
    }
  }

  async createIncomeEntry(entry: IncomeEntry): Promise<void> {
    this.incomeEntries.push(entry);
  }

  async getIncomeEntriesByMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<Array<IncomeEntry & { contractTitle: string; contractHourlyRate: number }>> {
    const entries = this.incomeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entry.userId === userId && 
             entryDate.getFullYear() === year && 
             entryDate.getMonth() + 1 === month;
    });

    return entries.map(entry => {
      const contract = this.contracts.find(c => c.id === entry.contractId);
      return {
        ...entry,
        contractTitle: contract?.title || "Unknown",
        contractHourlyRate: contract?.hourlyRate || 0,
      };
    });
  }

  async deleteIncomeEntry(entryId: string, userId: string): Promise<boolean> {
    const index = this.incomeEntries.findIndex(entry => 
      entry.id === entryId && entry.userId === userId
    );
    
    if (index !== -1) {
      this.incomeEntries.splice(index, 1);
      return true;
    }
    
    return false;
  }

  // Helper method for tests to clear data
  clear(): void {
    this.contracts = [];
    this.incomeEntries = [];
  }
}

describe("Income Service", () => {
  let incomeService: IncomeService;
  let mockRepository: MockIncomeRepository;

  beforeEach(() => {
    mockRepository = new MockIncomeRepository();
    incomeService = new IncomeService(mockRepository);
  });

  describe("Contract Management", () => {
    it("should create a new contract", async () => {
      const contract = getMockContract({
        title: "Web Development Contract",
        hourlyRate: 37
      });

      const result = await incomeService.createContract(contract, "user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          title: "Web Development Contract",
          hourlyRate: 37,
          userId: "user-1"
        });
      }
    });

    it("should get contracts for a user", async () => {
      const contract1 = getMockContract({ title: "Contract 1", hourlyRate: 35 });
      const contract2 = getMockContract({ title: "Contract 2", hourlyRate: 40 });
      
      await incomeService.createContract(contract1, "user-1");
      await incomeService.createContract(contract2, "user-1");

      const result = await incomeService.getContracts("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]?.title).toBe("Contract 1");
        expect(result.data[1]?.title).toBe("Contract 2");
      }
    });
  });

  describe("Income Entry Management", () => {
    it("should create a new income entry", async () => {
      const contract = getMockContract({ hourlyRate: 37 });
      const contractResult = await incomeService.createContract(contract, "user-1");
      
      if (!contractResult.success) {
        throw new Error("Failed to create contract");
      }
      
      const entry = getMockIncomeEntry({
        contractId: contractResult.data.id,
        date: "2024-01-15",
        hoursWorked: 8
      });

      const result = await incomeService.createIncomeEntry(entry, "user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          contractId: contractResult.data.id,
          date: "2024-01-15",
          hoursWorked: 8,
          totalAmount: 296, // 37 * 8
          userId: "user-1"
        });
      }
    });

    it("should get income entries for a month", async () => {
      const contract = getMockContract({ hourlyRate: 37 });
      const contractResult = await incomeService.createContract(contract, "user-1");
      
      if (!contractResult.success) {
        throw new Error("Failed to create contract");
      }
      
      const entry1 = getMockIncomeEntry({
        contractId: contractResult.data.id,
        date: "2024-01-15",
        hoursWorked: 8
      });
      
      const entry2 = getMockIncomeEntry({
        contractId: contractResult.data.id,
        date: "2024-01-16",
        hoursWorked: 6
      });
      
      await incomeService.createIncomeEntry(entry1, "user-1");
      await incomeService.createIncomeEntry(entry2, "user-1");

      const result = await incomeService.getMonthlyIncome("user-1", 2024, 1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entries).toHaveLength(2);
        expect(result.data.totalAmount).toBe(518); // (37 * 8) + (37 * 6)
        expect(result.data.totalHours).toBe(14);
      }
    });

    it("should calculate correct total amount based on contract hourly rate", async () => {
      const contract = getMockContract({ hourlyRate: 45 });
      const contractResult = await incomeService.createContract(contract, "user-1");
      
      if (!contractResult.success) {
        throw new Error("Failed to create contract");
      }
      
      const entry = getMockIncomeEntry({
        contractId: contractResult.data.id,
        date: "2024-01-15",
        hoursWorked: 7.5
      });

      const result = await incomeService.createIncomeEntry(entry, "user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalAmount).toBe(337.5); // 45 * 7.5
      }
    });
  });

  describe("Default Contract Management", () => {
    it("should set a contract as default and unset others", async () => {
      const contract1 = getMockContract({ title: "Contract 1", isDefault: true });
      const contract2 = getMockContract({ title: "Contract 2", isDefault: false });
      
      await incomeService.createContract(contract1, "user-1");
      await incomeService.createContract(contract2, "user-1");

      const result = await incomeService.getDefaultContract("user-1");

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.title).toBe("Contract 1");
        expect(result.data.isDefault).toBe(true);
      }
    });

    it("should create quick entry with default contract", async () => {
      const defaultContract = getMockContract({ 
        title: "Default Contract", 
        hourlyRate: 40, 
        isDefault: true 
      });
      const contractResult = await incomeService.createContract(defaultContract, "user-1");
      
      if (!contractResult.success) {
        throw new Error("Failed to create default contract");
      }

      const result = await incomeService.createQuickEntry("user-1", "2024-01-15", 8);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contractId).toBe(contractResult.data.id);
        expect(result.data.hoursWorked).toBe(8);
        expect(result.data.totalAmount).toBe(320); // 40 * 8
        expect(result.data.date).toBe("2024-01-15");
      }
    });

    it("should fail to create quick entry without default contract", async () => {
      const result = await incomeService.createQuickEntry("user-1", "2024-01-15", 8);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.operation).toBe("no_default_contract");
      }
    });
  });

  describe("Delete Income Entry", () => {
    it("should delete an income entry", async () => {
      const contract = getMockContract({ hourlyRate: 37 });
      const contractResult = await incomeService.createContract(contract, "user-1");
      
      if (!contractResult.success) {
        throw new Error("Failed to create contract");
      }
      
      const entry = getMockIncomeEntry({
        contractId: contractResult.data.id,
        date: "2024-01-15",
        hoursWorked: 8
      });

      const createResult = await incomeService.createIncomeEntry(entry, "user-1");
      if (!createResult.success) {
        throw new Error("Failed to create entry");
      }

      const deleteResult = await incomeService.deleteIncomeEntry(createResult.data.id, "user-1");

      expect(deleteResult.success).toBe(true);

      // Verify entry is deleted
      const monthlyResult = await incomeService.getMonthlyIncome("user-1", 2024, 1);
      if (monthlyResult.success) {
        expect(monthlyResult.data.entries).toHaveLength(0);
      }
    });

    it("should fail to delete non-existent entry", async () => {
      const result = await incomeService.deleteIncomeEntry("non-existent-id", "user-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.operation).toBe("entry_not_found");
      }
    });
  });
});