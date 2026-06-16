package main
import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
)
func main() {
	db, _ := sql.Open("postgres", "postgresql://postgres:rizkyfau_zi@db.goewajwulfopzximeilw.supabase.co:5432/postgres")
	rows, _ := db.Query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'whatsmeow%'")
	var tables []string
	for rows.Next() {
		var name string
		rows.Scan(&name)
		tables = append(tables, name)
	}
	for _, t := range tables {
		db.Exec("DROP TABLE " + t + " CASCADE")
		fmt.Println("Dropped", t)
	}
}
