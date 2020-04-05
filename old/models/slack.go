package models

type SlackWebhookPost struct {
	Type        string              `json:"type"`
	Team        SlackTeam           `json:"team"`
	User        SlackUser           `json:"user"`
	Channel     SlackChannel        `json:"channel"`
	ResponseURL string              `json:"response_url"`
	Actions     []SlackPostedAction `json:"actions"`
}

type SlackTeam struct {
	ID     string `json:"id"`
	Domain string `json:"domain"`
}

type SlackUser struct {
	ID       string `json:"id"`
	UserName string `json:"username"`
	Name     string `json:"name"`
	TeamID   string `json:"team_id"`
}

type SlackChannel struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type SlackPostedAction struct {
	Value string       `json:"value"`
	Text  SlackMsgText `json:"text"`
}

type SlackMsg struct {
	Blocks []SlackMsgBlock `json:"blocks"`
}

type SlackMsgBlock struct {
	Type     string            `json:"type"`
	Text     *SlackMsgText     `json:"text,omitempty"`
	Fields   *[]SlackMsgText   `json:"fields,omitempty"`
	Elements *[]SlackMsgAction `json:"elements,omitempty"`
}

type SlackMsgText struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type SlackMsgAction struct {
	Type  string       `json:"type"`
	Text  SlackMsgText `json:"text"`
	Style string       `json:"style"`
	Value string       `json:"value"`
}
