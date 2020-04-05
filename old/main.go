package main

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/getsentry/sentry-go"
	"github.com/joho/godotenv"
)

func main() {
	if os.Getenv("APP_ENV") != "production" {
		if err := godotenv.Load(); err != nil {
			log.Fatalf("Error loading .env file: %v\n", err)
		}
	}

	err := sentry.Init(sentry.ClientOptions{
		Dsn: os.Getenv("SENTRY_DSN"),
	})
	if err != nil {
		log.Fatalf("sentry.Init: %s", err)
	}
	defer sentry.Flush(2 * time.Second)

	s := new(Server)
	if err := s.Initialize(
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
	); err != nil {
		log.Fatalf("Error initializing server %v\n", err)
	}

	address := fmt.Sprintf(":%s", os.Getenv("PORT"))
	origins := strings.Split(os.Getenv("ORIGIN"), ",")
	s.Run(address, origins)
}
