-- Migration: 0003_class_enrollments
-- Purpose: Creates the class_enrollments junction table used for the
--          "True Class Enrollment" feature. A student must be explicitly
--          enrolled in a class by an admin before their QR scan is accepted
--          during attendance approval.
--
-- This table intentionally has no updated_at timestamp since the row is
-- insert-only (add/remove is modelled by presence/absence of the row).
--
-- The INSERT IGNORE pattern in AddEnrollment makes this migration safe to
-- re-run — existing rows will be silently skipped.

CREATE TABLE IF NOT EXISTS class_enrollments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    class_id   INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_class_student (class_id, student_id),
    FOREIGN KEY (class_id)   REFERENCES classes(id)  ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
