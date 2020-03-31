package services

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
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

	insert := `INSERT INTO businesses (
		name,
		type,
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
	) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, ST_POINT($13, $14), $15, $16, $17, $18, $19) RETURNING id`

	var newID uint

	err := e.DB.QueryRow(
		insert,
		newRestaurant.Name,
		newRestaurant.Type,
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

	if &newID != nil {
		newIDStr := strconv.Itoa(int(newID))
		e.CreateRestaurantMsg(newRestaurant, newIDStr)
	}

	return &newID, nil
}

func (e RestaurantEntity) ApproveRestaurant(restaurantID uint) (*models.Restaurant, error) {
	now := time.Now()

	update := `UPDATE businesses SET is_active = TRUE, updated_at = $1 WHERE id = $2`
	err := e.DB.QueryRowx(update, now, restaurantID).Err()
	if err != nil {
		return nil, err
	}

	return e.GetRestaurant(restaurantID)
}

func (e RestaurantEntity) GetRestaurants(lat *float64, lng *float64) (*[]models.Restaurant, error) {
	var rows *sqlx.Rows
	var err error

	fmt.Printf("%v, %v\n", *lat, *lng)

	if *lat != 0.00 && *lng != 0.00 {
		// default search within 30 mi
		query := `SELECT *, ST_AsText(location) as location FROM businesses WHERE ST_DWithin(ST_POINT($1, $2)::geography, location, 48280.32) AND deleted_at IS null AND is_active IS TRUE ORDER BY name ASC`
		rows, err = e.DB.Queryx(query, lng, lat)
		if err != nil {
			return nil, err
		}
	} else {
		query := `SELECT *, ST_AsText(location) as location FROM businesses WHERE deleted_at IS null AND is_active IS TRUE ORDER BY name ASC`
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

		pointstring := strings.ReplaceAll(r.Location, "POINT(", "")
		pointstring = strings.ReplaceAll(pointstring, ")", "")
		point := strings.Split(pointstring, " ")

		storedLng, _ := strconv.ParseFloat(point[0], 64)
		storedLat, _ := strconv.ParseFloat(point[1], 64)

		r.LatLng.Lat = storedLat
		r.LatLng.Lng = storedLng

		restaurants = append(restaurants, r)
	}

	return &restaurants, nil
}

func (e RestaurantEntity) GetRestaurant(id uint) (*models.Restaurant, error) {
	query := `SELECT * FROM businesses WHERE id = $1`
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

func (e RestaurantEntity) CreateRestaurantMsg(restaurant models.Restaurant, restID string) {
	msg := models.SlackMsg{}

	introSection := models.SlackMsgBlock{
		Type: "section",
		Text: &models.SlackMsgText{
			Type: "mrkdwn",
			Text: fmt.Sprintf(
				"A new entry has been submitted:\n*%s*\n%s %s\n%s, %s %s\n\nEmail: %s - Phone: %s",
				restaurant.Name,
				restaurant.Address,
				restaurant.Address2,
				restaurant.City,
				restaurant.State,
				restaurant.Zipcode,
				restaurant.Email,
				restaurant.Phone,
			),
		},
	}
	msg.Blocks = append(msg.Blocks, introSection)

	isGeoLocated := false

	if restaurant.LatLng.Lat != 0.00 && restaurant.LatLng.Lng != 0.00 {
		isGeoLocated = true
	}

	infoSection := models.SlackMsgBlock{
		Type: "section",
		Fields: &[]models.SlackMsgText{
			{
				Type: "mrkdwn",
				Text: fmt.Sprintf("*Type:*\n%s", restaurant.Type),
			},
			{
				Type: "mrkdwn",
				Text: fmt.Sprintf("*Hours:*\n%s", restaurant.Hours),
			},
			{
				Type: "mrkdwn",
				Text: fmt.Sprintf("*URL:*\n%s", restaurant.URL),
			},
			{
				Type: "mrkdwn",
				Text: fmt.Sprintf("*Donate URL:*\n%s", restaurant.DonateURL),
			},
			{
				Type: "mrkdwn",
				Text: fmt.Sprintf("*Offers Giftcard:*\n%v", restaurant.HasGiftCard),
			},
			{
				Type: "mrkdwn",
				Text: fmt.Sprintf("*Is Geo Located:*\n%v", isGeoLocated),
			},
		},
	}
	msg.Blocks = append(msg.Blocks, infoSection)

	dividerSection := models.SlackMsgBlock{
		Type: "divider",
	}
	msg.Blocks = append(msg.Blocks, dividerSection)

	detailsSection := models.SlackMsgBlock{
		Type: "section",
		Text: &models.SlackMsgText{
			Type: "mrkdwn",
			Text: restaurant.Details,
		},
	}
	msg.Blocks = append(msg.Blocks, detailsSection)

	actionsSection := models.SlackMsgBlock{
		Type: "actions",
		Elements: &[]models.SlackMsgAction{
			{
				Type:  "button",
				Style: "primary",
				Value: restID,
				Text: models.SlackMsgText{
					Type: "plain_text",
					Text: "Approve",
				},
			},
		},
	}
	msg.Blocks = append(msg.Blocks, actionsSection)

	payload, _ := json.Marshal(msg)

	webhookURL := os.Getenv("SLACK_WEBHOOK_URL")
	_, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		fmt.Printf("Slack error: %v", err)
		sentry.CaptureException(fmt.Errorf("Slack Integration: %v", err))
	}
}
