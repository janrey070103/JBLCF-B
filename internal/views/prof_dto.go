package views

import (
	"jblcf-b/internal/models"
)

type ScanQRRequest struct {
	QRToken string `json:"qrToken" validate:"required"`
}

type ApproveAttendanceRequest struct {
	StudentID int `json:"studentId" validate:"required,gt=0"`
	ClassID   int `json:"classId" validate:"required,gt=0"`
	// Date is intentionally omitted from the client payload.
	// Session date is determined exclusively by the server at time of approval
	// to prevent backdating or future-dating via a manipulated client clock.
}

type StudentScanResponse struct {
	models.Student
	Course *models.Course `json:"course,omitempty"`
}

type AttendanceRecordResponse struct {
	models.AttendanceRecord
	Student *models.Student `json:"student,omitempty"`
	Course  *models.Course  `json:"course,omitempty"`
}
