import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

export interface IAutoBeTestScenarioApplication {
  /**
   * Make test scenarios for the given endpoints.
   *
   * @param props Properties containing the endpoints and test scenarios.
   */
  makeScenario(props: IAutoBeTestScenarioApplication.IProps): void;
}

export namespace IAutoBeTestScenarioApplication {
  export interface IProps {
    /** Array of test scenario groups. */
    scenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[];
  }

  export interface IScenarioGroup {
    /** Target API endpoint to test (unique per group) */
    endpoint: AutoBeOpenApi.IEndpoint;

    /** Test scenarios for this endpoint (at least one required) */
    scenarios: IScenario[] & tags.MinItems<1>;
  }

  export interface IScenario {
    /** Test scenario description in natural language */
    draft: string;

    /** Test function name (snake_case, starts with test_api_) */
    functionName: string;

    /** Required API endpoints for test setup (must exist in available operations) */
    dependencies: IDependencies[];
  }

  export interface IDependencies {
    /** Dependency endpoint (must exist in available operations) */
    endpoint: AutoBeOpenApi.IEndpoint;

    /** Why this dependency is needed for the test */
    purpose: string;
  }
}
