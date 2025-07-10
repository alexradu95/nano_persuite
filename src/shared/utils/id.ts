import { randomBytes } from "crypto";

export const createId = (): string => {
  return randomBytes(16).toString("hex");
};