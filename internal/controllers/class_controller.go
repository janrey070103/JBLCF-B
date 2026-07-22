package controllers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"jblcf-b/internal/db"
	"jblcf-b/internal/utils"
)

type ClassResponse struct {
	ID            int    `json:"id"`
	Code          string `json:"code"`
	Title         string `json:"title"`
	ProfessorID   int    `json:"professorId"`
	ProfessorName string `json:"professorName"`
	CourseID      int    `json:"courseId"`
	CourseCode    string `json:"courseCode"`
	Schedule      string `json:"schedule"`
	Room          string `json:"room"`
}

type CreateClassRequest struct {
	Code        string `json:"code" validate:"required"`
	Title       string `json:"title" validate:"required"`
	ProfessorID int    `json:"professorId" validate:"required"`
	CourseID    int    `json:"courseId" validate:"required"`
	Schedule    string `json:"schedule" validate:"required"`
	Room        string `json:"room"`
}

type UpdateClassRequest struct {
	Code        string `json:"code" validate:"required"`
	Title       string `json:"title" validate:"required"`
	ProfessorID int    `json:"professorId" validate:"required"`
	CourseID    int    `json:"courseId" validate:"required"`
	Schedule    string `json:"schedule" validate:"required"`
	Room        string `json:"room"`
}

func ListClasses(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.DB.Query(`
		SELECT 
			c.id, c.code, c.title, c.professor_id, u.full_name, c.course_id, co.code, c.schedule, c.room
		FROM classes c
		JOIN users u ON c.professor_id = u.id
		JOIN courses co ON c.course_id = co.id
		ORDER BY c.code
	`)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch classes")
		return
	}
	defer rows.Close()

	var classes []ClassResponse
	for rows.Next() {
		var c ClassResponse
		if err := rows.Scan(&c.ID, &c.Code, &c.Title, &c.ProfessorID, &c.ProfessorName, &c.CourseID, &c.CourseCode, &c.Schedule, &c.Room); err != nil {
			continue
		}
		classes = append(classes, c)
	}

	if classes == nil {
		classes = []ClassResponse{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(classes)
}

func CreateClass(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateClassRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if err := utils.Validate.Struct(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Validation failed")
		return
	}

	res, err := db.DB.Exec(`
		INSERT INTO classes (code, title, professor_id, course_id, schedule, room) 
		VALUES (?, ?, ?, ?, ?, ?)`,
		req.Code, req.Title, req.ProfessorID, req.CourseID, req.Schedule, req.Room,
	)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			sendError(w, http.StatusConflict, "Class code already exists")
			return
		}
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	id, _ := res.LastInsertId()
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"id": id})
}

func UpdateClass(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	id, err := strconv.Atoi(parts[len(parts)-1])
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid class ID")
		return
	}

	var req UpdateClassRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if err := utils.Validate.Struct(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Validation failed")
		return
	}

	_, err = db.DB.Exec(`
		UPDATE classes SET code=?, title=?, professor_id=?, course_id=?, schedule=?, room=? WHERE id=?`,
		req.Code, req.Title, req.ProfessorID, req.CourseID, req.Schedule, req.Room, id,
	)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			sendError(w, http.StatusConflict, "Class code already exists")
			return
		}
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

func DeleteClass(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	id, err := strconv.Atoi(parts[len(parts)-1])
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid class ID")
		return
	}

	// Wait, deleting a class might fail if attendance records depend on it (RESTRICT/CASCADE).
	// The schema uses ON DELETE CASCADE for attendance_records.
	_, err = db.DB.Exec(`DELETE FROM classes WHERE id = ?`, id)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error: Cannot delete class")
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}
