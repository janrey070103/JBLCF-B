package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// LoadConfig reads the .env file.
func LoadConfig() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}
}

// GetEnv retrieves an environment variable or a default value.
func GetEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
