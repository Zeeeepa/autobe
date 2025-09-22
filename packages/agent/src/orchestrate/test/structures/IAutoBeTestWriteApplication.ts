export interface IAutoBeTestWriteApplication {
  /**
   * Main entry point for AI Function Call - generates complete E2E test code.
   *
   * The AI executes this function to perform the entire test generation
   * workflow: scenario analysis → draft implementation → code review → final
   * code production. This structured approach ensures high-quality,
   * compilation-error-free test code.
   *
   * @param props Complete specification for test generation including scenario,
   *   domain, and implementation steps
   */
  write(props: IAutoBeTestWriteApplication.IProps): void;
}

export namespace IAutoBeTestWriteApplication {
  export interface IProps {
    /** Step 1: Test planning and analysis (max 500 chars) */
    scenario: string;

    /** Step 2: Domain classification (lowercase snake_case) */
    domain: string;

    /** Step 3: Initial test code implementation */
    draft: string;

    /** Steps 4-5: Review and final implementation */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /** Step 4: Code review findings (max 500 chars) */
    review: string;

    /** Step 5: Final production-ready test code */
    final: string;
  }
}
