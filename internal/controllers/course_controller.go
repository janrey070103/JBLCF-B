package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"jblcf-b/internal/db"
	"jblcf-b/internal/models"
	"jblcf-b/internal/utils"
	"jblcf-b/internal/views"
)

func ListCourses(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.DB.Query(`SELECT id, code, name, description FROM courses`)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch courses")
		return
	}
	defer rows.Close()

	var courses []models.Course
	for rows.Next() {
		var c models.Course
		if err := rows.Scan(&c.ID, &c.Code, &c.Name, &c.Description); err != nil {
			continue
		}
		courses = append(courses, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(courses)
}

func CreateCourse(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req views.CreateCourseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if err := utils.Validate.Struct(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Validation failed")
		return
	}

	res, err := db.DB.Exec(
		`INSERT INTO courses (code, name, description) VALUES (?, ?, ?)`,
		req.Code, req.Name, req.Description,
	)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			sendError(w, http.StatusConflict, "Course code already exists")
			return
		}
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	id, _ := res.LastInsertId()
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int64{"id": id})
}

func UpdateCourse(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse ID from URL path: /api/admin/courses/{id}
	parts := strings.Split(r.URL.Path, "/")
	idStr := parts[len(parts)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid course ID")
		return
	}

	var req views.UpdateCourseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if err := utils.Validate.Struct(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Validation failed")
		return
	}

	_, err = db.DB.Exec(
		`UPDATE courses SET code = ?, name = ?, description = ? WHERE id = ?`,
		req.Code, req.Name, req.Description, id,
	)
	if err == sql.ErrNoRows {
		sendError(w, http.StatusNotFound, "Course not found")
		return
	} else if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}
