import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired when the Interface agent creates the complete list of API
 * endpoints during the RESTful API design process.
 *
 * This event occurs early in the API design workflow, after the Interface agent
 * has analyzed the requirements and database schema to determine what API
 * endpoints are needed for the application. The endpoint creation establishes
 * the fundamental structure of the API surface area before detailed operation
 * definitions and schema components are developed.
 *
 * The endpoints list provides the architectural foundation for the API design,
 * ensuring comprehensive coverage of the business functionality while
 * maintaining RESTful principles and consistency with the underlying data
 * model.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceEndpointEvent
  extends AutoBeEventBase<"interfaceEndpoint">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  /**
   * Array of API endpoints that have been defined for the application.
   *
   * Contains the complete list of {@link AutoBeOpenApi.IEndpoint} definitions
   * that establish the API surface area for the application. Each endpoint
   * represents a specific URL path and HTTP method combination that will be
   * available in the final API, covering all necessary business operations and
   * data access patterns.
   *
   * The endpoints are designed to provide comprehensive coverage of the
   * business functionality while following RESTful conventions and maintaining
   * consistency with the database schema. This foundational structure guides
   * the subsequent development of detailed operation specifications and schema
   * definitions.
   */
  endpoints: AutoBeOpenApi.IEndpoint[];

  /**
   * Iteration number of the requirements analysis this endpoint creation was
   * performed for.
   *
   * Indicates which version of the requirements analysis this endpoint design
   * reflects. This step number ensures that the API endpoints are aligned with
   * the current requirements and helps track the evolution of the API surface
   * area as requirements change.
   *
   * The step value enables proper synchronization between endpoint definitions
   * and the underlying requirements, ensuring that the API structure remains
   * relevant to the current project scope and business objectives.
   */
  step: number;
}
