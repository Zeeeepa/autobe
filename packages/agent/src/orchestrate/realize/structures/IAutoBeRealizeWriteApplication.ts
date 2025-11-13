import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeRealizeWriteApplication {
  /**
   * Process provider implementation task or preliminary data requests.
   *
   * Generates complete provider function implementation through three-phase
   * workflow (plan → draft → revise). Ensures type safety, proper Prisma usage,
   * and API contract compliance.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeRealizeWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeWriteApplication {
  export interface IProps {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getPrismaSchemas) or final implementation generation (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetPrismaSchemas;
  }

  /**
   * Request to generate provider function implementation.
   *
   * Executes three-phase generation to create complete provider implementation.
   * Follows plan → draft → revise pattern to ensure type safety, proper Prisma
   * usage, and API contract compliance.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /**
     * Implementation plan and strategy.
     *
     * Analyzes the provider function requirements, identifies related Prisma
     * schemas, and outlines the implementation approach. Includes schema
     * validation and API contract verification.
     */
    plan: string;

    /**
     * Initial implementation draft.
     *
     * The first complete implementation attempt based on the plan. May contain
     * areas that need refinement in the review phase.
     */
    draft: string;

    /**
     * Revision and finalization phase.
     *
     * Reviews the draft implementation and produces the final code with all
     * improvements and corrections applied.
     */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Review and improvement suggestions.
     *
     * Identifies areas for improvement in the draft code, including:
     *
     * - Type safety enhancements
     * - Prisma query optimizations
     * - Null/undefined handling corrections
     * - Authentication/authorization improvements
     * - Error handling refinements
     */
    review: string;

    /**
     * Final implementation code.
     *
     * The complete, production-ready implementation with all review suggestions
     * applied.
     *
     * Returns `null` if the draft is already perfect and needs no changes.
     */
    final: string | null;
  }
}
