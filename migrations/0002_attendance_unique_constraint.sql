-- Add unique constraint to prevent duplicate attendance records for the same student in the same class session
ALTER TABLE attendance_records
ADD CONSTRAINT unique_attendance_session UNIQUE (class_id, student_id, session_date);
