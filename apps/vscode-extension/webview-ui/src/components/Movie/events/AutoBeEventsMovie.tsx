import { AutoBeEvent } from "@autobe/interface";
import {
  AutoBeAssistantMessageMovie,
  AutoBeProgressEventMovie,
  AutoBeScenarioEventMovie,
  AutoBeStartEventMovie,
  AutoBeUserMessageMovie,
} from "@autobe/ui";

import { IProgressEventsMovieProps } from "./ProgressEventsMovie";
import AnalyzeComplete from "./analyze/AnalyzeComplete";
import { InterfaceComplement, InterfaceComplete } from "./interface";
import PrismaComplete from "./prisma/PrismaComplete";
import PrismaCorrect from "./prisma/PrismaCorrect";
import { PrismaInsufficient } from "./prisma/PrismaInsufficient";
import PrismaValidate from "./prisma/PrismaValidate";
import RealizeAuthorizationComplete from "./realize/RealizeAuthorizationComplete";
import RealizeAuthorizationCorrect from "./realize/RealizeAuthorizationCorrect";
import RealizeAuthorizationValidate from "./realize/RealizeAuthorizationValidate";
import RealizeComplete from "./realize/RealizeComplete";
import RealizeTestComplete from "./realize/RealizeTestComplete";
import RealizeValidate from "./realize/RealizeValidate";
import { TestComplete } from "./test/TestComplete";
import { TestCorrect } from "./test/TestCorrect";
import { TestValidate } from "./test/TestValidate";

interface IAutoBeEventsMovieProps {
  event: AutoBeEvent;
}

export const isAutoBeProgressEventBase = (
  event: AutoBeEvent,
): event is IProgressEventsMovieProps["event"] => {
  return (
    "total" in event &&
    "completed" in event &&
    typeof event.total === "number" &&
    typeof event.completed === "number"
  );
};
const AutoBeEventsMovie = (props: IAutoBeEventsMovieProps) => {
  const { event } = props;

  if (isAutoBeProgressEventBase(event)) {
    return <AutoBeProgressEventMovie event={event} />;
  }

  switch (event.type) {
    case "assistantMessage": {
      return (
        <AutoBeAssistantMessageMovie
          text={event.text}
          isoTimestamp={event.created_at}
        />
      );
    }
    case "userMessage": {
      return <AutoBeUserMessageMovie message={event.contents} />;
    }
    case "analyzeStart":
    case "interfaceStart":
    case "prismaStart":
    case "testStart":
    case "realizeAuthorizationStart":
    case "realizeTestStart":
    case "realizeStart": {
      return <AutoBeStartEventMovie event={event} />;
    }

    case "analyzeScenario":
    case "prismaComponents":
    case "interfaceGroups":
    case "realizeTestReset": {
      return <AutoBeScenarioEventMovie event={event} />;
    }
    case "analyzeComplete": {
      return <AnalyzeComplete event={event} />;
    }
    case "prismaValidate": {
      return <PrismaValidate event={event} />;
    }
    case "prismaCorrect": {
      return <PrismaCorrect event={event} />;
    }
    case "prismaComplete": {
      return <PrismaComplete event={event} />;
    }
    case "prismaInsufficient": {
      return <PrismaInsufficient event={event} />;
    }
    case "interfaceComplement": {
      return <InterfaceComplement event={event} />;
    }
    case "interfaceComplete": {
      return <InterfaceComplete event={event} />;
    }
    case "testValidate": {
      return <TestValidate event={event} />;
    }
    case "testCorrect": {
      return <TestCorrect event={event} />;
    }
    case "testComplete": {
      return <TestComplete event={event} />;
    }
    case "realizeValidate": {
      return <RealizeValidate event={event} />;
    }
    case "realizeComplete": {
      return <RealizeComplete event={event} />;
    }
    case "realizeAuthorizationValidate": {
      return <RealizeAuthorizationValidate event={event} />;
    }
    case "realizeAuthorizationCorrect": {
      return <RealizeAuthorizationCorrect event={event} />;
    }
    case "realizeAuthorizationComplete": {
      return <RealizeAuthorizationComplete event={event} />;
    }
    case "realizeTestComplete": {
      return <RealizeTestComplete event={event} />;
    }
    case "consentFunctionCall":
    case "vendorRequest":
    case "vendorResponse":
    case "jsonParseError":
    case "jsonValidateError": {
      return null;
    }
    default:
      event satisfies never;
      return <div>Unknown Event</div>;
  }
};

export default AutoBeEventsMovie;
