package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"jblcf-b/internal/db"
	"jblcf-b/internal/middleware"
	"jblcf-b/internal/models"
	"jblcf-b/internal/utils"
)

// ListEnrollments — GET /api/admin/classes/:id/enrollments
// Returns all students enrolled in the class, plus today's attendance status.
func ListEnrollments(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	// path: /api/admin/classes/:id/enrollments
	classID, err := strconv.Atoi(parts[len(parts)-2])
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid class ID")
		return
	}

	rows, err := db.DB.Query(`
		SELECT s.id, s.school_id, s.last_name, s.first_name, s.middle_name, s.suffix, s.full_name,
		       s.email, s.phone, s.course_id, s.year_level, s.qr_token, s.photo, s.is_active, s.created_at
		FROM class_enrollments ce
		JOIN students s ON ce.student_id = s.id
		WHERE ce.class_id = ? AND s.is_active = true
		ORDER BY s.last_name, s.first_name
	`, classID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}
	defer rows.Close()

	var students []models.Student
	for rows.Next() {
		var s models.Student
		if err := rows.Scan(&s.ID, &s.SchoolID, &s.LastName, &s.FirstName, &s.MiddleName, &s.Suffix, &s.FullName,
			&s.Email, &s.Phone, &s.CourseID, &s.YearLevel, &s.QRToken, &s.Photo, &s.IsActive, &s.CreatedAt); err != nil {
			continue
		}
		students = append(students, s)
	}
	if students == nil {
		students = []models.Student{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(students)
}

// AddEnrollment — POST /api/admin/classes/:id/enrollments
// Body: { "studentId": 5 }
func AddEnrollment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	classID, err := strconv.Atoi(parts[len(parts)-2])
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid class ID")
		return
	}

	var body struct {
		StudentID int `json:"studentId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.StudentID == 0 {
		sendError(w, http.StatusBadRequest, "studentId is required")
		return
	}

	// Verify student is active
	var isActive bool
	err = db.DB.QueryRow(`SELECT is_active FROM students WHERE id = ?`, body.StudentID).Scan(&isActive)
	if err == sql.ErrNoRows || !isActive {
		sendError(w, http.StatusNotFound, "Student not found or inactive")
		return
	}

	_, err = db.DB.Exec(`
		INSERT IGNORE INTO class_enrollments (class_id, student_id) VALUES (?, ?)
	`, classID, body.StudentID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "enrolled"})
}

// RemoveEnrollment — DELETE /api/admin/classes/:id/enrollments/:student_id
func RemoveEnrollment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	// /api/admin/classes/:id/enrollments/:student_id
	studentID, err := strconv.Atoi(parts[len(parts)-1])
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid student ID")
		return
	}
	classID, err := strconv.Atoi(parts[len(parts)-3])
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid class ID")
		return
	}

	_, err = db.DB.Exec(`DELETE FROM class_enrollments WHERE class_id = ? AND student_id = ?`, classID, studentID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "removed"})
}

// GetClassRoster — GET /api/prof/classes/:id/roster
// Returns every enrolled student with their attendance status for today.
func GetClassRoster(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	// /api/prof/classes/:id/roster
	classID, err := strconv.Atoi(parts[len(parts)-2])
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid class ID")
		return
	}

	// Verify the professor owns this class (IDOR prevention)
	claims, ok := r.Context().Value(middleware.UserContextKey).(*utils.Claims)
	if !ok {
		sendError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	var profID int
	err = db.DB.QueryRow(`SELECT professor_id FROM classes WHERE id = ?`, classID).Scan(&profID)
	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Class not found")
		return
	} else if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}
	if profID != claims.UserID {
		sendError(w, http.StatusForbidden, "Forbidden: you do not have access to this class")
		return
	}

	date := r.URL.Query().Get("date")
	if date == "" {
		sendError(w, http.StatusBadRequest, "date query param required (YYYY-MM-DD)")
		return
	}

	if date == time.Now().Format("2006-01-02") {
		var classSchedule string
		if err := db.DB.QueryRow(`SELECT schedule FROM classes WHERE id = ?`, classID).Scan(&classSchedule); err == nil {
			now := time.Now()
			_, sessionEnd, parseErr := parseClassSessionWindow(classSchedule, now)
			if parseErr == nil && now.After(sessionEnd) {
				_, _ = db.DB.Exec(`
					INSERT INTO attendance_records (class_id, student_id, session_date, status, method, approval_status, note)
					SELECT ce.class_id, ce.student_id, ?, ?, ?, true, ?
					FROM class_enrollments ce
					JOIN students s ON s.id = ce.student_id
					LEFT JOIN attendance_records ar
						ON ar.class_id = ce.class_id
						AND ar.student_id = ce.student_id
						AND ar.session_date = ?
					WHERE ce.class_id = ?
					  AND s.is_active = true
					  AND ar.id IS NULL
				`, date, models.Absent, "auto_absent", "Auto-marked absent: not scanned during class session", date, classID)
			}
		}
	}

	rows, err := db.DB.Query(`
		SELECT
			s.id, s.school_id, s.full_name, s.photo, s.course_id,
			COALESCE(ar.status, 'absent') AS attendance_status,
			ar.scanned_at
		FROM class_enrollments ce
		JOIN students s ON ce.student_id = s.id
		LEFT JOIN attendance_records ar ON ar.student_id = s.id AND ar.class_id = ce.class_id AND ar.session_date = ?
		WHERE ce.class_id = ? AND s.is_active = true
		ORDER BY s.last_name, s.first_name
	`, date, classID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}
	defer rows.Close()

	type RosterEntry struct {
		ID               int     `json:"id"`
		SchoolID         string  `json:"schoolId"`
		FullName         string  `json:"fullName"`
		Photo            *string `json:"photo,omitempty"`
		CourseID         int     `json:"courseId"`
		AttendanceStatus string  `json:"attendanceStatus"`
		ScannedAt        *string `json:"scannedAt,omitempty"`
	}

	var roster []RosterEntry
	for rows.Next() {
		var e RosterEntry
		if err := rows.Scan(&e.ID, &e.SchoolID, &e.FullName, &e.Photo, &e.CourseID, &e.AttendanceStatus, &e.ScannedAt); err != nil {
			continue
		}
		roster = append(roster, e)
	}
	if roster == nil {
		roster = []RosterEntry{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(roster)
}
