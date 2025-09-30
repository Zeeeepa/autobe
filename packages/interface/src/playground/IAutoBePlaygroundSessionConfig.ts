import { IAutoBePlaygroundModel } from "./IAutoBePlaygroundModel";

/**
 * Interface representing configuration settings for a playground session.
 *
 * This interface encapsulates the essential configuration parameters that
 * govern how an AutoBE vibe coding session operates. It combines AI model
 * selection with user preferences for locale and timezone, establishing the
 * foundational context for natural language processing and code generation
 * throughout the automated development lifecycle.
 *
 * The configuration is immutable once a session begins, ensuring consistent
 * behavior and reproducible results across the entire backend generation
 * process. These settings directly influence how AutoBE interprets user
 * requirements and generates localized, timezone-aware backend applications.
 *
 * @author Samchon
 */
export interface IAutoBePlaygroundSessionConfig {
  /**
   * AI model configuration used for this session.
   *
   * References the complete AI model settings including vendor, endpoints, and
   * structured output capabilities. This model powers all AI interactions
   * throughout the vibe coding session, from natural language understanding to
   * code generation across all five development phases.
   */
  model: IAutoBePlaygroundModel;

  /**
   * Timezone setting for the session.
   *
   * IANA timezone identifier (e.g., "Asia/Seoul", "America/New_York") that
   * determines how temporal data is handled throughout the generated backend
   * application. This setting influences timestamp formatting, scheduling
   * logic, and any timezone-sensitive business rules in the generated code.
   */
  timezone: string;

  /**
   * Locale setting for language preferences.
   *
   * ISO language code (e.g., "ko" for Korean, "en" for English, "ja" for
   * Japanese) that determines the conversation language with AutoBE and
   * influences generated code comments, error messages, and any localized
   * content in the backend application. This ensures the vibe coding experience
   * aligns with user language preferences.
   */
  locale: string;
}

export namespace IAutoBePlaygroundSessionConfig {
  /**
   * Input parameters for creating session configuration.
   *
   * Defines the minimal required information to establish a new session
   * configuration. Instead of embedding the full model details, it references
   * an existing model configuration by ID, promoting reusability and
   * centralized model management across multiple sessions.
   */
  export interface ICreate {
    /**
     * Reference ID to an existing AI model configuration.
     *
     * UUID of a pre-configured AI model in the playground system. This approach
     * allows sessions to share model configurations while maintaining
     * centralized management of API credentials and endpoints.
     */
    model_id: string;

    /**
     * Timezone for the new session.
     *
     * Must be a valid IANA timezone identifier. This setting cannot be changed
     * after session creation, ensuring temporal consistency throughout the
     * development process.
     */
    timezone: string;

    /**
     * Locale for language preferences.
     *
     * ISO language code determining the interaction language and localization
     * preferences for the session. Fixed at session creation to maintain
     * consistent language context.
     */
    locale: string;
  }
}
