import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Workflow } from './src/automation/entities/workflow.entity';

const databaseUrl = process.env.DATABASE_URL;

const dataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  host: databaseUrl ? undefined : (process.env.DATABASE_HOST ?? 'localhost'),
  port: databaseUrl
    ? undefined
    : Number.parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: databaseUrl ? undefined : (process.env.DATABASE_USER ?? 'postgres'),
  password: databaseUrl
    ? undefined
    : (process.env.DATABASE_PASSWORD ?? 'postgres'),
  database: databaseUrl
    ? undefined
    : (process.env.DATABASE_NAME ?? 'automation'),
  ssl: process.env.DATABASE_SSL === 'true',
  entities: [Workflow],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
});

export default dataSource;
