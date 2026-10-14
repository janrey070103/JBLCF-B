package controllers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"jblcf-b/internal/db"
)

type RecentActivityItem struct {
	ID          int    `json:"id"`
	ClassID     int    `json:"classId"`
	ClassCode   string `json:"classCode"`
	ClassTitle  string `json:"classTitle"`
	StudentID   int    `json:"studentId"`
	StudentName string `json:"studentName"`
	SchoolID    string `json:"schoolId"`
	Photo       string `json:"photo"`
	Status      string `json:"status"`
	Method      string `json:"method"`
	SessionDate string `json:"sessionDate"`
	ScannedAt   string `json:"scannedAt"`
	Note        string `json:"note"`
}

type DashboardStats struct {
	TotalStudents    int                  `json:"totalStudents"`
	TotalClasses     int                  `json:"totalClasses"`
	TotalProfessors  int                  `json:"totalProfessors"`
	TotalEnrollments int                  `json:"totalEnrollments"`
	TodayScans       int                  `json:"todayScans"`
	TotalScans       int                  `json:"totalScans"`
	RecentScans      int                  `json:"recentScans"` // for backward compatibility
	RecentActivity   []RecentActivityItem `json:"recentActivity"`
}

func GetAdminDashboardStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	stats := DashboardStats{
		RecentActivity: make([]RecentActivityItem, 0),
	}

	// Total Active Students
	_ = db.DB.QueryRow(`SELECT COUNT(*) FROM students WHERE is_active = true`).Scan(&stats.TotalStudents)

	// Total Classes
	_ = db.DB.QueryRow(`SELECT COUNT(*) FROM classes`).Scan(&stats.TotalClasses)

	// Total Active Professors
	_ = db.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE role = 'professor' AND is_active = true`).Scan(&stats.TotalProfessors)

	// Total Enrollments across all classes
	_ = db.DB.QueryRow(`SELECT COUNT(*) FROM class_enrollments`).Scan(&stats.TotalEnrollments)

	// Philippine Standard Time (UTC+8)
	manilaZone := time.FixedZone("Asia/Manila", 8*3600)
	nowInManila := time.Now().In(manilaZone)
	todayStr := nowInManila.Format("2006-01-02")

	// Today's Scans (matching session_date or scanned_at falling on today)
	_ = db.DB.QueryRow(`
		SELECT COUNT(*) 
		FROM attendance_records 
		WHERE session_date = ? 
		   OR DATE(COALESCE(scanned_at, session_date)) = ?
	`, todayStr, todayStr).Scan(&stats.TodayScans)

	// Total All-Time Attendance Records
	_ = db.DB.QueryRow(`SELECT COUNT(*) FROM attendance_records`).Scan(&stats.TotalScans)

	// Backward compatibility for existing frontends
	stats.RecentScans = stats.TodayScans

	// Fetch Recent Activity (latest scans/events across all classes)
	rows, err := db.DB.Query(`
		SELECT 
			ar.id, 
			ar.class_id, 
			COALESCE(c.code, 'N/A') AS class_code, 
			COALESCE(c.title, 'Class') AS class_title,
			ar.student_id, 
			COALESCE(s.full_name, 'Unknown Student') AS student_name, 
			COALESCE(s.school_id, '') AS school_id,
			COALESCE(s.photo, '') AS photo,
			ar.status, 
			COALESCE(ar.method, 'qr_scan') AS method,
			ar.session_date, 
			ar.scanned_at,
			COALESCE(ar.note, '') AS note
		FROM attendance_records ar
		LEFT JOIN students s ON ar.student_id = s.id
		LEFT JOIN classes c ON ar.class_id = c.id
		ORDER BY ar.id DESC
		LIMIT 20
	`)

	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var item RecentActivityItem
			var sessionDate string
			var scannedAt sql.NullTime

			if scanErr := rows.Scan(
				&item.ID,
				&item.ClassID,
				&item.ClassCode,
				&item.ClassTitle,
				&item.StudentID,
				&item.StudentName,
				&item.SchoolID,
				&item.Photo,
				&item.Status,
				&item.Method,
				&sessionDate,
				&scannedAt,
				&item.Note,
			); scanErr == nil {
				item.SessionDate = sessionDate
				if scannedAt.Valid {
					item.ScannedAt = scannedAt.Time.In(manilaZone).Format(time.RFC3339)
				} else {
					item.ScannedAt = sessionDate
				}
				stats.RecentActivity = append(stats.RecentActivity, item)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
