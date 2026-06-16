package main
import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
)
func main() {
	db, _ := sql.Open("postgres", "postgresql://postgres:rizkyfau_zi@db.goewajwulfopzximeilw.supabase.co:5432/postgres")
	rows, _ := db.Query("SELECT id, nama, telepon FROM employees")
	for rows.Next() {
		var id, nama, tlp string
		rows.Scan(&id, &nama, &tlp)
		fmt.Printf("Emp: %s, %s, %s\n", id, nama, tlp)
	}
}
