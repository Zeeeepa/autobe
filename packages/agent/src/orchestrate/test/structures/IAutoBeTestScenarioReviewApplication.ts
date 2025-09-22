import { IAutoBeTestScenarioApplication } from "./IAutoBeTestScenarioApplication";

export interface IAutoBeTestScenarioReviewApplication {
  review: (props: IAutoBeTestScenarioReviewApplication.IProps) => void;
}

export namespace IAutoBeTestScenarioReviewApplication {
  export interface IProps {
    /** Review summary with critical findings and key improvements */
    review: string;

    /** Structured action plan with priority-based improvements */
    plan: string;

    /** Whether the scenario groups pass the review */
    pass: boolean;

    /** Reviewed and improved scenario groups with all quality fixes applied */
    scenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[];
  }
}
