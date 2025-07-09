#!/bin/bash

# Check if directory path is provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 <directory_path>"
    exit 1
fi

# Check if directory exists
if [ ! -d "$1" ]; then
    echo "Error: Directory '$1' does not exist"
    exit 1
fi

# Set threshold to 5MB in bytes
THRESHOLD=$((5 * 1024 * 1024))

# Function to check if GIF is animated
is_animated() {
    local frames
    frames=$(identify "$1" | wc -l)
    [ "$frames" -gt 1 ]
}


# Find all GIF files recursively and print their sizes if over threshold
find "$1" -type f -iname "*.gif" | while read -r file; do
    size=$(stat -c%s "$file")
    
    if [ "$size" -gt "$THRESHOLD" ]; then
        size_mb=$(echo "scale=2; $size/1048576" | bc)
        
        if is_animated "$file"; then
            type="animated"
        else
            type="static"
        fi
        
        printf "%-80s\n" "$file" 
    fi
done

# Print summary if any large files were found
