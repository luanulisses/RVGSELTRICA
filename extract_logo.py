
import base64
import re

html_path = r'C:\Users\luan.muniz\Documents\RVGS ELETRICA\RVGS ELETRICA\html\rvgs-eletrica (4).html'
output_path = r'c:\Users\luan.muniz\Documents\RVGS ELETRICA\RVGS ELETRICA\public\logo_transparent.png'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the first data:image/png;base64 string
match = re.search(r'src="data:image/png;base64,([^"]+)"', content)
if match:
    base64_data = match.group(1)
    img_data = base64.b64decode(base64_data)
    with open(output_path, 'wb') as f:
        f.write(img_data)
    print(f"Logo saved successfully to {output_path}")
else:
    print("Could not find base64 logo in HTML")
