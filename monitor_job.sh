#!/bin/bash

JOB_ID=$1
API_URL="http://localhost:8084"

if [ -z "$JOB_ID" ]; then
    echo "Usage: $0 <job_id>"
    exit 1
fi

echo "Monitoring job: $JOB_ID"

while true; do
    RESPONSE=$(curl -s "$API_URL/api/translate/job/$JOB_ID")
    STATUS=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))")
    PROGRESS=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('progress', 0))")
    
    echo -ne "\rStatus: $STATUS, Progress: $PROGRESS%"
    
    if [ "$STATUS" = "completed" ]; then
        echo -e "\n\nJob completed! Downloading result..."
        curl -s "$API_URL/api/translate/download/$JOB_ID" -o "result_$JOB_ID.txt"
        echo "Result saved to: result_$JOB_ID.txt"
        break
    elif [ "$STATUS" = "failed" ]; then
        echo -e "\n\nJob failed!"
        echo $RESPONSE | python3 -m json.tool
        break
    fi
    
    sleep 2
done
