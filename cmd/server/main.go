package main

import (
	"fmt"
	"log"
	"net/http"

	"jblcf-b/internal/config"
	"jblcf-b/internal/db"
	"jblcf-b/internal/middleware"
	"jblcf-b/internal/routes"
)

func main() {
	// 1. Load environment variables
	config.LoadConfig()

	// 2. Read database configuration
	dbHost := config.GetEnv("DB_HOST", "127.0.0.1:3306")
	dbUser := config.GetEnv("DB_USER", "root")
	dbPassword := config.GetEnv("DB_PASSWORD", "")
	dbName := config.GetEnv("DB_NAME", "jblcf_attendance")

	// 3. Connect to the database
	db.ConnectDB(dbHost, dbUser, dbPassword, dbName)

	// 4. Setup HTTP multiplexer and register routes
	mux := http.NewServeMux()
	routes.RegisterRoutes(mux)

	// Serve uploaded student photos as static files.
	// Files are stored at ./uploads/<filename> on disk and the DB stores /uploads/<filename>.
	// This handler makes GET /uploads/<filename> return the file so the browser can display it.
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	// 5. Start the server, wrapped with CORS middleware.
	// Allowed origins are read from CORS_ALLOWED_ORIGINS in .env.
	port := config.GetEnv("SERVER_PORT", "8080")
	addr := fmt.Sprintf(":%s", port)

	log.Printf("Server starting on port %s...\n", port)
	if err := http.ListenAndServe(addr, middleware.CORSMiddleware(mux)); err != nil {
		log.Fatalf("Server failed to start: %v\n", err)
	}
}
