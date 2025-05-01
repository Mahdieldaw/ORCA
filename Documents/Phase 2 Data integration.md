let's proceed with Phase 2: Backend Engineering & Data Structure.

We will adapt the provided plan's logic and goals but implement them using our chosen "smarter" code stack: NestJS backend, PostgreSQL database managed by Prisma, LangChain.js for AI logic, and Supabase for Auth (and potentially DB hosting). We are replacing the Firebase/GCP infrastructure suggested in the prompt with this stack because it offers better relational integrity (PostgreSQL vs. Firestore) and a more structured backend framework (NestJS vs. Cloud Functions) suitable for this application's complexity.

Objective: Define and implement the backend API, core logic engines (Execution, Validation, Snapshot), data persistence schemas (using Prisma/PostgreSQL), and necessary service abstractions. This phase focuses purely on backend functionality, testable independently of the Phase 1 UI shell.

Instructions:

Step 1: Define Prisma Schema (Data Structure)

Ensure you have Prisma set up in your NestJS project (npm install prisma --save-dev, npx prisma init --datasource-provider postgresql).

Replace the contents of prisma/schema.prisma with the definitive schema below (refined from "Plan AI" and incorporating necessary elements):

// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  // output   = "../node_modules/.prisma/client" // Default output location
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Ensure this matches your Supabase DB URL or other Postgres instance
}

// --- Core Data Models ---

// Link to Supabase Auth users - Assumes handle_new_user trigger exists in DB
model UserProfile {
  id        String    @id // This MUST match the UUID from auth.users
  email     String?   @unique
  fullName  String?   @map("full_name")
  createdAt DateTime? @default(now()) @map("created_at")

  // User settings embedded here for simplicity, or could be a separate table
  preferences     Json?     @default("{}") // General UI/backend preferences
  savedPrompts    Json?     @default("[]") // Array of {id: string, name: string, prompt: string}
  maxSnapshots    Int?      @default(50) @map("max_snapshots") // Example setting

  // Relations
  workflows   Workflow[]
  executions  Execution[]
  snapshots   Snapshot[]

  @@map("user_profiles")
}

model Model {
  id                         String    @id @default(uuid())
  name                       String    @unique // User-facing e.g., "GPT-4 Turbo"
  provider                   String?   // e.g., "OpenAI", "Anthropic"
  modelIdentifierForFlowise  String    @unique @map("model_identifier_for_flowise") // Critical: e.g., "gpt-4-turbo-preview"
  contextLength              Int?      @map("context_length")
  configDefaults             Json?     @map("config_defaults") // e.g., { "temperature": 0.7 }
  createdAt                  DateTime? @default(now()) @map("created_at")

  // Relations
  stages Stage[]

  @@map("models")
}

model Workflow {
  id          String      @id @default(uuid())
  userId      String      @map("user_id")
  name        String
  description String?
  metadata    Json?       // e.g., { "tags": ["summarization"], "version": 1 }
  createdAt   DateTime?   @default(now()) @map("created_at")
  updatedAt   DateTime?   @updatedAt @map("updated_at")

  // Relations
  user        UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)
  stages      Stage[]     @relation(onDelete: Cascade)
  executions  Execution[] @relation(onDelete: Cascade)
  snapshots   Snapshot[]  @relation(onDelete: Cascade) // Snapshots deleted if workflow is deleted

  @@map("workflows")
}

model Stage {
  id                    String    @id @default(uuid())
  workflowId            String    @map("workflow_id")
  userId                String    @map("user_id") // Denormalized for simpler RLS/checks
  stageOrder            Int       @map("stage_order")
  name                  String?   // User-friendly stage name
  promptTemplate        String?   @db.Text @map("prompt_template")
  modelId               String?   @map("model_id")
  validationType        String?   @default("none") @map("validation_type") // 'none', 'manual', 'regex', 'function', 'llm'(future)
  validationCriteria    Json?     @map("validation_criteria") // e.g., { "pattern": "..." }, { "functionName": "..." }
  outputVariables       Json?     @map("output_variables") // Defines expected output structure { "key": "type" }
  inputVariableMapping  Json?     @map("input_variable_mapping") // Maps stage inputs { "promptVar": "source.path" }
  retryLimit            Int?      @default(0) @map("retry_limit")
  nextStageOnPass       Int?      @map("next_stage_on_pass") // Target stage_order
  nextStageOnFail       Int?      @map("next_stage_on_fail") // Target stage_order
  flowiseConfig         Json?     @map("flowise_config") // Overrides for Flowise call
  createdAt             DateTime? @default(now()) @map("created_at")

  // Relations
  workflow              Workflow     @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  model                 Model?       @relation(fields: [modelId], references: [id], onDelete: SetNull) // Model deletion shouldn't break stages
  executionLogs         ExecutionLog[]

  @@unique([workflowId, stageOrder])
  @@map("stages")
}

