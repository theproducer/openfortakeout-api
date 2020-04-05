package services

import (
	"github.com/theproducer/openfortakeout_api/models"
)

type RestaurantEntityInterface interface {
	CreateRestaurant(newRestaurant models.Restaurant) (*uint, error)
	ApproveRestaurant(restaurantID uint) (*models.Restaurant, error)
	GetRestaurants(lat *float64, lng *float64) (*[]models.Restaurant, error)
	GetRestaurant(id uint) (*models.Restaurant, error)
}

type GeocodioServiceInterface interface {
	GeocodeAddress(street, city, state, zipcode string) (*models.GeoPoint, error)
	GeocodeZipcode(zipcode string) (*models.GeoPoint, error)
}
