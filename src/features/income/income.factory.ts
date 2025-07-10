import { IncomeService } from "./income.service";
import { DatabaseIncomeRepository } from "./income.repository";

export const createIncomeService = (): IncomeService => {
  return new IncomeService(new DatabaseIncomeRepository());
};