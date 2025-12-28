import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1704067200000 implements MigrationInterface {
  name = 'InitialSchema1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "phone_number" varchar(20) NOT NULL,
        "phone_verified" boolean NOT NULL DEFAULT false,
        "balance_cents" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_phone_number" UNIQUE ("phone_number")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_phone_number" ON "users" ("phone_number")`);

    // OTP codes table
    await queryRunner.query(`
      CREATE TABLE "otp_codes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "phone_number" varchar(20) NOT NULL,
        "code" varchar(6) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "used" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_otp_codes" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_otp_codes_phone_number" ON "otp_codes" ("phone_number")`);

    // Calls table
    await queryRunner.query(`
      CREATE TABLE "calls" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "target_phone_number" varchar(20) NOT NULL,
        "user_prompt" text NOT NULL,
        "status" varchar(50) NOT NULL DEFAULT 'pending',
        "vapi_call_id" varchar(100),
        "started_at" timestamptz,
        "connected_at" timestamptz,
        "ended_at" timestamptz,
        "duration_seconds" integer,
        "hold_duration_seconds" integer,
        "cost_cents" integer,
        "outcome" varchar(50),
        "outcome_summary" text,
        "recording_url" text,
        "transcript_url" text,
        "expected_wait_minutes" integer,
        "callback_requested" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_calls" PRIMARY KEY ("id"),
        CONSTRAINT "FK_calls_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_calls_user_id" ON "calls" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_calls_status" ON "calls" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_calls_created_at" ON "calls" ("created_at")`);

    // Call events table
    await queryRunner.query(`
      CREATE TABLE "call_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "call_id" uuid NOT NULL,
        "event_type" varchar(50) NOT NULL,
        "event_data" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_call_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_call_events_call" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_call_events_call_id" ON "call_events" ("call_id")`);

    // Transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" varchar(20) NOT NULL,
        "amount_cents" integer NOT NULL,
        "balance_after_cents" integer NOT NULL,
        "stripe_payment_intent_id" varchar(100),
        "call_id" uuid,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transactions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_transactions_call" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_user_id" ON "transactions" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "call_events"`);
    await queryRunner.query(`DROP TABLE "calls"`);
    await queryRunner.query(`DROP TABLE "otp_codes"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
