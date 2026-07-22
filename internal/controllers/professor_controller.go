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
	"jblcf-b/internal/views"
)

func ListProfessorClasses(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, ok := r.Context().Value(middleware.UserContextKey).(*utils.Claims)
	if !ok {
		sendError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	rows, err := db.DB.Query(`
		SELECT id, code, title, professor_id, course_id, schedule, room 
		FROM classes WHERE professor_id = ?
	`, claims.UserID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}
	defer rows.Close()

	var classes []models.Class
	for rows.Next() {
		var c models.Class
		if err := rows.Scan(&c.ID, &c.Code, &c.Title, &c.ProfessorID, &c.CourseID, &c.Schedule, &c.Room); err != nil {
			continue
		}
		classes = append(classes, c)
	}

	if classes == nil {
		classes = []models.Class{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(classes)
}

func ScanQRCode(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req views.ScanQRRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if err := utils.Validate.Struct(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Validation failed")
		return
	}

	var s models.Student
	err := db.DB.QueryRow(`
		SELECT id, school_id, last_name, first_name, middle_name, suffix, full_name, email, phone, course_id, year_level, qr_token, photo, is_active, created_at 
		FROM students WHERE qr_token = ? AND is_active = true
	`, req.QRToken).Scan(
		&s.ID, &s.SchoolID, &s.LastName, &s.FirstName, &s.MiddleName, &s.Suffix, &s.FullName, &s.Email, &s.Phone, &s.CourseID, &s.YearLevel, &s.QRToken, &s.Photo, &s.IsActive, &s.CreatedAt,
	)

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Student not found or inactive")
		return
	} else if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	var c models.Course
	err = db.DB.QueryRow(`SELECT id, code, name FROM courses WHERE id = ?`, s.CourseID).Scan(&c.ID, &c.Code, &c.Name)
	var coursePtr *models.Course
	if err == nil {
		coursePtr = &c
	}

	resp := views.StudentScanResponse{
		Student: s,
		Course:  coursePtr,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func ApproveAttendance(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, ok := r.Context().Value(middleware.UserContextKey).(*utils.Claims)
	if !ok {
		sendError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req views.ApproveAttendanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if err := utils.Validate.Struct(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Validation failed")
		return
	}

	// Verify class belongs to professor
	var profID int
	err := db.DB.QueryRow(`SELECT professor_id FROM classes WHERE id = ?`, req.ClassID).Scan(&profID)
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

	// Verify student exists and is active
	var studentActive bool
	err = db.DB.QueryRow(`SELECT is_active FROM students WHERE id = ?`, req.StudentID).Scan(&studentActive)
	if err == sql.ErrNoRows || !studentActive {
		sendError(w, http.StatusNotFound, "Student not found or inactive")
		return
	} else if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	// Verify student is explicitly enrolled in this class via class_enrollments
	var enrollmentCount int
	err = db.DB.QueryRow(`SELECT COUNT(*) FROM class_enrollments WHERE class_id = ? AND student_id = ?`, req.ClassID, req.StudentID).Scan(&enrollmentCount)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}
	if enrollmentCount == 0 {
		sendError(w, http.StatusForbidden, "Student is not enrolled in this class")
		return
	}

	// Use the server's current date as the session date.
	// A client-supplied date is intentionally not accepted to prevent
	// backdating or future-dating attendance records.
	sessionDate := time.Now().Format("2006-01-02")

	// Insert attendance record
	res, err := db.DB.Exec(`
		INSERT INTO attendance_records (class_id, student_id, session_date, status, method, approval_status)
		VALUES (?, ?, ?, ?, ?, ?)
	`, req.ClassID, req.StudentID, sessionDate, models.Present, "qr_scan", true)

	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			sendError(w, http.StatusConflict, "Student already marked present for this session")
			return
		}
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	id, _ := res.LastInsertId()
	
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id": id,
		"status": "approved",
	})
}

func GetClassAttendance(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	claims, ok := r.Context().Value(middleware.UserContextKey).(*utils.Claims)
	if !ok {
		sendError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	classID, err := strconv.Atoi(parts[len(parts)-1])
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid class ID")
		return
	}

	// Verify class belongs to professor
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

	// Fetch attendance records for this class
	rows, err := db.DB.Query(`
		SELECT a.id, a.class_id, a.student_id, a.session_date, a.status, a.method, a.scanned_at, a.note, a.approval_status,
		       s.school_id, s.last_name, s.first_name, s.middle_name, s.suffix, s.full_name, s.email, s.phone, s.course_id, s.photo,
		       c.code, c.name
		FROM attendance_records a
		JOIN students s ON a.student_id = s.id
		JOIN courses c ON s.course_id = c.id
		WHERE a.class_id = ?
	`, classID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}
	defer rows.Close()

	var records []views.AttendanceRecordResponse
	for rows.Next() {
		var rec models.AttendanceRecord
		var s models.Student
		var c models.Course

		if err := rows.Scan(
			&rec.ID, &rec.ClassID, &rec.StudentID, &rec.Date, &rec.Status, &rec.Method, &rec.ScannedAt, &rec.Note, &rec.ApprovalStatus,
			&s.SchoolID, &s.LastName, &s.FirstName, &s.MiddleName, &s.Suffix, &s.FullName, &s.Email, &s.Phone, &s.CourseID, &s.Photo,
			&c.Code, &c.Name,
		); err != nil {
			continue
		}

		s.ID = rec.StudentID
		c.ID = s.CourseID

		records = append(records, views.AttendanceRecordResponse{
			AttendanceRecord: rec,
			Student:          &s,
			Course:           &c,
		})
	}

	if records == nil {
		records = []views.AttendanceRecordResponse{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(records)
}
