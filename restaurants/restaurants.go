package restaurants

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/getsentry/sentry-go"
	"github.com/go-playground/validator"
	"github.com/gorilla/mux"
	"github.com/theproducer/openfortakeout_api/models"
	"github.com/theproducer/openfortakeout_api/services"
)

type Controller struct {
	r        *mux.Router
	e        services.RestaurantEntityInterface
	geocoder services.GeocodioService
}

func NewController(router *mux.Router, ei services.RestaurantEntityInterface, g services.GeocodioService) Controller {
	c := Controller{
		r:        router,
		e:        ei,
		geocoder: g,
	}

	c.routes()

	return c
}

func (c *Controller) routes() {
	s := c.r.PathPrefix("/restaurants").Subrouter()
	s.HandleFunc("/", c.list).Methods("GET")
	s.HandleFunc("/{id}", c.get).Methods("GET")
	s.HandleFunc("/", c.create).Methods("POST")
}

func (c *Controller) list(w http.ResponseWriter, r *http.Request) {
	lat := 0.00
	lng := 0.00
	zipcode := ""

	latStr := r.URL.Query().Get("lat")
	lngStr := r.URL.Query().Get("lng")
	zipcode = r.URL.Query().Get("zipcode")

	if latStr != "" {
		lat, _ = strconv.ParseFloat(latStr, 64)
	}

	if latStr != "" {
		lng, _ = strconv.ParseFloat(lngStr, 64)
	}

	if lat == 0.00 && lng == 0.00 && zipcode != "" {
		// convert zipcode to lat/lng
		point, err := c.geocoder.GeocodeZipcode(zipcode)
		if err != nil {
			eventID := sentry.CaptureException(err)
			http.Error(w, fmt.Sprintf("There was a problem generating results: ID: %v", eventID), http.StatusInternalServerError)
			return
		}

		lat = point.Lat
		lng = point.Lng
	}

	restaurants, err := c.e.GetRestaurants(&lat, &lng)
	if err != nil {
		eventID := sentry.CaptureException(err)
		http.Error(w, fmt.Sprintf("There was a problem generating results: ID: %v", eventID), http.StatusInternalServerError)
		return
	}

	payload, _ := json.Marshal(restaurants)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(payload)
	return
}

func (c *Controller) get(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := strings.TrimSpace(vars["id"])

	if idStr == "" {
		http.Error(w, "restaurant not found", http.StatusNotFound)
		return
	}

	menuID, _ := strconv.Atoi(idStr)

	restaurant, err := c.e.GetRestaurant(uint(menuID))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	payload, _ := json.Marshal(restaurant)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(payload)
	return
}

func (c *Controller) create(w http.ResponseWriter, r *http.Request) {
	newRest := new(models.Restaurant)

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&newRest); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Data validation
	validate := validator.New()
	if err := validate.Struct(newRest); err != nil {
		if _, ok := err.(*validator.InvalidValidationError); ok {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		var invalidFieldsStr strings.Builder

		for _, err := range err.(validator.ValidationErrors) {
			invalidFieldsStr.WriteString(err.Field() + ", ")
		}

		http.Error(w, fmt.Sprintf("Could not create entry as it contained missing or invalid fields: %s", invalidFieldsStr.String()), http.StatusBadRequest)
		return
	}

	// Geocode address
	point, err := c.geocoder.GeocodeAddress(
		fmt.Sprintf("%s %s", newRest.Address, newRest.Address2),
		newRest.City,
		newRest.State,
		newRest.Zipcode,
	)
	if err != nil {
		eventID := sentry.CaptureException(err)
		http.Error(w, fmt.Sprintf("There was a saving your entry: ID: %v", eventID), http.StatusInternalServerError)
		return
	}

	if point == nil {
		point = &models.GeoPoint{}
	}

	newRest.LatLng = *point

	restID, err := c.e.CreateRestaurant(*newRest)
	if err != nil {
		eventID := sentry.CaptureException(err)
		http.Error(w, fmt.Sprintf("There was a saving your entry: ID: %v", eventID), http.StatusInternalServerError)
	}

	restIDStr := strconv.Itoa(int(*restID))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(restIDStr + "\n"))
	return
}
