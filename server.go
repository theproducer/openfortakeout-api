package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"github.com/rs/cors"
	"github.com/theproducer/openfortakeout_api/restaurants"
	"github.com/theproducer/openfortakeout_api/services"
)

type Server struct {
	Router *mux.Router
	DB     *sqlx.DB
}

func (s *Server) Initialize(user, password, dbName, host, port string) error {
	dsn := fmt.Sprintf("host=%s port=%s user=%s dbname=%s password=%s sslmode=disable", host, port, user, dbName, password)
	db, err := sqlx.Open("postgres", dsn)
	if err != nil {
		return err
	}

	if err := s.RunMigrations(db.DB, dbName); err != nil {
		return err
	}

	s.DB = db
	s.Router = mux.NewRouter()

	s.Router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("API OK"))
		return
	}).Methods("GET")

	re := services.RestaurantEntity{
		DB: s.DB,
	}

	geocoder := services.GeocodioService{
		APIKey: os.Getenv("GEOCODIO_APIKEY"),
		DB:     s.DB,
	}

	restaurants.NewController(s.Router, re, geocoder)

	return nil
}

func (s *Server) RunMigrations(db *sql.DB, dbName string) error {
	driver, err := postgres.WithInstance(db, &postgres.Config{
		DatabaseName: dbName,
		SchemaName:   "public",
	})
	if err != nil {
		return err
	}

	m, err := migrate.NewWithDatabaseInstance(os.Getenv("MIGRATIONS"), dbName, driver)
	if err != nil {
		return err
	}

	if err := m.Up(); err != nil {
		if err != migrate.ErrNoChange {
			return err
		}
	}

	return nil
}

func (s *Server) Run(addr, origin string) {
	c := cors.New(cors.Options{
		AllowedOrigins: []string{origin},
		AllowedHeaders: []string{"X-Requested-With", "Content-Type", "Authorization"},
		AllowedMethods: []string{"GET", "HEAD", "POST", "PUT", "OPTIONS", "DELETE"},
		Debug:          true,
	})

	serverHandler := c.Handler(s.Router)
	loggedHandler := handlers.LoggingHandler(os.Stdout, serverHandler)

	log.Printf("Starting server at %v\n", addr)
	log.Fatal(http.ListenAndServe(addr, loggedHandler))
}
