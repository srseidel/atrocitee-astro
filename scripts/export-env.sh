#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

# Read .env file and export each uncommented line
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
        # Remove any leading/trailing whitespace
        line=$(echo "$line" | xargs)
        # Export the variable
        export "$line"
        echo "Exported: ${line%%=*}"
    fi
done < .env

echo "Environment variables exported successfully!" 