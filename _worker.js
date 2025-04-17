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
          node-version: "16" # 指定一个稳定的 Node.js 版本

      - name: Install dependencies
        run: |
          npm install -g javascript-obfuscator || { echo "npm install 失败"; exit 1; }
          javascript-obfuscator --version
          
          # 安装 jq 用于 JSON 解析
          sudo apt-get update || { echo "apt-get update 失败"; exit 1; }
          sudo apt-get install -y jq || { echo "安装 jq 失败"; exit 1; }

      - name: Fetch and download latest unobfuscated-worker.js
        run: |
          # 下载 unobfuscated-worker.js 文件
          wget -O origin.js https://raw.githubusercontent.com/bia-pain-bache/BPB-Worker-Panel/main/build/unobfuscated-worker.js || { echo "下载 unobfuscated-worker.js 失败"; exit 1; }
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
            --simplify true || { echo "混淆失败"; exit 1; }
          ls -l _worker.js
          head -n 10 _worker.js

      - name: Cleanup
        run: |
          # 删除 origin.js 文件
          rm -f origin.js

      - name: Commit changes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          branch: main
          commit_message: ':arrow_up: 更新最新的 BPB 面板'
          commit_author: 'github-actions[bot] <github-actions[bot]@users.noreply.github.com>'
          push_options: '--set-upstream'
