import {
  AutoBeAnalyzeReviewEvent,
  AutoBeAnalyzeWriteEvent,
  AutoBeInterfaceComplementEvent,
  AutoBeInterfaceComponentsEvent,
  AutoBeInterfaceEndpointsEvent,
  AutoBeInterfaceOperationsEvent,
  AutoBePrismaComponentsEvent,
  AutoBePrismaInsufficientEvent,
  AutoBePrismaSchemasEvent,
  AutoBeRealizeDecoratorCorrectEvent,
  AutoBeRealizeDecoratorEvent,
  AutoBeRealizeDecoratorValidateEvent,
  AutoBeRealizeProgressEvent,
  AutoBeRealizeTestOperationEvent,
  AutoBeRealizeTestResetEvent,
  AutoBeRealizeValidateEvent,
  AutoBeTestCorrectEvent,
  AutoBeTestScenarioEvent,
  AutoBeTestValidateEvent,
  AutoBeTestWriteEvent,
} from "@autobe/interface";

export function AutoBePlaygroundProgressEventMovie(
  props: AutoBePlaygroundProgressEventMovie.IProps,
) {
  return (
    <ul>
      <li>{getDescription(props.event)}</li>
    </ul>
  );
}
export namespace AutoBePlaygroundProgressEventMovie {
  export interface IProps {
    event:
      | AutoBeAnalyzeReviewEvent
      | AutoBeAnalyzeWriteEvent
      | AutoBePrismaComponentsEvent
      | AutoBePrismaSchemasEvent
      | AutoBePrismaInsufficientEvent
      | AutoBeInterfaceEndpointsEvent
      | AutoBeInterfaceOperationsEvent
      | AutoBeInterfaceComponentsEvent
      | AutoBeInterfaceComplementEvent
      | AutoBeTestScenarioEvent
      | AutoBeTestWriteEvent
      | AutoBeRealizeDecoratorEvent
      | AutoBeTestValidateEvent
      | AutoBeTestCorrectEvent
      | AutoBeRealizeProgressEvent
      | AutoBeRealizeValidateEvent
      | AutoBeRealizeTestResetEvent
      | AutoBeRealizeTestOperationEvent
      | AutoBeRealizeDecoratorValidateEvent
      | AutoBeRealizeDecoratorCorrectEvent;
  }
}

function getDescription(
  event: AutoBePlaygroundProgressEventMovie.IProps["event"],
): string {
  switch (event.type) {
    case "interfaceEndpoints":
      const endpoints: number = event.endpoints.length;
      return `Composing Endpoints: ${endpoints} of ${endpoints}`;
    case "interfaceOperations":
      return `Designing Operations: ${event.completed} of ${event.total}`;
    case "interfaceComponents":
      return `Defining Type Schemas: ${event.completed} of ${event.total}`;
    case "interfaceComplement":
      return "Filling missed type schemas";
    case "prismaComponents":
      const tables: number = event.components
        .map((c) => c.tables.length)
        .reduce((a, b) => a + b, 0);
      return `Composing Prisma Tables: ${tables} of ${tables}`;
    case "prismaSchemas":
      return `Generating Prisma Schemas: ${event.completed} of ${event.total}`;
    case "prismaInsufficient":
      return `Prisma Insufficient (${event.component.namespace}): ${event.missed.length} of ${event.component.tables.length}`;
    case "testScenario":
      return `Generating Test Plan Completed: ${event.scenarios.length}`;
    case "testWrite":
      return `Writing Test Functions: ${event.completed} of ${event.total}`;
    case "testValidate":
      return `Validating Test Function: ${event.result.type}`;
    case "testCorrect":
      return `Correcting Test Function`;
    case "realizeDecorator":
      return `Generated Decorators: ${event.completed} of ${event.total}`;
    case "realizeDecoratorValidate":
      return `Validating Decorator Function: ${event.result.type}`;
    case "realizeDecoratorCorrect":
      return `Correcting Decorator Function ${event.result.type}`;
    case "realizeValidate":
      return `Validating Realize Function: ${event.result.type}`;
    case "realizeProgress":
      return `Writing Main Controller: ${event.completed} of ${event.total}`;
    case "analyzeWrite":
      return `Analyze user requirements and write documents`;
    case "analyzeReview":
      return `Reviewing generated documents by Analyze in progress`;
    case "realizeTestReset":
      return `Reset DB for E2E Test`;
    case "realizeTestOperation":
      return `Operated E2E Test Function: ${event.name}`;
    default:
      event satisfies never;
      throw new Error("Unknown event type"); // unreachable
  }
}
