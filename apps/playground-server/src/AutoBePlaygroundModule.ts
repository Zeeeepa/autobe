import { Module } from "@nestjs/common";

import { AutoBePlaygroundController } from "./controllers/AutoBePlaygroundController";
import { AutoBePlaygroundModelController } from "./controllers/AutoBePlaygroundModelController";
import { AutoBePlaygroundReplayController } from "./controllers/AutoBePlaygroundReplayController";
import { AutoBePlaygroundSessionController } from "./controllers/AutoBePlaygroundSessionController";
import { HealthCheckController } from "./controllers/HealthCheckController";

@Module({
  controllers: [
    // legacy
    AutoBePlaygroundController,
    AutoBePlaygroundReplayController,
    HealthCheckController,
    // service
    AutoBePlaygroundModelController,
    AutoBePlaygroundSessionController,
  ],
})
export class AutoBePlaygroundModule {}
