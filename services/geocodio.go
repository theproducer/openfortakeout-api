package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/getsentry/sentry-go"
	"github.com/jmoiron/sqlx"
	"github.com/theproducer/openfortakeout_api/models"
)

type GeocodioService struct {
	APIKey string
	DB     *sqlx.DB
}

func (g *GeocodioService) GeocodeAddress(street, city, state, zipcode string) (*models.GeoPoint, error) {
	geocodioURL := fmt.Sprintf(
		"https://api.geocod.io/v1.4/geocode?street=%s&city=%s&state=%s&postal_code=%s&api_key=%s",
		url.QueryEscape(street),
		url.QueryEscape(city),
		url.QueryEscape(state),
		url.QueryEscape(zipcode),
		g.APIKey,
	)
	resp, err := http.Get(geocodioURL)
	if err != nil {
		return nil, fmt.Errorf("GeocodioService: %v", err)
	}

	defer resp.Body.Close()

	result := new(models.GeocodioResults)
	decoder := json.NewDecoder(resp.Body)
	if err := decoder.Decode(&result); err != nil {
		return nil, fmt.Errorf("GeocodioService: %v", err)
	}

	if len(result.Results) == 0 {
		return nil, nil
	}

	return &result.Results[0].Location, nil
}
func (g *GeocodioService) GeocodeZipcode(zipcode string) (*models.GeoPoint, error) {
	point, err := g.LookupZipcode(zipcode)
	if err != nil {
		return nil, fmt.Errorf("GeocodioService: %v", err)
	}

	if point == nil {
		sentry.CaptureMessage(fmt.Sprintf("Geocoding zipcode: %s\n", zipcode))
		fmt.Printf("Geocoding zipcode: %s\n", zipcode)
		return g.GeocodeAddress("", "", "", zipcode)
	}

	return point, nil
}

func (g *GeocodioService) LookupZipcode(zipcode string) (*models.GeoPoint, error) {
	query := `SELECT * FROM zipcodes WHERE zipcode = $1`
	row := g.DB.QueryRowx(query, zipcode)
	var zipResult models.Zipcode
	err := row.StructScan(&zipResult)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &models.GeoPoint{
		Lat: zipResult.Lat,
		Lng: zipResult.Lng,
	}, nil
}
