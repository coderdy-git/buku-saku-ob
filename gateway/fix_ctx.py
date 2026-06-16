with open('/home/rf/Projects/coderdy-ob/gateway/main.go', 'r') as f:
    content = f.read()

content = content.replace(
    'container, err := sqlstore.New("sqlite3", "file:wastates.db?_foreign_keys=on", dbLog)',
    'container, err := sqlstore.New(context.Background(), "sqlite3", "file:wastates.db?_foreign_keys=on", dbLog)'
)

content = content.replace(
    'deviceStore, err := container.GetFirstDevice()',
    'deviceStore, err := container.GetFirstDevice(context.Background())'
)

with open('/home/rf/Projects/coderdy-ob/gateway/main.go', 'w') as f:
    f.write(content)
