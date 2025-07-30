import { AutoBeEventBase } from "./AutoBeEventBase";

/** @author @sunrabbit123 */
export interface AutoBeModifyStartEvent extends AutoBeEventBase<"modifyStart"> {
  /**
   * Reason why the Modify agent was activated through function calling.
   *
   * Explains the specific circumstances that triggered the AI chatbot to invoke
   * the Modify agent via function calling. This could include reasons such as
   * initial project requirements gathering, requests for requirement
   * clarification, updates to existing requirements based on user feedback, or
   * revision requests for the analysis report.
   */
  reason: string;
}
