package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"strings"
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

	// Drop existing tables
	tables := []string{"attendance_logs", "shopping_history", "ledger", "orders", "employees", "operators", "otp_codes"}
	for _, t := range tables {
		db.Exec("DROP TABLE IF EXISTS public." + t + " CASCADE")
	}

	// Read new schema
	b, err := ioutil.ReadFile("/home/rf/Projects/coderdy-ob/schema.sql")
	if err != nil {
		fmt.Println("Error reading schema:", err)
		return
	}
	
	// Execute new schema
	queries := strings.Split(string(b), ";")
	for _, q := range queries {
		q = strings.TrimSpace(q)
		if q == "" {
			continue
		}
		_, err := db.Exec(q)
		if err != nil {
			fmt.Println("Error executing query:", err, "\nQuery:", q)
		}
	}
	fmt.Println("Database completely overhauled!")
}
