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

	// Check whatsmeow tables
	rows, err := db.Query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'whatsmeow%'")
	if err != nil {
		fmt.Println("Error querying tables:", err)
	} else {
		count := 0
		for rows.Next() {
			count++
		}
		fmt.Printf("whatsmeow tables count: %d\n", count)
	}

	// Check employees
	var empCount int
	err = db.QueryRow("SELECT COUNT(*) FROM employees").Scan(&empCount)
	if err != nil {
		fmt.Println("Error querying employees:", err)
	} else {
		fmt.Printf("employees table count: %d\n", empCount)
	}
}
