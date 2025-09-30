// import { tags } from "typia";

// export interface ICheck {
//   /** The title or description of the validation rule/check item */
//   title: string;

//   /** The validation state (true: passed/satisfied, false: failed/violated) */
//   state: boolean;
// }

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
    /**
     * Step 1: Deep compilation error analysis and correction strategy.
     *
     * AI performs comprehensive analysis of compilation errors to develop
     * targeted correction strategies. This step involves deep examination of
     * error messages, identification of error patterns, understanding root
     * causes, and planning systematic corrections.
     *
     * The AI examines each compilation diagnostic to understand where the
     * implementation diverged from correct TypeScript usage, identifies the
     * business logic intent behind the failed code, and formulates strategies
     * to fix errors while preserving the original test purpose. This analysis
     * correlates error patterns with code structure to ensure corrections
     * address root causes rather than symptoms.
     *
     * This deep analysis forms the foundation for all subsequent correction
     * efforts, ensuring a methodical approach to resolving compilation issues.
     *
     * Workflow: Error diagnostic analysis → Root cause identification →
     * Correction strategy planning → Business logic preservation strategy
     */
    think: string;

    /**
     * Step 2: Draft corrected TypeScript E2E test code implementation.
     *
     * AI generates the first corrected version of the test code based on error
     * analysis and correction strategies. This draft addresses all identified
     * compilation errors while preserving the original business logic and test
     * workflow. The code is compilation-error-free and follows all established
     * conventions.
     *
     * The implementation incorporates lessons learned from error analysis to
     * produce properly typed, syntactically correct code that maintains the
     * intended test functionality. All type safety requirements and framework
     * conventions are followed in this corrected implementation.
     *
     * Workflow: Error correction → TypeScript implementation → Functional
     * preservation
     *
     * DO: Resolve all compilation errors while maintaining original test intent
     */
    draft: string;

    /**
     * Step 3-4: Review and finalization process.
     *
     * Encapsulates the review and final implementation phases into a single
     * revision process. This structured approach ensures systematic validation
     * and refinement of the corrected code through comprehensive review
     * followed by production-ready implementation.
     *
     * The revision process maintains clear separation between review feedback
     * and final deliverable while ensuring all corrections are properly
     * validated and integrated.
     */
    revise: IReviseProps;
  }

  /**
   * Revision properties for the final review and implementation phases.
   *
   * This interface encapsulates the final two steps of the error correction
   * workflow, ensuring systematic review and production-ready code delivery.
   */
  export interface IReviseProps {
    // /**
    //  * Dual-document compliance validation for TEST_WRITE.md and
    //  * TEST_CORRECT.md.
    //  *
    //  * This property tracks whether each section from BOTH TEST_WRITE.md and
    //  * TEST_CORRECT.md guidelines has been properly followed. Since the correct
    //  * agent must ensure compliance with both documents, keys should include
    //  * sections from both prompt files.
    //  *
    //  * Each ICheck item should have:
    //  *
    //  * - Title: Prefixed with source document for clarity ("TEST_WRITE: " or
    //  *   "TEST_CORRECT: ")
    //  * - State: Compliance status (true if followed, false if violated)
    //  *
    //  * Note: Section identifiers may evolve as documentation updates, so
    //  * implementations should be flexible in handling different key formats.
    //  *
    //  * Example:
    //  *
    //  * ```typescript
    //  * rules: [
    //  *   { title: "TEST_WRITE: 1. Role and Responsibility", state: true },
    //  *   { title: "TEST_WRITE: 3.1. Import Management", state: true },
    //  *   {
    //  *     title: "TEST_CORRECT: 4.1. Missing Properties Pattern",
    //  *     state: true,
    //  *   },
    //  *   {
    //  *     title: "TEST_CORRECT: 4.2. Type Mismatch Pattern",
    //  *     state: false,
    //  *   },
    //  *   // ... other sections from both documents
    //  * ];
    //  * ```
    //  */
    // rules: ICheck[] & tags.MinItems<1>;

    // /**
    //  * Combined quality checklist validation from both prompt documents.
    //  *
    //  * This property captures the compliance status for checklist items from
    //  * BOTH TEST_WRITE.md (Section 5: Final Checklist) and TEST_CORRECT.md
    //  * (Section 5: Final Review Checklist). The correct agent must validate
    //  * against both checklists to ensure comprehensive quality control.
    //  *
    //  * Each ICheck item should have:
    //  *
    //  * - Title: Checklist item as described in the documents
    //  * - State: Whether the criterion has been satisfied
    //  *
    //  * Note: Checklist items may be updated over time, so implementations should
    //  * adapt to documentation changes while maintaining the validation purpose.
    //  *
    //  * Example:
    //  *
    //  * ```typescript
    //  * checkList: [
    //  *   { title: "No compilation errors", state: true },
    //  *   { title: "Proper async/await usage", state: true },
    //  *   { title: "All typia tags preserved", state: true },
    //  *   { title: "No type bypasses or workarounds", state: false },
    //  *   // ... other checklist items from both documents
    //  * ];
    //  * ```
    //  */
    // checkList: ICheck[] & tags.MinItems<1>;

    /**
     * Step 3: Code review and correction validation.
     *
     * AI performs a comprehensive review of the corrected draft implementation,
     * validating that all compilation errors have been resolved and that the
     * code maintains the original functionality. This review examines both
     * technical correctness and business logic preservation.
     *
     * The review process includes verification of TypeScript compilation
     * compatibility, API integration correctness, test workflow completeness,
     * and adherence to all quality standards. Any remaining issues or potential
     * improvements are identified for incorporation into the final
     * implementation.
     *
     * Workflow: Draft validation → Compilation verification → Functionality
     * review → Quality assessment
     */
    review: string;

    /**
     * Step 4: Final production-ready corrected test code.
     *
     * AI produces the final, polished version of the corrected test code
     * incorporating all review feedback and validation results. This code
     * represents the completed error correction, guaranteed to compile
     * successfully while preserving all original test functionality and
     * business logic. When the draft correction already perfectly resolves all
     * issues with no problems found during review, this value can be null,
     * indicating no further refinement was necessary.
     *
     * The final implementation resolves all compilation issues, maintains
     * strict type safety, follows all established conventions, and delivers a
     * production-ready test that accurately validates the intended API
     * behaviors and user workflows. A null value signifies the draft correction
     * was already optimal and requires no modifications.
     *
     * Workflow: Review integration → Final refinement → Production-ready
     * implementation (or null if draft needs no changes). This is the ultimate
     * deliverable that will replace the compilation-failed code when provided,
     * otherwise the draft correction is used as-is.
     */
    final: string | null;
  }
}
