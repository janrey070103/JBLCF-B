package db

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"jblcf-b/internal/config"
)

var DB *sql.DB

// ConnectDB initializes the MySQL connection pool.
func ConnectDB(host, user, password, dbname string) {
	var err error
	
	// Support direct DSN or DATABASE_URL if provided
	dsn := config.GetEnv("DATABASE_URL", config.GetEnv("DB_DSN", ""))
	if dsn == "" {
		tlsParam := ""
		if config.GetEnv("DB_SSL", "false") == "true" {
			tlsParam = "&tls=true"
		}
		dsn = fmt.Sprintf("%s:%s@tcp(%s)/%s?parseTime=true%s", user, password, host, dbname, tlsParam)
	}

	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Error opening database connection: %v\n", err)
	}

	// Sane defaults for connection pool
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(25)
	DB.SetConnMaxLifetime(5 * time.Minute)

	if err = DB.Ping(); err != nil {
		log.Fatalf("Error pinging database: %v\n", err)
	}

	log.Println("Successfully connected to MySQL database!")
}
