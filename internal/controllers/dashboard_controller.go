package controllers

import (
	"encoding/json"
	"net/http"

	"jblcf-b/internal/db"
)

type DashboardStats struct {
	TotalStudents   int `json:"totalStudents"`
	TotalClasses    int `json:"totalClasses"`
	TotalProfessors int `json:"totalProfessors"`
	RecentScans     int `json:"recentScans"`
}

func GetAdminDashboardStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var stats DashboardStats

	// Total Active Students
	db.DB.QueryRow(`SELECT COUNT(*) FROM students WHERE is_active = true`).Scan(&stats.TotalStudents)

	// Total Classes
	db.DB.QueryRow(`SELECT COUNT(*) FROM classes`).Scan(&stats.TotalClasses)

	// Total Active Professors
	db.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE role = 'professor' AND is_active = true`).Scan(&stats.TotalProfessors)

	// Recent Scans (Attendance records created today)
	db.DB.QueryRow(`SELECT COUNT(*) FROM attendance_records WHERE DATE(scanned_at) = CURDATE()`).Scan(&stats.RecentScans)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
