package slackadmin

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/getsentry/sentry-go"
	"github.com/gorilla/mux"
	"github.com/theproducer/openfortakeout_api/models"
	"github.com/theproducer/openfortakeout_api/services"
)

type Controller struct {
	r *mux.Router
	e services.RestaurantEntityInterface
}

func NewController(router *mux.Router, ei services.RestaurantEntityInterface) Controller {
	c := Controller{
		r: router,
		e: ei,
	}

	c.routes()

	return c
}

func (c *Controller) routes() {
	s := c.r.PathPrefix("/slackadmin").Subrouter()
	s.HandleFunc("/webhook/", c.webhook).Methods("POST")
}

func (c *Controller) webhook(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		sentry.CaptureException(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	slackResponse := new(models.SlackWebhookPost)
	jsonPayload := r.FormValue("payload")

	decoder := json.NewDecoder(strings.NewReader(jsonPayload))
	if err := decoder.Decode(&slackResponse); err != nil {
		sentry.CaptureMessage(jsonPayload)
		sentry.CaptureException(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// validate the payload
	slackTeamID := os.Getenv("SLACK_TEAM_ID")
	slackChannelID := os.Getenv("SLACK_CHANNEL_ID")

	if slackResponse.Team.ID == slackTeamID && slackResponse.Channel.ID == slackChannelID {
		if len(slackResponse.Actions) > 0 {
			action := slackResponse.Actions[0]

			if action.Text.Text == "Approve" {
				// Approve the related submission
				restID, err := strconv.ParseUint(action.Value, 10, 64)
				if err != nil {
					sentry.CaptureException(err)
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}

				restaurant, err := c.e.ApproveRestaurant(uint(restID))
				if err != nil {
					sentry.CaptureException(err)
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}

				responseMsg := models.SlackMsgText{
					Text: fmt.Sprintf("*%s* has been approved by %s", restaurant.Name, slackResponse.User.Name),
					Type: "mrkdwn",
				}

				payload, _ := json.Marshal(responseMsg)

				_, err = http.Post(slackResponse.ResponseURL, "application/json", bytes.NewBuffer(payload))
				if err != nil {
					sentry.CaptureException(err)
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				w.Write(payload)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			return
		}

		http.Error(w, "", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	return

}
