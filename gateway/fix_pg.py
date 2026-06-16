with open('/home/rf/Projects/coderdy-ob/gateway/main.go', 'r') as f:
    content = f.read()

# Add lib/pq import
content = content.replace(
    '_ "github.com/mattn/go-sqlite3"',
    '_ "github.com/mattn/go-sqlite3"\n\t_ "github.com/lib/pq"'
)

old_store = """	// Create SQLite store
	container, err := sqlstore.New(context.Background(), "sqlite3", "file:wastates.db?_foreign_keys=on", dbLog)
	if err != nil {
		panic(err)
	}"""

new_store = """	// Try to use Supabase PostgreSQL if provided, otherwise fallback to local SQLite
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
	}"""

content = content.replace(old_store, new_store)

with open('/home/rf/Projects/coderdy-ob/gateway/main.go', 'w') as f:
    f.write(content)

print("Updated to support PostgreSQL via DATABASE_URL")