model Execution {
  id                  String      @id @default(uuid())
  workflowId          String      @map("workflow_id")
  userId              String      @map("user_id")
  status              String      @default("pending") // 'pending', 'running', 'completed', 'failed', 'paused'
  executionInputs     Json?       @map("execution_inputs") // Initial inputs for the entire run
  currentStageOrder   Int?        @map("current_stage_order")
  executionContext    Json?       @default("{}") @map("execution_context") // Stores outputs from completed stages { "stage_1": { "output": {...} } }
  startedAt           DateTime?   @default(now()) @map("started_at")
  completedAt         DateTime?   @map("completed_at")

  // Relations
  workflow            Workflow     @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  user                UserProfile  @relation(fields: [userId], references: [id], onDelete: Cascade)
  executionLogs       ExecutionLog[] @relation(onDelete: Cascade) // Logs deleted if execution is deleted

  @@index([userId, status]) // Index for fetching user's active/completed runs
  @@map("executions")
}

model ExecutionLog {
  id                String      @id @default(uuid())
  executionId       String      @map("execution_id")
  stageId           String      @map("stage_id") // Link to the specific stage definition used
  userId            String      @map("user_id") // Denormalized
  stageOrder        Int         @map("stage_order") // Denormalized
  attemptNumber     Int         @default(1) @map("attempt_number")
  inputs            Json?       // Actual inputs for this specific attempt
  promptSent        String?     @db.Text @map("prompt_sent") // For debugging
  rawOutput         String?     @db.Text @map("raw_output")
  parsedOutput      Json?       @map("parsed_output")
  validationResult  String?     @default("pending") @map("validation_result") // 'pending', 'pass', 'fail', 'error'
  validatorNotes    String?     @map("validator_notes")
  errorMessage      String?     @map("error_message")
  executedAt        DateTime?   @default(now()) @map("executed_at")
  durationMs        Int?        @map("duration_ms")

  // Relations
  execution         Execution    @relation(fields: [executionId], references: [id], onDelete: Cascade)
  stage             Stage        @relation(fields: [stageId], references: [id], onDelete: Cascade) // Cascade delete seems reasonable here

  @@index([executionId, stageOrder, attemptNumber]) // Index for retrieving logs for a run
  @@map("execution_logs")
}

model Snapshot {
  id                String    @id @default(uuid())
  userId            String    @map("user_id")
  name              String
  description       String?
  type              String    @default("workflow") // Currently only 'workflow'
  sourceWorkflowId  String?   @map("source_workflow_id")
  snapshotData      Json      @map("snapshot_data") // JSON containing { workflow: {...}, stages: [{...}] }
  createdAt         DateTime? @default(now()) @map("created_at")

  // Relations
  user              UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)
  workflow          Workflow?   @relation(fields: [sourceWorkflowId], references: [id], onDelete: SetNull)

  @@map("snapshots")
}


Run database migration: npx prisma migrate dev --name init (or appropriate migration command).

Generate Prisma Client: npx prisma generate

Step 2: Scaffold NestJS Modules and Services

Use NestJS CLI (nest g module <name>, nest g service <name>, nest g controller <name>) to create the following core modules and their associated services/controllers:

AuthModule: Handles authentication middleware/guards (integrating with Supabase Auth JWT validation).

PrismaModule: Centralized Prisma Client provider.

UsersModule: Manages user profiles/settings (reading/writing UserProfile).

ModelsModule: Service to list available Model records.

WorkflowsModule: CRUD for Workflow and Stage records.

ExecutionsModule: Handles starting runs, getting status, managing Execution and ExecutionLog records. Contains the core orchestration logic.

AIServiceModule (or just AIService): Abstracted interface to LangChain for prompt execution.

ValidationModule (or just ValidationService): Logic for different validation types.

SnapshotsModule: CRUD for Snapshot records.

Define Interfaces/DTOs (TypeScript): Create Data Transfer Objects (using class-validator, class-transformer) for API request/response bodies corresponding to the Prisma models (e.g., CreateWorkflowDto, UpdateStageDto, ExecutionStatusDto). Use Prisma-generated types internally within services.

Step 3: Implement Core Engine Logic within Services

Focus on the logic using mocked dependencies for now (like the actual LLM call).

PrismaService (@Injectable, Global): Provide an instance of PrismaClient.

AuthService/Guard: Implement JWT validation strategy (e.g., using passport-jwt) to verify tokens from Supabase Auth passed by the frontend. Create a Guard (@UseGuards) to protect routes.

WorkflowsService: Implement methods like createWorkflow(userId, data), findUserWorkflows(userId), getWorkflowWithStages(userId, workflowId), updateWorkflowStages(userId, workflowId, stagesData). Use Prisma Client for DB operations. Add checks to ensure user owns the workflow.

AIService:

Inject configuration (API keys).

Method: executePrompt(modelIdentifier: string, prompt: string, config: Record<string, any>): Promise<{ rawOutput: string }>

Inside: Use a map or switch based on modelIdentifier to instantiate the correct LangChain LLM class (OpenAI, ChatAnthropic, etc.). (Mock actual LLM calls for now, return dummy text). Apply config (temperature etc.). Invoke the LLM. Return the raw output.

ValidationService:

Method: validate(output: string, validationType: string, criteria: Prisma.JsonValue): Promise<{ result: 'pass' | 'fail', notes?: string }>

