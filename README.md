# Automation API

NestJS service that exposes workflow metadata stored in PostgreSQL, forwards prompts to OpenRouter for AI completions, and documents everything through Swagger.

## Overview
- Provides REST endpoints for listing `workflows` and generating AI text completions.
- Uses TypeORM for persistence with entity auto-loading during development.
- Includes Docker Compose for local orchestration of the API and PostgreSQL.
- Ships with OpenAPI docs (Swagger UI) and typed DTOs for consistent contracts.

## Tech Stack
- Runtime: Node.js 18+ with NestJS 11.
- Data: PostgreSQL 16 accessed via TypeORM.
- AI: OpenRouter chat completions API.
- Tooling: ESLint + Prettier, Jest configuration (no custom tests yet).

## Architecture Highlights
- `AppModule` loads configuration, database connection, and the automation feature module.
- `AutomationModule` bundles the controller, service, TypeORM repository, and DTOs.
- `Workflow` entity represents persisted automation workflows.
- Swagger is configured in `main.ts` to publish docs at runtime under `/docs`.

## Quickstart

### Option A – Docker Compose (recommended)
1. Update `.env.docker` with the credentials you want the containers to use (at minimum set `OPENROUTER_API_KEY`).
2. Run `docker compose up --build`.
3. Wait for `nestjs` and `postgres` containers to report healthy.
4. Visit `http://localhost:3000/docs` for the Swagger UI or hit the endpoints directly.

### Option B – Local Node.js + External PostgreSQL
1. Copy `.env.example` to `.env` and point `DATABASE_*` variables to an accessible PostgreSQL instance.
2. Install dependencies with `npm install`.
3. Start the API in watch mode using `npm run start:dev`.
4. Ensure Postgres contains the `workflows` table (see database section below).

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | NestJS HTTP listener port. |
| `DATABASE_HOST` | `localhost` | PostgreSQL hostname or service name. |
| `DATABASE_PORT` | `5432` | PostgreSQL port. |
| `DATABASE_USER` | `postgres` | Database username. |
| `DATABASE_PASSWORD` | `postgres` | Database password. |
| `DATABASE_NAME` | `automation` | Target database. |
| `DATABASE_SYNCHRONIZE` | `true` | Auto-create schema in dev; disable in production. |
| `OPENROUTER_API_KEY` | — | Required credential for OpenRouter calls. |
| `OPENROUTER_MODEL` | `meta-llama/llama-3.1-8b-instruct` | Model dispatched to OpenRouter. |
| `OPENROUTER_API_URL` | `https://openrouter.ai/api/v1/chat/completions` | OpenRouter chat endpoint. |
| `OPENROUTER_SITE_URL` | `http://localhost:3000` | Used for OpenRouter attribution headers (optional). |
| `OPENROUTER_SITE_NAME` | `Automation API` | Human readable site name for attribution (optional). |
| `POSTGRES_DB` | `automation` | Database created in the Postgres container. |
| `POSTGRES_USER` | `postgres` | Username configured in the Postgres container. |
| `POSTGRES_PASSWORD` | `postgres` | Password configured in the Postgres container. |
| `MCP_ENABLED` | `true` | Toggle to start the MCP WebSocket server. |
| `MCP_HOST` | `0.0.0.0` | Bind host for the MCP WebSocket server. |
| `MCP_PORT` | `4000` | Port for the MCP WebSocket server. |
| `MCP_API_KEYS` | — | Comma separated `token:userId:scope1|scope2` entries for MCP authentication. |

`.env.docker` is consumed automatically by `docker-compose.yml`; `.env` remains for local Node.js development.

## Database
- With `DATABASE_SYNCHRONIZE=true`, TypeORM creates the `workflows` table automatically on boot.
- Equivalent SQL definition (for manual provisioning):

```sql
CREATE TABLE IF NOT EXISTS workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE
);
```

- Seed sample data (optional) to test the listing endpoint:

```sql
INSERT INTO workflows (name, description)
VALUES
  ('Daily report', 'Collects metrics and emails the team'),
  ('Lead enrichment', 'Enrich CRM records via third-party APIs')
ON CONFLICT DO NOTHING;
```

## Project Structure

```
src/
├── automation/
│   ├── automation.controller.ts      # Swagger-annotated REST endpoints
│   ├── automation.module.ts          # Feature wiring for service and repository
│   ├── automation.service.ts         # Workflow queries + OpenRouter integration
│   ├── dto/                          # Request/response DTOs used by Swagger
│   ├── entities/                     # TypeORM entities (Workflow)
│   ├── interfaces/                   # Shared TypeScript interfaces & contracts
│   └── repositories/                 # Repository implementations
├── app.module.ts
└── main.ts                           # Bootstraps NestJS + Swagger configuration
```

## API Reference

