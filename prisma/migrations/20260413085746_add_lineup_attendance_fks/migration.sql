-- Foreign keys for MeetLineup -> Race and MeetLineup -> Team
ALTER TABLE "meet_lineups" DROP CONSTRAINT IF EXISTS "meet_lineups_raceId_fkey";
ALTER TABLE "meet_lineups" ADD CONSTRAINT "meet_lineups_raceId_fkey"
  FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meet_lineups" DROP CONSTRAINT IF EXISTS "meet_lineups_teamId_fkey";
ALTER TABLE "meet_lineups" ADD CONSTRAINT "meet_lineups_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "meet_lineups_teamId_idx" ON "meet_lineups"("teamId");

-- Foreign key for EventAttendance -> CalendarEvent
ALTER TABLE "event_attendance" DROP CONSTRAINT IF EXISTS "event_attendance_calendarEventId_fkey";
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_calendarEventId_fkey"
  FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
