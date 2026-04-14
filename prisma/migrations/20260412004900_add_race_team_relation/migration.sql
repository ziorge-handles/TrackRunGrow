-- Add index and foreign key for Race.teamId -> Team (schema already had teamId column)
CREATE INDEX IF NOT EXISTS "races_teamId_idx" ON "races"("teamId");

ALTER TABLE "races" DROP CONSTRAINT IF EXISTS "races_teamId_fkey";
ALTER TABLE "races" ADD CONSTRAINT "races_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
