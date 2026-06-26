-- AddForeignKey
ALTER TABLE "discipline_score_events" ADD CONSTRAINT "discipline_score_events_mission_session_id_fkey" FOREIGN KEY ("mission_session_id") REFERENCES "mission_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
