#!/bin/bash

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "FFmpeg is not installed. Please install it first:"
    echo "sudo apt-get update && sudo apt-get install ffmpeg"
    exit 1
fi

# Function to process a single GIF
optimize_gif() {
    local input_file="$1"
    local output_file="${input_file%.*}_optimized.gif"
    local temp_dir=$(mktemp -d)
    
    echo "Processing: $input_file"
    
    # Extract frames to PNG sequence
    ffmpeg -i "$input_file" -vf "mpdecimate,setpts=N/30/TB" "${temp_dir}/frame_%04d.png"
    
    # Calculate new framerate (slower playback)
    # Getting original framerate
    original_fps=$(ffmpeg -i "$input_file" 2>&1 | grep -oP '\d+(?= fps)' || echo "30")
    new_fps=$(echo "$original_fps/2" | bc)
    
    # Convert back to GIF with optimizations
    ffmpeg -framerate $new_fps -i "${temp_dir}/frame_%04d.png" \
        -vf "split[s0][s1];[s0]palettegen=stats_mode=single[p];[s1][p]paletteuse=new=1" \
        -loop 0 "$output_file"
    
    # Clean up temporary files
    rm -rf "$temp_dir"
    
    # Print size comparison
    original_size=$(ls -lh "$input_file" | awk '{print $5}')
    optimized_size=$(ls -lh "$output_file" | awk '{print $5}')
    echo "Original size: $original_size"
    echo "Optimized size: $optimized_size"
}

# Check if directory or file was provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <file.gif or directory>"
    exit 1
fi

# Process single file or directory
if [ -f "$1" ]; then
    # Single file
    if [[ "$1" == *.gif ]]; then
        optimize_gif "$1"
    else
        echo "Error: File must be a GIF"
        exit 1
    fi
elif [ -d "$1" ]; then
    # Directory
    find "$1" -type f -name "*.gif" | while read -r gif; do
        optimize_gif "$gif"
    done
else
    echo "Error: File or directory not found"
    exit 1
fi
