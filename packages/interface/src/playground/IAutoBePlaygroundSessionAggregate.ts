import { AutoBePhase } from "../histories/AutoBePhase";
import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";

export interface IAutoBePlaygroundSessionAggregate {
  phase: AutoBePhase | null;
  token_usage: IAutoBeTokenUsageJson;
}
