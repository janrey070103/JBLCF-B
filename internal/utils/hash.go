package utils

import (
	"golang.org/x/crypto/bcrypt"
)

// HashPassword generates a bcrypt hash of the given password with cost 12.
func HashPassword(password string) (string, error) {
	// Cost 12 takes approx 200-300ms on modern hardware, providing good security against brute force.
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(bytes), err
}

// CheckPasswordHash compares a raw password against a bcrypt hash in constant time.
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
