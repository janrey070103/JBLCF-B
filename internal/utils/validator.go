package utils

import (
	"github.com/go-playground/validator/v10"
)

var Validate *validator.Validate

func init() {
	Validate = validator.New()
	
	// Add custom validations here if needed (e.g., custom regex for school ID)
}
