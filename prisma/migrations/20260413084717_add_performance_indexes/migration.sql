-- Performance indexes for high-volume query patterns

-- BodyMetric: athlete lookups sorted by date
CREATE INDEX IF NOT EXISTS "BodyMetric_athleteId_recordedAt_idx" ON "BodyMetric"("athleteId", "recordedAt");

-- RaceResult: athlete history and per-race listings
CREATE INDEX IF NOT EXISTS "RaceResult_athleteId_recordedAt_idx" ON "RaceResult"("athleteId", "recordedAt");
CREATE INDEX IF NOT EXISTS "RaceResult_raceId_idx" ON "RaceResult"("raceId");

-- WorkoutLog: athlete training log sorted by date
CREATE INDEX IF NOT EXISTS "WorkoutLog_athleteId_date_idx" ON "WorkoutLog"("athleteId", "date");

-- CalendarEvent: team schedule queries
CREATE INDEX IF NOT EXISTS "CalendarEvent_teamId_startTime_idx" ON "CalendarEvent"("teamId", "startTime");

-- AiSuggestion: athlete suggestion history
CREATE INDEX IF NOT EXISTS "AiSuggestion_athleteId_createdAt_idx" ON "AiSuggestion"("athleteId", "createdAt");

-- EventAttendance: attendance by athlete
CREATE INDEX IF NOT EXISTS "event_attendance_athleteId_idx" ON "event_attendance"("athleteId");

-- MessageRecipient: inbox queries (unread messages per user)
CREATE INDEX IF NOT EXISTS "message_recipients_userId_isRead_idx" ON "message_recipients"("userId", "isRead");

-- LineupEntry: per-lineup and per-athlete lookups
CREATE INDEX IF NOT EXISTS "lineup_entries_lineupId_idx" ON "lineup_entries"("lineupId");
CREATE INDEX IF NOT EXISTS "lineup_entries_athleteId_idx" ON "lineup_entries"("athleteId");
