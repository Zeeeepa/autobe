import { IAutoBePlaygroundModel, IPage } from "@autobe/interface";
import { TypedBody, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

@Controller("autobe/playground/models")
export class AutoBePlaygroundModelController {
  @TypedRoute.Patch()
  public async index(
    @TypedBody() body: IPage.IRequest,
  ): Promise<IPage<IAutoBePlaygroundModel>> {
    body;
    return typia.random<IPage<IAutoBePlaygroundModel>>();
  }

  @TypedRoute.Get(":id")
  public async at(
    @TypedParam("id") id: string & typia.tags.Format<"uuid">,
  ): Promise<IAutoBePlaygroundModel> {
    id;
    return typia.random<IAutoBePlaygroundModel>();
  }

  @TypedRoute.Post()
  public async create(
    @TypedBody() body: IAutoBePlaygroundModel.ICreate,
  ): Promise<IAutoBePlaygroundModel> {
    body;
    return typia.random<IAutoBePlaygroundModel>();
  }

  @TypedRoute.Put(":id")
  public async update(
    @TypedParam("id") id: string & typia.tags.Format<"uuid">,
  ): Promise<void> {
    id;
  }

  @TypedRoute.Delete(":id")
  public async erase(
    @TypedParam("id") id: string & typia.tags.Format<"uuid">,
  ): Promise<void> {
    id;
  }
}
