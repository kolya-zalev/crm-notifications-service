import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1793990435553 implements MigrationInterface {
  name = 'Init1793990435553';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "type" character varying NOT NULL, "message" text NOT NULL, "leadId" character varying, "actorId" character varying, "actorName" character varying NOT NULL DEFAULT '', "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5340fc241f57310d243e5ab20b" ON "notifications" ("userId", "isRead") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_21e65af2f4f242d4c85a92aff4" ON "notifications" ("userId", "createdAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_21e65af2f4f242d4c85a92aff4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5340fc241f57310d243e5ab20b"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
