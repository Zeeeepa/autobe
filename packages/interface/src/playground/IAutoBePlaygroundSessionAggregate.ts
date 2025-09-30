import { AutoBePhase } from "../histories/AutoBePhase";
import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";

/**
 * Interface representing aggregated session metrics and state.
 *
 * This interface captures the high-level summary information for an AutoBE
 * playground session, providing a snapshot of the current development phase and
 * cumulative resource consumption. It serves as a lightweight status indicator
 * that enables quick assessment of session progress without accessing the
 * detailed history or event data.
 *
 * The aggregate data is continuously updated throughout the vibe coding
 * session, offering real-time visibility into the automated development
 * pipeline's progress and efficiency metrics for monitoring and optimization
 * purposes.
 *
 * @author Samchon
 */
export interface IAutoBePlaygroundSessionAggregate {
  /**
   * Current development phase in the waterfall pipeline.
   *
   * Indicates which of the five AutoBE development phases (analyze, prisma,
   * interface, test, realize) is currently active. Null value signifies that
   * the session has not yet started processing or has completed all phases.
   * This status helps track the session's progress through the automated
   * backend generation workflow.
   */
  phase: AutoBePhase | null;

  /**
   * Cumulative token usage across all AI interactions.
   *
   * Comprehensive metrics tracking the total tokens consumed throughout the
   * vibe coding session, including prompt tokens sent to AI models and
   * completion tokens received. This data encompasses all agent activities
   * across all phases, providing crucial information for cost management,
   * resource optimization, and performance benchmarking of the automated
   * development process.
   */
  token_usage: IAutoBeTokenUsageJson;
}
