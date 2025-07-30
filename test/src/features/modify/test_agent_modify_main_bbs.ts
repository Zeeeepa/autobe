import { TestFactory } from "../../TestFactory";
import { validate_agent_modify_main } from "./internal/validate_agent_modify_main";

export const test_agent_modify_main_bbs = (factory: TestFactory) =>
  validate_agent_modify_main(factory, "bbs-backend");
