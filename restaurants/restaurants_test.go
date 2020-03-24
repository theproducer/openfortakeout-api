package restaurants

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/theproducer/openfortakeout_api/models"
	"github.com/theproducer/openfortakeout_api/services"
)

type handlerTests struct {
	description        string
	url                string
	method             string
	body               io.Reader
	expectedStatusCode int
	expectedBody       string
	entityClient       services.RestaurantEntityInterface
}

func buildController(ei services.RestaurantEntityInterface) Controller {
	controller := NewController(mux.NewRouter(), ei)
	return controller
}

func runTestCases(t *testing.T, testcases []handlerTests) {
	assert := assert.New(t)

	for _, testcase := range testcases {
		c := buildController(testcase.entityClient)

		req, err := http.NewRequest(testcase.method, testcase.url, testcase.body)
		assert.NoError(err)

		rr := httptest.NewRecorder()
		c.r.ServeHTTP(rr, req)

		assert.Equal(testcase.expectedStatusCode, rr.Code, testcase.description)
		assert.Equal(testcase.expectedBody, rr.Body.String(), testcase.description)
	}
}

type mockTestMode int

const (
	Success mockTestMode = iota
	Fail
	Error
	NotFound
)

type mockEntityInterface struct {
	mode      mockTestMode
	testRest  *models.Restaurant
	testRests *[]models.Restaurant
}

func (e mockEntityInterface) CreateRestaurant(newRestaurant models.Restaurant) (*uint, error) {
	testID := uint(1)
	switch e.mode {
	case Success:
		return &testID, nil
	case Fail:
		return nil, errors.New("could not write restaurant to db")
	}

	return nil, nil
}

func (e mockEntityInterface) GetRestaurants(lat *float64, lng *float64) (*[]models.Restaurant, error) {
	switch e.mode {
	case Success:
		return e.testRests, nil
	case Fail:
		return nil, errors.New("could not get restaurants from db")
	case NotFound:
		retSlice := []models.Restaurant{}
		return &retSlice, nil
	}

	return nil, nil
}

func (e mockEntityInterface) GetRestaurant(id uint) (*models.Restaurant, error) {
	switch e.mode {
	case Success:
		return e.testRest, nil
	case Fail:
		return nil, errors.New("could not find restaurant by id")
	case NotFound:
		return nil, nil
	}

	return nil, nil
}

func TestListHandler(t *testing.T) {
	retSlice := []models.Restaurant{}
	for i := 0; i < 10; i++ {
		retSlice = append(retSlice, models.Restaurant{Name: fmt.Sprintf("Restaurant Number %v", i+1)})
	}

	expectedListReturn, _ := json.Marshal(retSlice)

	tests := []handlerTests{
		{
			description:        "get list of restaurants",
			url:                "/restaurants/",
			method:             "GET",
			body:               nil,
			expectedStatusCode: http.StatusOK,
			expectedBody:       string(expectedListReturn),
			entityClient: mockEntityInterface{
				mode:      Success,
				testRests: &retSlice,
			},
		}, {
			description:        "failed list fetch",
			url:                "/restaurants/",
			method:             "GET",
			body:               nil,
			expectedStatusCode: http.StatusInternalServerError,
			expectedBody:       "could not get restaurants from db\n",
			entityClient: mockEntityInterface{
				mode:      Fail,
				testRests: &retSlice,
			},
		},
	}

	runTestCases(t, tests)
}

func TestCreateHandler(t *testing.T) {
	validCreateJSON := `{
		"name": "Bob's Burgers",
		"details": "Testing, 1, 2, 2, 3",
		"hours": "10AM - 9PM",
		"url": "http://www.apple.com",
		"address": "123 Main Street",
		"address_2": "STE 3",
		"city": "Sioux Falls",
		"state": "SD",
		"zipcode": "57106",
		"donate_url": "http://duckduckgo.com"
	}`

	invalidCreateJSON := `{
		"badprop": "lol, what is this?"
	}`

	tests := []handlerTests{
		{
			description:        "successful creation",
			url:                "/restaurants/",
			method:             "POST",
			body:               strings.NewReader(validCreateJSON),
			expectedStatusCode: http.StatusCreated,
			expectedBody:       "1\n",
			entityClient: mockEntityInterface{
				mode: Success,
			},
		}, {
			description:        "invalid restaurant payload",
			url:                "/restaurants/",
			method:             "POST",
			body:               strings.NewReader(invalidCreateJSON),
			expectedStatusCode: http.StatusBadRequest,
			expectedBody:       "json: unknown field \"badprop\"\n",
			entityClient: mockEntityInterface{
				mode: Success,
			},
		}, {
			description:        "failed restaurant creation",
			url:                "/restaurants/",
			method:             "POST",
			body:               strings.NewReader(validCreateJSON),
			expectedStatusCode: http.StatusInternalServerError,
			expectedBody:       "could not write restaurant to db\n",
			entityClient: mockEntityInterface{
				mode: Fail,
			},
		},
	}

	runTestCases(t, tests)
}
