import json

# Đọc text từ file
with open('long-text.txt', 'r') as f:
    long_text = f.read().strip()

# Đọc JSON template
with open('test-exceed-basic.json', 'r') as f:
    data = json.load(f)

# Replace PLACEHOLDER với text thực
data['text'] = long_text

# Lưu lại JSON
with open('test-exceed-basic.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Created JSON with text length: {len(long_text)} chars")
