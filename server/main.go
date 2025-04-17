package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

var clients = make(map[string]*websocket.Conn)

type Message struct {
	Type string          `json:"type"`
	To   string          `json:"to"`
	From string          `json:"from"`
	Data json.RawMessage `json:"data"`
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	clients[id] = conn
	log.Printf("Client %s connected", id)

	defer func() {
		delete(clients, id)
		conn.Close()
		log.Printf("Client %s disconnected", id)
	}()

	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("Read error for %s: %v", id, err)
			break
		}

		msg.From = id
		if targetConn, ok := clients[msg.To]; ok {
			err = targetConn.WriteJSON(msg)
			if err != nil {
				log.Printf("Write error to %s: %v", msg.To, err)
			}
		} else {
			log.Printf("Client %s not found", msg.To)
		}
	}
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	log.Printf("Webhook received: %v", payload)
	fmt.Fprintf(w, "Webhook received")
}

func main() {
	http.HandleFunc("/ws", wsHandler)
	http.HandleFunc("/webhook", webhookHandler)
	log.Println("Server starting on :8080")
	if err := http.ListenAndServeTLS(":443", "/etc/ssl/selfsigned/selfsigned.crt", "/etc/ssl/selfsigned/selfsigned.key", nil)	; err != nil {
		log.Fatalf("Server error: %v", err)
	}
}