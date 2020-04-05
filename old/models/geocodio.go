package models

type GeocodioResults struct {
	Results []GeocodioResult `json:"results"`
}

type GeocodioResult struct {
	Location GeoPoint `json:"location"`
}

type Zipcode struct {
	ID      uint    `db:"id"`
	Zipcode string  `db:"zipcode"`
	Lat     float64 `db:"lat"`
	Lng     float64 `db:"lng"`
}