Inside: Use a switch on validationType. Implement logic for 'regex' (using criteria.pattern). Return pass/fail. (Manual validation is triggered by user input via API, not this service directly).

ExecutionsService (Core Orchestrator):

Method: startExecution(userId: string, workflowId: string, inputs: Prisma.JsonValue): Promise<Execution>

Verify user owns workflow.

Create Execution record (status='pending').

(If using background jobs): Queue a job to run the execution loop, passing execution ID.

(If synchronous MVP): Immediately call a private method like runNextStage(executionId).

Return the created execution.

Method: runNextStage(executionId: string): Promise<void> (This is the main loop logic)

Fetch Execution and its current state (current_stage_order, executionContext).

Fetch the next Stage definition based on current_stage_order. Handle end-of-workflow.

Update Execution status to 'running'.

Resolve inputVariableMapping using executionContext and executionInputs to get current_stage_inputs.

Substitute variables in promptTemplate -> prompt_sent.

Record start time.

Call AIService.executePrompt(...). Record end time (durationMs).

Create ExecutionLog record (attemptNumber=1, store inputs, prompt, output, validationResult='pending').

Call ValidationService.validate(...).

Update ExecutionLog with validation result.

Determine next_stage_order based on result (nextStageOnPass/nextStageOnFail).

Update executionContext with parsedOutput (if any).

Update Execution record (current_stage_order = next order).

If more stages, recursively call runNextStage(executionId) or queue next job.

If finished, update Execution status to 'completed'.

Handle errors: Catch errors from AI/Validation, update log (validationResult='error', errorMessage), update execution (status='failed'). Implement retry logic based on retryLimit and attemptNumber.

Method: recordManualValidation(userId: string, logId: string, result: 'pass' | 'fail', notes?: string): Updates the specific ExecutionLog, checks ownership, and potentially triggers runNextStage if result is 'pass'.

SnapshotsService:

Method: createSnapshot(userId: string, workflowId: string, name: string, description?: string): Fetch workflow + stages, bundle into JSON, create Snapshot record. Apply limits from UserProfile.maxSnapshots.

Method: getSnapshotData(userId: string, snapshotId: string): Fetch snapshot and return snapshotData.

Step 4: Define API Controllers

Create controllers (@Controller) for each module that needs to expose functionality to the frontend (Workflows, Executions, Snapshots, Users, Models).

Define routes (@Get, @Post, @Put, @Delete) corresponding to the required frontend actions.

Apply Auth Guards (@UseGuards(JwtAuthGuard)) to protected routes.

Use DTOs for request validation and response structuring. Inject corresponding services into controllers to handle the logic.

Example Controller Snippet:

// src/executions/executions.controller.ts
import { Controller, Post, Body, Param, UseGuards, Request, Get } from '@nestjs/common';
import { ExecutionsService } from './executions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Your Auth Guard
import { StartExecutionDto } from './dto/start-execution.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'; // For API docs

@ApiTags('Executions')
@ApiBearerAuth() // Indicates JWT is required
@Controller('executions')
export class ExecutionsController {
  constructor(private readonly executionsService: ExecutionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':workflowId/run')
  async startExecution(
    @Param('workflowId') workflowId: string,
    @Body() startExecutionDto: StartExecutionDto,
    @Request() req, // Access user from JWT payload attached by Guard
  ) {
    const userId = req.user.userId; // Assuming Guard attaches user object with userId
    return this.executionsService.startExecution(userId, workflowId, startExecutionDto.inputs);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':executionId')
  async getExecutionStatus(
       @Param('executionId') executionId: string,
       @Request() req,
  ) {
      const userId = req.user.userId;
      // TODO: Implement getStatus method in service, ensuring user owns execution
      // return this.executionsService.getStatus(userId, executionId);
      return { message: 'Get status endpoint placeholder', executionId, userId };
  }

  // Add endpoints for manual validation, retries etc.
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

Step 5: Unit & Integration Testing Setup

Set up Jest (or preferred testing framework) within the NestJS project.

Write unit tests for services, mocking Prisma Client (@golevelup/ts-jest can help) and other service dependencies (like AIService). Test core logic (validation routing, state transitions).

Write integration tests using supertest to hit the actual API endpoints, potentially using a separate test database spun up via Docker Compose.

Phase 2 Acceptance Criteria:

✅ Prisma schema implemented; migrations successfully applied to the database.

✅ NestJS modules, services, and controllers scaffolded for core entities.

✅ Core logic methods defined in services (even with mocked dependencies for external calls like LLMs).

✅ API endpoints defined for key operations (create workflow, start execution, list snapshots, etc.).

✅ Authentication guard implemented and applied to relevant endpoints.

✅ Basic unit tests pass for core service logic (e.g., validation routing).

✅ Can trigger startExecution via API/test client and verify (via DB check or service mocks) that an Execution record is created and initial logging occurs.

✅ Can call services related to snapshots and verify DB interactions (mocked or real).

this concludes the detailed plan for Phase 2 using the code stack. Focus on implementing the Prisma schema, NestJS services/controllers, core logic abstractions, and setting up basic tests. The actual AI calls within AIService can return mocked data for now.