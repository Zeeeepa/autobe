packages/agent/prompts 중 function call 을 반드시 해야하는 애들이 있거든? 이들의 시스템 프롬프트를 수정해서, function calling 을 반드시 하라고 알려주렴. 이들은 function calling 이 선택사항이 아니라 무조건 하는거야. 따라서 "이렇게 함수 실행할 계획인데 동의하십니까?" 이따위 질문하지말고, 무조건 그 즉시로 실행하라고 이야기해야함.

물론, 내가 Function 에 IAutoBeAnalyzeReviewApplication.review 라고 썼다고 해서, 정말로 IAutoBeAnalyzeReviewApplication.review 라고 시스템 프롬프트에 기입하면 안되는거 알지? 네임스페이스 떼고 순수 함수 이름만 써야한다? IAutoBeAnalyzeReviewApplication.review 가 아니라 review 인거야? 네임스페이스는 너가 함수 잘 찾게 해주려고 붙인 거니까 말이지.

- System Prompt 위치: packages/agent/prompts
- Function 정의 위치: packages/agent/src/orchestrate/*/structures

System Prompt    | Function Calling Schema
-----------------|---------------------------------------------------------------
ANALYZE_WRITE.md | IAutoBeAnalyzeWriteApplication.write 
ANALYZE_REVIEW.md | IAutoBeAnalyzeReviewApplication.review 
PRISMA_SCHEMA.md | IAutoBePrismaSchemaApplication.makePrismaSchemaFile 
PRISMA_REVIEW.md | IAutoBePrismaReviewApplication.reviewSchemaFile 
PRISMA_CORRECT.md | IAutoBePrismaCorrectApplication.correctPrismaSchemaFiles
INTERFACE_AUTHORIZATION.md | IAutoBeInterfaceAuthorizationsApplication.makeOperations 
INTERFACE_ENDPOINT.md | IAutoBeInterfaceEndpointApplication.makeEndpoints 
INTERFACE_OPERATION.md | IAutoBeInterfaceOperationApplication.makeOperations 
INTERFACE_SCHEMA.md | IAutoBeInterfaceSchemaApplication.makeComponents 
INTERFACE_OPERATION_REVIEW.md | IAutoBeInterfaceOperationsReviewApplication.reviewOperations
INTERFACE_SCHEMA_REVIEW.md | IAutoBeInterfaceSchemasReviewApplication.reviewSchemas
INTERFACE_COMPLEMENT.md | IAutoBeInterfaceComplementApplication.complementComponents 
TEST_SCENARIO.md | IAutoBeTestScenarioApplication.makeScenario 
TEST_WRITE.md | IAutoBeTestWriteApplication.write 
TEST_CORRECT.md | IAutoBeTestCorrectApplication.rewrite
REALIZE_CODER.md | IAutoBeRealizeWriteApplication.coding 
REALIZE_AUTHORIZATION.md | IAutoBeRealizeAuthorizationApplication.createDecorator
REALIZE_AUTHORIZATION_CORRECT.md | IAutoBeRealizeAuthorizationCorrectApplication.correctDecorator

그리고 function calling 이 필수는 아니고, 주어진 함수의 선결 조건에 부합하지 않거나 함수를 실행하기 위한 정보가 모자랄 때는 안 해도되는 에이전트들이 있어.

그러나 여기서도 함수 호출을 위한 모든 준비가 끝났는데, "함수 실행의 허락을 구해도 되겠습니까?" 따위로 에이전트가 함수 호출 대신 assistant message 를 반환할 수도 있는거 아냐? 이런거 절대 하지말고, 함수 호출 준비가 되었다면 더 이상 아무말하지 말고 그 즉시로 함수 실행하라고 해 줘.

System Prompt    | Function Calling Schema
-----------------|---------------------------------------------------------------
ANALYZE_SCENARIO.md | IAutoBeAnalyzeScenarioApplication.compose 
PRISMA_COMPONENT.md | IAutoBePrismaComponentApplication.extractComponents
INTERFACE_GROUP.md | IAutoBeInterfaceGroupApplication.makeGroups