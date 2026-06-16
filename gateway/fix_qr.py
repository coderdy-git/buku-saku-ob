import re

with open('/home/rf/Projects/coderdy-ob/gateway/main.go', 'r') as f:
    content = f.read()

content = content.replace(
    'qrterminal.GenerateHalfBlock(evt.Code, qrterminal.L, os.Stdout)',
    'qrterminal.GenerateHalfBlock(evt.Code, qrterminal.L, os.Stdout)\n\t\t\t\tos.WriteFile("qr_code.txt", []byte(evt.Code), 0644)'
)

with open('/home/rf/Projects/coderdy-ob/gateway/main.go', 'w') as f:
    f.write(content)
