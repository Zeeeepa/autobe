import { TestFactory } from "../../TestFactory";
import { validate_agent_modify_main_until_prisma } from "./internal/validate_agent_modify_main_until_prisma";

export const test_agent_modify_main_bbs = (factory: TestFactory) =>
  validate_agent_modify_main_until_prisma(factory, "bbs-backend");
