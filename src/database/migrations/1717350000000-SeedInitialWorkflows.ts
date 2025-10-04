import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialWorkflows1717350000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "workflows" ("name", "description", "is_active") VALUES
        ('Daily report', 'Collects metrics and emails the team', true),
        ('Lead enrichment', 'Enrich CRM records via third-party APIs', true),
        ('Customer onboarding', 'Guides new customers through initial setup steps', true)
      ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "workflows" WHERE "name" IN ($1, $2, $3)`,
      [
        'Daily report',
        'Lead enrichment',
        'Customer onboarding',
      ],
    );
  }
}
