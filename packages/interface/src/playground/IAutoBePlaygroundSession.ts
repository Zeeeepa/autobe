import { tags } from "typia";

import { AutoBeEventSnapshot } from "../events/AutoBeEventSnapshot";
import { AutoBeHistory } from "../histories/AutoBeHistory";
import { IAutoBePlaygroundSessionAggregate } from "./IAutoBePlaygroundSessionAggregate";
import { IAutoBePlaygroundSessionConfig } from "./IAutoBePlaygroundSessionConfig";

/**
 * Interface representing a complete AutoBE playground session.
 *
 * This interface captures the full context of a vibe coding session where users
 * interact with AutoBE to generate backend applications through natural
 * language conversations. It extends the summary information with detailed
 * histories and event snapshots, providing a comprehensive view of the entire
 * development journey from initial requirements to final implementation.
 *
 * The session data structure serves as the primary unit of work in AutoBE
 * playground, encapsulating all user interactions, agent activities, and
 * generated artifacts throughout the automated development lifecycle.
 *
 * @author Samchon
 */
export interface IAutoBePlaygroundSession
  extends IAutoBePlaygroundSession.ISummary {
  /**
   * Unique identifier for the playground session.
   *
   * A UUID v7 that uniquely identifies this vibe coding session across the
   * AutoBE platform. This identifier is used for session persistence, replay
   * functionality, and tracking development progress.
   */
  id: string & tags.Format<"uuid">;

  /**
   * Complete chronological history of all interactions within the session.
   *
   * Contains the full conversation flow including user messages, AI assistant
   * responses, and all agent activities across the five development phases
   * (analyze, prisma, interface, test, realize). This comprehensive history
   * enables session replay and provides insights into the AI's decision-making
   * process throughout development.
   */
  histories: AutoBeHistory[];

  /**
   * Detailed event snapshots capturing granular development activities.
   *
   * Records fine-grained events such as compiler validations, code generation
   * steps, error corrections, and file operations. These snapshots provide
   * technical visibility into the incremental progress and validation cycles
   * that ensure the generated code meets production quality standards.
   */
  snapshots: AutoBeEventSnapshot[];
}

export namespace IAutoBePlaygroundSession {
  /**
   * Summary information for an AutoBE playground session.
   *
   * Provides essential metadata and aggregated information about a vibe coding
   * session without the detailed history and event data. This summary view is
   * useful for session listings, quick status checks, and performance
   * monitoring across multiple sessions.
   */
  export interface ISummary {
    /**
     * Unique identifier for the playground session.
     *
     * A UUID v7 that serves as the primary key for session identification and
     * retrieval across the AutoBE platform.
     */
    id: string & tags.Format<"uuid">;

    /**
     * Configuration settings for the playground session.
     *
     * Contains the AI model selection, locale preferences, and timezone
     * settings that govern how AutoBE processes conversations and generates
     * code for this specific session.
     */
    config: IAutoBePlaygroundSessionConfig;

    /**
     * Aggregated metrics and current state of the session.
     *
     * Provides summary statistics including current development phase, token
     * usage across all AI interactions, and other performance metrics that help
     * monitor session progress and resource consumption.
     */
    aggregate: IAutoBePlaygroundSessionAggregate;

    /**
     * User-provided title or project name for the session.
     *
     * An optional descriptive name that helps users identify and organize their
     * vibe coding sessions. Typically describes the backend application being
     * developed, such as "E-commerce Platform" or "Task Management API".
     */
    title: string | null;

    /**
     * Session creation timestamp.
     *
     * ISO 8601 formatted timestamp marking when the user initiated this vibe
     * coding session. Used for session history, sorting, and analytics
     * purposes.
     */
    created_at: string & tags.Format<"date-time">;

    /**
     * Session completion timestamp.
     *
     * ISO 8601 formatted timestamp indicating when the backend application
     * generation was successfully completed. Null if the session is still in
     * progress or was terminated before completion.
     */
    completed_at: null | (string & tags.Format<"date-time">);
  }

  /**
   * Input parameters for creating a new playground session.
   *
   * Defines the required configuration and optional metadata needed to initiate
   * a new vibe coding session in AutoBE playground. These parameters establish
   * the foundation for AI-driven backend development tailored to user
   * preferences.
   */
  export interface ICreate {
    /**
     * Configuration parameters for the new session.
     *
     * Specifies the AI model, locale, and timezone settings that will guide the
     * conversation processing and code generation throughout the session
     * lifecycle.
     */
    config: IAutoBePlaygroundSessionConfig.ICreate;

    /**
     * Optional title for the new session.
     *
     * A descriptive name for the backend application project, helping users
     * organize and identify their vibe coding sessions. Can be updated later
     * through the update interface.
     */
    title: string | null;
  }

  /**
   * Input parameters for updating an existing playground session.
   *
   * Allows modification of mutable session properties after creation. Currently
   * supports updating the session title, with potential for additional
   * updatable fields as the platform evolves.
   */
  export interface IUpdate {
    /**
     * New title for the session.
     *
     * Updates the descriptive name of the session. Providing null clears the
     * existing title. Omitting this field leaves the current title unchanged.
     */
    title?: string | null;
  }
}
