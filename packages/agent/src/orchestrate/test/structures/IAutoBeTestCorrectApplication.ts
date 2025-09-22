export interface IAutoBeTestCorrectApplication {
  /**
   * Main entry point for AI Function Call - analyzes compilation errors and
   * generates corrected E2E test code.
   *
   * The AI executes this function to perform the complete error correction
   * workflow: compilation error analysis → draft correction → code review →
   * final corrected implementation. This multi-step process ensures systematic
   * error resolution while preserving original test functionality and
   * maintaining code quality.
   *
   * The corrector analyzes compilation diagnostics to identify specific issues,
   * develops correction strategies, and produces corrected code through
   * iterative refinement with comprehensive review and validation.
   *
   * @param props Complete specification for error correction workflow including
   *   analysis steps, draft implementation, review process, and final code
   *   generation
   */
  rewrite(props: IAutoBeTestCorrectApplication.IProps): void;
}

export namespace IAutoBeTestCorrectApplication {
  export interface IProps {
    /** Step 1: Error analysis and correction strategy (max 500 chars) */
    think: string;

    /** Step 2: Draft corrected test code */
    draft: string;

    /** Step 3-4: Review and final implementation */
    revise: IReviseProps;
  }

  /**
   * Revision properties for the final review and implementation phases.
   *
   * This interface encapsulates the final two steps of the error correction
   * workflow, ensuring systematic review and production-ready code delivery.
   */
  export interface IReviseProps {
    /** Step 3: Code review findings (max 500 chars) */
    review: string;

    /** Step 4: Final corrected test code */
    final: string;
  }
}
