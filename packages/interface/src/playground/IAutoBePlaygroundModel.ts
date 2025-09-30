import { ILlmSchema } from "@samchon/openapi";
import { tags } from "typia";

/**
 * Interface representing an AI model configuration for AutoBE playground.
 *
 * This interface defines the structure for managing various AI model
 * configurations that power the vibe coding sessions in AutoBE. It enables
 * administrators to configure multiple AI models from different vendors with
 * their specific endpoints and credentials, providing flexibility in model
 * selection based on performance requirements, cost considerations, or
 * specialized capabilities.
 *
 * Each model configuration encapsulates the necessary information to establish
 * connections with AI services and defines the model's structured output
 * capabilities through the ILlmSchema system, ensuring proper function calling
 * and JSON schema support for the automated development pipeline.
 *
 * @author Samchon
 */
export interface IAutoBePlaygroundModel {
  /**
   * Unique identifier for the model configuration.
   *
   * A UUID v7 that uniquely identifies this AI model configuration within the
   * AutoBE platform. Used for model selection during session creation and
   * tracking model usage across different vibe coding sessions.
   */
  id: string & tags.Format<"uuid">;

  /**
   * Display title for the model configuration.
   *
   * Human-readable name that helps users identify and select appropriate AI
   * models for their vibe coding sessions. Examples include "GPT-4 Turbo
   * Production", "Claude 3 Opus Development", or "Custom LLaMA Model". Null if
   * no custom title is provided, defaulting to vendor model name.
   */
  title: string | null;

  /**
   * Model schema identifier for structured output capabilities.
   *
   * Specifies the ILlmSchema model type that defines this AI model's support
   * for function calling and JSON schema generation. Common values include
   * "chatgpt", "claude", "llama", "deepseek", "3.0", or "3.1", each
   * representing different levels of structured output sophistication.
   */
  schema: ILlmSchema.Model;

  /**
   * AI vendor model identifier.
   *
   * The actual model name or identifier used by the AI vendor's API. Examples
   * include "gpt-4-turbo", "claude-3-opus-20240229", or custom model paths like
   * "openai/gpt-4-mini" when using router services. This value is passed
   * directly to the AI service API for model selection.
   */
  vendor: string;

  /**
   * Base URL endpoint for the AI service API.
   *
   * The root URL for making API calls to the AI service. Supports standard
   * vendor endpoints like "https://api.openai.com/v1" or
   * "https://api.anthropic.com", as well as custom endpoints for enterprise
   * deployments or self-hosted models. This flexibility enables integration
   * with various AI service providers.
   */
  baseUrl: string & tags.Format<"uri">;

  /**
   * Model configuration creation timestamp.
   *
   * ISO 8601 formatted timestamp marking when this AI model configuration was
   * first registered in the AutoBE platform. Used for audit trails and
   * configuration management.
   */
  created_at: string & tags.Format<"date-time">;

  /**
   * Last modification timestamp for the model configuration.
   *
   * ISO 8601 formatted timestamp indicating the most recent update to this
   * model configuration. Tracks changes to model settings, credentials, or
   * endpoints for configuration versioning and troubleshooting.
   */
  updated_at: string & tags.Format<"date-time">;
}

export namespace IAutoBePlaygroundModel {
  /**
   * Input parameters for creating a new AI model configuration.
   *
   * Defines all necessary information to register a new AI model in the AutoBE
   * playground. Includes sensitive information like API keys that must be
   * handled securely and are not exposed in read operations for security
   * reasons.
   */
  export interface ICreate {
    /**
     * Optional display title for the model configuration.
     *
     * A human-friendly name to help users identify this model configuration in
     * the UI. If not provided, the system will use the vendor model name as the
     * default display value.
     */
    title: string | null;

    /**
     * Model schema type for structured output capabilities.
     *
     * Determines the ILlmSchema model that defines how this AI model handles
     * function calling and JSON schema generation. Critical for ensuring proper
     * integration with AutoBE's automated development pipeline.
     */
    schema: ILlmSchema.Model;

    /**
     * Vendor-specific model identifier.
     *
     * The exact model name or path required by the AI vendor's API. Must match
     * the vendor's model naming conventions to ensure successful API calls.
     */
    vendor: string;

    /**
     * API key for authenticating with the AI service.
     *
     * Sensitive credential required for accessing the AI model. Must be kept
     * secure and is never exposed in read operations. Different vendors may
     * have different key formats and validation requirements.
     */
    apiKey: string;

    /**
     * Base URL for the AI service endpoint.
     *
     * The root API endpoint for the AI service. Must be a valid URI and should
     * include the version path if required by the vendor (e.g., "/v1" for
     * OpenAI).
     */
    baseUrl: string & tags.Format<"uri">;
  }

  /**
   * Input parameters for updating an existing AI model configuration.
   *
   * Allows partial updates to model configuration while maintaining security by
   * keeping sensitive fields like API keys write-only. All fields are optional,
   * enabling targeted updates without affecting unchanged values.
   */
  export interface IUpdate {
    /**
     * New display title for the model.
     *
     * Updates the human-readable name. Providing null clears any custom title,
     * reverting to the default vendor model name. Omitting this field preserves
     * the current title.
     */
    title?: string | null;

    /**
     * Updated model schema type.
     *
     * Changes the ILlmSchema model type if the AI model's capabilities have
     * been upgraded or if switching to a different schema version for better
     * structured output support.
     */
    schema?: ILlmSchema.Model;

    /**
     * New API key for the model.
     *
     * Allows rotation of API credentials for security purposes or when
     * switching to a different access tier. The new key replaces the existing
     * one entirely.
     */
    apiKey?: string;
  }
}
