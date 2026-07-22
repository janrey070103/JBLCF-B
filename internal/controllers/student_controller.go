package controllers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/google/uuid"

	"jblcf-b/internal/db"
	"jblcf-b/internal/models"
	"jblcf-b/internal/utils"
	"jblcf-b/internal/views"
)

func ListStudents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse optional pagination query params
	q := r.URL.Query()
	page := 1
	pageSize := 20
	if p := q.Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if ps := q.Get("pageSize"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 && v <= 100 {
			pageSize = v
		}
	}
	offset := (page - 1) * pageSize

	// Count total active students for pagination metadata
	var total int
	if err := db.DB.QueryRow(`SELECT COUNT(*) FROM students WHERE is_active = true`).Scan(&total); err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to count students")
		return
	}

	rows, err := db.DB.Query(`
		SELECT id, school_id, last_name, first_name, middle_name, suffix, full_name, email, phone, course_id, year_level, qr_token, photo, is_active, created_at 
		FROM students WHERE is_active = true
		ORDER BY last_name, first_name
		LIMIT ? OFFSET ?
	`, pageSize, offset)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch students")
		return
	}
	defer rows.Close()

	var students []models.Student
	for rows.Next() {
		var s models.Student
		if err := rows.Scan(&s.ID, &s.SchoolID, &s.LastName, &s.FirstName, &s.MiddleName, &s.Suffix, &s.FullName, &s.Email, &s.Phone, &s.CourseID, &s.YearLevel, &s.QRToken, &s.Photo, &s.IsActive, &s.CreatedAt); err != nil {
			continue
		}
		students = append(students, s)
	}

	if students == nil {
		students = []models.Student{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"students": students,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}


func GetStudent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	identifier := parts[len(parts)-1]

	var query string
	var args []interface{}
	
	// If it's a UUID/Token, it's a scan lookup, else ID
	if len(identifier) > 20 {
		query = `SELECT id, school_id, last_name, first_name, middle_name, suffix, full_name, email, phone, course_id, year_level, qr_token, photo, is_active, created_at FROM students WHERE qr_token = ? AND is_active = true`
		args = append(args, identifier)
	} else {
		id, err := strconv.Atoi(identifier)
		if err != nil {
			sendError(w, http.StatusBadRequest, "Invalid student ID format")
			return
		}
		query = `SELECT id, school_id, last_name, first_name, middle_name, suffix, full_name, email, phone, course_id, year_level, qr_token, photo, is_active, created_at FROM students WHERE id = ? AND is_active = true`
		args = append(args, id)
	}

	var s models.Student
	err := db.DB.QueryRow(query, args...).Scan(
		&s.ID, &s.SchoolID, &s.LastName, &s.FirstName, &s.MiddleName, &s.Suffix, &s.FullName, &s.Email, &s.Phone, &s.CourseID, &s.YearLevel, &s.QRToken, &s.Photo, &s.IsActive, &s.CreatedAt,
	)

	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Student not found or inactive")
		return
	} else if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}

func CreateStudent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req views.CreateStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if err := utils.Validate.Struct(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Validation failed: Check required fields")
		return
	}

	fullName := req.FirstName + " " + req.LastName
	if req.MiddleName != nil && *req.MiddleName != "" {
		fullName = req.FirstName + " " + *req.MiddleName + " " + req.LastName
	}

	// Generate non-guessable QR Token
	qrToken := uuid.New().String()

	res, err := db.DB.Exec(`
		INSERT INTO students (school_id, last_name, first_name, middle_name, suffix, full_name, email, phone, course_id, year_level, qr_token) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		req.SchoolID, req.LastName, req.FirstName, req.MiddleName, req.Suffix, fullName, req.Email, req.Phone, req.CourseID, req.YearLevel, qrToken,
	)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			sendError(w, http.StatusConflict, "School ID or Email already exists")
			return
		}
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	id, _ := res.LastInsertId()
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id": id,
		"qrToken": qrToken,
	})
}

func UpdateStudent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	id, err := strconv.Atoi(parts[len(parts)-1])
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	var req views.UpdateStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if err := utils.Validate.Struct(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Validation failed")
		return
	}

	fullName := req.FirstName + " " + req.LastName
	if req.MiddleName != nil && *req.MiddleName != "" {
		fullName = req.FirstName + " " + *req.MiddleName + " " + req.LastName
	}

	_, err = db.DB.Exec(`
		UPDATE students SET last_name=?, first_name=?, middle_name=?, suffix=?, full_name=?, email=?, phone=?, course_id=?, year_level=?, is_active=COALESCE(?, is_active)
		WHERE id = ?`,
		req.LastName, req.FirstName, req.MiddleName, req.Suffix, fullName, req.Email, req.Phone, req.CourseID, req.YearLevel, req.IsActive, id,
	)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

func DeleteStudent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	id, err := strconv.Atoi(parts[len(parts)-1])
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	// Soft Delete: Deactivate the student and append a deletion marker to unique fields
	// so the school_id and email can be reused for new students.
	_, err = db.DB.Exec(`
		UPDATE students 
		SET is_active = false,
		    school_id = CONCAT(school_id, '-del-', UNIX_TIMESTAMP()),
		    email = CONCAT(email, '-del-', UNIX_TIMESTAMP())
		WHERE id = ?
	`, id)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}

func UploadStudentPhoto(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	// /api/admin/students/:id/photo
	id, err := strconv.Atoi(parts[len(parts)-2])
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid student ID")
		return
	}

	err = r.ParseMultipartForm(10 << 20) // 10 MB limit
	if err != nil {
		sendError(w, http.StatusBadRequest, "File too large")
		return
	}

	file, _, err := r.FormFile("photo")
	if err != nil {
		sendError(w, http.StatusBadRequest, "Missing 'photo' field in form")
		return
	}
	defer file.Close()

	// Magic Byte Check
	buffer := make([]byte, 512)
	_, err = file.Read(buffer)
	if err != nil && err != io.EOF {
		sendError(w, http.StatusInternalServerError, "Error reading file")
		return
	}

	contentType := http.DetectContentType(buffer)
	if contentType != "image/jpeg" && contentType != "image/png" {
		sendError(w, http.StatusUnsupportedMediaType, "Only JPEG and PNG are allowed")
		return
	}

	file.Seek(0, 0)

	ext := ".jpg"
	if contentType == "image/png" {
		ext = ".png"
	}

	filename := uuid.New().String() + ext
	
	if err := os.MkdirAll("uploads", os.ModePerm); err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create uploads directory")
		return
	}
	
	uploadPath := filepath.Join("uploads", filename)

	out, err := os.Create(uploadPath)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to copy file")
		return
	}

	dbPath := fmt.Sprintf("/uploads/%s", filename)
	_, err = db.DB.Exec(`UPDATE students SET photo = ? WHERE id = ?`, dbPath, id)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update database")
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "uploaded", "path": dbPath})
}
