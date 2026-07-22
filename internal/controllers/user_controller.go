package controllers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"jblcf-b/internal/db"
	"jblcf-b/internal/models"
	"jblcf-b/internal/utils"
)

type CreateUserRequest struct {
	FullName string `json:"fullName" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	Role     string `json:"role" validate:"required,oneof=superadmin professor"`
	Phone    string `json:"phone"`
}

type UpdateUserRequest struct {
	FullName string `json:"fullName" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password"` // Optional
	Role     string `json:"role" validate:"required,oneof=superadmin professor"`
	Phone    string `json:"phone"`
	IsActive *bool  `json:"isActive" validate:"required"`
}

func ListUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.DB.Query(`
		SELECT id, full_name, email, role, phone, is_active, created_at 
		FROM users
		ORDER BY full_name
	`)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to fetch users")
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.FullName, &u.Email, &u.Role, &u.Phone, &u.IsActive, &u.CreatedAt); err != nil {
			continue
		}
		users = append(users, u)
	}

	if users == nil {
		users = []models.User{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if err := utils.Validate.Struct(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Validation failed")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	res, err := db.DB.Exec(`
		INSERT INTO users (full_name, email, password_hash, role, phone) 
		VALUES (?, ?, ?, ?, ?)`,
		req.FullName, req.Email, string(hash), req.Role, req.Phone,
	)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			sendError(w, http.StatusConflict, "Email already exists")
			return
		}
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	id, _ := res.LastInsertId()
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{"id": id})
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	id, err := strconv.Atoi(parts[len(parts)-1])
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if err := utils.Validate.Struct(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Validation failed")
		return
	}

	// Build dynamic query
	var query string
	var args []interface{}
	
	if req.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Failed to hash password")
			return
		}
		query = `UPDATE users SET full_name=?, email=?, password_hash=?, role=?, phone=?, is_active=? WHERE id=?`
		args = []interface{}{req.FullName, req.Email, string(hash), req.Role, req.Phone, *req.IsActive, id}
	} else {
		query = `UPDATE users SET full_name=?, email=?, role=?, phone=?, is_active=? WHERE id=?`
		args = []interface{}{req.FullName, req.Email, req.Role, req.Phone, *req.IsActive, id}
	}

	_, err = db.DB.Exec(query, args...)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			sendError(w, http.StatusConflict, "Email already exists")
			return
		}
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	id, err := strconv.Atoi(parts[len(parts)-1])
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Soft Delete
	_, err = db.DB.Exec(`UPDATE users SET is_active = false WHERE id = ?`, id)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Database error")
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})
}
