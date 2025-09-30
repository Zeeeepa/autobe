import { tags } from "typia";

import { AutoBeEventSnapshot } from "../events/AutoBeEventSnapshot";
import { AutoBeHistory } from "../histories/AutoBeHistory";
import { IAutoBePlaygroundSessionAggregate } from "./IAutoBePlaygroundSessionAggregate";
import { IAutoBePlaygroundSessionConfig } from "./IAutoBePlaygroundSessionConfig";

export interface IAutoBePlaygroundSession
  extends IAutoBePlaygroundSession.ISummary {
  id: string & tags.Format<"uuid">;
  histories: AutoBeHistory[];
  snapshots: AutoBeEventSnapshot[];
}
export namespace IAutoBePlaygroundSession {
  export interface ISummary {
    id: string & tags.Format<"uuid">;
    config: IAutoBePlaygroundSessionConfig;
    aggregate: IAutoBePlaygroundSessionAggregate;
    title: string | null;
    created_at: string & tags.Format<"date-time">;
    completed_at: null | (string & tags.Format<"date-time">);
  }
  export interface ICreate {
    config: IAutoBePlaygroundSessionConfig.ICreate;
    title: string | null;
  }
  export interface IUpdate {
    title?: string | null;
  }
}
