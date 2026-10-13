package middleware

import (
	"net/http"
	"os"
	"strings"
)

// CORSMiddleware adds cross-origin headers to every response.
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if origin != "" && isOriginAllowed(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")

			reqHeaders := r.Header.Get("Access-Control-Request-Headers")
			if reqHeaders != "" {
				w.Header().Set("Access-Control-Allow-Headers", reqHeaders)
			} else {
				w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token, X-Requested-With")
			}

			w.Header().Set("Access-Control-Max-Age", "86400")
			w.Header().Add("Vary", "Origin")
			w.Header().Add("Vary", "Access-Control-Request-Method")
			w.Header().Add("Vary", "Access-Control-Request-Headers")
		}

		// Handle preflight OPTIONS request.
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func isOriginAllowed(origin string) bool {
	rawOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	// If not configured, or set to wildcard "*", allow all origins
	if rawOrigins == "" || rawOrigins == "*" {
		return true
	}

	cleanOrigin := strings.TrimRight(strings.ToLower(origin), "/")

	// Automatically allow local development and vercel deployments
	if cleanOrigin == "http://localhost:5173" ||
		cleanOrigin == "http://localhost:3000" ||
		cleanOrigin == "http://127.0.0.1:5173" ||
		cleanOrigin == "http://127.0.0.1:3000" ||
		strings.HasSuffix(cleanOrigin, ".vercel.app") {
		return true
	}

	// Check against comma-separated list
	for _, o := range strings.Split(rawOrigins, ",") {
		o = strings.TrimRight(strings.TrimSpace(strings.ToLower(o)), "/")
		if o == "*" || o == cleanOrigin {
			return true
		}
	}

	return false
}
