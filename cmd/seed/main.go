package main

import (
	"log"

	"jblcf-b/internal/config"
	"jblcf-b/internal/db"
	"jblcf-b/internal/utils"
)

func main() {
	config.LoadConfig()
	dbHost := config.GetEnv("DB_HOST", "127.0.0.1:3306")
	dbUser := config.GetEnv("DB_USER", "root")
	dbPassword := config.GetEnv("DB_PASSWORD", "")
	dbName := config.GetEnv("DB_NAME", "jblcf_attendance")
	db.ConnectDB(dbHost, dbUser, dbPassword, dbName)

	hash, _ := utils.HashPassword("password123")

	// Superadmin
	db.DB.Exec(`INSERT INTO users (full_name, email, password_hash, role) VALUES ('Admin Lacson', 'admin@jblcf.edu.ph', ?, 'superadmin')`, hash)
	
	// Professor
	res, _ := db.DB.Exec(`INSERT INTO users (full_name, email, password_hash, role) VALUES ('Professor Smith', 'prof@jblcf.edu.ph', ?, 'professor')`, hash)
	profID, _ := res.LastInsertId()

	// Seed Courses
	res, _ = db.DB.Exec(`INSERT INTO courses (code, name, description) VALUES ('BSMT', 'BS Marine Transportation', '')`)
	course1ID, _ := res.LastInsertId()
	db.DB.Exec(`INSERT INTO courses (code, name, description) VALUES ('BSMarE', 'BS Marine Engineering', '')`)
	
	// Seed Classes
	db.DB.Exec(`INSERT INTO classes (code, title, professor_id, course_id, schedule, room) VALUES ('NAV101', 'Navigation 1', ?, ?, 'Mon/Wed 9AM', 'Rm 101')`, profID, course1ID)

	log.Println("Database seeded successfully!")
}
