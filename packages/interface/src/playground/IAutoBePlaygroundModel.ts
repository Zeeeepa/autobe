import { ILlmSchema } from "@samchon/openapi";
import { tags } from "typia";

export interface IAutoBePlaygroundModel {
  id: string & tags.Format<"uuid">;
  title: string | null;
  schema: ILlmSchema.Model;
  vendor: string;
  baseUrl: string & tags.Format<"uri">;
  created_at: string & tags.Format<"date-time">;
  updated_at: string & tags.Format<"date-time">;
}
export namespace IAutoBePlaygroundModel {
  export interface ICreate {
    title: string | null;
    schema: ILlmSchema.Model;
    vendor: string;
    apiKey: string;
    baseUrl: string & tags.Format<"uri">;
  }
  export interface IUpdate {
    title?: string | null;
    schema?: ILlmSchema.Model;
    apiKey?: string;
  }
}
