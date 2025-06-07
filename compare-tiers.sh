#!/bin/bash

echo "=== TIER PERFORMANCE COMPARISON ==="

for tier in basic standard premium; do
  echo -e "\n--- Testing $tier tier ---"
  
  start_time=$(date +%s)
  
  curl -s -X POST http://localhost:3000/api/translate \
    -H "Content-Type: application/json" \
    -d '{
      "text": "'"$(python3 -c "print('Test text. ' * 500)")"'",
      "targetLang": "vi",
      "tier": "'"$tier"'"
    }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('success'):
    stats = data.get('stats', {})
    print(f'Success! Chunks: {stats.get(\"chunks\")}, Time: {stats.get(\"processingTime\")}ms')
else:
    print(f'Error: {data.get(\"error\")}')"
    
  end_time=$(date +%s)
  echo "Total time: $((end_time - start_time))s"
done
