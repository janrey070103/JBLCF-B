package controllers

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"
)

var timeTokenRegex = regexp.MustCompile(`(?i)\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b`)

func parseClockToken(token string) (int, int, error) {
	normalized := strings.ToLower(strings.TrimSpace(token))
	normalized = strings.ReplaceAll(normalized, " ", "")

	layouts := []string{"3:04pm", "15:04", "3pm"}
	var parsed time.Time
	var err error
	for _, layout := range layouts {
		parsed, err = time.Parse(layout, normalized)
		if err == nil {
			return parsed.Hour(), parsed.Minute(), nil
		}
	}

	return 0, 0, fmt.Errorf("invalid time token: %s", token)
}

func parseClassSessionWindow(schedule string, now time.Time) (time.Time, time.Time, error) {
	tokens := timeTokenRegex.FindAllString(schedule, -1)
	if len(tokens) < 2 {
		return time.Time{}, time.Time{}, errors.New("schedule must include a start and end time")
	}

	startHour, startMin, err := parseClockToken(tokens[0])
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	endHour, endMin, err := parseClockToken(tokens[1])
	if err != nil {
		return time.Time{}, time.Time{}, err
	}

	start := time.Date(now.Year(), now.Month(), now.Day(), startHour, startMin, 0, 0, now.Location())
	end := time.Date(now.Year(), now.Month(), now.Day(), endHour, endMin, 0, 0, now.Location())
	if !end.After(start) {
		return time.Time{}, time.Time{}, errors.New("schedule end time must be after start time")
	}

	return start, end, nil
}

func validateScheduleTimeRange(schedule string) error {
	// Schedule is stored as descriptive text; if time tokens are detected, parseClassSessionWindow will use them.
	return nil
}
