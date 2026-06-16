package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/mattn/go-sqlite3"
	_ "github.com/lib/pq"
	"github.com/mdp/qrterminal/v3"
	"go.mau.fi/whatsmeow"
	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
	"google.golang.org/protobuf/proto"
)

var client *whatsmeow.Client
var otpStore = make(map[string]string)

func eventHandler(evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:
		// You can add logic to process incoming messages here
		if !v.Info.IsFromMe {
			log.Printf("Received a message from %s: %s\n", v.Info.Sender.User, v.Message.GetConversation())
		}
	}
}

type SendMessageRequest struct {
	Phone   string `json:"phone"`
	Message string `json:"message"`
}

func sendMessageHandler(w http.ResponseWriter, r *http.Request) {
	// Add basic CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if req.Phone == "" || req.Message == "" {
		http.Error(w, "Phone and message are required", http.StatusBadRequest)
		return
	}

	if client == nil || !client.IsConnected() {
		http.Error(w, "WhatsApp client is not connected", http.StatusInternalServerError)
		return
	}

	// Format JID (e.g., 62812345678)
	jid := types.NewJID(req.Phone, types.DefaultUserServer)

	// Send message
	msg := &waProto.Message{
		Conversation: proto.String(req.Message),
	}

	resp, err := client.SendMessage(context.Background(), jid, msg)
	if err != nil {
		log.Printf("Failed to send message: %v", err)
		http.Error(w, fmt.Sprintf("Failed to send message: %v", err), http.StatusInternalServerError)
		return
	}

	log.Printf("Message sent to %s. ID: %s", req.Phone, resp.ID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "Message sent successfully",
		"id":      resp.ID,
	})
}

func sendOtpHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if req.Phone == "" {
		http.Error(w, "Phone is required", http.StatusBadRequest)
		return
	}

	// Generate 4-digit OTP
	rand.Seed(time.Now().UnixNano())
	otp := fmt.Sprintf("%04d", rand.Intn(10000))
	otpStore[req.Phone] = otp

	message := fmt.Sprintf("*Buku Saku OB*\n\nKode OTP Anda adalah: *%s*\nJANGAN BERIKAN kode ini kepada siapa pun.", otp)

	jid := types.NewJID(req.Phone, types.DefaultUserServer)
	msg := &waProto.Message{
		Conversation: proto.String(message),
	}

	_, err := client.SendMessage(context.Background(), jid, msg)
	if err != nil {
		http.Error(w, "Failed to send OTP", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "OTP sent via WhatsApp",
	})
}

type VerifyOtpRequest struct {
	Phone string `json:"phone"`
	Otp   string `json:"otp"`
}

func verifyOtpHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req VerifyOtpRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	storedOtp, exists := otpStore[req.Phone]
	if !exists || storedOtp != req.Otp {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "error",
			"message": "Invalid OTP",
		})
		return
	}

	// Clear OTP after successful verify
	delete(otpStore, req.Phone)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "OTP verified successfully",
	})
}

func main() {
	dbLog := waLog.Stdout("Database", "WARN", true)
	// Try to use Supabase PostgreSQL if provided, otherwise fallback to local SQLite
	dbUrl := os.Getenv("DATABASE_URL")
	var container *sqlstore.Container
	var err error

	if dbUrl != "" {
		fmt.Println("Connecting to Supabase PostgreSQL for session storage...")
		container, err = sqlstore.New(context.Background(), "postgres", dbUrl, dbLog)
	} else {
		fmt.Println("Using local SQLite for session storage...")
		container, err = sqlstore.New(context.Background(), "sqlite3", "file:wastates.db?_foreign_keys=on", dbLog)
	}

	if err != nil {
		panic(err)
	}

	// Ensure store uses latest schema (get first device)
	deviceStore, err := container.GetFirstDevice(context.Background())
	if err != nil {
		panic(err)
	}

	clientLog := waLog.Stdout("Client", "WARN", true)
	client = whatsmeow.NewClient(deviceStore, clientLog)
	client.AddEventHandler(eventHandler)

	if client.Store.ID == nil {
		// No ID stored, new login
		qrChan, _ := client.GetQRChannel(context.Background())
		err = client.Connect()
		if err != nil {
			panic(err)
		}
		for evt := range qrChan {
			if evt.Event == "code" {
				// Render QR code to standard output
				qrterminal.GenerateHalfBlock(evt.Code, qrterminal.L, os.Stdout)
				os.WriteFile("qr_code.txt", []byte(evt.Code), 0644)
				fmt.Println("Scan this QR code with your WhatsApp app to log in")
			} else {
				fmt.Println("Login event:", evt.Event)
			}
		}
	} else {
		// Already logged in, just connect
		err = client.Connect()
		if err != nil {
			panic(err)
		}
		fmt.Println("Successfully connected to WhatsApp!")
	}

	// Start HTTP Server for API
	go func() {
		http.HandleFunc("/send", sendMessageHandler)
		http.HandleFunc("/send-otp", sendOtpHandler)
		http.HandleFunc("/verify-otp", verifyOtpHandler)
		fmt.Println("Starting WA Gateway API on http://localhost:8080")
		fmt.Println("Usage: POST http://localhost:8080/send with JSON body: {\"phone\": \"62812xxx\", \"message\": \"Hello\"}")
		if err := http.ListenAndServe(":8080", nil); err != nil {
			log.Fatal("HTTP server error:", err)
		}
	}()

	// Listen to Ctrl+C
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	fmt.Println("\nDisconnecting...")
	client.Disconnect()
}
