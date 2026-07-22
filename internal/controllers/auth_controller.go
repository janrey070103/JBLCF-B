package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"jblcf-b/internal/db"
	"jblcf-b/internal/models"
	"jblcf-b/internal/utils"
	"jblcf-b/internal/views"
)

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req views.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Boundary Input Validation
	if err := utils.Validate.Struct(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Validation failed: please provide a valid email and password")
		return
	}

	// Parameterized Query to prevent SQL injection
	query := `SELECT id, full_name, email, password_hash, role, phone, is_active, created_at 
	          FROM users WHERE email = ?`

	var user models.User
	var hash string

	err := db.DB.QueryRow(query, req.Email).Scan(
		&user.ID,
		&user.FullName,
		&user.Email,
		&hash,
		&user.Role,
		&user.Phone,
		&user.IsActive,
		&user.CreatedAt,
	)

	if err == sql.ErrNoRows {
		sendError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	} else if err != nil {
		sendError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	if !user.IsActive {
		sendError(w, http.StatusForbidden, "Account is disabled")
		return
	}

	// Constant-time password comparison via bcrypt
	if !utils.CheckPasswordHash(req.Password, hash) {
		sendError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Issue JWT
	token, err := utils.GenerateToken(user.ID, user.Role)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	resp := views.LoginResponse{
		Token: token,
		User:  user,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

func sendError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
