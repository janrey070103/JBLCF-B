package views

type CreateCourseRequest struct {
	Code        string  `json:"code" validate:"required"`
	Name        string  `json:"name" validate:"required"`
	Description *string `json:"description"`
}

type UpdateCourseRequest struct {
	Code        string  `json:"code" validate:"required"`
	Name        string  `json:"name" validate:"required"`
	Description *string `json:"description"`
}

type CreateStudentRequest struct {
	SchoolID   string  `json:"schoolId" validate:"required"`
	LastName   string  `json:"lastName" validate:"required"`
	FirstName  string  `json:"firstName" validate:"required"`
	MiddleName *string `json:"middleName"`
	Suffix     *string `json:"suffix"`
	Email      string  `json:"email" validate:"required,email"`
	Phone      *string `json:"phone"`
	CourseID   int     `json:"courseId" validate:"required,gt=0"`
	YearLevel  *int    `json:"yearLevel"`
}

type UpdateStudentRequest struct {
	LastName   string  `json:"lastName" validate:"required"`
	FirstName  string  `json:"firstName" validate:"required"`
	MiddleName *string `json:"middleName"`
	Suffix     *string `json:"suffix"`
	Email      string  `json:"email" validate:"required,email"`
	Phone      *string `json:"phone"`
	CourseID   int     `json:"courseId" validate:"required,gt=0"`
	YearLevel  *int    `json:"yearLevel"`
	IsActive   *bool   `json:"isActive"`
}
