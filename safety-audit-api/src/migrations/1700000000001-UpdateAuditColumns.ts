import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAuditColumns1700000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First check if status column exists
        const hasStatusColumn = await queryRunner.hasColumn('audits', 'status');
        
        // Add new columns first
        await queryRunner.query(`
            ALTER TABLE "audits"
            ADD COLUMN IF NOT EXISTS "auditorTitle" varchar,
            ADD COLUMN IF NOT EXISTS "auditorEmail" varchar,
            ADD COLUMN IF NOT EXISTS "sections" jsonb DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS "fields" jsonb DEFAULT '[]'
        `);

        // Create enum type if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE audit_status_enum AS ENUM ('draft', 'completed');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Handle status column based on whether it exists
        if (!hasStatusColumn) {
            // If status doesn't exist, add it directly as enum
            await queryRunner.query(`
                ALTER TABLE "audits"
                ADD COLUMN "status" audit_status_enum DEFAULT 'draft' NOT NULL
            `);
        } else {
            // If status exists, create temporary column and migrate data
            await queryRunner.query(`
                ALTER TABLE "audits" 
                ADD COLUMN "status_new" audit_status_enum;
                
                UPDATE "audits" 
                SET "status_new" = 
                    CASE 
                        WHEN "completedAt" IS NOT NULL THEN 'completed'::audit_status_enum 
                        ELSE 'draft'::audit_status_enum 
                    END;
                
                ALTER TABLE "audits" 
                DROP COLUMN "status",
                ALTER COLUMN "status_new" SET NOT NULL,
                ALTER COLUMN "status_new" SET DEFAULT 'draft',
                RENAME COLUMN "status_new" TO "status";
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert the status column to varchar if needed
        await queryRunner.query(`
            ALTER TABLE "audits" 
            ALTER COLUMN "status" TYPE varchar 
            USING status::text;
        `);

        // Drop the enum type
        await queryRunner.query(`
            DROP TYPE IF EXISTS audit_status_enum;
        `);

        // Remove added columns
        await queryRunner.query(`
            ALTER TABLE "audits"
            DROP COLUMN IF EXISTS "auditorTitle",
            DROP COLUMN IF EXISTS "auditorEmail",
            DROP COLUMN IF EXISTS "sections",
            DROP COLUMN IF EXISTS "fields"
        `);
    }
} 