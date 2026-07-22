package models

import "time"

type Role string

const (
	Superadmin Role = "superadmin"
	Professor  Role = "professor"
)

type User struct {
	ID        int       `json:"id"`
	FullName  string    `json:"fullName"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	Role      Role      `json:"role"`
	Phone     *string   `json:"phone,omitempty"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
}

type Course struct {
	ID          int     `json:"id"`
	Code        string  `json:"code"`
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

type Student struct {
	ID         int       `json:"id"`
	SchoolID   string    `json:"schoolId"`
	LastName   string    `json:"lastName"`
	FirstName  string    `json:"firstName"`
	MiddleName *string   `json:"middleName,omitempty"`
	Suffix     *string   `json:"suffix,omitempty"`
	FullName   string    `json:"fullName"`
	Email      string    `json:"email"`
	Phone      *string   `json:"phone,omitempty"`
	CourseID   int       `json:"courseId"`
	YearLevel  *int      `json:"yearLevel,omitempty"`
	QRToken    string    `json:"qrToken"`
	Photo      *string   `json:"photo,omitempty"`
	IsActive   bool      `json:"isActive"`
	CreatedAt  time.Time `json:"createdAt"`
}

type Class struct {
	ID          int     `json:"id"`
	Code        string  `json:"code"`
	Title       string  `json:"title"`
	ProfessorID int     `json:"professorId"`
	CourseID    int     `json:"courseId"`
	Schedule    string  `json:"schedule"`
	Room        *string `json:"room,omitempty"`
}

type AttendanceStatus string

const (
	Present AttendanceStatus = "present"
	Late    AttendanceStatus = "late"
	Absent  AttendanceStatus = "absent"
	Excused AttendanceStatus = "excused"
)

type AttendanceRecord struct {
	ID             int              `json:"id"`
	ClassID        int              `json:"classId"`
	StudentID      int              `json:"studentId"`
	Date           string           `json:"date"`
	Status         AttendanceStatus `json:"status"`
	Method         *string          `json:"method,omitempty"`
	ScannedAt      *time.Time       `json:"scannedAt,omitempty"`
	Note           *string          `json:"note,omitempty"`
	ApprovalStatus bool             `json:"approvalStatus"`
}
