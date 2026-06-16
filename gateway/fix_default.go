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

	tables := []string{"employees", "orders", "ledger", "shopping_history", "attendance_logs"}
	for _, t := range tables {
		_, err := db.Exec("ALTER TABLE public." + t + " ALTER COLUMN operator_id SET DEFAULT auth.uid()")
		if err != nil {
			fmt.Println("Error updating", t, ":", err)
		} else {
			fmt.Println("Updated default auth.uid() on", t)
		}
	}
}
