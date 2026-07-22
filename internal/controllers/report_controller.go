package controllers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"jblcf-b/internal/db"
)

type ClassReportRow struct {
	SessionDate string `json:"sessionDate"`
	StudentName string `json:"studentName"`
	Status      string `json:"status"`
	Method      string `json:"method"`
	Note        string `json:"note"`
}

type StudentReportRow struct {
	SessionDate string `json:"sessionDate"`
	ClassCode   string `json:"classCode"`
	Status      string `json:"status"`
	Method      string `json:"method"`
	Note        string `json:"note"`
}

func GetClassReport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	q := r.URL.Query()
	classIdStr := q.Get("classId")
	startDate := q.Get("startDate")
	endDate := q.Get("endDate")

	if classIdStr == "" || startDate == "" || endDate == "" {
		sendError(w, http.StatusBadRequest, "classId, startDate, and endDate are required")
		return
	}

	classId, err := strconv.Atoi(classIdStr)
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid classId")
		return
	}

	rows, err := db.DB.Query(`
		SELECT ar.session_date, s.full_name, ar.status, COALESCE(ar.method, ''), COALESCE(ar.note, '')
		FROM attendance_records ar
		JOIN students s ON ar.student_id = s.id
		WHERE ar.class_id = ? AND ar.session_date BETWEEN ? AND ?
		ORDER BY ar.session_date DESC, s.last_name, s.first_name
	`, classId, startDate, endDate)

	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to generate report")
		return
	}
	defer rows.Close()

	var report []ClassReportRow
	for rows.Next() {
		var row ClassReportRow
		if err := rows.Scan(&row.SessionDate, &row.StudentName, &row.Status, &row.Method, &row.Note); err == nil {
			report = append(report, row)
		}
	}

	if report == nil {
		report = []ClassReportRow{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(report)
}

func GetStudentReport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	studentIdStr := r.URL.Query().Get("studentId")
	if studentIdStr == "" {
		sendError(w, http.StatusBadRequest, "studentId is required")
		return
	}

	studentId, err := strconv.Atoi(studentIdStr)
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid studentId")
		return
	}

	rows, err := db.DB.Query(`
		SELECT ar.session_date, c.code, ar.status, COALESCE(ar.method, ''), COALESCE(ar.note, '')
		FROM attendance_records ar
		JOIN classes c ON ar.class_id = c.id
		WHERE ar.student_id = ?
		ORDER BY ar.session_date DESC
	`, studentId)

	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to generate report")
		return
	}
	defer rows.Close()

	var report []StudentReportRow
	for rows.Next() {
		var row StudentReportRow
		if err := rows.Scan(&row.SessionDate, &row.ClassCode, &row.Status, &row.Method, &row.Note); err == nil {
			report = append(report, row)
		}
	}

	if report == nil {
		report = []StudentReportRow{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(report)
}
