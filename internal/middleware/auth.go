package middleware

import (
	"context"
	"net/http"
	"strings"
	"encoding/json"

	"jblcf-b/internal/models"
	"jblcf-b/internal/utils"
)

type contextKey string

const UserContextKey = contextKey("userClaims")

// RequireAuth validates the JWT token in the Authorization header.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Unauthorized: missing token", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Unauthorized: invalid token format", http.StatusUnauthorized)
			return
		}

		claims, err := utils.ValidateToken(parts[1])
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole ensures the authenticated user has the specified role.
// Must be used after RequireAuth.
func RequireRole(role models.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserContextKey).(*utils.Claims)
			if !ok {
				http.Error(w, "Unauthorized: missing user context", http.StatusUnauthorized)
				return
			}

			if claims.Role != role {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusForbidden)
				json.NewEncoder(w).Encode(map[string]string{"error": "Forbidden: insufficient permissions"})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