| Method & Path | Description | Request Body | Success Response |
| --- | --- | --- | --- |
| `GET /automation/workflows` | Retrieve all workflows ordered by `id` | — | `200 OK` with `Workflow[]` |
| `GET /automation/analytics` | Aggregated workflow statistics | — | `200 OK` with analytics object |
| `POST /automation/agent` | Natural-language agent orchestration that selects tools automatically | `{ "prompt": string, "scopes?": string[], "outputFormat?": "text" | "markdown" | "html" }` | `200 OK` with structured agent response |
| `POST /automation/ai` | Generate text using OpenRouter | `{ "prompt": string }` | `200 OK` with `{ content: string }` |

- Authorization is not enforced yet; ensure you protect the API before exposing it publicly.
- All responses are JSON encoded and documented in Swagger.

### Example Requests

```bash
# List workflows
curl http://localhost:3000/automation/workflows

# Generate an AI completion
curl -X POST http://localhost:3000/automation/ai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Summarize the latest workflows"}'
```

## Swagger & Tooling
- Swagger UI hosted at `GET /docs` once the app is running.
- Raw OpenAPI JSON available at `GET /docs-json` for tooling integration.
- DTOs (`GenerateAiRequestDto`, `GenerateAiResponseDto`, `Workflow`) drive schema definitions automatically.
- Keep the docs up to date by annotating new endpoints with `@ApiOperation`, `@ApiOkResponse`, etc.

## MCP Server
- WebSocket endpoint: `ws://<host>:<MCP_PORT>` (defaults to `ws://localhost:4000`).
- Authentication handshake:
  1. Client connects and receives the `authentication_required` event.
  2. Client sends `{ "type": "authenticate", "token": "<api-token>", "id": "auth-1" }`.
  3. Server responds with scopes (e.g., `["workflow.read","analytics.read"]`).
- Supported messages (after authentication):
  - `{ "type": "initialize", "id": "1" }`
  - `{ "type": "list_tools", "id": "2" }` (returns only tools allowed by the user's scopes)
  - `{ "type": "call_tool", "id": "3", "tool": "list_workflows" }`
  - `{ "type": "call_tool", "id": "4", "tool": "workflow_analytics" }`
  - `{ "type": "call_tool", "id": "5", "tool": "agent_ask", "params": { "prompt": "Build dashboard summarising workflows", "outputFormat": "html" } }`
  - `{ "type": "call_tool", "id": "6", "tool": "generate_ai", "params": { "prompt": "Hello" } }`
- Scope requirements:
  - `workflow.read` → `list_workflows`
  - `analytics.read` → `workflow_analytics`
  - `ai.generate` → `generate_ai`
  - `agent.execute` **and** `ai.generate` (plus data scopes such as `workflow.read`/`analytics.read`) → `agent_ask`
- Responses follow the MCP draft structure with `result`, `error`, or `event` payloads.
- Disable the server by setting `MCP_ENABLED=false` if not needed.

## Development Commands
- `npm run start:dev` – Watch mode for local development.
- `npm run start` – Production-style start (no watch).
- `npm run build` – Compile TypeScript to `dist/`.
- `npm run lint` – Run ESLint with Prettier integration.
- `npm run format` – Format sources with Prettier.
- `npm run test` – Execute Jest test suite (currently defaults to NestJS starter configuration).
- `npm run migration:create -- --name=MeaningfulName` – Create an empty migration in `src/database/migrations`.
- `npm run migration:generate -- --name=MeaningfulName` – Generate a migration based on entity changes.
- `npm run migration:run` – Apply pending migrations to the configured database.
- `npm run migration:revert` – Roll back the most recent migration.

> Pass a `--name=` value when creating or generating migrations. Environments are read from `.env` (local) or `.env.docker` (Compose) when the scripts execute.

## Working With OpenRouter
- Make sure `OPENROUTER_API_KEY` is set before hitting `/automation/ai`.
- Optional attribution headers (`OPENROUTER_SITE_URL`, `OPENROUTER_SITE_NAME`) improve rate limits per OpenRouter guidance.
- Errors from OpenRouter propagate as `500` responses with context in the message; inspect server logs for details.

## Production Considerations
- Disable `DATABASE_SYNCHRONIZE` and manage schema via migrations.
- Add authentication/authorization (e.g., JWT, API keys) before exposing the endpoints.
- Configure logging (`app.useLogger`) and monitoring as needed.
- Set up proper error tracking (Sentry, OpenTelemetry) for AI request failures.
- Pin Docker image versions and review resource limits for long-running deployments.

## Troubleshooting
- `ECONNREFUSED` on `/automation/workflows` usually means PostgreSQL credentials or host are incorrect.
- 500 from `/automation/ai` with "API key not configured" indicates missing `OPENROUTER_API_KEY`.
- Use `docker compose logs -f nestjs` or `npm run start:dev` terminal output to inspect runtime errors quickly.

## Contributing / Next Steps
- Expand test coverage using NestJS `TestingModule` utilities.
- Consider caching workflow queries if the dataset grows large.
- Introduce background jobs or queues for long-running automation actions.
