package utils

import (
	"errors"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"jblcf-b/internal/config"
	"jblcf-b/internal/models"
)

var (
	ErrInvalidToken = errors.New("invalid or expired token")
	ErrMissingClaim = errors.New("missing required claims")
)

type Claims struct {
	UserID int         `json:"uid"`
	Role   models.Role `json:"role"`
	jwt.RegisteredClaims
}

// jwtSecret reads and validates the JWT_SECRET environment variable.
// It panics at startup if the secret is missing or is the well-known placeholder,
// preventing accidental deployment with an insecure key.
func jwtSecret() []byte {
	s := config.GetEnv("JWT_SECRET", "")
	if s == "" || s == "super-secret-key-change-me" {
		log.Fatal("FATAL: JWT_SECRET is not set or is still the default placeholder. " +
			"Set a strong random secret in your .env file before running the server.")
	}
	return []byte(s)
}

// GenerateToken creates a signed JWT for the given user ID and role, valid for 24 hours.
func GenerateToken(userID int, role models.Role) (string, error) {
	secret := jwtSecret()

	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "jblcf-b-attendance-system",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}

// ValidateToken parses and validates a JWT string, returning the embedded claims if successful.
func ValidateToken(tokenStr string) (*Claims, error) {
	secret := jwtSecret()

	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Ensure the signing method is HMAC
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return secret, nil
	})

	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, ErrMissingClaim
	}

	return claims, nil
}
