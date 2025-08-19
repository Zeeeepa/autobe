import { AutoBeEvent, IAutoBeTokenUsageJson } from "@autobe/interface";
import typia from "typia";

export namespace TestLogger {
  export const event = (start: Date, event: AutoBeEvent): void => {
    const time: number = (new Date().getTime() - start.getTime()) / 60_000;
    const content: string[] = [
      `- ${event.type}: ${time.toLocaleString()} mins`,
    ];

    // SCENARIOS
    if (event.type === "analyzeScenario")
      content.push(
        `  - documents: #${event.files.length}, roles: #${event.roles.length}`,
      );
    else if (event.type === "interfaceGroups")
      content.push(`  - groups: #${event.groups.length}`);
    else if (event.type === "prismaComponents")
      content.push(`  - components: #${event.components.length}`);
    else if (event.type === "interfaceEndpoints")
      content.push(`  - endpoints: #${event.endpoints.length}`);
    else if (event.type === "testScenarios")
      content.push(`  - scenarios: #${event.scenarios.length}`);

    // PROGRESSES
    if (typia.is<ProgressEvent>(event))
      content.push(`  - progress: (${event.completed} of ${event.total})`);
    if (typia.is<TokenUsageEvent>(event))
      content.push(
        `  - token usage: (input: ${event.tokenUsage.input.total.toLocaleString()}, output: ${event.tokenUsage.output.total.toLocaleString()})`,
      );
    console.log(content.join("\n"));
  };
}

interface TokenUsageEvent {
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
}
interface ProgressEvent {
  total: number;
  completed: number;
}
