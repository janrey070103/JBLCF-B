package middleware

import (
	"net/http"
	"os"
	"strings"
)

// CORSMiddleware adds cross-origin headers to every response.
//
// Allowed origins: controlled via the CORS_ALLOWED_ORIGINS environment
// variable as a comma-separated list (e.g. "http://localhost:5173").
// If the variable is not set, the server defaults to allowing only the
// same origin (no header is emitted), which is safe for production.
//
// This is NOT a wildcard CORS policy. Each request's Origin header is
// checked against the allow-list, so only listed origins gain access to
// authenticated endpoints.
func CORSMiddleware(next http.Handler) http.Handler {
	// Parse allow-list once at startup.
	rawOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	allowed := map[string]bool{}
	for _, o := range strings.Split(rawOrigins, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			allowed[o] = true
		}
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if origin != "" && allowed[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
			// Cache preflight for 10 minutes.
			w.Header().Set("Access-Control-Max-Age", "600")
		}

		// Handle preflight OPTIONS request.
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
