package routes

import (
	"encoding/json"
	"net/http"
	"strings"

	"jblcf-b/internal/controllers"
	"jblcf-b/internal/db"
	"jblcf-b/internal/middleware"
	"jblcf-b/internal/models"
)

// RegisterRoutes sets up all the HTTP endpoints for the application.
func RegisterRoutes(mux *http.ServeMux) {
	// Public Routes
	mux.HandleFunc("/health", healthCheckHandler)
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	// Auth Routes (Rate Limited)
	mux.Handle("/api/auth/login", middleware.LoginRateLimiter(http.HandlerFunc(controllers.LoginHandler)))

	// Register Phase 8 routes
	
	// Superadmin group
	adminHandler := http.NewServeMux()
	adminHandler.HandleFunc("/api/admin/courses", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet { controllers.ListCourses(w, r) } else { controllers.CreateCourse(w, r) }
	})
	adminHandler.HandleFunc("/api/admin/courses/", controllers.UpdateCourse) // PUT /api/admin/courses/:id
	
	adminHandler.HandleFunc("/api/admin/students", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet { controllers.ListStudents(w, r) } else { controllers.CreateStudent(w, r) }
	})
	adminHandler.HandleFunc("/api/admin/students/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/photo") {
			controllers.UploadStudentPhoto(w, r)
		} else {
			if r.Method == http.MethodGet { controllers.GetStudent(w, r) }
			if r.Method == http.MethodPut { controllers.UpdateStudent(w, r) }
			if r.Method == http.MethodDelete { controllers.DeleteStudent(w, r) }
		}
	})

	adminHandler.HandleFunc("/api/admin/users", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet { controllers.ListUsers(w, r) } else { controllers.CreateUser(w, r) }
	})
	adminHandler.HandleFunc("/api/admin/users/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPut { controllers.UpdateUser(w, r) }
		if r.Method == http.MethodDelete { controllers.DeleteUser(w, r) }
	})

	adminHandler.HandleFunc("/api/admin/classes", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet { controllers.ListClasses(w, r) } else { controllers.CreateClass(w, r) }
	})
	adminHandler.HandleFunc("/api/admin/classes/", func(w http.ResponseWriter, r *http.Request) {
		// /api/admin/classes/:id/enrollments
		if strings.HasSuffix(r.URL.Path, "/enrollments") {
			if r.Method == http.MethodGet { controllers.ListEnrollments(w, r) }
			if r.Method == http.MethodPost { controllers.AddEnrollment(w, r) }
			return
		}
		// /api/admin/classes/:id/enrollments/:student_id
		if strings.Contains(r.URL.Path, "/enrollments/") {
			if r.Method == http.MethodDelete { controllers.RemoveEnrollment(w, r) }
			return
		}
		if r.Method == http.MethodPut { controllers.UpdateClass(w, r) }
		if r.Method == http.MethodDelete { controllers.DeleteClass(w, r) }
	})

	adminHandler.HandleFunc("/api/admin/stats", controllers.GetAdminDashboardStats)

	// Reports
	adminHandler.HandleFunc("/api/admin/reports/class", controllers.GetClassReport)
	adminHandler.HandleFunc("/api/admin/reports/student", controllers.GetStudentReport)

	// Attendance Delete
	adminHandler.HandleFunc("/api/admin/attendance", controllers.DeleteAttendanceRecord)
	adminHandler.HandleFunc("/api/admin/attendance/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			controllers.DeleteAttendanceRecord(w, r)
		} else {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.Handle("/api/admin/", middleware.RequireAuth(middleware.RequireRole(models.Superadmin)(adminHandler)))

	// Professor group
	profHandler := http.NewServeMux()
	profHandler.HandleFunc("/api/prof/classes", controllers.ListProfessorClasses)
	profHandler.HandleFunc("/api/prof/classes/", func(w http.ResponseWriter, r *http.Request) {
		// /api/prof/classes/:id/roster
		if strings.HasSuffix(r.URL.Path, "/roster") {
			if r.Method == http.MethodGet { controllers.GetClassRoster(w, r) }
			return
		}
	})
	
	// Scan endpoint (rate limited)
	profHandler.Handle("/api/prof/attendance/scan", middleware.RateLimitMiddleware(http.HandlerFunc(controllers.ScanQRCode)))

	// Approve endpoint (rate limited — prevents rapid-fire duplicate approval attempts)
	profHandler.Handle("/api/prof/attendance/approve", middleware.RateLimitMiddleware(http.HandlerFunc(controllers.ApproveAttendance)))
	profHandler.HandleFunc("/api/prof/attendance/class/", controllers.GetClassAttendance)

	// Delete attendance record
	profHandler.HandleFunc("/api/prof/attendance", controllers.DeleteAttendanceRecord)
	profHandler.HandleFunc("/api/prof/attendance/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			controllers.DeleteAttendanceRecord(w, r)
		} else {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})
	
	mux.Handle("/api/prof/", middleware.RequireAuth(middleware.RequireRole(models.Professor)(profHandler)))
}

// healthCheckHandler responds with a 200 OK if the server and DB are healthy.
func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	// Verify database connection
	if err := db.DB.Ping(); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "error",
			"error":  "Database connection failed",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"message": "Server and database are healthy",
	})
}
