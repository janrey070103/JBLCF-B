package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"strconv"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var (
	visitors = make(map[string]*visitor)
	mu       sync.Mutex
)

// Background cleanup routine to prevent memory leaks from inactive IPs/emails.
func init() {
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			mu.Lock()
			for k, v := range visitors {
				if time.Since(v.lastSeen) > 15*time.Minute {
					delete(visitors, k)
				}
			}
			mu.Unlock()
		}
	}()
}

func getVisitor(identifier string) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	v, exists := visitors[identifier]
	if !exists {
		// Limit to 5 attempts per 15 minutes.
		// rate.Limit is events per second. 5 events / 900 seconds.
		limit := rate.Every(15 * time.Minute / 5)
		limiter := rate.NewLimiter(limit, 5)
		visitors[identifier] = &visitor{limiter, time.Now()}
		return limiter
	}

	v.lastSeen = time.Now()
	return v.limiter
}

// LoginRateLimiter limits login attempts per IP AND per Email.
// It returns a 429 Retry-After response when limits are hit.
func LoginRateLimiter(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. IP-based limiting
		ip, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			ip = r.RemoteAddr
		}
		ipLimiter := getVisitor("ip:" + ip)
		
		// We use Reserve to find out how long until we can proceed, but if it's not immediate, we block.
		if !ipLimiter.Allow() {
			rejectRateLimit(w)
			return
		}

		// 2. Email-based limiting (Read body, then restore it)
		bodyBytes, err := io.ReadAll(r.Body)
		if err == nil {
			r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
			var payload struct {
				Email string `json:"email"`
			}
			if err := json.Unmarshal(bodyBytes, &payload); err == nil && payload.Email != "" {
				emailLimiter := getVisitor("email:" + payload.Email)
				if !emailLimiter.Allow() {
					rejectRateLimit(w)
					return
				}
			}
		} else {
			r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
		}

		next.ServeHTTP(w, r)
	})
}

func rejectRateLimit(w http.ResponseWriter) {
	w.Header().Set("Retry-After", strconv.Itoa(15*60)) // 15 minutes in seconds
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusTooManyRequests)
	json.NewEncoder(w).Encode(map[string]string{
		"error": "Too many requests. Please try again later.",
	})
}

// RateLimitMiddleware is an alias for LoginRateLimiter for use on non-login
// sensitive endpoints (scan, approve) that share the same IP-based strategy.
var RateLimitMiddleware = LoginRateLimiter
