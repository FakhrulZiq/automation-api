# Automation API

This project demonstrates a simple Model Context Protocol (MCP) style automation service built with [NestJS](https://nestjs.com/) that reads workflow metadata stored in PostgreSQL.

The repository includes:
- A NestJS HTTP API with TypeORM integration.
- A PostgreSQL database configured via Docker Compose.
- An OpenRouter-backed AI endpoint for prompt completions.
- Auto-generated Swagger UI available at `/docs` when the server is running.

## Prerequisites

- Node.js 18.18+ (Node 20+ recommended for full compatibility)
- npm 9+
- Docker Engine & Docker Compose (for containerised setup)

## Environment Configuration

1. Duplicate `.env.example` and rename it to `.env`.
2. Adjust any values as needed—especially the database credentials if you run PostgreSQL outside Docker.

Environment variables used by NestJS:

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=automation
DATABASE_SYNCHRONIZE=true            # Turn off in production; migrations recommended instead
OPENROUTER_API_KEY=...               # Required to call OpenRouter
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_SITE_NAME=Automation API
```

## Database Schema

TypeORM is configured with `synchronize=true` for local development so tables are created automatically. If you want to provision the schema manually the equivalent SQL is:

```sql
CREATE TABLE IF NOT EXISTS workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE
);
```

Seed some example data to test the read endpoint:

```sql
INSERT INTO workflows (name, description)
VALUES
  ('Daily report', 'Collects metrics and emails the team'),
  ('Lead enrichment', 'Enrich CRM records via third-party APIs')
ON CONFLICT DO NOTHING;
```

## Running Locally (Node + local PostgreSQL)

```bash
npm install
npm run start:dev
```

Make sure your PostgreSQL instance is running and reachable using the credentials defined in `.env` before starting the API.

## Running Everything with Docker Compose

```bash
docker compose up --build
```

Services started by Compose:
- `postgres` – PostgreSQL 16 with a persistent volume `postgres_data`.
- `nestjs` – the NestJS API, compiled and served from the bundled Dockerfile.

Once the stack is up you can connect to PostgreSQL to seed example data:

```bash
docker exec -it postgres psql -U postgres -d automation
```

## Available API Endpoints

- `GET /automation/workflows` – Lists workflows stored in the PostgreSQL database.
- `POST /automation/ai` – Sends a `prompt` string to OpenRouter and returns the generated completion.

Responses are JSON formatted. Use any REST client (curl, Postman, VS Code REST, etc.) to interact with the API.

## API Documentation

- OpenAPI JSON: `GET /docs-json`
- Interactive Swagger UI: `GET /docs`

## Development Notes

- TypeORM entities are auto-loaded and synchronised in development; switch to migrations for production usage.
- Update `DATABASE_SYNCHRONIZE=false` in production and manage schema changes via migrations.
- The project retains the default NestJS testing configuration (`npm run test`). No database-specific tests have been added yet.
