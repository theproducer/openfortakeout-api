package services

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"time"

	"github.com/getsentry/sentry-go"
	"github.com/jmoiron/sqlx"
	"github.com/theproducer/openfortakeout_api/models"
)

type RestaurantEntity struct {
	DB *sqlx.DB
}

func (e RestaurantEntity) CreateRestaurant(newRestaurant models.Restaurant) (*uint, error) {
	now := time.Now()

	insert := `INSERT INTO restaurants (
		name,
		email,
		phone,
		details,
		hours,
		url,
		address,
		address2,
		city,
		state,
		zipcode,
		location,
		donate_url,
		giftcard,		
		is_active,
		created_at,
		updated_at
	) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ST_POINT($12, $13), $14, $15, $16, $17, $18) RETURNING id`

	var newID uint

	err := e.DB.QueryRow(
		insert,
		newRestaurant.Name,
		newRestaurant.Email,
		newRestaurant.Phone,
		newRestaurant.Details,
		newRestaurant.Hours,
		newRestaurant.URL,
		newRestaurant.Address,
		newRestaurant.Address2,
		newRestaurant.City,
		newRestaurant.State,
		newRestaurant.Zipcode,
		newRestaurant.LatLng.Lng,
		newRestaurant.LatLng.Lat,
		newRestaurant.DonateURL,
		newRestaurant.HasGiftCard,
		newRestaurant.IsActive,
		now,
		now,
	).Scan(&newID)

	if err != nil {
		return nil, err
	}

	e.CreateRestaurantMsg(newRestaurant)

	return &newID, nil
}

func (e RestaurantEntity) GetRestaurants(lat *float64, lng *float64) (*[]models.Restaurant, error) {
	var rows *sqlx.Rows
	var err error

	fmt.Printf("%v, %v\n", *lat, *lng)

	if *lat != 0.00 && *lng != 0.00 {
		// default search within 30 mi
		query := `SELECT * FROM restaurants WHERE ST_DWithin(ST_POINT($1, $2)::geography, location, 48280.32) AND deleted_at IS null AND is_active IS TRUE`
		rows, err = e.DB.Queryx(query, lng, lat)
		if err != nil {
			return nil, err
		}
	} else {
		query := `SELECT * FROM restaurants WHERE deleted_at IS null AND is_active IS TRUE`
		rows, err = e.DB.Queryx(query)
		if err != nil {
			return nil, err
		}
	}

	restaurants := []models.Restaurant{}

	for rows.Next() {
		var r models.Restaurant
		err := rows.StructScan(&r)
		if err != nil {
			return nil, err
		}
		restaurants = append(restaurants, r)
	}

	return &restaurants, nil
}

func (e RestaurantEntity) GetRestaurant(id uint) (*models.Restaurant, error) {
	query := `SELECT * FROM restaurants WHERE id = $1`
	row := e.DB.QueryRowx(query, id)
	var r models.Restaurant
	err := row.StructScan(&r)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &r, nil
}

func (e RestaurantEntity) CreateRestaurantMsg(restaurant models.Restaurant) {
	msg := models.RestaurantMsg{
		Text: fmt.Sprintf("%s from %s, %s has been added", restaurant.Name, restaurant.City, restaurant.State),
	}

	payload, _ := json.Marshal(msg)

	webhookURL := os.Getenv("SLACK_WEBHOOK_URL")
	resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		sentry.CaptureException(fmt.Errorf("Slack Integration: %v", err))
	}

	if resp.StatusCode != 200 || resp.StatusCode != 201 {
		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			sentry.CaptureException(fmt.Errorf("Slack Integration: %v", err))
		}
		// do something with the error silently
		sentry.CaptureException(fmt.Errorf("Slack Integration: %v", string(body)))
	}
}
