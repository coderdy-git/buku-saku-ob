package main

import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
)

func main() {
	dbUrl := "postgresql://postgres:rizkyfau_zi@db.goewajwulfopzximeilw.supabase.co:5432/postgres"
	db, err := sql.Open("postgres", dbUrl)
	if err != nil {
		fmt.Println("Error connecting:", err)
		return
	}
	defer db.Close()

	tables := []string{
		"whatsmeow_pre_keys",
		"whatsmeow_message_secrets",
		"whatsmeow_app_state_sync_keys",
		"whatsmeow_app_state_mutation_macs",
		"whatsmeow_sender_keys",
		"whatsmeow_contacts",
		"whatsmeow_devices",
	}

	for _, table := range tables {
		_, err := db.Exec("DROP TABLE IF EXISTS " + table + " CASCADE")
		if err != nil {
			fmt.Println("Error dropping", table, ":", err)
		} else {
			fmt.Println("Dropped", table)
		}
	}
	fmt.Println("Successfully cleared WhatsApp session tables.")
}
