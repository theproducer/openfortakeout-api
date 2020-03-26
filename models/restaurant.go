package models

import (
	"database/sql/driver"
	"errors"
	"fmt"
	"time"
)

type CommonModelFields struct {
	ID uint `json:"id"`
}

type CommonModelTimestamps struct {
	CreatedAt time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt *time.Time `db:"deleted_at" json:"deleted_at"`
}

type Restaurant struct {
	CommonModelFields
	Name        string   `db:"name" json:"name" validate:"required"`
	Type        string   `db:"type" json:"type" validate:"required"`
	Phone       string   `db:"phone" json:"phone" validate:"required,max=14"`
	Details     string   `db:"details" json:"details"`
	Hours       string   `db:"hours" json:"hours"`
	Email       string   `db:"email" json:"email" validate:"required,email"`
	URL         string   `db:"url" json:"url" validate:"omitempty,url"`
	Address     string   `db:"address" json:"address" validate:"required"`
	Address2    string   `db:"address2" json:"address_2"`
	City        string   `db:"city" json:"city" validate:"required"`
	State       string   `db:"state" json:"state" validate:"required"`
	Zipcode     string   `db:"zipcode" json:"zipcode" validate:"required,len=5"`
	DonateURL   string   `db:"donate_url" json:"donate_url" validate:"omitempty,url"`
	Location    string   `db:"location" json:"-"`
	HasGiftCard bool     `db:"giftcard" json:"giftcard"`
	IsActive    bool     `db:"is_active" json:"active"`
	LatLng      GeoPoint `json:"latlng"`
	CommonModelTimestamps
}

type RestaurantMsg struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type GeoPoint struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

func (g *GeoPoint) Scan(src interface{}) error {
	var source string
	switch src.(type) {
	case string:
		source = src.(string)
	default:
		return errors.New("incompatible type for GeoPoint")
	}

	fmt.Printf("Source Data: %v", source)

	return nil
}

func (g *GeoPoint) Value() (driver.Value, error) {
	rawSQL := fmt.Sprintf("ST_MakePoint(%v,%v)", g.Lat, g.Lng)
	return rawSQL, nil
}
