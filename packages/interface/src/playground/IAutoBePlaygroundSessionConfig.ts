import { IAutoBePlaygroundModel } from "./IAutoBePlaygroundModel";

export interface IAutoBePlaygroundSessionConfig {
  model: IAutoBePlaygroundModel;
  timezone: string;
  locale: string;
}
export namespace IAutoBePlaygroundSessionConfig {
  export interface ICreate {
    model_id: string;
    timezone: string;
    locale: string;
  }
}
