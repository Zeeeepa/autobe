import { IAutoBePlaygroundSession, IPage } from "@autobe/interface";
import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller, Get } from "@nestjs/common";
import typia from "typia";

@Controller("autobe/playground/sessions")
export class AutoBePlaygroundSessionController {
  @TypedRoute.Patch()
  public async index(
    @TypedBody() body: IPage.IRequest,
  ): Promise<IPage<IAutoBePlaygroundSession.ISummary>> {
    body;
    return typia.random<IPage<IAutoBePlaygroundSession.ISummary>>();
  }

  @Get(":id")
  public async at(
    @TypedParam("id") id: string & typia.tags.Format<"uuid">,
  ): Promise<IAutoBePlaygroundSession> {
    id;
    return typia.random<IAutoBePlaygroundSession>();
  }

  @TypedRoute.Post(":id")
  public async update(
    @TypedParam("id") id: string & typia.tags.Format<"uuid">,
    @TypedBody() body: IAutoBePlaygroundSession.IUpdate,
  ): Promise<void> {
    id;
    body;
  }

  @TypedRoute.Delete(":id")
  public async erase(
    @TypedParam("id") id: string & typia.tags.Format<"uuid">,
  ): Promise<void> {
    id;
  }
}
