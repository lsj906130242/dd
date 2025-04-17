name: Build Obfuscate BPB Panel

on:
  push:
    branches:
      - main
  schedule:
    - cron: "0 1 * * *"

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Check out the code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "16" # Specify a stable Node.js version

      - name: Install dependencies
        run: |
          npm install -g javascript-obfuscator || { echo "npm install failed"; exit 1; }
          javascript-obfuscator --version
          
          # Install jq for JSON parsing
          sudo apt-get update || { echo "apt-get update failed"; exit 1; }
          sudo apt-get install -y jq || { echo "Installing jq failed"; exit 1; }

      - name: Fetch and download latest unobfuscated-worker.js
        run: |
          # Get the latest release info from GitHub API
          RELEASE_INFO=$(curl -s https://api.github.com/repos/bia-pain-bache/BPB-Worker-Panel/releases/latest)
          # Extract the download URL for unobfuscated-worker.js
          DOWNLOAD_URL=$(echo "$RELEASE_INFO" | jq -r '.assets[] | select(.name == "unobfuscated-worker.js") | .browser_download_url')
          
          # Check if URL was found
          if [ -z "$DOWNLOAD_URL" ]; then
            echo "Error: Could not find unobfuscated-worker.js in latest release"
            exit 1
          fi
          
          # Download the file
          wget -O origin.js "$DOWNLOAD_URL" || { echo "Download failed"; exit 1; }
          ls -l origin.js
          head -n 10 origin.js

      - name: Obfuscate BPB worker js
        run: |
          javascript-obfuscator origin.js --output _worker.js \
            --compact true \
            --identifier-names-generator hexadecimal \
            --rename-globals true \
            --string-array true \
            --string-array-encoding 'base64' \
            --string-array-threshold 0.75 \
            --transform-object-keys true \
            --self-defending false \
            --simplify true || { echo "Obfuscation failed"; exit 1; }
          ls -l _worker.js
          head -n 10 _worker.js

      - name: Cleanup
        run: |
          # Remove the origin.js file if not needed
          rm -f origin.js

      - name: Commit changes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          branch: main
          commit_message: ':arrow_up: update latest bpb panel'
          commit_author: 'github-actions[bot] <github-actions[bot]@users.noreply.github.com>'
          push_options: '--set-upstream'
