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

	// Remove pin_hash column from employees
	_, err = db.Exec("ALTER TABLE public.employees DROP COLUMN IF EXISTS pin_hash CASCADE")
	if err != nil {
		fmt.Println("Error dropping pin_hash:", err)
	} else {
		fmt.Println("Dropped pin_hash column from employees.")
	}

	// Delete the accidental Rizky Fauzi entry if it exists
	res, err := db.Exec("DELETE FROM public.employees WHERE telepon = '6285172276660'")
	if err != nil {
		fmt.Println("Error deleting old data:", err)
	} else {
		affected, _ := res.RowsAffected()
		fmt.Printf("Deleted %d accidental OB records from employees.\n", affected)
	}
}
