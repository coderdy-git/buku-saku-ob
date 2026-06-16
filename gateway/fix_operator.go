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

	// Create operators table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS public.operators (
			id TEXT PRIMARY KEY,
			nama TEXT NOT NULL,
			telepon TEXT NOT NULL UNIQUE,
			pin_hash TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
		);
		ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
		CREATE POLICY "Allow public read access to operators" ON public.operators FOR SELECT USING (true);
		CREATE POLICY "Allow public write access to operators" ON public.operators FOR ALL USING (true) WITH CHECK (true);
	`)
	if err != nil {
		fmt.Println("Error creating operators table:", err)
		return
	}

	fmt.Println("Operators table created successfully!")
}
