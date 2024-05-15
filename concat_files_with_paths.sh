#!/bin/bash

# Check if the src directory exists
if [ ! -d "src" ]; then
  echo "The src directory does not exist."
  exit 1
fi

# Output file
output_file="concatenated_code.txt"

# Create or clear the output file
> "$output_file"

# Function to concatenate files with path prefix
concatenate_files() {
  local dir=$1

  # Iterate over all files and directories within the specified directory
  for entry in "$dir"/*; do
    if [ -f "$entry" ]; then
      # Print a separator and the file path at the beginning of each file
      echo -e "\n\n--- FILE: $entry ---\n" >> "$output_file"
      # Append the file content to the output file
      cat "$entry" >> "$output_file"
    elif [ -d "$entry" ]; then
      # If it's a directory, recursively call this function
      concatenate_files "$entry"
    fi
  done
}

# Start concatenating files from the src directory
concatenate_files "src"

cat README.md >> "$output_file"

echo "All files have been concatenated into $output_file"
